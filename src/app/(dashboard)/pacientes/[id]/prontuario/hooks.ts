import { useState, useCallback, useEffect, useRef } from "react"
import { useRouter, useParams } from "next/navigation"
import { toast } from "sonner"
import type { Patient, Session, Document } from "./types"
import { CLINICAL_CATEGORIES } from "./types"

// ============================================
// HOOK: useProntuarioData
// ============================================

export function useProntuarioData() {
  const router = useRouter()
  const params = useParams()
  const [patient, setPatient] = useState<Patient | null>(null)
  const [sessions, setSessions] = useState<Session[]>([])
  const [documents, setDocuments] = useState<Document[]>([])
  const [loading, setLoading] = useState(true)

  const fetchPatient = useCallback(async () => {
    try {
      const response = await fetch(`/api/patients/${params.id}`)
      if (response.ok) {
        const data = await response.json()
        setPatient(data)
      } else if (response.status === 404) {
        router.push("/pacientes")
      }
    } catch {
      toast.error("Ocorreu um erro")
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
    } catch {
      toast.error("Ocorreu um erro")
    } finally {
      setLoading(false)
    }
  }, [params.id])

  const fetchDocuments = useCallback(async () => {
    try {
      const response = await fetch(`/api/patients/${params.id}/documents`)
      if (response.ok) {
        const data = await response.json()
        const clinicalDocs = data.filter((doc: Document) =>
          CLINICAL_CATEGORIES.includes(doc.category)
        )
        setDocuments(clinicalDocs)
      }
    } catch {
      toast.error("Ocorreu um erro")
    }
  }, [params.id])

  useEffect(() => {
    fetchPatient()
    fetchSessions()
    fetchDocuments()
  }, [fetchPatient, fetchSessions, fetchDocuments])

  return { patient, sessions, setSessions, documents, loading, fetchDocuments, patientId: params.id as string }
}

// ============================================
// HOOK: useSessionEditor
// ============================================

export function useSessionEditor(
  sessions: Session[],
  setSessions: (fn: (prev: Session[]) => Session[]) => void
) {
  const [expandedSessions, setExpandedSessions] = useState<Set<string>>(new Set())
  const [editingSession, setEditingSession] = useState<string | null>(null)
  const [editedNotes, setEditedNotes] = useState("")
  const [saving, setSaving] = useState(false)

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
    } catch {
      toast.error("Ocorreu um erro")
    } finally {
      setSaving(false)
    }
  }

  return {
    expandedSessions,
    editingSession,
    editedNotes,
    setEditedNotes,
    saving,
    toggleSession,
    startEditing,
    cancelEditing,
    saveNotes,
  }
}

// ============================================
// HOOK: useDocumentUpload
// ============================================

export function useDocumentUpload(
  patientId: string,
  fetchDocuments: () => void
) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false)
  const [uploadSessionId, setUploadSessionId] = useState<string | null>(null)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)
  const [uploadForm, setUploadForm] = useState({
    name: "",
    description: "",
    category: "",
  })

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

      const response = await fetch(`/api/patients/${patientId}/documents`, {
        method: "POST",
        body: formData,
      })

      if (response.ok) {
        closeUploadDialog()
        fetchDocuments()
      } else {
        const data = await response.json()
        toast.error(data.error || "Erro ao fazer upload")
      }
    } catch {
      toast.error("Erro ao fazer upload do documento")
    } finally {
      setUploading(false)
    }
  }

  const closeUploadDialog = () => {
    setUploadDialogOpen(false)
    setSelectedFile(null)
    setUploadForm({ name: "", description: "", category: "" })
    setUploadSessionId(null)
    if (fileInputRef.current) fileInputRef.current.value = ""
  }

  const removeSelectedFile = () => {
    setSelectedFile(null)
    if (fileInputRef.current) fileInputRef.current.value = ""
  }

  return {
    fileInputRef,
    uploadDialogOpen,
    setUploadDialogOpen,
    uploadSessionId,
    selectedFile,
    uploading,
    uploadForm,
    setUploadForm,
    openUploadDialog,
    handleFileChange,
    handleUpload,
    closeUploadDialog,
    removeSelectedFile,
  }
}

// ============================================
// HOOK: useDocumentActions
// ============================================

export function useDocumentActions(
  patientId: string,
  fetchDocuments: () => void
) {
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [selectedDoc, setSelectedDoc] = useState<Document | null>(null)

  const handleDeleteDoc = async () => {
    if (!selectedDoc) return

    try {
      const response = await fetch(
        `/api/patients/${patientId}/documents/${selectedDoc.id}`,
        { method: "DELETE" }
      )

      if (response.ok) {
        setDeleteDialogOpen(false)
        setSelectedDoc(null)
        fetchDocuments()
      }
    } catch {
      toast.error("Ocorreu um erro")
    }
  }

  const handleDownload = async (doc: Document) => {
    try {
      const response = await fetch(`/api/patients/${patientId}/documents/${doc.id}/download`)
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
    } catch {
      toast.error("Erro ao baixar o documento")
    }
  }

  const confirmDeleteDoc = (doc: Document) => {
    setSelectedDoc(doc)
    setDeleteDialogOpen(true)
  }

  return {
    deleteDialogOpen,
    setDeleteDialogOpen,
    selectedDoc,
    handleDeleteDoc,
    handleDownload,
    confirmDeleteDoc,
  }
}
