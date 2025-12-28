import { NextResponse } from "next/server"
import { z } from "zod"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

const updatePricingPlanSchema = z.object({
  type: z.enum(["SESSION", "PACKAGE"]),
  sessionPrice: z.number().optional().nullable(),
  packageSessions: z.number().optional().nullable(),
  packagePrice: z.number().optional().nullable(),
  startDate: z.string().optional(),
  active: z.boolean().optional(),
  notes: z.string().optional(),
})

// PUT - Atualizar plano de pagamento
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string; planId: string }> }
) {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Não autorizado" },
        { status: 401 }
      )
    }

    const { id, planId } = await params

    // Verificar se o paciente pertence ao usuário
    const patient = await prisma.patient.findFirst({
      where: {
        id,
        userId: session.user.id,
      },
    })

    if (!patient) {
      return NextResponse.json(
        { error: "Paciente não encontrado" },
        { status: 404 }
      )
    }

    // Verificar se o plano existe
    const existingPlan = await prisma.pricingPlan.findFirst({
      where: {
        id: planId,
        patientId: id,
      },
    })

    if (!existingPlan) {
      return NextResponse.json(
        { error: "Plano não encontrado" },
        { status: 404 }
      )
    }

    const body = await request.json()
    const data = updatePricingPlanSchema.parse(body)

    const pricingPlan = await prisma.pricingPlan.update({
      where: { id: planId },
      data: {
        type: data.type,
        sessionPrice: data.type === "SESSION" ? data.sessionPrice : null,
        packageSessions: data.type === "PACKAGE" ? data.packageSessions : null,
        packagePrice: data.type === "PACKAGE" ? data.packagePrice : null,
        startDate: data.startDate ? new Date(data.startDate) : undefined,
        active: data.active,
        notes: data.notes,
      },
    })

    return NextResponse.json(pricingPlan)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.issues[0].message },
        { status: 400 }
      )
    }

    console.error("Erro ao atualizar plano de pagamento:", error)
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    )
  }
}

// DELETE - Excluir plano de pagamento (com cascata para sessões e pagamentos)
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string; planId: string }> }
) {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Não autorizado" },
        { status: 401 }
      )
    }

    const { id, planId } = await params

    // Verificar se o paciente pertence ao usuário
    const patient = await prisma.patient.findFirst({
      where: {
        id,
        userId: session.user.id,
      },
    })

    if (!patient) {
      return NextResponse.json(
        { error: "Paciente não encontrado" },
        { status: 404 }
      )
    }

    // Verificar se o plano existe e buscar SessionPackage associado
    const existingPlan = await prisma.pricingPlan.findFirst({
      where: {
        id: planId,
        patientId: id,
      },
      include: {
        sessionPackage: {
          include: {
            sessions: {
              select: { id: true },
            },
          },
        },
      },
    })

    if (!existingPlan) {
      return NextResponse.json(
        { error: "Plano não encontrado" },
        { status: 404 }
      )
    }

    // Deletar em cascata usando transação
    await prisma.$transaction(async (tx) => {
      // Se existir um SessionPackage vinculado
      if (existingPlan.sessionPackage) {
        const sessionIds = existingPlan.sessionPackage.sessions.map((s) => s.id)

        // 1. Deletar pagamentos das sessões
        if (sessionIds.length > 0) {
          await tx.payment.deleteMany({
            where: { sessionId: { in: sessionIds } },
          })

          // 2. Deletar sessões
          await tx.session.deleteMany({
            where: { id: { in: sessionIds } },
          })
        }

        // 3. Deletar SessionPackage
        await tx.sessionPackage.delete({
          where: { id: existingPlan.sessionPackage.id },
        })
      }

      // 4. Deletar PricingPlan
      await tx.pricingPlan.delete({
        where: { id: planId },
      })
    })

    return NextResponse.json({ message: "Plano e dados relacionados excluídos com sucesso" })
  } catch (error) {
    console.error("Erro ao excluir plano de pagamento:", error)
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    )
  }
}
