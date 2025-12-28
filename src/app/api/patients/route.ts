import { NextResponse } from "next/server"
import { z } from "zod"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

const createPatientSchema = z.object({
  name: z.string().min(2, "Nome deve ter pelo menos 2 caracteres"),
  email: z.string().email("Email inválido").optional().or(z.literal("")),
  phone: z.string().optional(),
  birthDate: z.string().optional(),
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
})

// GET - Listar pacientes
export async function GET(request: Request) {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Não autorizado" },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const search = searchParams.get("search") || ""
    const status = searchParams.get("status") || "ACTIVE"

    const patients = await prisma.patient.findMany({
      where: {
        userId: session.user.id,
        ...(status !== "ALL" && { status: status as "ACTIVE" | "INACTIVE" | "ARCHIVED" }),
        ...(search && {
          OR: [
            { name: { contains: search, mode: "insensitive" } },
            { email: { contains: search, mode: "insensitive" } },
            { phone: { contains: search, mode: "insensitive" } },
          ],
        }),
      },
      orderBy: { name: "asc" },
    })

    return NextResponse.json(patients)
  } catch (error) {
    console.error("Erro ao listar pacientes:", error)
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    )
  }
}

// POST - Criar paciente
export async function POST(request: Request) {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Não autorizado" },
        { status: 401 }
      )
    }

    const body = await request.json()
    const data = createPatientSchema.parse(body)

    const patient = await prisma.patient.create({
      data: {
        userId: session.user.id,
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
      },
    })

    return NextResponse.json(patient, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.issues[0].message },
        { status: 400 }
      )
    }

    console.error("Erro ao criar paciente:", error)
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    )
  }
}
