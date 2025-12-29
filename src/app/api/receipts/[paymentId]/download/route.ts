import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { logApiError } from "@/lib/logger"
import { prisma } from "@/lib/prisma"
import { fetchPrivateFile } from "@/lib/cloudinary"

// GET - Download recibo via proxy seguro
export async function GET(
  request: Request,
  { params }: { params: Promise<{ paymentId: string }> }
) {
  try {
    const session = await auth()
    const { paymentId } = await params

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Não autorizado" },
        { status: 401 }
      )
    }

    // Buscar pagamento com verificação de ownership
    const payment = await prisma.payment.findFirst({
      where: {
        id: paymentId,
        userId: session.user.id,
      },
    })

    if (!payment) {
      return NextResponse.json(
        { error: "Pagamento não encontrado" },
        { status: 404 }
      )
    }

    if (!payment.receiptUrl) {
      return NextResponse.json(
        { error: "Este pagamento não possui recibo" },
        { status: 404 }
      )
    }

    // Buscar arquivo do Cloudinary via URL assinada
    const result = await fetchPrivateFile(payment.receiptUrl)

    if (!result.success) {
      logApiError("API", "GET", result.error)
      return NextResponse.json(
        { error: "Erro ao buscar arquivo" },
        { status: 500 }
      )
    }

    // Inferir tipo do arquivo pelo nome ou URL se não tiver receiptFileType
    const inferFileType = (fileName: string | null, fileType: string | null, url: string | null): string => {
      if (fileType && fileType !== "application/octet-stream") {
        return fileType
      }

      // Verificar pelo nome do arquivo
      const checkExtension = (str: string): string | null => {
        const lower = str.toLowerCase()
        if (lower.includes(".pdf")) return "application/pdf"
        if (lower.includes(".jpg") || lower.includes(".jpeg")) return "image/jpeg"
        if (lower.includes(".png")) return "image/png"
        if (lower.includes(".gif")) return "image/gif"
        if (lower.includes(".webp")) return "image/webp"
        return null
      }

      if (fileName) {
        const type = checkExtension(fileName)
        if (type) return type
      }

      // Tentar inferir pela URL (Cloudinary inclui extensão)
      if (url) {
        const type = checkExtension(url)
        if (type) return type
      }

      return fileType || "application/octet-stream"
    }

    // Retornar arquivo com headers corretos para download
    const fileName = payment.receiptFileName || "recibo"
    const fileType = inferFileType(payment.receiptFileName, payment.receiptFileType, payment.receiptUrl)

    return new NextResponse(result.buffer, {
      headers: {
        "Content-Type": fileType,
        "Content-Disposition": `attachment; filename="${encodeURIComponent(fileName)}"`,
        "Content-Length": result.buffer.byteLength.toString(),
        "Cache-Control": "private, no-store, max-age=0",
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
