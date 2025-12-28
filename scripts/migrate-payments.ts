import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

async function migratePayments() {
  console.log("Iniciando migração de pagamentos...")

  // Buscar todas as sessões que não têm payment e não são canceladas
  const sessionsWithoutPayment = await prisma.session.findMany({
    where: {
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

  console.log(`Encontradas ${sessionsWithoutPayment.length} sessões sem pagamento`)

  let createdCount = 0

  for (const session of sessionsWithoutPayment) {
    // Pegar preço do plano ativo do paciente
    const activePlan = session.patient.pricingPlans[0]
    const amount = activePlan?.sessionPrice || 0

    await prisma.payment.create({
      data: {
        userId: session.userId,
        sessionId: session.id,
        amount,
        status: "PENDING",
      },
    })

    createdCount++
    console.log(`Criado pagamento para sessão ${session.id} - Paciente: ${session.patient.name}`)
  }

  console.log(`\nMigração concluída! ${createdCount} pagamentos criados.`)
}

migratePayments()
  .catch((e) => {
    console.error("Erro na migração:", e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
