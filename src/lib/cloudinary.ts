import { v2 as cloudinary } from "cloudinary"

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
})

// Extrai informações da URL do Cloudinary
function parseCloudinaryUrl(url: string): {
  publicId: string
  resourceType: string
  type: string
} | null {
  try {
    // Padrão: https://res.cloudinary.com/{cloud}/{resource_type}/{type}/v{version}/{public_id}
    // Exemplo: https://res.cloudinary.com/xxx/image/authenticated/v123/folder/file.pdf
    const match = url.match(
      /res\.cloudinary\.com\/[^/]+\/(image|raw|video)\/(upload|authenticated)\/v\d+\/(.+?)(?:\.[^.]+)?$/
    )
    if (match) {
      return {
        resourceType: match[1],
        type: match[2],
        publicId: match[3],
      }
    }

    // Tenta padrão alternativo sem extensão visível
    const altMatch = url.match(
      /res\.cloudinary\.com\/[^/]+\/(image|raw|video)\/(upload|authenticated)\/v\d+\/(.+)$/
    )
    if (altMatch) {
      return {
        resourceType: altMatch[1],
        type: altMatch[2],
        publicId: altMatch[3],
      }
    }

    return null
  } catch {
    return null
  }
}

/**
 * Gera URL assinada para acesso a arquivos privados
 * A URL expira após o tempo especificado (padrão: 10 minutos)
 */
export function getSignedUrl(
  fileUrl: string,
  expirationMinutes: number = 10
): string {
  try {
    const parsed = parseCloudinaryUrl(fileUrl)
    if (!parsed) {
      console.error("Não foi possível parsear URL do Cloudinary:", fileUrl)
      return fileUrl
    }

    // Calcular timestamp de expiração
    const expiresAt = Math.floor(Date.now() / 1000) + expirationMinutes * 60

    // Gerar URL assinada com expiração
    const signedUrl = cloudinary.url(parsed.publicId, {
      resource_type: parsed.resourceType as "image" | "video" | "raw",
      type: "authenticated",
      sign_url: true,
      secure: true,
      expires_at: expiresAt,
    })

    return signedUrl
  } catch (error) {
    console.error("Erro ao gerar URL assinada:", error)
    return fileUrl
  }
}

/**
 * Busca o arquivo do Cloudinary usando URL assinada
 * Retorna o buffer do arquivo
 */
export async function fetchPrivateFile(fileUrl: string): Promise<{
  buffer: ArrayBuffer
  success: boolean
  error?: string
}> {
  try {
    // Gerar URL assinada com expiração de 5 minutos
    const signedUrl = getSignedUrl(fileUrl, 5)

    console.log("Buscando arquivo privado com URL assinada")

    const response = await fetch(signedUrl, {
      headers: { Accept: "*/*" },
    })

    if (!response.ok) {
      console.error("Erro ao buscar arquivo:", response.status, response.statusText)
      return {
        buffer: new ArrayBuffer(0),
        success: false,
        error: `HTTP ${response.status}: ${response.statusText}`,
      }
    }

    const buffer = await response.arrayBuffer()
    console.log("Arquivo recebido, tamanho:", buffer.byteLength)

    return {
      buffer,
      success: true,
    }
  } catch (error) {
    console.error("Erro ao buscar arquivo privado:", error)
    return {
      buffer: new ArrayBuffer(0),
      success: false,
      error: error instanceof Error ? error.message : "Erro desconhecido",
    }
  }
}

export { cloudinary }
