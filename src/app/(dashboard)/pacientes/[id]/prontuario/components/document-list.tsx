"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Paperclip, Eye, Download, Trash2 } from "lucide-react"
import { FileIcon } from "@/components/file-viewer"
import { formatFileSize } from "@/lib/formatters"
import type { Document } from "../types"
import { CLINICAL_CATEGORY_LABELS } from "../types"

interface DocumentListProps {
  documents: Document[]
  onView: (doc: Document) => void
  onDownload: (doc: Document) => void
  onDelete: (doc: Document) => void
}

function formatDateShort(dateString: string) {
  return new Date(dateString).toLocaleDateString("pt-BR")
}

export function DocumentList({ documents, onView, onDownload, onDelete }: DocumentListProps) {
  const generalDocuments = documents.filter((d) => !d.sessionId)

  if (generalDocuments.length === 0) return null

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-sm font-medium">
          <Paperclip className="h-4 w-4 text-gray-400" />
          Documentos do Prontuário
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
          {generalDocuments.map((doc) => (
            <div
              key={doc.id}
              className="border rounded-lg p-3 hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-start gap-3">
                <FileIcon fileType={doc.fileType} className="h-5 w-5" />
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm truncate" title={doc.name}>
                    {doc.name}
                  </p>
                  <p className="text-xs text-gray-500">
                    {CLINICAL_CATEGORY_LABELS[doc.category] || doc.category}
                  </p>
                  <p className="text-xs text-gray-400">
                    {formatFileSize(doc.fileSize)} • {formatDateShort(doc.uploadedAt)}
                  </p>
                </div>
              </div>
              <div className="flex gap-1 mt-2">
                <Button size="sm" variant="ghost" onClick={() => onView(doc)}>
                  <Eye className="h-3 w-3" />
                </Button>
                <Button size="sm" variant="ghost" onClick={() => onDownload(doc)}>
                  <Download className="h-3 w-3" />
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  className="text-red-600 hover:text-red-700"
                  onClick={() => onDelete(doc)}
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
