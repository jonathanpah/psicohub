import { NextResponse } from "next/server"
import { z } from "zod"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { logPatientEvent } from "@/lib/audit"
import { logApiError } from "@/lib/logger"

// Helper para campos de string opcionais que podem vir como null ou vazio do frontend
const optionalStringCreate = z.string().optional().nullable().or(z.literal("")).transform(s => s?.trim() || null)

const createPatientSchema = z.object({
  name: z.string().min(2, "Nome deve ter pelo menos 2 caracteres").transform(s => s.trim()),
  email: z.string().email("Email inválido").optional().nullable().or(z.literal("")).transform(s => s?.trim().toLowerCase() || null),
  phone: optionalStringCreate,
  birthDate: z.string().optional().nullable(),
  cpf: optionalStringCreate,
  address: optionalStringCreate,
  // Dados do responsável 1
  guardian: optionalStringCreate,
  guardianCpf: optionalStringCreate,
  guardianEmail: z.string().email("Email do responsável inválido").optional().nullable().or(z.literal("")).transform(s => s?.trim().toLowerCase() || null),
  guardianPhone: optionalStringCreate,
  guardianAddress: optionalStringCreate,
  guardianRelation: optionalStringCreate,
  // Dados do responsável 2
  guardian2: optionalStringCreate,
  guardian2Cpf: optionalStringCreate,
  guardian2Email: z.string().email("Email do responsável 2 inválido").optional().nullable().or(z.literal("")).transform(s => s?.trim().toLowerCase() || null),
  guardian2Phone: optionalStringCreate,
  guardian2Address: optionalStringCreate,
  guardian2Relation: optionalStringCreate,
  notes: optionalStringCreate,
})

/**
 * GET /api/patients
 * Lista pacientes do usuário autenticado
 *
 * @query search - Busca por nome, email ou telefone
 * @query status - Filtrar por ACTIVE | INACTIVE | ARCHIVED | ALL
 * @query page - Página (0-indexed, requer limit)
 * @query limit - Itens por página (máx 100)
 *
 * @returns Patient[] - Sem paginação
 * @returns { data: Patient[], pagination: {...} } - Com paginação
 * @throws 401 - Não autorizado
 * @throws 500 - Erro interno
 */
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
    const search = (searchParams.get("search") || "").trim()
    const status = searchParams.get("status") || "ACTIVE"
    const page = Math.max(0, parseInt(searchParams.get("page") || "0") || 0)
    const limit = Math.min(100, Math.max(0, parseInt(searchParams.get("limit") || "0") || 0))

    const whereClause = {
      userId: session.user.id,
      ...(status !== "ALL" && { status: status as "ACTIVE" | "INACTIVE" | "ARCHIVED" }),
      ...(search && {
        OR: [
          { name: { contains: search, mode: "insensitive" as const } },
          { email: { contains: search, mode: "insensitive" as const } },
          { phone: { contains: search, mode: "insensitive" as const } },
        ],
      }),
    }

    // Se paginação solicitada (limit > 0)
    if (limit > 0) {
      const [patients, total] = await Promise.all([
        prisma.patient.findMany({
          where: whereClause,
          orderBy: { name: "asc" },
          skip: page * limit,
          take: limit,
        }),
        prisma.patient.count({ where: whereClause }),
      ])

      return NextResponse.json({
        data: patients,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      })
    }

    // Sem paginação (retorna todos - comportamento legado)
    const patients = await prisma.patient.findMany({
      where: whereClause,
      orderBy: { name: "asc" },
    })

    return NextResponse.json(patients)
  } catch (error: unknown) {
    logApiError("/api/patients", "GET", error)
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    )
  }
}

/**
 * POST /api/patients
 * Cria um novo paciente
 *
 * @body name - Nome do paciente (obrigatório, mín 2 chars)
 * @body email - Email (opcional)
 * @body phone - Telefone (opcional)
 * @body birthDate - Data de nascimento ISO (opcional)
 * @body cpf - CPF (opcional)
 * @body address - Endereço (opcional)
 * @body guardian - Nome do responsável (opcional)
 * @body guardianCpf - CPF do responsável (opcional)
 * @body guardianEmail - Email do responsável (opcional)
 * @body guardianPhone - Telefone do responsável (opcional)
 * @body notes - Observações (opcional)
 *
 * @returns Patient - Paciente criado
 * @throws 400 - Dados inválidos
 * @throws 401 - Não autorizado
 * @throws 500 - Erro interno
 */
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
        guardian2: data.guardian2 || null,
        guardian2Cpf: data.guardian2Cpf || null,
        guardian2Email: data.guardian2Email || null,
        guardian2Phone: data.guardian2Phone || null,
        guardian2Address: data.guardian2Address || null,
        guardian2Relation: data.guardian2Relation || null,
        notes: data.notes || null,
      },
    })

    // Registrar auditoria
    await logPatientEvent("PATIENT_CREATE", session.user.id, patient.id, undefined, request)

    return NextResponse.json(patient, { status: 201 })
  } catch (error: unknown) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.issues[0].message },
        { status: 400 }
      )
    }

    logApiError("/api/patients", "POST", error)
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    )
  }
}
