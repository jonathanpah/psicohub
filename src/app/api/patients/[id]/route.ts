import { NextResponse } from "next/server"
import { z } from "zod"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

const updatePatientSchema = z.object({
  name: z.string().min(2, "Nome deve ter pelo menos 2 caracteres"),
  email: z.string().email("Email inválido").optional().or(z.literal("")),
  phone: z.string().optional(),
  birthDate: z.string().optional().nullable(),
  cpf: z.string().optional(),
  address: z.string().optional(),
  // Dados do responsável
  guardian: z.string().optional(),
  guardianCpf: z.string().optional(),
  guardianEmail: z.string().email("Email do responsável inválido").optional().or(z.literal("")),
  guardianPhone: z.string().optional(),
  guardianAddress: z.string().optional(),
  guardianRelation: z.string().optional(),
  notes: z.string().optional(),
  status: z.enum(["ACTIVE", "INACTIVE", "ARCHIVED"]).optional(),
})

// GET - Buscar paciente por ID
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

    const patient = await prisma.patient.findFirst({
      where: {
        id,
        userId: session.user.id,
      },
      include: {
        sessions: {
          orderBy: { dateTime: "desc" },
          take: 10,
          include: {
            payment: true,
            package: {
              select: {
                id: true,
                name: true,
                totalSessions: true,
              },
            },
          },
        },
        pricingPlans: {
          orderBy: { startDate: "desc" },
        },
      },
    })

    if (!patient) {
      return NextResponse.json(
        { error: "Paciente não encontrado" },
        { status: 404 }
      )
    }

    return NextResponse.json(patient)
  } catch (error) {
    console.error("Erro ao buscar paciente:", error)
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    )
  }
}

// PUT - Atualizar paciente
export async function PUT(
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
    const existingPatient = await prisma.patient.findFirst({
      where: {
        id,
        userId: session.user.id,
      },
    })

    if (!existingPatient) {
      return NextResponse.json(
        { error: "Paciente não encontrado" },
        { status: 404 }
      )
    }

    const body = await request.json()
    const data = updatePatientSchema.parse(body)

    const patient = await prisma.patient.update({
      where: { id },
      data: {
        name: data.name,
        email: data.email || null,
        phone: data.phone || null,
        birthDate: data.birthDate ? new Date(data.birthDate) : null,
        cpf: data.cpf || null,
        address: data.address || null,
        guardian: data.guardian || null,
        guardianCpf: data.guardianCpf || null,
        guardianEmail: data.guardianEmail || null,
        guardianPhone: data.guardianPhone || null,
        guardianAddress: data.guardianAddress || null,
        guardianRelation: data.guardianRelation || null,
        notes: data.notes || null,
        status: data.status,
      },
    })

    return NextResponse.json(patient)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.issues[0].message },
        { status: 400 }
      )
    }

    console.error("Erro ao atualizar paciente:", error)
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    )
  }
}

// DELETE - Excluir paciente
export async function DELETE(
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
    const existingPatient = await prisma.patient.findFirst({
      where: {
        id,
        userId: session.user.id,
      },
    })

    if (!existingPatient) {
      return NextResponse.json(
        { error: "Paciente não encontrado" },
        { status: 404 }
      )
    }

    await prisma.patient.delete({
      where: { id },
    })

    return NextResponse.json({ message: "Paciente excluído com sucesso" })
  } catch (error) {
    console.error("Erro ao excluir paciente:", error)
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    )
  }
}
