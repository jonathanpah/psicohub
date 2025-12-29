import { NextResponse } from "next/server"
import { z } from "zod"
import { auth } from "@/lib/auth"
import { logApiError } from "@/lib/logger"
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
  // Configurações do recibo
  receiptShowName: z.boolean().optional(),
  receiptShowCpf: z.boolean().optional(),
  receiptShowCrp: z.boolean().optional(),
  receiptShowPhone: z.boolean().optional(),
  receiptShowClinicName: z.boolean().optional(),
  receiptShowClinicCnpj: z.boolean().optional(),
  receiptShowClinicAddress: z.boolean().optional(),
  receiptShowClinicPhone: z.boolean().optional(),
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
        avatar: true,
        clinicName: true,
        clinicCnpj: true,
        clinicAddress: true,
        clinicPhone: true,
        // Configurações do recibo
        receiptShowName: true,
        receiptShowCpf: true,
        receiptShowCrp: true,
        receiptShowPhone: true,
        receiptShowClinicName: true,
        receiptShowClinicCnpj: true,
        receiptShowClinicAddress: true,
        receiptShowClinicPhone: true,
      },
    })

    if (!user) {
      return NextResponse.json(
        { error: "Usuário não encontrado" },
        { status: 404 }
      )
    }

    return NextResponse.json(user)
  } catch (error: unknown) {
    logApiError("API", "ERROR", error)
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
        // Configurações do recibo
        ...(data.receiptShowName !== undefined && { receiptShowName: data.receiptShowName }),
        ...(data.receiptShowCpf !== undefined && { receiptShowCpf: data.receiptShowCpf }),
        ...(data.receiptShowCrp !== undefined && { receiptShowCrp: data.receiptShowCrp }),
        ...(data.receiptShowPhone !== undefined && { receiptShowPhone: data.receiptShowPhone }),
        ...(data.receiptShowClinicName !== undefined && { receiptShowClinicName: data.receiptShowClinicName }),
        ...(data.receiptShowClinicCnpj !== undefined && { receiptShowClinicCnpj: data.receiptShowClinicCnpj }),
        ...(data.receiptShowClinicAddress !== undefined && { receiptShowClinicAddress: data.receiptShowClinicAddress }),
        ...(data.receiptShowClinicPhone !== undefined && { receiptShowClinicPhone: data.receiptShowClinicPhone }),
      },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        cpf: true,
        crp: true,
        specialties: true,
        avatar: true,
        clinicName: true,
        clinicCnpj: true,
        clinicAddress: true,
        clinicPhone: true,
        // Configurações do recibo
        receiptShowName: true,
        receiptShowCpf: true,
        receiptShowCrp: true,
        receiptShowPhone: true,
        receiptShowClinicName: true,
        receiptShowClinicCnpj: true,
        receiptShowClinicAddress: true,
        receiptShowClinicPhone: true,
      },
    })

    return NextResponse.json(user)
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
