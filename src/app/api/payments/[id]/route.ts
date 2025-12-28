import { NextResponse } from "next/server"
import { z } from "zod"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

const updatePaymentSchema = z.object({
  status: z.enum(["PENDING", "PAID", "CANCELLED"]).optional(),
  method: z.enum(["PIX", "DINHEIRO", "CARTAO_CREDITO", "CARTAO_DEBITO", "TRANSFERENCIA"]).optional().nullable(),
  amount: z.number().optional(),
  notes: z.string().optional().nullable(),
  receiptUrl: z.string().optional().nullable(),
})

// GET - Buscar pagamento específico
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

    const payment = await prisma.payment.findFirst({
      where: {
        id,
        userId: session.user.id,
      },
      include: {
        session: {
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
          },
        },
        user: {
          select: {
            id: true,
            name: true,
            crp: true,
            cpf: true,
            phone: true,
            clinicName: true,
            clinicCnpj: true,
            clinicAddress: true,
            clinicPhone: true,
          },
        },
      },
    })

    if (!payment) {
      return NextResponse.json(
        { error: "Pagamento não encontrado" },
        { status: 404 }
      )
    }

    return NextResponse.json(payment)
  } catch (error) {
    console.error("Erro ao buscar pagamento:", error)
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    )
  }
}

// PUT - Atualizar pagamento
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

    // Verificar se o pagamento existe e pertence ao usuário
    const existingPayment = await prisma.payment.findFirst({
      where: {
        id,
        userId: session.user.id,
      },
    })

    if (!existingPayment) {
      return NextResponse.json(
        { error: "Pagamento não encontrado" },
        { status: 404 }
      )
    }

    const body = await request.json()
    const data = updatePaymentSchema.parse(body)

    // Se está marcando como PAID, definir paidAt
    const updateData: Record<string, unknown> = {}

    if (data.status !== undefined) {
      updateData.status = data.status
      if (data.status === "PAID" && !existingPayment.paidAt) {
        updateData.paidAt = new Date()
      } else if (data.status !== "PAID") {
        updateData.paidAt = null
      }
    }

    if (data.method !== undefined) {
      updateData.method = data.method
    }

    if (data.amount !== undefined) {
      updateData.amount = data.amount
    }

    if (data.notes !== undefined) {
      updateData.notes = data.notes
    }

    if (data.receiptUrl !== undefined) {
      updateData.receiptUrl = data.receiptUrl
    }

    const updatedPayment = await prisma.payment.update({
      where: { id },
      data: updateData,
      include: {
        session: {
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
        },
      },
    })

    return NextResponse.json(updatedPayment)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.issues[0].message },
        { status: 400 }
      )
    }

    console.error("Erro ao atualizar pagamento:", error)
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    )
  }
}

// DELETE - Excluir pagamento
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

    // Verificar se o pagamento existe e pertence ao usuário
    const existingPayment = await prisma.payment.findFirst({
      where: {
        id,
        userId: session.user.id,
      },
    })

    if (!existingPayment) {
      return NextResponse.json(
        { error: "Pagamento não encontrado" },
        { status: 404 }
      )
    }

    await prisma.payment.delete({
      where: { id },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Erro ao excluir pagamento:", error)
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    )
  }
}
