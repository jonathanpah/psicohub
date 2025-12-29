import { NextResponse } from "next/server"
import { z } from "zod"
import { auth } from "@/lib/auth"
import { logApiError } from "@/lib/logger"
import { prisma } from "@/lib/prisma"
import { logSessionEvent } from "@/lib/audit"
import { sanitizeText } from "@/lib/sanitize"
import { checkRateLimit, rateLimitConfigs, getClientIP, rateLimitExceededResponse } from "@/lib/rate-limit"

// Nota: isCourtesy NÃO está incluído intencionalmente
// Cortesia não pode ser alterada após a criação da sessão
// para manter consistência com o pagamento (cortesia não gera pagamento)
const updateSessionSchema = z.object({
  patientId: z.string().optional(),
  dateTime: z.string().optional(),
  duration: z.number().min(15).max(180).optional(),
  status: z.enum(["SCHEDULED", "CONFIRMED", "COMPLETED", "CANCELLED", "NO_SHOW"]).optional(),
  clinicalNotes: z.string().optional(),
  observations: z.string().optional(),
})

// GET - Buscar sessão específica
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    const { id } = await params

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Não autorizado" },
        { status: 401 }
      )
    }

    const sessionData = await prisma.session.findFirst({
      where: {
        id,
        userId: session.user.id,
      },
      include: {
        patient: {
          select: {
            id: true,
            name: true,
            phone: true,
            email: true,
          },
        },
        payment: true,
      },
    })

    if (!sessionData) {
      return NextResponse.json(
        { error: "Sessão não encontrada" },
        { status: 404 }
      )
    }

    // Registrar auditoria de visualização
    await logSessionEvent("SESSION_VIEW", session.user.id, sessionData.id, undefined, request)

    return NextResponse.json(sessionData)
  } catch (error: unknown) {
    logApiError("API", "ERROR", error)
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    )
  }
}

