/**
 * Utilitários para manipulação de arquivos
 * Usado pelos viewers de documentos e recibos
 */

import {
  FileText,
  FileSpreadsheet,
  FileImage,
  File,
  FileCode,
  FileArchive,
  LucideIcon,
} from "lucide-react"

// ============================================
// TIPOS DE ARQUIVO
// ============================================

export type FileCategory = "image" | "pdf" | "office" | "text" | "code" | "archive" | "other"

export interface FileTypeInfo {
  category: FileCategory
  icon: LucideIcon
  canPreview: boolean
  label: string
}

// ============================================
// EXTENSÕES E MIME TYPES
// ============================================

const IMAGE_EXTENSIONS = ["jpg", "jpeg", "png", "gif", "webp", "svg", "bmp", "ico"]
const PDF_EXTENSIONS = ["pdf"]
const OFFICE_EXTENSIONS = ["doc", "docx", "xls", "xlsx", "ppt", "pptx", "odt", "ods", "odp"]
const TEXT_EXTENSIONS = ["txt", "rtf", "md", "csv"]
const CODE_EXTENSIONS = ["json", "xml", "html", "css", "js", "ts", "jsx", "tsx"]
const ARCHIVE_EXTENSIONS = ["zip", "rar", "7z", "tar", "gz"]

const IMAGE_MIME_TYPES = ["image/jpeg", "image/png", "image/gif", "image/webp", "image/svg+xml"]
const PDF_MIME_TYPES = ["application/pdf"]
const OFFICE_MIME_TYPES = [
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/vnd.ms-powerpoint",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation",
]

// ============================================
// FUNÇÕES DE DETECÇÃO
// ============================================

/**
 * Extrai a extensão de um nome de arquivo
 */
export function getFileExtension(filename: string): string {
  const parts = filename.toLowerCase().split(".")
  return parts.length > 1 ? parts[parts.length - 1] : ""
}

/**
 * Verifica se é uma imagem
 */
export function isImage(filenameOrType: string): boolean {
  const lower = filenameOrType.toLowerCase()
  return (
    IMAGE_EXTENSIONS.some((ext) => lower.endsWith(`.${ext}`)) ||
    IMAGE_MIME_TYPES.some((mime) => lower.includes(mime))
  )
}

/**
 * Verifica se é um PDF
 */
export function isPdf(filenameOrType: string): boolean {
  const lower = filenameOrType.toLowerCase()
  return lower.endsWith(".pdf") || lower.includes("application/pdf")
}

/**
 * Verifica se é um documento Office
 */
export function isOfficeDoc(filenameOrType: string): boolean {
  const lower = filenameOrType.toLowerCase()
  return (
    OFFICE_EXTENSIONS.some((ext) => lower.endsWith(`.${ext}`)) ||
    OFFICE_MIME_TYPES.some((mime) => lower.includes(mime))
  )
}

/**
 * Verifica se é um arquivo de texto
 */
export function isTextFile(filenameOrType: string): boolean {
  const lower = filenameOrType.toLowerCase()
  return TEXT_EXTENSIONS.some((ext) => lower.endsWith(`.${ext}`))
}

/**
 * Verifica se é um arquivo de código
 */
export function isCodeFile(filenameOrType: string): boolean {
  const lower = filenameOrType.toLowerCase()
  return CODE_EXTENSIONS.some((ext) => lower.endsWith(`.${ext}`))
}

/**
 * Verifica se é um arquivo compactado
 */
export function isArchive(filenameOrType: string): boolean {
  const lower = filenameOrType.toLowerCase()
  return ARCHIVE_EXTENSIONS.some((ext) => lower.endsWith(`.${ext}`))
}

/**
 * Retorna a categoria do arquivo
 */
