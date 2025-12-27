import { NextResponse } from "next/server"
import { z } from "zod"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

const updateProfileSchema = z.object({
  name: z.string().min(2, "Nome deve ter pelo menos 2 caracteres"),
  phone: z.string().optional(),
  cpf: z.string().optional(),
  crp: z.string().optional(),
  specialties: z.array(z.string()).optional(),
  clinicName: z.string().optional(),
  clinicCnpj: z.string().optional(),
  clinicAddress: z.string().optional(),
  clinicPhone: z.string().optional(),
})

export async function GET() {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Não autorizado" },
        { status: 401 }
      )
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        cpf: true,
        crp: true,
        specialties: true,
        clinicName: true,
        clinicCnpj: true,
        clinicAddress: true,
        clinicPhone: true,
      },
    })

    if (!user) {
      return NextResponse.json(
        { error: "Usuário não encontrado" },
        { status: 404 }
      )
    }

    return NextResponse.json(user)
  } catch (error) {
    console.error("Erro ao buscar perfil:", error)
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    )
  }
}

export async function PUT(request: Request) {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Não autorizado" },
        { status: 401 }
      )
    }

    const body = await request.json()
    const data = updateProfileSchema.parse(body)

    const user = await prisma.user.update({
      where: { id: session.user.id },
      data: {
        name: data.name,
        phone: data.phone,
        cpf: data.cpf,
        crp: data.crp,
        specialties: data.specialties || [],
        clinicName: data.clinicName,
        clinicCnpj: data.clinicCnpj,
        clinicAddress: data.clinicAddress,
        clinicPhone: data.clinicPhone,
      },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        cpf: true,
        crp: true,
        specialties: true,
        clinicName: true,
        clinicCnpj: true,
        clinicAddress: true,
        clinicPhone: true,
      },
    })

    return NextResponse.json(user)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.issues[0].message },
        { status: 400 }
      )
    }

    console.error("Erro ao atualizar perfil:", error)
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    )
  }
}
