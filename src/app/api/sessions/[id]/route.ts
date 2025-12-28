import { NextResponse } from "next/server"
import { z } from "zod"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

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

    return NextResponse.json(sessionData)
  } catch (error) {
    console.error("Erro ao buscar sessão:", error)
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
        ...(data.clinicalNotes !== undefined && { clinicalNotes: data.clinicalNotes || null }),
        ...(data.observations !== undefined && { observations: data.observations || null }),
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

    // Se a sessão foi cancelada, cancelar o pagamento também
    if (data.status === "CANCELLED" && updatedSession.payment) {
      await prisma.payment.update({
        where: { id: updatedSession.payment.id },
        data: { status: "CANCELLED" },
      })
    }

    return NextResponse.json(updatedSession)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.issues[0].message },
        { status: 400 }
      )
    }

    console.error("Erro ao atualizar sessão:", error)
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

    await prisma.session.delete({
      where: { id },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Erro ao excluir sessão:", error)
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    )
  }
}
