"use client"

import { useState, useCallback, useEffect } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  FileText,
  File,
  FileSpreadsheet,
  Image as ImageIcon,
  Download,
  Loader2,
} from "lucide-react"
import { toast } from "sonner"
import { isImage, isPdf, isOfficeDoc } from "@/lib/file-utils"

// ============================================
// TIPOS
// ============================================

export interface FileData {
  id: string
  name: string
  fileName: string
  fileUrl: string
  fileType: string
  fileSize?: number | null
}

export interface FileViewerConfig {
  /** URL base para visualização (sem o ID) */
  viewUrlTemplate: string
  /** URL base para download (sem o ID) */
  downloadUrlTemplate: string
  /** Título do loading */
  loadingText?: string
}

interface FileViewerProps {
  file: FileData | null
  config: FileViewerConfig
  open: boolean
  onClose: () => void
}

// ============================================
// ÍCONES DE ARQUIVO
// ============================================

export function FileIcon({
  fileType,
  className = "h-8 w-8"
}: {
  fileType: string
  className?: string
}) {
  if (fileType.includes("pdf")) {
    return <FileText className={`${className} text-red-500`} />
  }
  if (fileType.includes("word") || fileType.includes("document")) {
    return <FileText className={`${className} text-blue-500`} />
  }
  if (fileType.includes("sheet") || fileType.includes("excel")) {
    return <FileSpreadsheet className={`${className} text-green-500`} />
  }
  if (fileType.includes("presentation") || fileType.includes("powerpoint")) {
    return <FileText className={`${className} text-orange-500`} />
  }
  if (fileType.startsWith("image/")) {
    return <ImageIcon className={`${className} text-purple-500`} />
  }
  return <File className={`${className} text-gray-500`} />
}

// ============================================
// COMPONENTE PRINCIPAL
// ============================================

