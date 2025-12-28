import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { cloudinary } from "@/lib/cloudinary"

const ALLOWED_TYPES = [
  "image/jpeg",
  "image/jpg",
  "image/png",
  "application/pdf",
]

const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB

export async function POST(request: Request) {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Não autorizado" },
        { status: 401 }
      )
    }

    const formData = await request.formData()
    const file = formData.get("file") as File | null

    if (!file) {
      return NextResponse.json(
        { error: "Nenhum arquivo enviado" },
        { status: 400 }
      )
    }

    // Validate file type
    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: "Tipo de arquivo não permitido. Use PDF, JPEG, JPG ou PNG." },
        { status: 400 }
      )
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: "Arquivo muito grande. Máximo: 10MB" },
        { status: 400 }
      )
    }

    // Convert file to base64 for Cloudinary
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)
    const base64 = buffer.toString("base64")
    const dataUri = `data:${file.type};base64,${base64}`

    // Determine resource type
    const resourceType = file.type === "application/pdf" ? "raw" : "image"

    // Upload to Cloudinary com type authenticated para segurança
    const result = await cloudinary.uploader.upload(dataUri, {
      folder: `psicohub/${session.user.id}/receipts`,
      resource_type: resourceType,
      type: "authenticated", // Acesso privado
      public_id: `receipt_${Date.now()}`,
    })

    // Retornar metadados completos para armazenamento
    return NextResponse.json({
      url: result.secure_url,
      fileName: file.name,
      fileType: file.type,
      fileSize: file.size,
      publicId: result.public_id,
      format: result.format,
    })
  } catch (error) {
    console.error("Erro no upload:", error)
    return NextResponse.json(
      { error: "Erro ao fazer upload do arquivo" },
      { status: 500 }
    )
  }
}
