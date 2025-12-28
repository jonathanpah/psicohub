"use client"

import { useState } from "react"
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
  Presentation,
  Image as ImageIcon,
  Download,
  Loader2,
} from "lucide-react"

export interface DocumentData {
  id: string
  name: string
  fileName: string
  fileUrl: string
  fileType: string
  fileSize: number
}

interface DocumentViewerProps {
  document: DocumentData | null
  patientId: string
  open: boolean
  onClose: () => void
}

function getFileIcon(fileType: string, size: "sm" | "lg" = "lg") {
  const sizeClass = size === "lg" ? "h-8 w-8" : "h-5 w-5"

  if (fileType.includes("pdf")) return <FileText className={`${sizeClass} text-red-500`} />
  if (fileType.includes("word") || fileType.includes("document"))
    return <FileText className={`${sizeClass} text-blue-500`} />
  if (fileType.includes("sheet") || fileType.includes("excel"))
    return <FileSpreadsheet className={`${sizeClass} text-green-500`} />
  if (fileType.includes("presentation") || fileType.includes("powerpoint"))
    return <Presentation className={`${sizeClass} text-orange-500`} />
  if (fileType.startsWith("image/")) return <ImageIcon className={`${sizeClass} text-purple-500`} />
  return <File className={`${sizeClass} text-gray-500`} />
}

function isImage(fileType: string) {
  return fileType.startsWith("image/")
}

function isPdf(fileType: string) {
  return fileType === "application/pdf"
}

function isOfficeDoc(fileType: string) {
  return (
    fileType.includes("word") ||
    fileType.includes("document") ||
    fileType.includes("sheet") ||
    fileType.includes("excel") ||
    fileType.includes("presentation") ||
    fileType.includes("powerpoint")
  )
}

export function DocumentViewer({ document, patientId, open, onClose }: DocumentViewerProps) {
  const [loading, setLoading] = useState(true)

  const handleDownload = async () => {
    if (!document) return

    try {
      const response = await fetch(`/api/patients/${patientId}/documents/${document.id}/download`)
      if (!response.ok) throw new Error("Erro ao baixar")

      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const link = window.document.createElement("a")
      link.href = url
      link.download = document.fileName
      window.document.body.appendChild(link)
      link.click()
      window.document.body.removeChild(link)
      window.URL.revokeObjectURL(url)
    } catch (error) {
      console.error("Erro ao baixar documento:", error)
      alert("Erro ao baixar o documento")
    }
  }

  const getViewerUrl = () => {
    if (!document) return ""

    // Para PDFs, usar nossa API de proxy
    if (isPdf(document.fileType)) {
      return `/api/patients/${patientId}/documents/${document.id}/view`
    }
    // Para imagens, usar nossa API de proxy também
    if (isImage(document.fileType)) {
      return `/api/patients/${patientId}/documents/${document.id}/view`
    }
    // Para documentos Office, não é possível visualizar diretamente
    // (Google Docs Viewer precisaria de URL pública, o que comprometeria a segurança)
    // Usuário pode fazer download e abrir localmente
    return ""
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-5xl h-[90vh] flex flex-col p-0">
        <DialogHeader className="p-4 border-b flex-shrink-0 pr-12">
          <div className="flex items-center gap-2">
            {document && getFileIcon(document.fileType, "sm")}
            <DialogTitle className="text-base font-medium truncate">
              {document?.name}
            </DialogTitle>
          </div>
        </DialogHeader>

        <div className="flex-1 relative overflow-hidden bg-gray-100">
          {/* Loading só para PDFs e imagens (que realmente carregam) */}
          {loading && document && (isPdf(document.fileType) || isImage(document.fileType)) && (
            <div className="absolute inset-0 flex items-center justify-center bg-white z-10">
              <div className="text-center">
                <Loader2 className="h-8 w-8 animate-spin text-blue-600 mx-auto mb-2" />
                <p className="text-sm text-gray-500">Carregando documento...</p>
              </div>
            </div>
          )}

          {document && isImage(document.fileType) && (
            <div className="w-full h-full flex items-center justify-center p-4 overflow-auto">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={getViewerUrl()}
                alt={document.name}
                className="max-w-full max-h-full object-contain"
                onLoad={() => setLoading(false)}
                onError={() => setLoading(false)}
              />
            </div>
          )}

          {document && isPdf(document.fileType) && (
            <iframe
              src={getViewerUrl()}
              className="w-full h-full border-0"
              title={document.name}
              onLoad={() => setLoading(false)}
            />
          )}

          {document && isOfficeDoc(document.fileType) && (
            <div className="w-full h-full flex items-center justify-center">
              <div className="text-center">
                {getFileIcon(document.fileType)}
                <p className="text-gray-600 mt-4 mb-2">
                  <strong>{document.name}</strong>
                </p>
                <p className="text-gray-500 text-sm mb-4">
                  Documentos Office não podem ser visualizados diretamente por motivos de segurança.
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

          {document &&
            !isImage(document.fileType) &&
            !isPdf(document.fileType) &&
            !isOfficeDoc(document.fileType) && (
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

// Componente auxiliar para ícones de arquivo
export function FileIcon({ fileType, className }: { fileType: string; className?: string }) {
  const baseClass = className || "h-8 w-8"

  if (fileType.includes("pdf")) return <FileText className={`${baseClass} text-red-500`} />
  if (fileType.includes("word") || fileType.includes("document"))
    return <FileText className={`${baseClass} text-blue-500`} />
  if (fileType.includes("sheet") || fileType.includes("excel"))
    return <FileSpreadsheet className={`${baseClass} text-green-500`} />
  if (fileType.includes("presentation") || fileType.includes("powerpoint"))
    return <Presentation className={`${baseClass} text-orange-500`} />
  if (fileType.startsWith("image/")) return <ImageIcon className={`${baseClass} text-purple-500`} />
  return <File className={`${baseClass} text-gray-500`} />
}

// Hook para usar o visualizador
export function useDocumentViewer() {
  const [viewerOpen, setViewerOpen] = useState(false)
  const [viewingDoc, setViewingDoc] = useState<DocumentData | null>(null)

  const openViewer = (doc: DocumentData) => {
    setViewingDoc(doc)
    setViewerOpen(true)
  }

  const closeViewer = () => {
    setViewerOpen(false)
    setViewingDoc(null)
  }

  return {
    viewerOpen,
    viewingDoc,
    openViewer,
    closeViewer,
  }
}
