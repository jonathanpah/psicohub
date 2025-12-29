import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { logApiError } from "@/lib/logger"
import { prisma } from "@/lib/prisma"
import { fetchPrivateFile } from "@/lib/cloudinary"
import { logDocumentEvent } from "@/lib/audit"

// GET - Download documento via proxy seguro
// IMPORTANTE: Verifica autenticação e ownership antes de servir o arquivo
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string; docId: string }> }
) {
  try {
    // 1. Verificar autenticação
    const session = await auth()
    const { id: patientId, docId } = await params

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Não autorizado" },
        { status: 401 }
      )
    }

    // 2. Verificar se o paciente pertence ao usuário logado
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

    // 3. Verificar se o documento pertence ao paciente
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

    // 4. Buscar arquivo do Cloudinary via URL assinada (privada)
    const result = await fetchPrivateFile(document.fileUrl)

    if (!result.success) {
      logApiError("API", "GET", result.error)
      return NextResponse.json(
        { error: "Erro ao buscar arquivo" },
        { status: 500 }
      )
    }

    // 5. Registrar auditoria de download (conformidade LGPD)
    await logDocumentEvent("DOCUMENT_DOWNLOAD", session.user.id, docId, {
      documentName: document.name,
      patientId,
    }, request)

    // 6. Retornar o arquivo com headers corretos para download
    return new NextResponse(result.buffer, {
      headers: {
        "Content-Type": document.fileType,
        "Content-Disposition": `attachment; filename="${encodeURIComponent(document.fileName)}"`,
        "Content-Length": result.buffer.byteLength.toString(),
        "Cache-Control": "private, no-store, max-age=0", // Não cachear dados sensíveis
        "X-Content-Type-Options": "nosniff",
      },
    })
  } catch (error: unknown) {
    logApiError("API", "ERROR", error)
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    )
  }
}
