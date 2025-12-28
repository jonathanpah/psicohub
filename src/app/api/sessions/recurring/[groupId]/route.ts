import { NextResponse } from "next/server"
import { z } from "zod"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

const deleteSchema = z.object({
  deleteType: z.enum(["SINGLE", "FUTURE", "ALL"]),
  sessionId: z.string().optional(), // Necessário para SINGLE e FUTURE
})

// GET - Listar todas as sessões de um grupo de recorrência
export async function GET(
  request: Request,
  { params }: { params: Promise<{ groupId: string }> }
) {
  try {
    const session = await auth()
    const { groupId } = await params

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Não autorizado" },
        { status: 401 }
      )
    }

    const sessions = await prisma.session.findMany({
      where: {
        userId: session.user.id,
        recurrenceGroupId: groupId,
      },
      include: {
        patient: {
          select: {
            id: true,
            name: true,
          },
        },
        payment: {
          select: {
            id: true,
            status: true,
            amount: true,
          },
        },
      },
      orderBy: { dateTime: "asc" },
    })

    if (sessions.length === 0) {
      return NextResponse.json(
        { error: "Grupo de recorrência não encontrado" },
        { status: 404 }
      )
    }

    // Estatísticas do grupo
    const stats = {
      total: sessions.length,
      scheduled: sessions.filter(s => s.status === "SCHEDULED").length,
      confirmed: sessions.filter(s => s.status === "CONFIRMED").length,
      completed: sessions.filter(s => s.status === "COMPLETED").length,
      cancelled: sessions.filter(s => s.status === "CANCELLED").length,
      noShow: sessions.filter(s => s.status === "NO_SHOW").length,
    }

    return NextResponse.json({
      groupId,
      sessions,
      stats,
      pattern: sessions[0].recurrencePattern,
      patientName: sessions[0].patient.name,
    })
  } catch (error) {
    console.error("Erro ao buscar grupo de recorrência:", error)
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    )
  }
}

// DELETE - Excluir sessões do grupo
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ groupId: string }> }
) {
  try {
    const session = await auth()
    const { groupId } = await params

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Não autorizado" },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { deleteType, sessionId } = deleteSchema.parse(body)

    // Verificar se o grupo pertence ao usuário
    const groupSessions = await prisma.session.findMany({
      where: {
        userId: session.user.id,
        recurrenceGroupId: groupId,
      },
      orderBy: { dateTime: "asc" },
    })

    if (groupSessions.length === 0) {
      return NextResponse.json(
        { error: "Grupo de recorrência não encontrado" },
        { status: 404 }
      )
    }

    let deletedCount = 0

    switch (deleteType) {
      case "SINGLE": {
        // Excluir apenas uma sessão específica
        if (!sessionId) {
          return NextResponse.json(
            { error: "sessionId é obrigatório para exclusão individual" },
            { status: 400 }
          )
        }

        const targetSession = groupSessions.find(s => s.id === sessionId)
        if (!targetSession) {
          return NextResponse.json(
            { error: "Sessão não encontrada no grupo" },
            { status: 404 }
          )
        }

        // Não permitir excluir sessões já realizadas
        if (targetSession.status === "COMPLETED") {
          return NextResponse.json(
            { error: "Não é possível excluir sessões já realizadas" },
            { status: 400 }
          )
        }

        await prisma.session.delete({
          where: { id: sessionId },
        })
        deletedCount = 1
        break
      }

      case "FUTURE": {
        // Excluir esta sessão e todas as futuras
        if (!sessionId) {
          return NextResponse.json(
            { error: "sessionId é obrigatório para exclusão de futuras" },
            { status: 400 }
          )
        }

        const targetSession = groupSessions.find(s => s.id === sessionId)
        if (!targetSession) {
          return NextResponse.json(
            { error: "Sessão não encontrada no grupo" },
            { status: 404 }
          )
        }

        // Encontrar sessões futuras (a partir desta)
        const futureSessions = groupSessions.filter(
          s => s.dateTime >= targetSession.dateTime && s.status !== "COMPLETED"
        )

        // Excluir todas as futuras
        const result = await prisma.session.deleteMany({
          where: {
            id: { in: futureSessions.map(s => s.id) },
          },
        })
        deletedCount = result.count
        break
      }

      case "ALL": {
        // Excluir todas as sessões do grupo (exceto realizadas)
        const deletableSessions = groupSessions.filter(
          s => s.status !== "COMPLETED"
        )

        const result = await prisma.session.deleteMany({
          where: {
            id: { in: deletableSessions.map(s => s.id) },
          },
        })
        deletedCount = result.count
        break
      }
    }

    return NextResponse.json({
      success: true,
      deletedCount,
      message: `${deletedCount} sessão(ões) excluída(s)`,
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.issues[0].message },
        { status: 400 }
      )
    }

    console.error("Erro ao excluir sessões:", error)
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    )
  }
}
