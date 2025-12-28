"use client"

import { useEffect, useState, useCallback, useRef } from "react"
import { useRouter, useParams } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import {
  ArrowLeft,
  Calendar,
  Clock,
  FileText,
  Search,
  Edit,
  Save,
  X,
  ChevronDown,
  ChevronUp,
  Upload,
  Paperclip,
  Trash2,
  Download,
  Eye,
} from "lucide-react"
import { DocumentViewer, FileIcon, useDocumentViewer } from "@/components/document-viewer"

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

interface Session {
  id: string
  dateTime: string
  duration: number
  status: "SCHEDULED" | "CONFIRMED" | "COMPLETED" | "CANCELLED" | "NO_SHOW"
  clinicalNotes: string | null
  observations: string | null
}

interface Patient {
  id: string
  name: string
  birthDate: string | null
  sessions: Session[]
}

const statusColors: Record<string, { bg: string; text: string }> = {
  SCHEDULED: { bg: "#475368", text: "#ffffff" }, // RGB 71 83 104
  CONFIRMED: { bg: "#B1CF95", text: "#1f2937" }, // RGB 177 207 149
  COMPLETED: { bg: "#3E552A", text: "#ffffff" }, // RGB 62 85 42
  CANCELLED: { bg: "#B02418", text: "#ffffff" }, // RGB 176 36 24
  NO_SHOW: { bg: "#F5C242", text: "#1f2937" }, // RGB 245 194 66
}

const statusLabels: Record<string, string> = {
  SCHEDULED: "Agendada",
  CONFIRMED: "Confirmada",
  COMPLETED: "Realizada",
  CANCELLED: "Cancelada",
  NO_SHOW: "Falta",
}

// Categorias de documentos do prontuário (clínicos)
const clinicalCategories = [
  { value: "ANAMNESIS", label: "Ficha de Anamnese" },
  { value: "PSYCHOLOGICAL_REPORT", label: "Laudo Psicológico" },
  { value: "EXTERNAL_REPORT", label: "Laudo de Outros Profissionais" },
  { value: "MEDICAL_EXAM", label: "Exames Médicos" },
  { value: "SCHOOL_REPORT", label: "Relatório Escolar" },
  { value: "PSYCHOLOGICAL_EVALUATION", label: "Avaliação Psicológica" },
  { value: "CLINICAL_EVOLUTION", label: "Evolução Clínica" },
  { value: "OTHER", label: "Outro Documento" },
]

// Lista de valores para filtrar apenas documentos clínicos
const CLINICAL_CATEGORIES = [
  "ANAMNESIS",
  "PSYCHOLOGICAL_REPORT",
  "EXTERNAL_REPORT",
  "MEDICAL_EXAM",
  "SCHOOL_REPORT",
  "PSYCHOLOGICAL_EVALUATION",
  "CLINICAL_EVOLUTION",
  "OTHER",
]

const categoryLabels: Record<string, string> = {
  ANAMNESIS: "Anamnese",
  PSYCHOLOGICAL_REPORT: "Laudo Psicológico",
  EXTERNAL_REPORT: "Laudo Externo",
  MEDICAL_EXAM: "Exame Médico",
  SCHOOL_REPORT: "Relatório Escolar",
  PSYCHOLOGICAL_EVALUATION: "Avaliação",
  CLINICAL_EVOLUTION: "Evolução",
  OTHER: "Outro",
}

function formatFileSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export default function ProntuarioPage() {
  const router = useRouter()
  const params = useParams()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [patient, setPatient] = useState<Patient | null>(null)
  const [sessions, setSessions] = useState<Session[]>([])
  const [documents, setDocuments] = useState<Document[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [expandedSessions, setExpandedSessions] = useState<Set<string>>(new Set())
  const [editingSession, setEditingSession] = useState<string | null>(null)
  const [editedNotes, setEditedNotes] = useState("")
  const [saving, setSaving] = useState(false)

  // Upload state
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false)
  const [uploadSessionId, setUploadSessionId] = useState<string | null>(null)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)
  const [uploadForm, setUploadForm] = useState({
    name: "",
    description: "",
    category: "",
  })

  // Delete state
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [selectedDoc, setSelectedDoc] = useState<Document | null>(null)

  // Document viewer
  const { viewerOpen, viewingDoc, openViewer, closeViewer } = useDocumentViewer()

  const fetchPatient = useCallback(async () => {
    try {
      const response = await fetch(`/api/patients/${params.id}`)
      if (response.ok) {
        const data = await response.json()
        setPatient(data)
      } else if (response.status === 404) {
        router.push("/pacientes")
      }
    } catch (error) {
      console.error("Erro ao carregar paciente:", error)
    }
  }, [params.id, router])

  const fetchSessions = useCallback(async () => {
    try {
      const response = await fetch(`/api/sessions?patientId=${params.id}`)
      if (response.ok) {
        const data = await response.json()
        data.sort((a: Session, b: Session) =>
          new Date(b.dateTime).getTime() - new Date(a.dateTime).getTime()
        )
        setSessions(data)
      }
    } catch (error) {
      console.error("Erro ao carregar sessões:", error)
    } finally {
      setLoading(false)
    }
  }, [params.id])

  const fetchDocuments = useCallback(async () => {
    try {
      const response = await fetch(`/api/patients/${params.id}/documents`)
      if (response.ok) {
        const data = await response.json()
        // Filtrar apenas documentos clínicos (prontuário)
        const clinicalDocs = data.filter((doc: Document) =>
          CLINICAL_CATEGORIES.includes(doc.category)
        )
        setDocuments(clinicalDocs)
      }
    } catch (error) {
      console.error("Erro ao carregar documentos:", error)
    }
  }, [params.id])

  useEffect(() => {
    fetchPatient()
    fetchSessions()
    fetchDocuments()
  }, [fetchPatient, fetchSessions, fetchDocuments])

  const toggleSession = (sessionId: string) => {
    setExpandedSessions((prev) => {
      const newSet = new Set(prev)
      if (newSet.has(sessionId)) {
        newSet.delete(sessionId)
      } else {
        newSet.add(sessionId)
      }
      return newSet
    })
  }

  const startEditing = (session: Session) => {
    setEditingSession(session.id)
    setEditedNotes(session.clinicalNotes || "")
  }

  const cancelEditing = () => {
    setEditingSession(null)
    setEditedNotes("")
  }

  const saveNotes = async (sessionId: string) => {
    setSaving(true)
    try {
      const response = await fetch(`/api/sessions/${sessionId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ clinicalNotes: editedNotes }),
      })

      if (response.ok) {
        setSessions((prev) =>
          prev.map((s) =>
            s.id === sessionId ? { ...s, clinicalNotes: editedNotes } : s
          )
        )
        setEditingSession(null)
        setEditedNotes("")
      }
    } catch (error) {
      console.error("Erro ao salvar notas:", error)
    } finally {
      setSaving(false)
    }
  }

  const openUploadDialog = (sessionId: string | null = null) => {
    setUploadSessionId(sessionId)
    setUploadDialogOpen(true)
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setSelectedFile(file)
      setUploadForm((prev) => ({
        ...prev,
        name: prev.name || file.name.replace(/\.[^/.]+$/, ""),
      }))
    }
  }

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedFile || !uploadForm.name || !uploadForm.category) return

    setUploading(true)
    try {
      const formData = new FormData()
      formData.append("file", selectedFile)
      formData.append("name", uploadForm.name)
      formData.append("description", uploadForm.description)
      formData.append("category", uploadForm.category)
      if (uploadSessionId) {
        formData.append("sessionId", uploadSessionId)
      }

      const response = await fetch(`/api/patients/${params.id}/documents`, {
        method: "POST",
        body: formData,
      })

      if (response.ok) {
        setUploadDialogOpen(false)
        setSelectedFile(null)
        setUploadForm({ name: "", description: "", category: "" })
        setUploadSessionId(null)
        if (fileInputRef.current) fileInputRef.current.value = ""
        fetchDocuments()
      } else {
        const data = await response.json()
        alert(data.error || "Erro ao fazer upload")
      }
    } catch (error) {
      console.error("Erro ao fazer upload:", error)
      alert("Erro ao fazer upload do documento")
    } finally {
      setUploading(false)
    }
  }

  const handleDeleteDoc = async () => {
    if (!selectedDoc) return

    try {
      const response = await fetch(
        `/api/patients/${params.id}/documents/${selectedDoc.id}`,
        { method: "DELETE" }
      )

      if (response.ok) {
        setDeleteDialogOpen(false)
        setSelectedDoc(null)
        fetchDocuments()
      }
    } catch (error) {
      console.error("Erro ao excluir documento:", error)
    }
  }

  const handleDownload = async (doc: Document) => {
    try {
      const response = await fetch(`/api/patients/${params.id}/documents/${doc.id}/download`)
      if (!response.ok) throw new Error("Erro ao baixar")

      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const link = window.document.createElement("a")
      link.href = url
      link.download = doc.fileName
      window.document.body.appendChild(link)
      link.click()
      window.document.body.removeChild(link)
      window.URL.revokeObjectURL(url)
    } catch (error) {
      console.error("Erro ao baixar documento:", error)
      alert("Erro ao baixar o documento")
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("pt-BR", {
      weekday: "long",
      day: "2-digit",
      month: "long",
      year: "numeric",
    })
  }

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString("pt-BR", {
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  const formatDateShort = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("pt-BR")
  }

  const filteredSessions = sessions.filter((session) => {
    if (!searchTerm) return true
    const searchLower = searchTerm.toLowerCase()
    return (
      session.clinicalNotes?.toLowerCase().includes(searchLower) ||
      session.observations?.toLowerCase().includes(searchLower) ||
      formatDate(session.dateTime).toLowerCase().includes(searchLower)
    )
  })

  // Documentos gerais (não vinculados a sessões)
  const generalDocuments = documents.filter((d) => !d.sessionId)

  // Documentos por sessão
  const getSessionDocuments = (sessionId: string) =>
    documents.filter((d) => d.sessionId === sessionId)

  // Group sessions by month/year
  const groupedSessions = filteredSessions.reduce((acc, session) => {
    const date = new Date(session.dateTime)
    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`
    const label = date.toLocaleDateString("pt-BR", { month: "long", year: "numeric" })

    if (!acc[key]) {
      acc[key] = { label, sessions: [] }
    }
    acc[key].sessions.push(session)
    return acc
  }, {} as Record<string, { label: string; sessions: Session[] }>)

  const completedCount = sessions.filter((s) => s.status === "COMPLETED").length
  const notesCount = sessions.filter((s) => s.clinicalNotes).length

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-gray-500">Carregando...</p>
      </div>
    )
  }

  if (!patient) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-gray-500">Paciente não encontrado</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href={`/pacientes/${patient.id}`}>
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Prontuário</h1>
            <p className="text-gray-600">{patient.name}</p>
          </div>
        </div>
        <Button onClick={() => openUploadDialog()}>
          <Upload className="h-4 w-4 mr-2" />
          Anexar Documento
        </Button>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-gray-100 rounded-full">
                <Calendar className="h-5 w-5 text-gray-500" />
              </div>
              <div>
                <p className="text-2xl font-semibold text-gray-900">{sessions.length}</p>
                <p className="text-xs text-gray-500">Total de Sessões</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-green-100 rounded-full">
                <Clock className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{completedCount}</p>
                <p className="text-sm text-gray-500">Sessões Realizadas</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-purple-100 rounded-full">
                <FileText className="h-6 w-6 text-purple-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{notesCount}</p>
                <p className="text-sm text-gray-500">Sessões com Notas</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-orange-100 rounded-full">
                <Paperclip className="h-6 w-6 text-orange-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{documents.length}</p>
                <p className="text-sm text-gray-500">Documentos Anexados</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* General Documents */}
      {generalDocuments.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Paperclip className="h-5 w-5" />
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
                        {categoryLabels[doc.category] || doc.category}
                      </p>
                      <p className="text-xs text-gray-400">
                        {formatFileSize(doc.fileSize)} • {formatDateShort(doc.uploadedAt)}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-1 mt-2">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => openViewer(doc)}
                    >
                      <Eye className="h-3 w-3" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleDownload(doc)}
                    >
                      <Download className="h-3 w-3" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-red-600 hover:text-red-700"
                      onClick={() => {
                        setSelectedDoc(doc)
                        setDeleteDialogOpen(true)
                      }}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Search */}
      <Card>
        <CardContent className="pt-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Buscar nas notas clínicas..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Timeline */}
      <div className="space-y-6">
        {Object.entries(groupedSessions)
          .sort((a, b) => b[0].localeCompare(a[0]))
          .map(([key, { label, sessions: groupSessions }]) => (
            <div key={key}>
              <h3 className="text-lg font-semibold text-gray-700 mb-4 capitalize">
                {label}
              </h3>
              <div className="space-y-4">
                {groupSessions.map((session) => {
                  const sessionDocs = getSessionDocuments(session.id)
                  return (
                    <Card key={session.id} className="overflow-hidden">
                      <div
                        className="flex items-center justify-between p-4 cursor-pointer hover:bg-gray-50"
                        onClick={() => toggleSession(session.id)}
                      >
                        <div className="flex items-center gap-4">
                          <div className="text-center min-w-[60px]">
                            <p className="text-2xl font-bold text-gray-900">
                              {new Date(session.dateTime).getDate()}
                            </p>
                            <p className="text-xs text-gray-500 uppercase">
                              {new Date(session.dateTime).toLocaleDateString("pt-BR", {
                                weekday: "short",
                              })}
                            </p>
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-medium">
                                {formatTime(session.dateTime)}
                              </span>
                              <span className="text-gray-400">•</span>
                              <span className="text-sm text-gray-500">
                                {session.duration} min
                              </span>
                            </div>
                            <div className="flex items-center gap-2 mt-1">
                              <Badge
                                style={{
                                  backgroundColor: statusColors[session.status].bg,
                                  color: statusColors[session.status].text,
                                }}
                              >
                                {statusLabels[session.status]}
                              </Badge>
                              {session.clinicalNotes && (
                                <span className="text-xs text-gray-500 flex items-center gap-1">
                                  <FileText className="h-3 w-3" />
                                  Com notas
                                </span>
                              )}
                              {sessionDocs.length > 0 && (
                                <span className="text-xs text-gray-500 flex items-center gap-1">
                                  <Paperclip className="h-3 w-3" />
                                  {sessionDocs.length} anexo{sessionDocs.length > 1 ? "s" : ""}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                        {expandedSessions.has(session.id) ? (
                          <ChevronUp className="h-5 w-5 text-gray-400" />
                        ) : (
                          <ChevronDown className="h-5 w-5 text-gray-400" />
                        )}
                      </div>

                      {expandedSessions.has(session.id) && (
                        <div className="border-t bg-gray-50 p-4 space-y-4">
                          {session.observations && (
                            <div>
                              <p className="text-sm font-medium text-gray-500 mb-1">
                                Observações
                              </p>
                              <p className="text-gray-700">{session.observations}</p>
                            </div>
                          )}

                          <div>
                            <div className="flex items-center justify-between mb-2">
                              <p className="text-sm font-medium text-gray-500 flex items-center gap-2">
                                <FileText className="h-4 w-4" />
                                Notas Clínicas
                              </p>
                              {editingSession !== session.id && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    startEditing(session)
                                  }}
                                >
                                  <Edit className="h-4 w-4 mr-1" />
                                  Editar
                                </Button>
                              )}
                            </div>

                            {editingSession === session.id ? (
                              <div className="space-y-2">
                                <Textarea
                                  value={editedNotes}
                                  onChange={(e) => setEditedNotes(e.target.value)}
                                  placeholder="Digite as notas clínicas..."
                                  rows={6}
                                  className="font-mono text-sm"
                                  onClick={(e) => e.stopPropagation()}
                                />
                                <div className="flex gap-2">
                                  <Button
                                    size="sm"
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      saveNotes(session.id)
                                    }}
                                    disabled={saving}
                                  >
                                    <Save className="h-4 w-4 mr-1" />
                                    {saving ? "Salvando..." : "Salvar"}
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      cancelEditing()
                                    }}
                                  >
                                    <X className="h-4 w-4 mr-1" />
                                    Cancelar
                                  </Button>
                                </div>
                              </div>
                            ) : (
                              <div className="bg-white rounded-md border p-4 min-h-[100px]">
                                {session.clinicalNotes ? (
                                  <p className="text-gray-700 whitespace-pre-wrap font-mono text-sm">
                                    {session.clinicalNotes}
                                  </p>
                                ) : (
                                  <p className="text-gray-400 italic">
                                    Nenhuma nota clínica registrada para esta sessão.
                                  </p>
                                )}
                              </div>
                            )}
                          </div>

                          {/* Session Attachments */}
                          <div>
                            <div className="flex items-center justify-between mb-2">
                              <p className="text-sm font-medium text-gray-500 flex items-center gap-2">
                                <Paperclip className="h-4 w-4" />
                                Anexos da Sessão
                              </p>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  openUploadDialog(session.id)
                                }}
                              >
                                <Upload className="h-4 w-4 mr-1" />
                                Anexar
                              </Button>
                            </div>

                            {sessionDocs.length > 0 ? (
                              <div className="grid gap-2 md:grid-cols-2">
                                {sessionDocs.map((doc) => (
                                  <div
                                    key={doc.id}
                                    className="bg-white border rounded-md p-2 flex items-center gap-2"
                                    onClick={(e) => e.stopPropagation()}
                                  >
                                    <FileIcon fileType={doc.fileType} className="h-5 w-5" />
                                    <div className="flex-1 min-w-0">
                                      <p className="text-sm font-medium truncate">
                                        {doc.name}
                                      </p>
                                      <p className="text-xs text-gray-500">
                                        {formatFileSize(doc.fileSize)}
                                      </p>
                                    </div>
                                    <div className="flex gap-1">
                                      <Button
                                        size="sm"
                                        variant="ghost"
                                        onClick={() => openViewer(doc)}
                                      >
                                        <Eye className="h-3 w-3" />
                                      </Button>
                                      <Button
                                        size="sm"
                                        variant="ghost"
                                        onClick={() => handleDownload(doc)}
                                      >
                                        <Download className="h-3 w-3" />
                                      </Button>
                                      <Button
                                        size="sm"
                                        variant="ghost"
                                        className="text-red-600"
                                        onClick={() => {
                                          setSelectedDoc(doc)
                                          setDeleteDialogOpen(true)
                                        }}
                                      >
                                        <Trash2 className="h-3 w-3" />
                                      </Button>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <p className="text-sm text-gray-400 italic bg-white rounded-md border p-3">
                                Nenhum documento anexado a esta sessão.
                              </p>
                            )}
                          </div>
                        </div>
                      )}
                    </Card>
                  )
                })}
              </div>
            </div>
          ))}

        {filteredSessions.length === 0 && (
          <Card>
            <CardContent className="py-12 text-center">
              {searchTerm ? (
                <p className="text-gray-500">
                  Nenhuma sessão encontrada para &quot;{searchTerm}&quot;
                </p>
              ) : (
                <p className="text-gray-500">Nenhuma sessão registrada ainda.</p>
              )}
            </CardContent>
          </Card>
        )}
      </div>

      {/* Upload Dialog */}
      <Dialog open={uploadDialogOpen} onOpenChange={setUploadDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>
              {uploadSessionId ? "Anexar Documento à Sessão" : "Anexar Documento ao Prontuário"}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleUpload} className="space-y-4">
            <div className="space-y-2">
              <Label>Arquivo *</Label>
              <div className="border-2 border-dashed rounded-lg p-6 text-center">
                <input
                  ref={fileInputRef}
                  type="file"
                  onChange={handleFileChange}
                  accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.jpg,.jpeg,.png,.webp"
                  className="hidden"
                  id="file-upload-prontuario"
                />
                {selectedFile ? (
                  <div className="flex items-center justify-center gap-2">
                    <FileIcon fileType={selectedFile.type} className="h-8 w-8" />
                    <div>
                      <p className="font-medium">{selectedFile.name}</p>
                      <p className="text-sm text-gray-500">
                        {formatFileSize(selectedFile.size)}
                      </p>
                    </div>
                  </div>
                ) : (
                  <label htmlFor="file-upload-prontuario" className="cursor-pointer">
                    <Upload className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                    <p className="text-sm text-gray-600">
                      Clique para selecionar ou arraste o arquivo
                    </p>
                    <p className="text-xs text-gray-400 mt-1">
                      PDF, DOC, DOCX, XLS, XLSX, PPT, PPTX, JPG, PNG (máx. 10MB)
                    </p>
                  </label>
                )}
              </div>
              {selectedFile && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setSelectedFile(null)
                    if (fileInputRef.current) fileInputRef.current.value = ""
                  }}
                >
                  Remover arquivo
                </Button>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="doc-name">Nome do Documento *</Label>
              <Input
                id="doc-name"
                value={uploadForm.name}
                onChange={(e) => setUploadForm({ ...uploadForm, name: e.target.value })}
                placeholder="Ex: Laudo Psicológico"
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
                  <SelectValue placeholder="Selecione a categoria" />
                </SelectTrigger>
                <SelectContent>
                  {clinicalCategories.map((cat) => (
                    <SelectItem key={cat.value} value={cat.value}>
                      {cat.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="doc-description">Descrição</Label>
              <Textarea
                id="doc-description"
                value={uploadForm.description}
                onChange={(e) => setUploadForm({ ...uploadForm, description: e.target.value })}
                placeholder="Descrição ou observações sobre o documento..."
                rows={3}
              />
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setUploadDialogOpen(false)
                  setSelectedFile(null)
                  setUploadForm({ name: "", description: "", category: "" })
                  setUploadSessionId(null)
                }}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={uploading || !selectedFile || !uploadForm.name || !uploadForm.category}
              >
                {uploading ? "Enviando..." : "Anexar"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir Documento</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir &quot;{selectedDoc?.name}&quot;? Esta ação não
              pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteDoc}
              className="bg-red-600 hover:bg-red-700"
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Document Viewer */}
      <DocumentViewer
        document={viewingDoc}
        patientId={params.id as string}
        open={viewerOpen}
        onClose={closeViewer}
      />
    </div>
  )
}
