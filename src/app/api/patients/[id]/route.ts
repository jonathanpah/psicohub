import { NextResponse } from "next/server"
import { z } from "zod"
import { auth } from "@/lib/auth"
import { logApiError } from "@/lib/logger"
import { prisma } from "@/lib/prisma"
import { logPatientEvent } from "@/lib/audit"
import { checkRateLimit, rateLimitConfigs, getClientIP, rateLimitExceededResponse } from "@/lib/rate-limit"

const updatePatientSchema = z.object({
  name: z.string().min(2, "Nome deve ter pelo menos 2 caracteres"),
  email: z.string().email("Email inválido").optional().or(z.literal("")),
  phone: z.string().optional(),
  birthDate: z.string().optional().nullable(),
  cpf: z.string().optional(),
  address: z.string().optional(),
  // Dados do responsável 1
  guardian: z.string().optional(),
  guardianCpf: z.string().optional(),
  guardianEmail: z.string().email("Email do responsável inválido").optional().or(z.literal("")),
  guardianPhone: z.string().optional(),
  guardianAddress: z.string().optional(),
  guardianRelation: z.string().optional(),
  // Dados do responsável 2
  guardian2: z.string().optional(),
  guardian2Cpf: z.string().optional(),
  guardian2Email: z.string().email("Email do responsável 2 inválido").optional().or(z.literal("")),
  guardian2Phone: z.string().optional(),
  guardian2Address: z.string().optional(),
  guardian2Relation: z.string().optional(),
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

    // Registrar auditoria de visualização
    await logPatientEvent("PATIENT_VIEW", session.user.id, patient.id, undefined, request)

    return NextResponse.json(patient)
  } catch (error: unknown) {
    logApiError("API", "ERROR", error)
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
        guardian2: data.guardian2 || null,
        guardian2Cpf: data.guardian2Cpf || null,
        guardian2Email: data.guardian2Email || null,
        guardian2Phone: data.guardian2Phone || null,
        guardian2Address: data.guardian2Address || null,
        guardian2Relation: data.guardian2Relation || null,
        notes: data.notes || null,
        status: data.status,
      },
    })

    // Registrar auditoria de atualização
    await logPatientEvent("PATIENT_UPDATE", session.user.id, patient.id, undefined, request)

    return NextResponse.json(patient)
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

// DELETE - Excluir paciente
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

    // Registrar auditoria antes de excluir (para ter o nome do paciente)
    await logPatientEvent("PATIENT_DELETE", session.user.id, id, undefined, request)

    await prisma.patient.delete({
      where: { id },
    })

    return NextResponse.json({ message: "Paciente excluído com sucesso" })
  } catch (error: unknown) {
    logApiError("API", "ERROR", error)
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    )
  }
}
