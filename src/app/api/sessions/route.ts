import { NextResponse } from "next/server"
import { z } from "zod"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { generateRecurrenceDates, generateRecurrenceGroupId } from "@/lib/recurrence"

const createSessionSchema = z.object({
  patientId: z.string().min(1, "Paciente é obrigatório"),
  dateTime: z.string().min(1, "Data e hora são obrigatórios"),
  duration: z.number().min(15).max(180).default(50),
  isCourtesy: z.boolean().optional().default(false),
  observations: z.string().optional(),
  clinicalNotes: z.string().optional(),
  // Campos de recorrência
  isRecurring: z.boolean().optional().default(false),
  recurrencePattern: z.enum(["WEEKLY", "BIWEEKLY", "MONTHLY"]).optional(),
  recurrenceEndType: z.enum(["DATE", "OCCURRENCES"]).optional(),
  recurrenceEndDate: z.string().optional(),
  recurrenceOccurrences: z.number().min(2).max(52).optional(),
  // Preço customizado por sessão (opcional)
  customSessionPrice: z.number().min(0).optional(),
  // Pagamento já realizado
  isPaid: z.boolean().optional().default(false),
  paymentMethod: z.string().optional(),
  receiptUrl: z.string().optional(),
  receiptFileName: z.string().optional(),
  receiptFileType: z.string().optional(),
  receiptFileSize: z.number().optional(),
})

// Função auxiliar para verificar conflitos de horário
async function checkTimeConflict(
  userId: string,
  dateTime: Date,
  duration: number,
  excludeSessionId?: string
): Promise<boolean> {
  const endTime = new Date(dateTime.getTime() + duration * 60 * 1000)

  const conflictingSession = await prisma.session.findFirst({
    where: {
      userId,
      status: { notIn: ["CANCELLED"] },
      ...(excludeSessionId && { id: { not: excludeSessionId } }),
      dateTime: {
        gte: new Date(dateTime.getTime() - 180 * 60 * 1000),
        lte: endTime,
      },
    },
  })

  if (!conflictingSession) return false

  const existingEnd = new Date(
    conflictingSession.dateTime.getTime() + conflictingSession.duration * 60 * 1000
  )

  return (
    (dateTime >= conflictingSession.dateTime && dateTime < existingEnd) ||
    (endTime > conflictingSession.dateTime && endTime <= existingEnd) ||
    (dateTime <= conflictingSession.dateTime && endTime >= existingEnd)
  )
}

// GET - Listar sessões
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
    const startDate = searchParams.get("startDate")
    const endDate = searchParams.get("endDate")
    const status = searchParams.get("status")

    const sessions = await prisma.session.findMany({
      where: {
        userId: session.user.id,
        ...(patientId && { patientId }),
        ...(status && { status: status as "SCHEDULED" | "CONFIRMED" | "COMPLETED" | "CANCELLED" | "NO_SHOW" }),
        ...(startDate && endDate && {
          dateTime: {
            gte: new Date(startDate),
            lte: new Date(endDate),
          },
        }),
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
        payment: {
          select: {
            id: true,
            amount: true,
            status: true,
            method: true,
          },
        },
        package: {
          select: {
            id: true,
            name: true,
            totalSessions: true,
          },
        },
      },
      orderBy: { dateTime: "asc" },
    })

    return NextResponse.json(sessions)
  } catch (error) {
    console.error("Erro ao listar sessões:", error)
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    )
  }
}

