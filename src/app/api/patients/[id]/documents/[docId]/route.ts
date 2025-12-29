import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { logApiError } from "@/lib/logger"
import { prisma } from "@/lib/prisma"
import { cloudinary } from "@/lib/cloudinary"

// GET - Buscar documento específico
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string; docId: string }> }
) {
  try {
    const session = await auth()
    const { id: patientId, docId } = await params

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

    const document = await prisma.document.findFirst({
      where: {
        id: docId,
        patientId,
      },
    })

    if (!document) {
      return NextResponse.json(
        { error: "Documento não encontrado" },
        { status: 404 }
      )
    }

    return NextResponse.json(document)
  } catch (error: unknown) {
    logApiError("API", "ERROR", error)
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    )
  }
}

// PUT - Atualizar documento (nome, descrição, categoria)
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string; docId: string }> }
) {
  try {
    const session = await auth()
    const { id: patientId, docId } = await params

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

    const existingDoc = await prisma.document.findFirst({
      where: {
        id: docId,
        patientId,
      },
    })

    if (!existingDoc) {
      return NextResponse.json(
        { error: "Documento não encontrado" },
        { status: 404 }
      )
    }

    const body = await request.json()

    const document = await prisma.document.update({
      where: { id: docId },
      data: {
        ...(body.name && { name: body.name }),
        ...(body.description !== undefined && { description: body.description || null }),
        ...(body.category && { category: body.category }),
        ...(body.sessionId !== undefined && { sessionId: body.sessionId || null }),
      },
    })

    return NextResponse.json(document)
  } catch (error: unknown) {
    logApiError("API", "ERROR", error)
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    )
  }
}

// DELETE - Excluir documento
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string; docId: string }> }
) {
  try {
    const session = await auth()
    const { id: patientId, docId } = await params

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

    const document = await prisma.document.findFirst({
      where: {
        id: docId,
        patientId,
      },
    })

    if (!document) {
      return NextResponse.json(
        { error: "Documento não encontrado" },
        { status: 404 }
      )
    }

    // Tentar excluir do Cloudinary
    try {
      // Extrair public_id da URL do Cloudinary
      const urlParts = document.fileUrl.split("/")
      const fileNameWithExt = urlParts[urlParts.length - 1]
      const publicId = `psicohub/documents/${patientId}/${fileNameWithExt.split(".")[0]}`

      await cloudinary.uploader.destroy(publicId, { resource_type: "raw" })
    } catch (cloudinaryError) {
      logApiError("API", "DELETE", cloudinaryError)
      // Continua mesmo se falhar no Cloudinary
    }

    // Excluir do banco de dados
    await prisma.document.delete({
      where: { id: docId },
    })

    return NextResponse.json({ success: true })
  } catch (error: unknown) {
    logApiError("API", "ERROR", error)
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    )
  }
}
