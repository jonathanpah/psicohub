import { NextResponse } from "next/server"
import { z } from "zod"
import { auth } from "@/lib/auth"
import { logApiError } from "@/lib/logger"
import { prisma } from "@/lib/prisma"

// Schema para criação de pacote com sessões
const createPackageSchema = z.object({
  patientId: z.string().min(1, "Paciente é obrigatório"),
  type: z.enum(["SESSION", "PACKAGE"]),
  // Para sessão avulsa
  sessionPrice: z.number().optional(),
  // Para pacote
  totalSessions: z.number().min(1).optional(),
  packagePrice: z.number().optional(),
  // Sessões a serem agendadas
  sessions: z.array(z.object({
    dateTime: z.string(),
    duration: z.number().min(15).max(180).default(50),
    observations: z.string().optional(),
  })).min(1, "Pelo menos uma sessão deve ser agendada"),
  // Metadados
  packageName: z.string().optional(),
  notes: z.string().optional(),
  // Pagamento já realizado
  isPaid: z.boolean().optional().default(false),
  paymentMethod: z.string().optional(),
  receiptUrl: z.string().optional(),
  receiptFileName: z.string().optional(),
  receiptFileType: z.string().optional(),
  receiptFileSize: z.number().optional(),
})

// GET - Listar pacotes do usuário
export async function GET(request: Request) {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Não autorizado" },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const patientId = searchParams.get("patientId")
    const status = searchParams.get("status")

    const packages = await prisma.sessionPackage.findMany({
      where: {
        userId: session.user.id,
        ...(patientId && { patientId }),
        ...(status && { status: status as "ACTIVE" | "COMPLETED" | "CANCELLED" }),
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
        pricingPlan: true,
        sessions: {
          select: {
            id: true,
            dateTime: true,
            status: true,
            packageOrder: true,
          },
          orderBy: { packageOrder: "asc" },
        },
      },
      orderBy: { createdAt: "desc" },
    })

    // Calcular estatísticas para cada pacote
    const packagesWithStats = packages.map((pkg) => {
      const scheduledCount = pkg.sessions.filter(
        (s) => s.status === "SCHEDULED" || s.status === "CONFIRMED"
      ).length
      const completedCount = pkg.sessions.filter(
        (s) => s.status === "COMPLETED"
      ).length
      const noShowCount = pkg.sessions.filter(
        (s) => s.status === "NO_SHOW"
      ).length
      const cancelledCount = pkg.sessions.filter(
        (s) => s.status === "CANCELLED"
      ).length
      // Sessões consumidas = realizadas + faltas
      const consumedCount = completedCount + noShowCount
      const remainingSlots = pkg.totalSessions - pkg.sessions.length

      return {
        ...pkg,
        stats: {
          scheduled: scheduledCount,
          completed: completedCount,
          noShow: noShowCount,
          cancelled: cancelledCount,
          consumed: consumedCount,
          remainingSlots,
          totalScheduled: pkg.sessions.length,
        },
      }
    })

    return NextResponse.json(packagesWithStats)
  } catch (error: unknown) {
    logApiError("API", "ERROR", error)
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    )
  }
}

