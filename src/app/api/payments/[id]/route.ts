import { NextResponse } from "next/server"
import { z } from "zod"
import { auth } from "@/lib/auth"
import { logApiError } from "@/lib/logger"
import { prisma } from "@/lib/prisma"
import { logPaymentEvent } from "@/lib/audit"
import { checkRateLimit, rateLimitConfigs, getClientIP, rateLimitExceededResponse } from "@/lib/rate-limit"
import { sanitizeText } from "@/lib/sanitize"

const updatePaymentSchema = z.object({
  status: z.enum(["PENDING", "PAID", "CANCELLED"]).optional(),
  method: z.enum(["PIX", "DINHEIRO", "CARTAO_CREDITO", "CARTAO_DEBITO", "TRANSFERENCIA"]).optional().nullable(),
  amount: z.number().optional(),
  notes: z.string().optional().nullable(),
  receiptUrl: z.string().optional().nullable(),
  receiptFileName: z.string().optional().nullable(),
  receiptFileType: z.string().optional().nullable(),
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
  } catch (error: unknown) {
    logApiError("API", "ERROR", error)
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
      updateData.notes = data.notes ? sanitizeText(data.notes) : null
    }

    if (data.receiptUrl !== undefined) {
      updateData.receiptUrl = data.receiptUrl
    }

    if (data.receiptFileName !== undefined) {
      updateData.receiptFileName = data.receiptFileName
    }

    if (data.receiptFileType !== undefined) {
      updateData.receiptFileType = data.receiptFileType
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

    // Registrar auditoria de atualização (sem dados pessoais)
    await logPaymentEvent("PAYMENT_UPDATE", session.user.id, updatedPayment.id, {
      amount: Number(updatedPayment.amount),
      status: updatedPayment.status,
    }, request)

    return NextResponse.json(updatedPayment)
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

// DELETE - Excluir pagamento
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

    // Registrar auditoria antes de excluir
    await logPaymentEvent("PAYMENT_DELETE", session.user.id, id, {
      sessionId: existingPayment.sessionId,
      amount: Number(existingPayment.amount),
      status: existingPayment.status,
    }, request)

    await prisma.payment.delete({
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
