import { NextResponse } from "next/server"
import { z } from "zod"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

// Schema para adicionar sessões ao pacote
const addSessionsSchema = z.object({
  sessions: z.array(z.object({
    dateTime: z.string(),
    duration: z.number().min(15).max(180).default(50),
    observations: z.string().optional(),
  })).min(1, "Pelo menos uma sessão deve ser agendada"),
  // Receipt info to copy to new payments (if package was already paid)
  copyReceipt: z.boolean().optional(),
  receiptUrl: z.string().optional(),
  receiptFileName: z.string().optional().nullable(),
  receiptFileType: z.string().optional().nullable(),
  receiptFileSize: z.number().optional().nullable(),
})

// POST - Adicionar mais sessões ao pacote
export async function POST(
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

    const sessionPackage = await prisma.sessionPackage.findFirst({
      where: {
        id,
        userId: session.user.id,
      },
      include: {
        sessions: {
          select: { packageOrder: true },
          orderBy: { packageOrder: "desc" },
          take: 1,
        },
      },
    })

    if (!sessionPackage) {
      return NextResponse.json(
        { error: "Pacote não encontrado" },
        { status: 404 }
      )
    }

    if (sessionPackage.status !== "ACTIVE") {
      return NextResponse.json(
        { error: "Não é possível adicionar sessões a um pacote inativo" },
        { status: 400 }
      )
    }

    const body = await request.json()
    const data = addSessionsSchema.parse(body)

    // Verificar se há slots disponíveis
    const currentSessionCount = await prisma.session.count({
      where: { packageId: id },
    })

    const remainingSlots = sessionPackage.totalSessions - currentSessionCount

    if (data.sessions.length > remainingSlots) {
      return NextResponse.json(
        { error: `Apenas ${remainingSlots} slots disponíveis no pacote` },
        { status: 400 }
      )
    }

    // Verificar conflitos de horário
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

    // Pegar a última ordem de sessão no pacote
    const lastOrder = sessionPackage.sessions[0]?.packageOrder || 0

    // Criar sessões em transação
    const createdSessions = await prisma.$transaction(async (tx) => {
      const sessions = []

      for (let i = 0; i < data.sessions.length; i++) {
        const sessionData = data.sessions[i]
        const order = lastOrder + i + 1

        const newSession = await tx.session.create({
          data: {
            userId: session.user.id,
            patientId: sessionPackage.patientId,
            dateTime: new Date(sessionData.dateTime),
            duration: sessionData.duration || 50,
            observations: sessionData.observations || null,
            packageId: id,
            packageOrder: order,
          },
        })

        // Criar Payment (com recibo copiado se o pacote já foi pago)
        const paymentData: {
          userId: string
          sessionId: string
          amount: number | typeof sessionPackage.pricePerSession
          status: "PENDING" | "PAID"
          paidAt?: Date | null
          receiptUrl?: string | null
          receiptFileName?: string | null
          receiptFileType?: string | null
          receiptFileSize?: number | null
        } = {
          userId: session.user.id,
          sessionId: newSession.id,
          amount: sessionPackage.pricePerSession,
          status: data.copyReceipt && data.receiptUrl ? "PAID" : "PENDING",
        }

        // Copy receipt info if provided
        if (data.copyReceipt && data.receiptUrl) {
          paymentData.paidAt = new Date()
          paymentData.receiptUrl = data.receiptUrl
          paymentData.receiptFileName = data.receiptFileName ?? null
          paymentData.receiptFileType = data.receiptFileType ?? null
          paymentData.receiptFileSize = data.receiptFileSize ?? null
        }

        await tx.payment.create({
          data: paymentData,
        })

        sessions.push(newSession)
      }

      return sessions
    })

    // Verificar se o pacote está completo e atualizar status
    const totalScheduled = currentSessionCount + data.sessions.length
    if (totalScheduled >= sessionPackage.totalSessions) {
      // Verificar se todas as sessões foram realizadas
      const completedCount = await prisma.session.count({
        where: {
          packageId: id,
          status: "COMPLETED",
        },
      })

      if (completedCount >= sessionPackage.totalSessions) {
        await prisma.sessionPackage.update({
          where: { id },
          data: { status: "COMPLETED" },
        })
      }
    }

    return NextResponse.json({
      message: `${createdSessions.length} sessão(ões) adicionada(s)`,
      sessions: createdSessions,
    }, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.issues[0].message },
        { status: 400 }
      )
    }

    console.error("Erro ao adicionar sessões:", error)
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    )
  }
}
