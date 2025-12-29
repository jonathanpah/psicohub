"use client"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Calendar,
  Clock,
  FileText,
  Save,
  Upload,
  Paperclip,
  Eye,
  Download,
  Trash2,
  X,
  Loader2,
} from "lucide-react"
import { FileIcon } from "@/components/file-viewer"
import { formatFileSize } from "@/lib/formatters"
import { SESSION_STATUS_COLORS, SESSION_STATUS_LABELS } from "@/constants/status"
import type { Session } from "../types"

interface Document {
  id: string
  name: string
  description: string | null
  fileName: string
  fileUrl: string
  fileType: string
  fileSize: number
  category: string
  sessionId: string | null
  uploadedAt: string
}

const CLINICAL_CATEGORY_OPTIONS = [
  { value: "ANAMNESIS", label: "Ficha de Anamnese" },
  { value: "PSYCHOLOGICAL_REPORT", label: "Laudo Psicológico" },
  { value: "EXTERNAL_REPORT", label: "Laudo de Outros Profissionais" },
  { value: "MEDICAL_EXAM", label: "Exames Médicos" },
  { value: "SCHOOL_REPORT", label: "Relatório Escolar" },
  { value: "PSYCHOLOGICAL_EVALUATION", label: "Avaliação Psicológica" },
  { value: "CLINICAL_EVOLUTION", label: "Evolução Clínica" },
  { value: "OTHER", label: "Outro Documento" },
]

interface SessionNotesDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  session: Session | null
  patientId: string
  onSessionUpdate: () => void
}

function formatSessionDate(dateString: string): string {
  const date = new Date(dateString)
  return date.toLocaleDateString("pt-BR", {
    weekday: "long",
    day: "2-digit",
    month: "long",
    year: "numeric",
  })
}

function formatSessionTime(dateString: string): string {
  return new Date(dateString).toLocaleTimeString("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
  })
}