export function getFileCategory(filenameOrType: string): FileCategory {
  if (isImage(filenameOrType)) return "image"
  if (isPdf(filenameOrType)) return "pdf"
  if (isOfficeDoc(filenameOrType)) return "office"
  if (isTextFile(filenameOrType)) return "text"
  if (isCodeFile(filenameOrType)) return "code"
  if (isArchive(filenameOrType)) return "archive"
  return "other"
}

/**
 * Retorna informações completas sobre o tipo de arquivo
 */
export function getFileTypeInfo(filenameOrType: string): FileTypeInfo {
  const category = getFileCategory(filenameOrType)

  const categoryConfig: Record<FileCategory, Omit<FileTypeInfo, "category">> = {
    image: { icon: FileImage, canPreview: true, label: "Imagem" },
    pdf: { icon: FileText, canPreview: true, label: "PDF" },
    office: { icon: FileSpreadsheet, canPreview: false, label: "Documento Office" },
    text: { icon: FileText, canPreview: true, label: "Texto" },
    code: { icon: FileCode, canPreview: true, label: "Código" },
    archive: { icon: FileArchive, canPreview: false, label: "Arquivo Compactado" },
    other: { icon: File, canPreview: false, label: "Arquivo" },
  }

  return {
    category,
    ...categoryConfig[category],
  }
}

/**
 * Retorna o ícone apropriado para o tipo de arquivo
 */
export function getFileIcon(filenameOrType: string): LucideIcon {
  return getFileTypeInfo(filenameOrType).icon
}

/**
 * Verifica se o arquivo pode ser visualizado inline
 */
export function canPreviewFile(filenameOrType: string): boolean {
  return getFileTypeInfo(filenameOrType).canPreview
}

// ============================================
// VALIDAÇÃO
// ============================================

/**
 * Tipos de arquivo permitidos para upload de documentos
 */
export const ALLOWED_DOCUMENT_TYPES = [
  "application/pdf",
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "text/plain",
]

/**
 * Tipos de arquivo permitidos para upload de recibos
 */
export const ALLOWED_RECEIPT_TYPES = [
  "application/pdf",
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
]

/**
 * Tamanho máximo de arquivo (10MB)
 */
export const MAX_FILE_SIZE = 10 * 1024 * 1024

/**
 * Valida o tipo de arquivo para upload
 */
export function isValidFileType(
  file: File,
  allowedTypes: string[] = ALLOWED_DOCUMENT_TYPES
): boolean {
  return allowedTypes.includes(file.type)
}

/**
 * Valida o tamanho do arquivo
 */
export function isValidFileSize(file: File, maxSize: number = MAX_FILE_SIZE): boolean {
  return file.size <= maxSize
}

/**
 * Valida arquivo para upload (tipo e tamanho)
 */
export function validateFile(
  file: File,
  options: {
    allowedTypes?: string[]
    maxSize?: number
  } = {}
): { valid: boolean; error?: string } {
  const { allowedTypes = ALLOWED_DOCUMENT_TYPES, maxSize = MAX_FILE_SIZE } = options

  if (!isValidFileType(file, allowedTypes)) {
    return { valid: false, error: "Tipo de arquivo não permitido" }
  }

  if (!isValidFileSize(file, maxSize)) {
    const maxMB = Math.round(maxSize / (1024 * 1024))
    return { valid: false, error: `Arquivo muito grande. Máximo: ${maxMB}MB` }
  }

  return { valid: true }
}

// ============================================
// DOWNLOAD
// ============================================

/**
 * Faz download de um arquivo a partir de uma URL
 */
export async function downloadFile(url: string, filename: string): Promise<void> {
  try {
    const response = await fetch(url)
    const blob = await response.blob()
    const blobUrl = window.URL.createObjectURL(blob)

    const link = document.createElement("a")
    link.href = blobUrl
    link.download = filename
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)

    window.URL.revokeObjectURL(blobUrl)
  } catch (error) {
    // Fallback: abrir em nova aba
    window.open(url, "_blank")
  }
}