export function FileViewer({ file, config, open, onClose }: FileViewerProps) {
  const [loading, setLoading] = useState(true)

  const getViewerUrl = useCallback(() => {
    if (!file) return ""
    return config.viewUrlTemplate.replace("{id}", file.id)
  }, [file, config.viewUrlTemplate])

  const handleDownload = useCallback(async () => {
    if (!file) return

    try {
      const downloadUrl = config.downloadUrlTemplate.replace("{id}", file.id)
      const response = await fetch(downloadUrl)
      if (!response.ok) throw new Error("Erro ao baixar")

      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement("a")
      link.href = url
      link.download = file.fileName
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)
    } catch {
      toast.error("Erro ao baixar o arquivo")
    }
  }, [file, config.downloadUrlTemplate])

  const canPreview = file && (isPdf(file.fileType) || isImage(file.fileType))
  const isOffice = file && isOfficeDoc(file.fileType)

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-5xl h-[90vh] flex flex-col p-0">
        <DialogHeader className="p-4 border-b flex-shrink-0 pr-12">
          <div className="flex items-center gap-2">
            {file && <FileIcon fileType={file.fileType} className="h-5 w-5" />}
            <DialogTitle className="text-base font-medium truncate">
              {file?.name || file?.fileName}
            </DialogTitle>
          </div>
        </DialogHeader>

        <div className="flex-1 relative overflow-hidden bg-gray-100">
          {/* Loading state */}
          {loading && canPreview && (
            <div className="absolute inset-0 flex items-center justify-center bg-white z-10">
              <div className="text-center">
                <Loader2 className="h-8 w-8 animate-spin text-blue-600 mx-auto mb-2" />
                <p className="text-sm text-gray-500">
                  {config.loadingText || "Carregando arquivo..."}
                </p>
              </div>
            </div>
          )}

          {/* Imagem */}
          {file && isImage(file.fileType) && (
            <div className="w-full h-full flex items-center justify-center p-4 overflow-auto">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={getViewerUrl()}
                alt={file.name}
                className="max-w-full max-h-full object-contain"
                onLoad={() => setLoading(false)}
                onError={() => setLoading(false)}
              />
            </div>
          )}

          {/* PDF */}
          {file && isPdf(file.fileType) && (
            <iframe
              src={getViewerUrl()}
              className="w-full h-full border-0"
              title={file.name}
              onLoad={() => setLoading(false)}
            />
          )}

          {/* Documentos Office */}
          {isOffice && (
            <div className="w-full h-full flex items-center justify-center">
              <div className="text-center">
                <FileIcon fileType={file.fileType} className="h-16 w-16 mx-auto" />
                <p className="text-gray-600 mt-4 mb-2">
                  <strong>{file.name}</strong>
                </p>
                <p className="text-gray-500 text-sm mb-4">
                  Documentos Office não podem ser visualizados diretamente.
                  <br />
                  Faça o download para abrir no seu computador.
                </p>
                <Button onClick={handleDownload}>
                  <Download className="h-4 w-4 mr-2" />
                  Baixar Arquivo
                </Button>
              </div>
            </div>
          )}

          {/* Outros tipos de arquivo */}
          {file && !canPreview && !isOffice && (
            <div className="w-full h-full flex items-center justify-center">
              <div className="text-center">
                <File className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600 mb-4">
                  Não é possível visualizar este tipo de arquivo diretamente.
                </p>
                <Button onClick={handleDownload}>
                  <Download className="h-4 w-4 mr-2" />
                  Baixar Arquivo
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}

// ============================================
// HOOK GENÉRICO
// ============================================

export function useFileViewer<T extends FileData>() {
  const [viewerOpen, setViewerOpen] = useState(false)
  const [viewingFile, setViewingFile] = useState<T | null>(null)

  const openViewer = useCallback((file: T) => {
    setViewingFile(file)
    setViewerOpen(true)
  }, [])

  const closeViewer = useCallback(() => {
    setViewerOpen(false)
    setViewingFile(null)
  }, [])

  return {
    viewerOpen,
    viewingFile,
    openViewer,
    closeViewer,
  }
}

// ============================================
// CONFIGURAÇÕES PRÉ-DEFINIDAS
// ============================================

/** Configuração para visualização de documentos de pacientes */
export function getDocumentViewerConfig(patientId: string): FileViewerConfig {
  return {
    viewUrlTemplate: `/api/patients/${patientId}/documents/{id}/view`,
    downloadUrlTemplate: `/api/patients/${patientId}/documents/{id}/download`,
    loadingText: "Carregando documento...",
  }
}

/** Configuração para visualização de recibos */
export function getReceiptViewerConfig(): FileViewerConfig {
  return {
    viewUrlTemplate: `/api/receipts/{id}/view`,
    downloadUrlTemplate: `/api/receipts/{id}/download`,
    loadingText: "Carregando recibo...",
  }
}

// ============================================
// COMPONENTES ESPECIALIZADOS (Wrappers)
// ============================================

// Re-exportar tipos para compatibilidade
export type DocumentData = FileData
export type ReceiptData = {
  paymentId: string
  fileName: string | null
  fileType: string | null
  fileSize: number | null
}

/** Visualizador de documentos (wrapper para compatibilidade) */
export function DocumentViewer({
  document,
  patientId,
  open,
  onClose,
}: {
  document: DocumentData | null
  patientId: string
  open: boolean
  onClose: () => void
}) {
  return (
    <FileViewer
      file={document}
      config={getDocumentViewerConfig(patientId)}
      open={open}
      onClose={onClose}
    />
  )
}

/** Visualizador de recibos (wrapper para compatibilidade) */
export function ReceiptViewer({
  receipt,
  open,
  onClose,
}: {
  receipt: ReceiptData | null
  open: boolean
  onClose: () => void
}) {
  const [detectedType, setDetectedType] = useState<string | null>(null)
  const [detecting, setDetecting] = useState(false)

  // Detectar tipo do arquivo via HEAD request quando abrir
  useEffect(() => {
    if (open && receipt && (!receipt.fileType || receipt.fileType === "application/octet-stream")) {
      setDetecting(true)
      fetch(`/api/receipts/${receipt.paymentId}/view`, { method: "HEAD" })
        .then((res) => {
          const contentType = res.headers.get("Content-Type")
          if (contentType) {
            setDetectedType(contentType)
          }
        })
        .catch(() => {
          // Ignorar erro, vai tentar mostrar mesmo assim
        })
        .finally(() => {
          setDetecting(false)
        })
    } else if (open && receipt?.fileType) {
      setDetectedType(receipt.fileType)
    }
  }, [open, receipt])

  // Reset ao fechar
  useEffect(() => {
    if (!open) {
      setDetectedType(null)
      setDetecting(false)
    }
  }, [open])

  // Tentar inferir o tipo do arquivo pelo nome se não tiver fileType
  const inferFileType = (fileName: string | null, fileType: string | null): string => {
    // Usar tipo detectado via HEAD request
    if (detectedType && detectedType !== "application/octet-stream") {
      return detectedType
    }

    // Se já tem um tipo válido, usa ele
    if (fileType && fileType !== "application/octet-stream") {
      return fileType
    }

    // Tentar inferir pelo nome do arquivo
    if (fileName) {
      const lower = fileName.toLowerCase()
      if (lower.endsWith(".pdf")) return "application/pdf"
      if (lower.endsWith(".jpg") || lower.endsWith(".jpeg")) return "image/jpeg"
      if (lower.endsWith(".png")) return "image/png"
      if (lower.endsWith(".gif")) return "image/gif"
      if (lower.endsWith(".webp")) return "image/webp"
    }

    return fileType || "application/octet-stream"
  }

  // Converter ReceiptData para FileData
  const file: FileData | null = receipt
    ? {
        id: receipt.paymentId,
        name: receipt.fileName || "Recibo",
        fileName: receipt.fileName || "recibo",
        fileUrl: "",
        fileType: inferFileType(receipt.fileName, receipt.fileType),
        fileSize: receipt.fileSize,
      }
    : null

  // Mostrar loading enquanto detecta tipo
  if (detecting) {
    return (
      <Dialog open={open} onOpenChange={onClose}>
        <DialogContent className="max-w-5xl h-[90vh] flex flex-col p-0">
          <DialogHeader className="p-4 border-b flex-shrink-0 pr-12">
            <DialogTitle className="text-base font-medium">Recibo</DialogTitle>
          </DialogHeader>
          <div className="flex-1 flex items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
          </div>
        </DialogContent>
      </Dialog>
    )
  }

  return (
    <FileViewer
      file={file}
      config={getReceiptViewerConfig()}
      open={open}
      onClose={onClose}
    />
  )
}

/** Hook para documentos (wrapper para compatibilidade) */
export function useDocumentViewer() {
  const { viewerOpen, viewingFile, openViewer, closeViewer } = useFileViewer<DocumentData>()
  return {
    viewerOpen,
    viewingDoc: viewingFile, // Manter nome antigo para compatibilidade
    openViewer,
    closeViewer,
  }
}

/** Hook para recibos (wrapper para compatibilidade) */
export function useReceiptViewer() {
  const [viewerOpen, setViewerOpen] = useState(false)
  const [viewingReceipt, setViewingReceipt] = useState<ReceiptData | null>(null)

  const openViewer = useCallback((receipt: ReceiptData) => {
    setViewingReceipt(receipt)
    setViewerOpen(true)
  }, [])

  const closeViewer = useCallback(() => {
    setViewerOpen(false)
    setViewingReceipt(null)
  }, [])

  return {
    viewerOpen,
    viewingReceipt,
    openViewer,
    closeViewer,
  }
}
