import { NextResponse } from "next/server"
import { z } from "zod"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

const createPricingPlanSchema = z.object({
  type: z.enum(["SESSION", "PACKAGE"]),
  sessionPrice: z.number().optional().nullable(),
  packageSessions: z.number().optional().nullable(),
  packagePrice: z.number().optional().nullable(),
  startDate: z.string().optional(),
  notes: z.string().optional(),
})

// GET - Listar planos de pagamento do paciente
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Não autorizado" },
        { status: 401 }
      )
    }

    const { id } = await params

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

    const pricingPlans = await prisma.pricingPlan.findMany({
      where: { patientId: id },
      orderBy: { startDate: "desc" },
    })

    return NextResponse.json(pricingPlans)
  } catch (error) {
    console.error("Erro ao listar planos de pagamento:", error)
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    )
  }
}

// POST - Criar novo plano de pagamento
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Não autorizado" },
        { status: 401 }
      )
    }

    const { id } = await params

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

    const body = await request.json()
    const data = createPricingPlanSchema.parse(body)

    // Desativar planos anteriores
    await prisma.pricingPlan.updateMany({
      where: {
        patientId: id,
        active: true,
      },
      data: { active: false },
    })

    // Criar novo plano
    const pricingPlan = await prisma.pricingPlan.create({
      data: {
        patientId: id,
        type: data.type,
        sessionPrice: data.type === "SESSION" ? data.sessionPrice : null,
        packageSessions: data.type === "PACKAGE" ? data.packageSessions : null,
        packagePrice: data.type === "PACKAGE" ? data.packagePrice : null,
        startDate: data.startDate ? new Date(data.startDate) : new Date(),
        notes: data.notes || null,
        active: true,
      },
    })

    return NextResponse.json(pricingPlan, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.issues[0].message },
        { status: 400 }
      )
    }

    console.error("Erro ao criar plano de pagamento:", error)
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    )
  }
}