// POST - Criar sessão (simples ou recorrente)
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
    const data = createSessionSchema.parse(body)

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

    // Determinar preço da sessão
    // Se foi informado preço customizado, usar ele
    // Caso contrário, buscar plano de preço ativo do paciente
    let sessionPrice = 0
    if (data.customSessionPrice !== undefined && data.customSessionPrice > 0) {
      sessionPrice = data.customSessionPrice
    } else {
      const pricingPlan = await prisma.pricingPlan.findFirst({
        where: {
          patientId: data.patientId,
          active: true,
        },
        orderBy: { startDate: "desc" },
      })

      if (pricingPlan) {
        if (pricingPlan.type === "SESSION" && pricingPlan.sessionPrice) {
          // Plano por sessão: usar sessionPrice diretamente
          sessionPrice = Number(pricingPlan.sessionPrice)
        } else if (pricingPlan.type === "PACKAGE" && pricingPlan.packagePrice && pricingPlan.packageSessions) {
          // Plano por pacote: calcular valor por sessão
          sessionPrice = Number(pricingPlan.packagePrice) / pricingPlan.packageSessions
        }
      }
    }

    // ========== SESSÃO RECORRENTE ==========
    if (data.isRecurring && data.recurrencePattern) {
      const recurrenceGroupId = generateRecurrenceGroupId()

      // Gerar datas da recorrência
      const dates = generateRecurrenceDates({
        startDate: new Date(data.dateTime),
        pattern: data.recurrencePattern,
        endDate: data.recurrenceEndDate ? new Date(data.recurrenceEndDate) : undefined,
        occurrences: data.recurrenceOccurrences,
      })

      // Verificar conflitos para TODAS as datas
      const conflictDates: string[] = []
      for (const date of dates) {
        const hasConflict = await checkTimeConflict(session.user.id, date, data.duration)
        if (hasConflict) {
          conflictDates.push(date.toISOString())
        }
      }

      if (conflictDates.length > 0) {
        return NextResponse.json({
          error: `Conflito de horário em ${conflictDates.length} data(s)`,
          conflicts: conflictDates,
        }, { status: 409 })
      }

      // Criar todas as sessões
      const createdSessions = []
      for (let i = 0; i < dates.length; i++) {
        const newSession = await prisma.session.create({
          data: {
            userId: session.user.id,
            patientId: data.patientId,
            dateTime: dates[i],
            duration: data.duration,
            isCourtesy: data.isCourtesy || false,
            observations: data.observations || null,
            recurrenceGroupId,
            recurrencePattern: data.recurrencePattern,
            recurrenceEndDate: data.recurrenceEndDate ? new Date(data.recurrenceEndDate) : null,
            recurrenceCount: dates.length,
            recurrenceIndex: i + 1,
          },
        })
        createdSessions.push(newSession)

        // Criar pagamento se não for cortesia
        if (!data.isCourtesy) {
          await prisma.payment.create({
            data: {
              userId: session.user.id,
              sessionId: newSession.id,
              amount: sessionPrice,
              status: data.isPaid ? "PAID" : "PENDING",
              method: data.isPaid && data.paymentMethod ? data.paymentMethod : null,
              paidAt: data.isPaid ? new Date() : null,
              receiptUrl: data.isPaid && data.receiptUrl ? data.receiptUrl : null,
              receiptFileName: data.isPaid && data.receiptFileName ? data.receiptFileName : null,
              receiptFileType: data.isPaid && data.receiptFileType ? data.receiptFileType : null,
              receiptFileSize: data.isPaid && data.receiptFileSize ? data.receiptFileSize : null,
            },
          })
        }
      }

      return NextResponse.json({
        recurrenceGroupId,
        sessionsCreated: createdSessions.length,
        firstSession: createdSessions[0],
        message: `${createdSessions.length} sessões criadas com sucesso`,
        isPaid: data.isPaid || false,
      }, { status: 201 })
    }

    // ========== SESSÃO SIMPLES ==========
    const dateTime = new Date(data.dateTime)

    // Verificar conflito de horário
    const hasConflict = await checkTimeConflict(session.user.id, dateTime, data.duration)
    if (hasConflict) {
      return NextResponse.json(
        { error: "Já existe uma sessão agendada neste horário" },
        { status: 409 }
      )
    }

    const newSession = await prisma.session.create({
      data: {
        userId: session.user.id,
        patientId: data.patientId,
        dateTime,
        duration: data.duration,
        isCourtesy: data.isCourtesy || false,
        observations: data.observations || null,
        clinicalNotes: data.clinicalNotes || null,
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
      },
    })

    // Criar pagamento automaticamente se não for sessão cortesia
    if (!data.isCourtesy) {
      await prisma.payment.create({
        data: {
          userId: session.user.id,
          sessionId: newSession.id,
          amount: sessionPrice,
          status: data.isPaid ? "PAID" : "PENDING",
          method: data.isPaid && data.paymentMethod ? data.paymentMethod : null,
          paidAt: data.isPaid ? new Date() : null,
          receiptUrl: data.isPaid && data.receiptUrl ? data.receiptUrl : null,
          receiptFileName: data.isPaid && data.receiptFileName ? data.receiptFileName : null,
          receiptFileType: data.isPaid && data.receiptFileType ? data.receiptFileType : null,
          receiptFileSize: data.isPaid && data.receiptFileSize ? data.receiptFileSize : null,
        },
      })
    }

    return NextResponse.json(newSession, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.issues[0].message },
        { status: 400 }
      )
    }

    console.error("Erro ao criar sessão:", error)
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    )
  }
}
