"use client"

import * as React from "react"
import { Upload, X, FileText, Image, Loader2, Eye, Download } from "lucide-react"
import { cn } from "@/lib/utils"

export interface FileData {
  url: string
  fileName: string
  fileType: string
  fileSize: number
}

interface FileUploadProps {
  value?: FileData | null
  onChange: (data: FileData | null) => void
  // Para visualização de recibos existentes, passar paymentId
  paymentId?: string
  accept?: string
  maxSize?: number // in MB
  disabled?: boolean
  className?: string
}

const ACCEPTED_TYPES = ".pdf,.jpg,.jpeg,.png"
const ACCEPTED_MIME_TYPES = ["application/pdf", "image/jpeg", "image/jpg", "image/png"]
const DEFAULT_MAX_SIZE = 10 // MB

function getFileIcon(fileType: string) {
  if (fileType === "application/pdf") {
    return <FileText className="h-5 w-5 text-red-500" />
  }
  return <Image className="h-5 w-5 text-blue-500" />
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function truncateFileName(name: string, maxLength: number = 25): string {
  if (name.length <= maxLength) return name
  const ext = name.split(".").pop() || ""
  const nameWithoutExt = name.slice(0, name.length - ext.length - 1)
  const truncated = nameWithoutExt.slice(0, maxLength - ext.length - 4) + "..."
  return `${truncated}.${ext}`
}

export function FileUpload({
  value,
  onChange,
  paymentId,
  accept = ACCEPTED_TYPES,
  maxSize = DEFAULT_MAX_SIZE,
  disabled = false,
  className,
}: FileUploadProps) {
  const inputRef = React.useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)
  const [dragOver, setDragOver] = React.useState(false)

  const handleFileSelect = async (file: File) => {
    setError(null)

    // Validate type
    if (!ACCEPTED_MIME_TYPES.includes(file.type)) {
      setError("Tipo de arquivo não permitido. Use PDF, JPEG, JPG ou PNG.")
      return
    }

    // Validate size
    if (file.size > maxSize * 1024 * 1024) {
      setError(`Arquivo muito grande. Máximo: ${maxSize}MB`)
      return
    }

    setUploading(true)

    try {
      const formData = new FormData()
      formData.append("file", file)

      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || "Erro no upload")
      }

      const data = await response.json()
      onChange({
        url: data.url,
        fileName: data.fileName,
        fileType: data.fileType,
        fileSize: data.fileSize,
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao fazer upload")
    } finally {
      setUploading(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      handleFileSelect(file)
    }
  }

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setDragOver(false)

    if (disabled || uploading) return

    const file = e.dataTransfer.files?.[0]
    if (file) {
      handleFileSelect(file)
    }
  }

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    if (!disabled && !uploading) {
      setDragOver(true)
    }
  }

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setDragOver(false)
  }

  const handleRemove = () => {
    onChange(null)
    if (inputRef.current) {
      inputRef.current.value = ""
    }
  }

  const handleView = () => {
    if (paymentId) {
      // Usar API interna para visualização
      window.open(`/api/receipts/${paymentId}/view`, "_blank")
    }
  }

  const handleDownload = () => {
    if (paymentId) {
      // Usar API interna para download
      window.open(`/api/receipts/${paymentId}/download`, "_blank")
    }
  }

  if (value) {
    return (
      <div className={cn("flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-lg", className)}>
        {getFileIcon(value.fileType)}
        <div className="flex-1 min-w-0">
          <span className="text-sm text-gray-700 block truncate" title={value.fileName}>
            {truncateFileName(value.fileName)}
          </span>
          <span className="text-xs text-gray-500">
            {formatFileSize(value.fileSize)}
          </span>
        </div>
        {paymentId ? (
          // Mostrar botões de visualização/download para recibos salvos
          <>
            <button
              type="button"
              onClick={handleView}
              className="p-1.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded"
              title="Visualizar"
            >
              <Eye className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={handleDownload}
              className="p-1.5 text-gray-500 hover:text-green-600 hover:bg-green-50 rounded"
              title="Download"
            >
              <Download className="h-4 w-4" />
            </button>
          </>
        ) : null}
        <button
          type="button"
          onClick={handleRemove}
          disabled={disabled}
          className="p-1.5 text-gray-500 hover:text-red-500 hover:bg-red-50 rounded disabled:opacity-50"
          title="Remover arquivo"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    )
  }

  return (
    <div className={className}>
      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        className={cn(
          "flex flex-col items-center justify-center gap-2 p-4 border-2 border-dashed rounded-lg transition-colors cursor-pointer",
          dragOver ? "border-gray-400 bg-gray-50" : "border-gray-200 hover:border-gray-300",
          disabled && "opacity-50 cursor-not-allowed",
          error && "border-red-300"
        )}
        onClick={() => !disabled && !uploading && inputRef.current?.click()}
      >
        <input
          ref={inputRef}
          type="file"
          accept={accept}
          onChange={handleChange}
          disabled={disabled || uploading}
          className="hidden"
        />

        {uploading ? (
          <>
            <Loader2 className="h-6 w-6 text-gray-400 animate-spin" />
            <span className="text-sm text-gray-500">Enviando...</span>
          </>
        ) : (
          <>
            <Upload className="h-6 w-6 text-gray-400" />
            <div className="text-center">
              <span className="text-sm text-gray-600">
                Arraste o arquivo ou{" "}
                <span className="text-gray-900 font-medium">clique aqui</span>
              </span>
              <p className="text-xs text-gray-400 mt-1">
                PDF, JPEG, JPG ou PNG (máx. {maxSize}MB)
              </p>
            </div>
          </>
        )}
      </div>

      {error && (
        <p className="text-xs text-red-500 mt-1">{error}</p>
      )}
    </div>
  )
}
