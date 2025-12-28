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
  Upload,
  FileText,
  Trash2,
  Download,
  Eye,
  FolderOpen,
  Plus,
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

interface Patient {
  id: string
  name: string
}

// Categorias de documentos contratuais/burocráticos (NÃO clínicos)
const contractCategories = [
  { value: "CONTRACT", label: "Contrato de Prestação de Serviços" },
  { value: "CONSENT_TERM", label: "Termo de Consentimento" },
  { value: "CONFIDENTIALITY_TERM", label: "Termo de Confidencialidade" },
  { value: "GUARDIAN_AUTHORIZATION", label: "Autorização de Responsável" },
  { value: "PAYMENT_RECEIPT", label: "Recibo de Pagamento" },
  { value: "PAYMENT_PROOF", label: "Comprovante de Pagamento" },
  { value: "INVOICE", label: "Nota Fiscal" },
  { value: "HEALTH_PLAN_DECLARATION", label: "Declaração para Plano de Saúde" },
]

// Lista de valores para filtrar apenas documentos contratuais
const CONTRACTUAL_CATEGORIES = [
  "CONTRACT",
  "CONSENT_TERM",
  "CONFIDENTIALITY_TERM",
  "GUARDIAN_AUTHORIZATION",
  "PAYMENT_RECEIPT",
  "PAYMENT_PROOF",
  "INVOICE",
  "HEALTH_PLAN_DECLARATION",
]

const categoryLabels: Record<string, string> = {
  CONTRACT: "Contrato",
  CONSENT_TERM: "Termo de Consentimento",
  CONFIDENTIALITY_TERM: "Confidencialidade",
  GUARDIAN_AUTHORIZATION: "Autorização",
  PAYMENT_RECEIPT: "Recibo",
  PAYMENT_PROOF: "Comprovante",
  INVOICE: "Nota Fiscal",
  HEALTH_PLAN_DECLARATION: "Plano de Saúde",
}

const categoryColors: Record<string, string> = {
  CONTRACT: "bg-gray-100 text-gray-600",
  CONSENT_TERM: "bg-gray-100 text-gray-600",
  CONFIDENTIALITY_TERM: "bg-gray-100 text-gray-600",
  GUARDIAN_AUTHORIZATION: "bg-gray-100 text-gray-600",
  PAYMENT_RECEIPT: "bg-emerald-50 text-emerald-600",
  PAYMENT_PROOF: "bg-emerald-50 text-emerald-600",
  INVOICE: "bg-amber-50 text-amber-600",
  HEALTH_PLAN_DECLARATION: "bg-gray-100 text-gray-600",
}

function formatFileSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export default function DocumentosPage() {
  const router = useRouter()
  const params = useParams()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [patient, setPatient] = useState<Patient | null>(null)
  const [documents, setDocuments] = useState<Document[]>([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [selectedDoc, setSelectedDoc] = useState<Document | null>(null)
  const [filterCategory, setFilterCategory] = useState<string>("ALL")

  // Usar hook do visualizador de documentos
  const { viewerOpen, viewingDoc, openViewer, closeViewer } = useDocumentViewer()

  // Form state
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    category: "",
  })

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

  const fetchDocuments = useCallback(async () => {
    try {
      const response = await fetch(`/api/patients/${params.id}/documents`)
      if (response.ok) {
        const data = await response.json()
        // Filtrar apenas documentos contratuais/burocráticos
        const contractualDocs = data.filter((doc: Document) =>
          CONTRACTUAL_CATEGORIES.includes(doc.category)
        )
        setDocuments(contractualDocs)
      }
    } catch (error) {
      console.error("Erro ao carregar documentos:", error)
    } finally {
      setLoading(false)
    }
  }, [params.id])

  useEffect(() => {
    fetchPatient()
    fetchDocuments()
  }, [fetchPatient, fetchDocuments])

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setSelectedFile(file)
      setFormData((prev) => ({
        ...prev,
        name: prev.name || file.name.replace(/\.[^/.]+$/, ""),
      }))
    }
  }

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedFile || !formData.name || !formData.category) return

    setUploading(true)
    try {
      const uploadFormData = new FormData()
      uploadFormData.append("file", selectedFile)
      uploadFormData.append("name", formData.name)
      uploadFormData.append("description", formData.description)
      uploadFormData.append("category", formData.category)

      const response = await fetch(`/api/patients/${params.id}/documents`, {
        method: "POST",
        body: uploadFormData,
      })

      if (response.ok) {
        setDialogOpen(false)
        setSelectedFile(null)
        setFormData({ name: "", description: "", category: "" })
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

  const handleDelete = async () => {
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

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
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

  const filteredDocuments = documents.filter((doc) => {
    if (filterCategory === "ALL") return true
    return doc.category === filterCategory
  })

  // Agrupar documentos por categoria
  const groupedDocuments = filteredDocuments.reduce((acc, doc) => {
    const cat = doc.category
    if (!acc[cat]) acc[cat] = []
    acc[cat].push(doc)
    return acc
  }, {} as Record<string, Document[]>)

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
            <h1 className="text-2xl font-bold text-gray-900">Dados Contratuais</h1>
            <p className="text-gray-600">{patient.name}</p>
          </div>
        </div>
        <Button onClick={() => setDialogOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Novo Documento
        </Button>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-gray-100 rounded-full">
                <FolderOpen className="h-5 w-5 text-gray-500" />
              </div>
              <div>
                <p className="text-2xl font-semibold text-gray-900">{documents.length}</p>
                <p className="text-xs text-gray-500">Total de Documentos</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-green-100 rounded-full">
                <FileText className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {documents.filter((d) => d.category === "CONTRACT").length}
                </p>
                <p className="text-sm text-gray-500">Contratos</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-yellow-100 rounded-full">
                <FileText className="h-6 w-6 text-yellow-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {documents.filter((d) =>
                    ["PAYMENT_RECEIPT", "PAYMENT_PROOF", "INVOICE"].includes(d.category)
                  ).length}
                </p>
                <p className="text-sm text-gray-500">Financeiros</p>
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
                <p className="text-2xl font-bold">
                  {documents.filter((d) =>
                    ["CONSENT_TERM", "CONFIDENTIALITY_TERM", "GUARDIAN_AUTHORIZATION"].includes(
                      d.category
                    )
                  ).length}
                </p>
                <p className="text-sm text-gray-500">Termos</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filter */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-4">
            <Label>Filtrar por categoria:</Label>
            <Select value={filterCategory} onValueChange={setFilterCategory}>
              <SelectTrigger className="w-64">
                <SelectValue placeholder="Todas as categorias" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">Todas as categorias</SelectItem>
                {contractCategories.map((cat) => (
                  <SelectItem key={cat.value} value={cat.value}>
                    {cat.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Documents List */}
      {Object.keys(groupedDocuments).length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <FolderOpen className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">Nenhum documento encontrado.</p>
            <Button className="mt-4" onClick={() => setDialogOpen(true)}>
              <Upload className="h-4 w-4 mr-2" />
              Fazer Upload
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {Object.entries(groupedDocuments).map(([category, docs]) => (
            <Card key={category}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Badge className={categoryColors[category]}>
                    {categoryLabels[category] || category}
                  </Badge>
                  <span className="text-sm font-normal text-gray-500">
                    ({docs.length} {docs.length === 1 ? "documento" : "documentos"})
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {docs.map((doc) => (
                    <div
                      key={doc.id}
                      className="border rounded-lg p-4 hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex items-start gap-3">
                        <FileIcon fileType={doc.fileType} />
                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate" title={doc.name}>
                            {doc.name}
                          </p>
                          <p className="text-sm text-gray-500 truncate" title={doc.fileName}>
                            {doc.fileName}
                          </p>
                          <p className="text-xs text-gray-400 mt-1">
                            {formatFileSize(doc.fileSize)} • {formatDate(doc.uploadedAt)}
                          </p>
                          {doc.description && (
                            <p className="text-sm text-gray-600 mt-2 line-clamp-2">
                              {doc.description}
                            </p>
                          )}
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
          ))}
        </div>
      )}

      {/* Upload Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Novo Documento</DialogTitle>
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
                  id="file-upload"
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
                  <label htmlFor="file-upload" className="cursor-pointer">
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
              <Label htmlFor="name">Nome do Documento *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Ex: Contrato de Prestação de Serviços"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="category">Categoria *</Label>
              <Select
                value={formData.category}
                onValueChange={(value) => setFormData({ ...formData, category: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione a categoria" />
                </SelectTrigger>
                <SelectContent>
                  {contractCategories.map((cat) => (
                    <SelectItem key={cat.value} value={cat.value}>
                      {cat.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Descrição</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Descrição ou observações sobre o documento..."
                rows={3}
              />
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setDialogOpen(false)
                  setSelectedFile(null)
                  setFormData({ name: "", description: "", category: "" })
                }}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={uploading || !selectedFile || !formData.name || !formData.category}
              >
                {uploading ? "Enviando..." : "Fazer Upload"}
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
              onClick={handleDelete}
              className="bg-red-600 hover:bg-red-700"
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Document Viewer Modal */}
      <DocumentViewer
        document={viewingDoc}
        patientId={params.id as string}
        open={viewerOpen}
        onClose={closeViewer}
      />
    </div>
  )
}