export function SessionNotesDialog({
  open,
  onOpenChange,
  session,
  patientId,
  onSessionUpdate,
}: SessionNotesDialogProps) {
  const [clinicalNotes, setClinicalNotes] = useState("")
  const [saving, setSaving] = useState(false)
  const [documents, setDocuments] = useState<Document[]>([])
  const [loadingDocs, setLoadingDocs] = useState(false)

  // Upload state
  const [showUploadForm, setShowUploadForm] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)
  const [uploadForm, setUploadForm] = useState({
    name: "",
    description: "",
    category: "",
  })
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Load session data when dialog opens
  useEffect(() => {
    if (open && session) {
      setClinicalNotes(session.clinicalNotes || "")
      fetchDocuments()
    } else {
      // Reset state when closing
      setClinicalNotes("")
      setDocuments([])
      setShowUploadForm(false)
      setSelectedFile(null)
      setUploadForm({ name: "", description: "", category: "" })
    }
  }, [open, session])

  const fetchDocuments = async () => {
    if (!session) return
    setLoadingDocs(true)
    try {
      const res = await fetch(`/api/patients/${patientId}/documents`)
      if (res.ok) {
        const data = await res.json()
        // Filter only documents for this session
        setDocuments(data.filter((d: Document) => d.sessionId === session.id))
      }
    } catch (error) {
      console.error("Erro ao carregar documentos:", error)
    } finally {
      setLoadingDocs(false)
    }
  }

  const handleSaveNotes = async () => {
    if (!session) return
    setSaving(true)
    try {
      const res = await fetch(`/api/sessions/${session.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clinicalNotes: clinicalNotes || null,
        }),
      })
      if (res.ok) {
        onSessionUpdate()
      }
    } catch (error) {
      console.error("Erro ao salvar notas:", error)
    } finally {
      setSaving(false)
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setSelectedFile(file)
      // Auto-fill name if empty
      if (!uploadForm.name) {
        const nameWithoutExt = file.name.replace(/\.[^/.]+$/, "")
        setUploadForm((prev) => ({ ...prev, name: nameWithoutExt }))
      }
    }
  }

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedFile || !session) return

    setUploading(true)
    try {
      const formData = new FormData()
      formData.append("file", selectedFile)
      formData.append("name", uploadForm.name)
      formData.append("category", uploadForm.category)
      formData.append("sessionId", session.id)
      if (uploadForm.description) {
        formData.append("description", uploadForm.description)
      }

      const res = await fetch(`/api/patients/${patientId}/documents`, {
        method: "POST",
        body: formData,
      })

      if (res.ok) {
        // Reset upload form
        setShowUploadForm(false)
        setSelectedFile(null)
        setUploadForm({ name: "", description: "", category: "" })
        if (fileInputRef.current) fileInputRef.current.value = ""
        // Refresh documents
        fetchDocuments()
      } else {
        const error = await res.json()
        console.error("Erro no upload:", error)
        alert(error.error || "Erro ao fazer upload do documento")
      }
    } catch (error) {
      console.error("Erro ao fazer upload:", error)
      alert("Erro ao fazer upload do documento")
    } finally {
      setUploading(false)
    }
  }

  const handleViewDoc = (doc: Document) => {
    window.open(doc.fileUrl, "_blank")
  }

  const handleDownloadDoc = (doc: Document) => {
    const link = document.createElement("a")
    link.href = doc.fileUrl
    link.download = doc.fileName
    link.click()
  }

  const handleDeleteDoc = async (doc: Document) => {
    if (!confirm("Tem certeza que deseja excluir este documento?")) return

    try {
      const res = await fetch(`/api/patients/${patientId}/documents/${doc.id}`, {
        method: "DELETE",
      })
      if (res.ok) {
        fetchDocuments()
      }
    } catch (error) {
      console.error("Erro ao excluir documento:", error)
    }
  }

  if (!session) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Notas da Sessão
          </DialogTitle>
        </DialogHeader>

        {/* Session Info */}
        <div className="bg-gray-50 rounded-lg p-4 space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 text-gray-600">
                <Calendar className="h-4 w-4" />
                <span className="text-sm capitalize">
                  {formatSessionDate(session.dateTime)}
                </span>
              </div>
              <div className="flex items-center gap-2 text-gray-600">
                <Clock className="h-4 w-4" />
                <span className="text-sm">
                  {formatSessionTime(session.dateTime)} ({session.duration} min)
                </span>
              </div>
            </div>
            <Badge className={SESSION_STATUS_COLORS[session.status]}>
              {SESSION_STATUS_LABELS[session.status]}
            </Badge>
          </div>
        </div>

        {/* Clinical Notes */}
        <div className="space-y-2">
          <Label className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Notas Clínicas
          </Label>
          <Textarea
            value={clinicalNotes}
            onChange={(e) => setClinicalNotes(e.target.value)}
            placeholder="Digite as notas clínicas da sessão..."
            rows={8}
            className="font-mono text-sm resize-none"
          />
          <div className="flex justify-end">
            <Button onClick={handleSaveNotes} disabled={saving} size="sm">
              {saving ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Salvando...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Salvar Notas
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Attachments Section */}
        <div className="space-y-3 border-t pt-4">
          <div className="flex items-center justify-between">
            <Label className="flex items-center gap-2">
              <Paperclip className="h-4 w-4" />
              Anexos da Sessão
            </Label>
            {!showUploadForm && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowUploadForm(true)}
              >
                <Upload className="h-4 w-4 mr-2" />
                Anexar
              </Button>
            )}
          </div>

          {/* Upload Form */}
          {showUploadForm && (
            <form onSubmit={handleUpload} className="bg-gray-50 rounded-lg p-4 space-y-3">
              <div className="space-y-2">
                <Label>Arquivo *</Label>
                <div className="border-2 border-dashed rounded-lg p-4 text-center bg-white">
                  <input
                    ref={fileInputRef}
                    type="file"
                    onChange={handleFileChange}
                    accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.jpg,.jpeg,.png,.webp"
                    className="hidden"
                    id="file-upload-session"
                  />
                  {selectedFile ? (
                    <div className="flex items-center justify-center gap-2">
                      <FileIcon fileType={selectedFile.type} className="h-6 w-6" />
                      <div className="text-left">
                        <p className="font-medium text-sm">{selectedFile.name}</p>
                        <p className="text-xs text-gray-500">
                          {formatFileSize(selectedFile.size)}
                        </p>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setSelectedFile(null)
                          if (fileInputRef.current) fileInputRef.current.value = ""
                        }}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ) : (
                    <label htmlFor="file-upload-session" className="cursor-pointer">
                      <Upload className="h-6 w-6 text-gray-400 mx-auto mb-1" />
                      <p className="text-sm text-gray-600">Clique para selecionar</p>
                      <p className="text-xs text-gray-400">PDF, DOC, DOCX, JPG, PNG (máx. 10MB)</p>
                    </label>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label htmlFor="doc-name">Nome *</Label>
                  <Input
                    id="doc-name"
                    value={uploadForm.name}
                    onChange={(e) => setUploadForm({ ...uploadForm, name: e.target.value })}
                    placeholder="Nome do documento"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="doc-category">Categoria *</Label>
                  <Select
                    value={uploadForm.category}
                    onValueChange={(value) => setUploadForm({ ...uploadForm, category: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
                    <SelectContent>
                      {CLINICAL_CATEGORY_OPTIONS.map((cat) => (
                        <SelectItem key={cat.value} value={cat.value}>
                          {cat.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setShowUploadForm(false)
                    setSelectedFile(null)
                    setUploadForm({ name: "", description: "", category: "" })
                  }}
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  disabled={uploading || !selectedFile || !uploadForm.name || !uploadForm.category}
                >
                  {uploading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Enviando...
                    </>
                  ) : (
                    "Anexar"
                  )}
                </Button>
              </div>
            </form>
          )}

          {/* Documents List */}
          {loadingDocs ? (
            <div className="flex items-center justify-center py-4">
              <Loader2 className="h-5 w-5 animate-spin text-gray-400" />
            </div>
          ) : documents.length > 0 ? (
            <div className="space-y-2">
              {documents.map((doc) => (
                <div
                  key={doc.id}
                  className="bg-white border rounded-lg p-3 flex items-center gap-3"
                >
                  <FileIcon fileType={doc.fileType} className="h-8 w-8 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">{doc.name}</p>
                    <p className="text-xs text-gray-500">{formatFileSize(doc.fileSize)}</p>
                  </div>
                  <div className="flex gap-1">
                    <Button size="sm" variant="ghost" onClick={() => handleViewDoc(doc)}>
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => handleDownloadDoc(doc)}>
                      <Download className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-red-600 hover:text-red-700"
                      onClick={() => handleDeleteDoc(doc)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-400 italic text-center py-4">
              Nenhum documento anexado a esta sessão.
            </p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
