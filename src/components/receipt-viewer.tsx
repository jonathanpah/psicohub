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
  Image as ImageIcon,
  Download,
  Loader2,
} from "lucide-react"

export interface ReceiptData {
  paymentId: string
  fileName: string | null
  fileType: string | null
  fileSize: number | null
}

interface ReceiptViewerProps {
  receipt: ReceiptData | null
  open: boolean
  onClose: () => void
}

function getFileIcon(fileType: string | null, size: "sm" | "lg" = "lg") {
  const sizeClass = size === "lg" ? "h-8 w-8" : "h-5 w-5"

  if (!fileType) return <File className={`${sizeClass} text-gray-500`} />
  if (fileType.includes("pdf")) return <FileText className={`${sizeClass} text-red-500`} />
  if (fileType.startsWith("image/")) return <ImageIcon className={`${sizeClass} text-purple-500`} />
  return <File className={`${sizeClass} text-gray-500`} />
}

function isImage(fileType: string | null) {
  return fileType?.startsWith("image/") ?? false
}

function isPdf(fileType: string | null) {
  return fileType === "application/pdf"
}

export function ReceiptViewer({ receipt, open, onClose }: ReceiptViewerProps) {
  const [loading, setLoading] = useState(true)

  const handleDownload = async () => {
    if (!receipt) return

    try {
      const response = await fetch(`/api/receipts/${receipt.paymentId}/download`)
      if (!response.ok) throw new Error("Erro ao baixar")

      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const link = window.document.createElement("a")
      link.href = url
      link.download = receipt.fileName || "recibo"
      window.document.body.appendChild(link)
      link.click()
      window.document.body.removeChild(link)
      window.URL.revokeObjectURL(url)
    } catch (error) {
      console.error("Erro ao baixar recibo:", error)
      alert("Erro ao baixar o recibo")
    }
  }

  const getViewerUrl = () => {
    if (!receipt) return ""
    return `/api/receipts/${receipt.paymentId}/view`
  }

  const displayName = receipt?.fileName || "Recibo"

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-5xl h-[90vh] flex flex-col p-0">
        <DialogHeader className="p-4 border-b flex-shrink-0 pr-12">
          <div className="flex items-center gap-2">
            {receipt && getFileIcon(receipt.fileType, "sm")}
            <DialogTitle className="text-base font-medium truncate">
              {displayName}
            </DialogTitle>
          </div>
        </DialogHeader>

        <div className="flex-1 relative overflow-hidden bg-gray-100">
          {/* Loading state */}
          {loading && receipt && (isPdf(receipt.fileType) || isImage(receipt.fileType)) && (
            <div className="absolute inset-0 flex items-center justify-center bg-white z-10">
              <div className="text-center">
                <Loader2 className="h-8 w-8 animate-spin text-blue-600 mx-auto mb-2" />
                <p className="text-sm text-gray-500">Carregando recibo...</p>
              </div>
            </div>
          )}

          {receipt && isImage(receipt.fileType) && (
            <div className="w-full h-full flex items-center justify-center p-4 overflow-auto">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={getViewerUrl()}
                alt={displayName}
                className="max-w-full max-h-full object-contain"
                onLoad={() => setLoading(false)}
                onError={() => setLoading(false)}
              />
            </div>
          )}

          {receipt && isPdf(receipt.fileType) && (
            <iframe
              src={getViewerUrl()}
              className="w-full h-full border-0"
              title={displayName}
              onLoad={() => setLoading(false)}
            />
          )}

          {receipt && !isImage(receipt.fileType) && !isPdf(receipt.fileType) && (
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

// Hook para usar o visualizador de recibos
export function useReceiptViewer() {
  const [viewerOpen, setViewerOpen] = useState(false)
  const [viewingReceipt, setViewingReceipt] = useState<ReceiptData | null>(null)

  const openViewer = (receipt: ReceiptData) => {
    setViewingReceipt(receipt)
    setViewerOpen(true)
  }

  const closeViewer = () => {
    setViewerOpen(false)
    setViewingReceipt(null)
  }

  return {
    viewerOpen,
    viewingReceipt,
    openViewer,
    closeViewer,
  }
}
