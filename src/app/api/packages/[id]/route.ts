import { NextResponse } from "next/server"
import { z } from "zod"
import { auth } from "@/lib/auth"
import { logApiError } from "@/lib/logger"
import { prisma } from "@/lib/prisma"

// GET - Buscar detalhes do pacote
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

    const sessionPackage = await prisma.sessionPackage.findFirst({
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
            cpf: true,
          },
        },
        pricingPlan: true,
        sessions: {
          include: {
            payment: {
              select: {
                id: true,
                amount: true,
                status: true,
                method: true,
                paidAt: true,
                receiptUrl: true,
                receiptFileName: true,
                receiptFileType: true,
                receiptFileSize: true,
              },
            },
          },
          orderBy: { packageOrder: "asc" },
        },
      },
    })

    if (!sessionPackage) {
      return NextResponse.json(
        { error: "Pacote não encontrado" },
        { status: 404 }
      )
    }

    // Calcular estatísticas
    const stats = {
      scheduled: sessionPackage.sessions.filter(
        (s) => s.status === "SCHEDULED" || s.status === "CONFIRMED"
      ).length,
      completed: sessionPackage.sessions.filter(
        (s) => s.status === "COMPLETED"
      ).length,
      noShow: sessionPackage.sessions.filter(
        (s) => s.status === "NO_SHOW"
      ).length,
      cancelled: sessionPackage.sessions.filter(
        (s) => s.status === "CANCELLED"
      ).length,
      // Sessões consumidas = realizadas + faltas (ambas contam para conclusão do pacote)
      consumed: sessionPackage.sessions.filter(
        (s) => s.status === "COMPLETED" || s.status === "NO_SHOW"
      ).length,
      remainingSlots: sessionPackage.totalSessions - sessionPackage.sessions.length,
      totalScheduled: sessionPackage.sessions.length,
      totalPaid: sessionPackage.sessions.filter(
        (s) => s.payment?.status === "PAID"
      ).length,
      totalPending: sessionPackage.sessions.filter(
        (s) => s.payment?.status === "PENDING"
      ).length,
      amountPaid: sessionPackage.sessions
        .filter((s) => s.payment?.status === "PAID")
        .reduce((sum, s) => sum + Number(s.payment?.amount || 0), 0),
      amountPending: sessionPackage.sessions
        .filter((s) => s.payment?.status === "PENDING")
        .reduce((sum, s) => sum + Number(s.payment?.amount || 0), 0),
    }

    return NextResponse.json({
      ...sessionPackage,
      stats,
    })
  } catch (error: unknown) {
    logApiError("API", "ERROR", error)
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    )
  }
}

// PUT - Atualizar pacote (status, nome, notas)
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

    const existingPackage = await prisma.sessionPackage.findFirst({
      where: {
        id,
        userId: session.user.id,
      },
    })

    if (!existingPackage) {
      return NextResponse.json(
        { error: "Pacote não encontrado" },
        { status: 404 }
      )
    }

    const body = await request.json()

    const updateData: Record<string, unknown> = {}

    if (body.name !== undefined) {
      updateData.name = body.name
    }

    if (body.notes !== undefined) {
      updateData.notes = body.notes
    }

    if (body.status !== undefined) {
      updateData.status = body.status

      // Se cancelar o pacote, cancelar sessões pendentes
      if (body.status === "CANCELLED") {
        await prisma.session.updateMany({
          where: {
            packageId: id,
            status: { in: ["SCHEDULED", "CONFIRMED"] },
          },
          data: { status: "CANCELLED" },
        })

        // Cancelar pagamentos pendentes
        await prisma.payment.updateMany({
          where: {
            session: { packageId: id },
            status: "PENDING",
          },
          data: { status: "CANCELLED" },
        })
      }
    }

    const updatedPackage = await prisma.sessionPackage.update({
      where: { id },
      data: updateData,
      include: {
        patient: {
          select: {
            id: true,
            name: true,
          },
        },
        sessions: {
          select: {
            id: true,
            status: true,
            packageOrder: true,
          },
        },
      },
    })

    return NextResponse.json(updatedPackage)
  } catch (error: unknown) {
    logApiError("API", "ERROR", error)
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    )
  }
}

// DELETE - Excluir pacote (apenas se não tiver sessões realizadas)
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

    const existingPackage = await prisma.sessionPackage.findFirst({
      where: {
        id,
        userId: session.user.id,
      },
      include: {
        sessions: true,
        pricingPlan: true,
      },
    })

    if (!existingPackage) {
      return NextResponse.json(
        { error: "Pacote não encontrado" },
        { status: 404 }
      )
    }

    // Verificar se tem sessões completadas
    const completedSessions = existingPackage.sessions.filter(
      (s) => s.status === "COMPLETED"
    )

    if (completedSessions.length > 0) {
      return NextResponse.json(
        { error: "Não é possível excluir pacote com sessões realizadas" },
        { status: 400 }
      )
    }

    // Excluir em cascata usando transação
    // Ordem: Sessions -> SessionPackage -> PricingPlan
    // Nota: Payment tem onDelete: Cascade de Session, então será deletado automaticamente
    await prisma.$transaction(async (tx) => {
      // 1. Deletar todas as sessões do pacote (Payments serão deletados automaticamente via cascade)
      await tx.session.deleteMany({
        where: { packageId: id },
      })

      // 2. Deletar o pacote
      await tx.sessionPackage.delete({
        where: { id },
      })

      // 3. Deletar o PricingPlan associado
      if (existingPackage.pricingPlanId) {
        await tx.pricingPlan.delete({
          where: { id: existingPackage.pricingPlanId },
        })
      }
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