// POST - Criar pacote com sessões
export async function POST(request: Request) {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Não autorizado" },
        { status: 401 }
      )
    }

    const body = await request.json()
    const data = createPackageSchema.parse(body)

    // Verificar se o paciente pertence ao usuário
    const patient = await prisma.patient.findFirst({
      where: {
        id: data.patientId,
        userId: session.user.id,
      },
    })

    if (!patient) {
      return NextResponse.json(
        { error: "Paciente não encontrado" },
        { status: 404 }
      )
    }

    // Verificar conflitos de horário para todas as sessões
    for (const sessionData of data.sessions) {
      const dateTime = new Date(sessionData.dateTime)
      const duration = sessionData.duration || 50
      const endTime = new Date(dateTime.getTime() + duration * 60 * 1000)

      const conflictingSession = await prisma.session.findFirst({
        where: {
          userId: session.user.id,
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
            { error: `Conflito de horário em ${dateTime.toLocaleDateString("pt-BR")} às ${dateTime.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}` },
            { status: 409 }
          )
        }
      }
    }

    // Calcular valores
    let pricePerSession: number
    let totalSessions: number
    let packagePrice: number

    if (data.type === "SESSION") {
      // Sessão avulsa
      pricePerSession = data.sessionPrice || 0
      totalSessions = data.sessions.length
      packagePrice = pricePerSession * totalSessions
    } else {
      // Pacote
      totalSessions = data.totalSessions || data.sessions.length
      packagePrice = data.packagePrice || 0
      pricePerSession = totalSessions > 0 ? packagePrice / totalSessions : 0
    }

    // Desativar planos anteriores
    await prisma.pricingPlan.updateMany({
      where: {
        patientId: data.patientId,
        active: true,
      },
      data: { active: false },
    })

    // Criar tudo em uma transação
    const result = await prisma.$transaction(async (tx) => {
      // 1. Criar PricingPlan
      const pricingPlan = await tx.pricingPlan.create({
        data: {
          patientId: data.patientId,
          type: data.type,
          sessionPrice: data.type === "SESSION" ? pricePerSession : null,
          packageSessions: data.type === "PACKAGE" ? totalSessions : null,
          packagePrice: data.type === "PACKAGE" ? packagePrice : null,
          active: true,
          notes: data.notes,
        },
      })

      // 2. Criar SessionPackage
      const sessionPackage = await tx.sessionPackage.create({
        data: {
          userId: session.user.id,
          patientId: data.patientId,
          pricingPlanId: pricingPlan.id,
          name: data.packageName || `${data.type === "PACKAGE" ? "Pacote" : "Sessões"} - ${new Date().toLocaleDateString("pt-BR")}`,
          totalSessions,
          pricePerSession,
          notes: data.notes,
        },
      })

      // 3. Criar Sessions e Payments
      const createdSessions = []
      for (let i = 0; i < data.sessions.length; i++) {
        const sessionData = data.sessions[i]

        const newSession = await tx.session.create({
          data: {
            userId: session.user.id,
            patientId: data.patientId,
            dateTime: new Date(sessionData.dateTime),
            duration: sessionData.duration || 50,
            observations: sessionData.observations || null,
            packageId: sessionPackage.id,
            packageOrder: i + 1,
          },
        })

        // Criar Payment para a sessão
        await tx.payment.create({
          data: {
            userId: session.user.id,
            sessionId: newSession.id,
            amount: pricePerSession,
            status: data.isPaid ? "PAID" : "PENDING",
            method: data.isPaid && data.paymentMethod ? data.paymentMethod : null,
            paidAt: data.isPaid ? new Date() : null,
            receiptUrl: data.isPaid && data.receiptUrl ? data.receiptUrl : null,
            receiptFileName: data.isPaid && data.receiptFileName ? data.receiptFileName : null,
            receiptFileType: data.isPaid && data.receiptFileType ? data.receiptFileType : null,
            receiptFileSize: data.isPaid && data.receiptFileSize ? data.receiptFileSize : null,
          },
        })

        createdSessions.push(newSession)
      }

      return {
        pricingPlan,
        sessionPackage,
        sessions: createdSessions,
      }
    })

    // Buscar o pacote completo para retornar
    const fullPackage = await prisma.sessionPackage.findUnique({
      where: { id: result.sessionPackage.id },
      include: {
        patient: {
          select: {
            id: true,
            name: true,
            phone: true,
            email: true,
          },
        },
        pricingPlan: true,
        sessions: {
          include: {
            payment: true,
          },
          orderBy: { packageOrder: "asc" },
        },
      },
    })

    return NextResponse.json(fullPackage, { status: 201 })
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
