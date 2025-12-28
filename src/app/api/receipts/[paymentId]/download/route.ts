import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
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
      console.error("Erro ao buscar recibo:", result.error)
      return NextResponse.json(
        { error: "Erro ao buscar arquivo" },
        { status: 500 }
      )
    }

    // Retornar arquivo com headers corretos para download
    const fileName = payment.receiptFileName || "recibo"
    const fileType = payment.receiptFileType || "application/octet-stream"

    return new NextResponse(result.buffer, {
      headers: {
        "Content-Type": fileType,
        "Content-Disposition": `attachment; filename="${encodeURIComponent(fileName)}"`,
        "Content-Length": result.buffer.byteLength.toString(),
        "Cache-Control": "private, no-store, max-age=0",
        "X-Content-Type-Options": "nosniff",
      },
    })
  } catch (error) {
    console.error("Erro ao baixar recibo:", error)
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    )
  }
}
