import { NextResponse } from "next/server"
import { z } from "zod"
import { auth } from "@/lib/auth"
import { logApiError } from "@/lib/logger"
import { prisma } from "@/lib/prisma"
import { cloudinary } from "@/lib/cloudinary"

// Tipos de arquivo permitidos
const ALLOWED_TYPES = [
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/vnd.ms-powerpoint",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  "image/jpeg",
  "image/png",
  "image/webp",
]

// Tamanho máximo: 10MB
const MAX_SIZE = 10 * 1024 * 1024

const documentCategories = [
  "CONTRACT",
  "CONSENT_TERM",
  "CONFIDENTIALITY_TERM",
  "GUARDIAN_AUTHORIZATION",
  "PAYMENT_RECEIPT",
  "PAYMENT_PROOF",
  "INVOICE",
  "HEALTH_PLAN_DECLARATION",
  "ANAMNESIS",
  "PSYCHOLOGICAL_REPORT",
  "EXTERNAL_REPORT",
  "MEDICAL_EXAM",
  "SCHOOL_REPORT",
  "PSYCHOLOGICAL_EVALUATION",
  "CLINICAL_EVOLUTION",
  "OTHER",
] as const

type DocumentCategory = (typeof documentCategories)[number]

// GET - Listar documentos do paciente
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    const { id: patientId } = await params

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Não autorizado" },
        { status: 401 }
      )
    }

    // Verificar se o paciente pertence ao usuário
    const patient = await prisma.patient.findFirst({
      where: {
        id: patientId,
        userId: session.user.id,
      },
    })

    if (!patient) {
      return NextResponse.json(
        { error: "Paciente não encontrado" },
        { status: 404 }
      )
    }

    const { searchParams } = new URL(request.url)
    const category = searchParams.get("category")
    const sessionId = searchParams.get("sessionId")

    const documents = await prisma.document.findMany({
      where: {
        patientId,
        ...(category && { category: category as DocumentCategory }),
        ...(sessionId && { sessionId }),
      },
      orderBy: { uploadedAt: "desc" },
    })

    return NextResponse.json(documents)
  } catch (error: unknown) {
    logApiError("API", "ERROR", error)
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    )
  }
}

// POST - Upload de documento
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    const { id: patientId } = await params

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Não autorizado" },
        { status: 401 }
      )
    }

    // Verificar se o paciente pertence ao usuário
    const patient = await prisma.patient.findFirst({
      where: {
        id: patientId,
        userId: session.user.id,
      },
    })

    if (!patient) {
      return NextResponse.json(
        { error: "Paciente não encontrado" },
        { status: 404 }
      )
    }

    const formData = await request.formData()
    const file = formData.get("file") as File
    const name = formData.get("name") as string
    const description = formData.get("description") as string | null
    const category = formData.get("category") as DocumentCategory
    const sessionId = formData.get("sessionId") as string | null

    if (!file) {
      return NextResponse.json(
        { error: "Nenhum arquivo enviado" },
        { status: 400 }
      )
    }

    if (!name || !category) {
      return NextResponse.json(
        { error: "Nome e categoria são obrigatórios" },
        { status: 400 }
      )
    }

    // Validar categoria
    if (!documentCategories.includes(category)) {
      return NextResponse.json(
        { error: "Categoria inválida" },
        { status: 400 }
      )
    }

    // Validar tipo de arquivo
    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: "Tipo de arquivo não permitido. Use PDF, DOC, DOCX, XLS, XLSX, PPT, PPTX, JPG, PNG ou WEBP." },
        { status: 400 }
      )
    }

    // Validar tamanho
    if (file.size > MAX_SIZE) {
      return NextResponse.json(
        { error: "O arquivo deve ter no máximo 10MB" },
        { status: 400 }
      )
    }

    // Se for vinculado a uma sessão, verificar se a sessão existe
    if (sessionId) {
      const sessionExists = await prisma.session.findFirst({
        where: {
          id: sessionId,
          patientId,
          userId: session.user.id,
        },
      })

      if (!sessionExists) {
        return NextResponse.json(
          { error: "Sessão não encontrada" },
          { status: 404 }
        )
      }
    }

    // Converter para base64
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)
    const base64 = `data:${file.type};base64,${buffer.toString("base64")}`

    // Gerar nome único para o arquivo (sem extensão duplicada)
    const timestamp = Date.now()
    const fileNameWithoutExt = file.name.replace(/\.[^/.]+$/, "").replace(/[^a-zA-Z0-9.-]/g, "_")
    const uniqueFileName = `${patientId}_${timestamp}_${fileNameWithoutExt}`

    // Determinar resource_type baseado no tipo do arquivo
    const isImage = file.type.startsWith("image/")
    const resourceType = isImage ? "image" : "raw"

    // Upload para Cloudinary com acesso PRIVADO (autenticado)
    // Arquivos só podem ser acessados via URL assinada
    const result = await cloudinary.uploader.upload(base64, {
      folder: `psicohub/documents/${patientId}`,
      public_id: uniqueFileName,
      resource_type: resourceType,
      type: "authenticated", // PRIVADO - requer URL assinada para acesso
    })

    // Salvar no banco de dados
    const document = await prisma.document.create({
      data: {
        patientId,
        sessionId: sessionId || null,
        name,
        description: description || null,
        fileName: file.name,
        fileUrl: result.secure_url,
        fileType: file.type,
        fileSize: file.size,
        category,
      },
    })

    return NextResponse.json(document, { status: 201 })
  } catch (error: unknown) {
    logApiError("API", "ERROR", error)
    return NextResponse.json(
      { error: "Erro ao fazer upload do documento" },
      { status: 500 }
    )
  }
}
