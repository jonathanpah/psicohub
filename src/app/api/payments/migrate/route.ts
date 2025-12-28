import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

// POST - Criar payments para sessões existentes que não têm
export async function POST() {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Não autorizado" },
        { status: 401 }
      )
    }

    // Buscar todas as sessões do usuário que não têm payment e não são canceladas
    const sessionsWithoutPayment = await prisma.session.findMany({
      where: {
        userId: session.user.id,
        payment: null,
        status: { notIn: ["CANCELLED"] },
        isCourtesy: false,
      },
      include: {
        patient: {
          include: {
            pricingPlans: {
              where: { active: true },
              orderBy: { startDate: "desc" },
              take: 1,
            },
          },
        },
      },
    })

    const createdPayments = []

    for (const sessionItem of sessionsWithoutPayment) {
      // Pegar preço do plano ativo do paciente
      const activePlan = sessionItem.patient.pricingPlans[0]
      const amount = activePlan?.sessionPrice || 0

      // Determinar status do payment baseado no status da sessão
      let paymentStatus: "PENDING" | "PAID" | "CANCELLED" = "PENDING"
      if (sessionItem.status === "COMPLETED") {
        // Sessões já realizadas ficam como pendente para o psicólogo marcar
        paymentStatus = "PENDING"
      }

      const payment = await prisma.payment.create({
        data: {
          userId: session.user.id,
          sessionId: sessionItem.id,
          amount,
          status: paymentStatus,
        },
      })

      createdPayments.push(payment)
    }

    return NextResponse.json({
      message: `${createdPayments.length} pagamentos criados com sucesso`,
      count: createdPayments.length,
      payments: createdPayments,
    })
  } catch (error) {
    console.error("Erro ao migrar sessões:", error)
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    )
  }
}