// PUT - Atualizar sessão
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    const { id } = await params

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Não autorizado" },
        { status: 401 }
      )
    }

    // Verificar se a sessão existe e pertence ao usuário
    const existingSession = await prisma.session.findFirst({
      where: {
        id,
        userId: session.user.id,
      },
    })

    if (!existingSession) {
      return NextResponse.json(
        { error: "Sessão não encontrada" },
        { status: 404 }
      )
    }

    const body = await request.json()
    const data = updateSessionSchema.parse(body)

    // Se está mudando o paciente, verificar se o novo paciente pertence ao usuário
    if (data.patientId && data.patientId !== existingSession.patientId) {
      const newPatient = await prisma.patient.findFirst({
        where: {
          id: data.patientId,
          userId: session.user.id,
        },
      })

      if (!newPatient) {
        return NextResponse.json(
          { error: "Paciente não encontrado ou não pertence a você" },
          { status: 404 }
        )
      }
    }

    // Se está mudando data/hora, verificar conflitos
    if (data.dateTime) {
      const dateTime = new Date(data.dateTime)
      const duration = data.duration || existingSession.duration
      const endTime = new Date(dateTime.getTime() + duration * 60 * 1000)

      const conflictingSession = await prisma.session.findFirst({
        where: {
          userId: session.user.id,
          id: { not: id },
          status: { notIn: ["CANCELLED"] },
          dateTime: {
            gte: new Date(dateTime.getTime() - 180 * 60 * 1000),
            lte: endTime,
          },
        },
      })

      if (conflictingSession) {
        const existingEnd = new Date(
          conflictingSession.dateTime.getTime() + conflictingSession.duration * 60 * 1000
        )

        const hasOverlap =
          (dateTime >= conflictingSession.dateTime && dateTime < existingEnd) ||
          (endTime > conflictingSession.dateTime && endTime <= existingEnd) ||
          (dateTime <= conflictingSession.dateTime && endTime >= existingEnd)

        if (hasOverlap) {
          return NextResponse.json(
            { error: "Já existe uma sessão agendada neste horário" },
            { status: 409 }
          )
        }
      }
    }

    const updatedSession = await prisma.session.update({
      where: { id },
      data: {
        ...(data.patientId && { patientId: data.patientId }),
        ...(data.dateTime && { dateTime: new Date(data.dateTime) }),
        ...(data.duration && { duration: data.duration }),
        ...(data.status && { status: data.status }),
        ...(data.clinicalNotes !== undefined && { clinicalNotes: data.clinicalNotes ? sanitizeText(data.clinicalNotes) : null }),
        ...(data.observations !== undefined && { observations: data.observations ? sanitizeText(data.observations) : null }),
      },
      include: {
        patient: {
          select: {
            id: true,
            name: true,
            phone: true,
            email: true,
          },
        },
        payment: true,
      },
    })

    // Sincronizar status do pagamento com status da sessão
    if (data.status && updatedSession.payment) {
      const paymentStatusMap: Record<string, string | null> = {
        CANCELLED: "CANCELLED",
        NO_SHOW: "CANCELLED", // Falta = cancela cobrança
      }

      const newPaymentStatus = paymentStatusMap[data.status]
      if (newPaymentStatus && updatedSession.payment.status !== newPaymentStatus) {
        await prisma.payment.update({
          where: { id: updatedSession.payment.id },
          data: {
            status: newPaymentStatus as "PENDING" | "PAID" | "CANCELLED",
            // Limpar paidAt se não for mais PAID
            ...(newPaymentStatus !== "PAID" && { paidAt: null }),
          },
        })
      }
    }

    // Se a sessão pertence a um pacote e foi completada/cancelada, verificar status do pacote
    if (data.status && existingSession.packageId) {
      const pkg = await prisma.sessionPackage.findUnique({
        where: { id: existingSession.packageId },
        include: {
          sessions: {
            select: { status: true },
          },
        },
      })

      if (pkg && pkg.status === "ACTIVE") {
        const allSessionsFinalized = pkg.sessions.every(
          s => s.status === "COMPLETED" || s.status === "CANCELLED" || s.status === "NO_SHOW"
        )
        const hasCompletedSessions = pkg.sessions.some(s => s.status === "COMPLETED")

        // Se todas as sessões estão finalizadas (completadas, canceladas ou falta)
        // E pelo menos uma foi completada, marcar pacote como COMPLETED
        if (allSessionsFinalized && pkg.sessions.length >= pkg.totalSessions) {
          await prisma.sessionPackage.update({
            where: { id: pkg.id },
            data: { status: hasCompletedSessions ? "COMPLETED" : "CANCELLED" },
          })
        }
      }
    }

    // Registrar auditoria de atualização (sem dados sensíveis)
    const auditChanges = {
      // Não logar conteúdo de notas clínicas - apenas indicar se foi alterado
      ...(data.status && { status: data.status }),
      ...(data.dateTime && { dateTime: "[ATUALIZADO]" }),
      ...(data.duration && { duration: data.duration }),
      ...(data.clinicalNotes !== undefined && { clinicalNotes: "[ATUALIZADO]" }),
      ...(data.observations !== undefined && { observations: "[ATUALIZADO]" }),
    }
    await logSessionEvent("SESSION_UPDATE", session.user.id, updatedSession.id, {
      changes: auditChanges,
    }, request)

    return NextResponse.json(updatedSession)
  } catch (error: unknown) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.issues[0].message },
        { status: 400 }
      )
    }

    logApiError("API", "ERROR", error)
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    )
  }
}

// DELETE - Excluir sessão
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  // Rate limiting para proteção contra exclusão em massa
  const clientIP = getClientIP(request)
  const rateLimitResult = await checkRateLimit(`delete:${clientIP}`, rateLimitConfigs.delete)
  if (!rateLimitResult.success) {
    return rateLimitExceededResponse(rateLimitResult)
  }

  try {
    const session = await auth()
    const { id } = await params

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Não autorizado" },
        { status: 401 }
      )
    }

    // Verificar se a sessão existe e pertence ao usuário
    const existingSession = await prisma.session.findFirst({
      where: {
        id,
        userId: session.user.id,
      },
    })

    if (!existingSession) {
      return NextResponse.json(
        { error: "Sessão não encontrada" },
        { status: 404 }
      )
    }

    // Registrar auditoria antes de excluir
    await logSessionEvent("SESSION_DELETE", session.user.id, id, {
      patientId: existingSession.patientId,
      dateTime: existingSession.dateTime,
    }, request)

    await prisma.session.delete({
      where: { id },
    })

    return NextResponse.json({ success: true })
  } catch (error: unknown) {
    logApiError("API", "ERROR", error)
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    )
  }
}
