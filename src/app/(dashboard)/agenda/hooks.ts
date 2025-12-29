import { useState, useCallback, useEffect, useRef } from "react"
import { useSearchParams } from "next/navigation"
import { toast } from "sonner"
import { parseCurrency } from "@/components/ui/masked-input"
import type { Session, Patient, SessionFormData } from "./types"
import { INITIAL_FORM_DATA } from "./types"

// ============================================
// HOOK: useSessions
// ============================================

export function useSessions() {
  const [sessions, setSessions] = useState<Session[]>([])
  const [loading, setLoading] = useState(true)

  const fetchSessions = useCallback(async (start?: Date, end?: Date) => {
    try {
      const params = new URLSearchParams()
      if (start) params.set("startDate", start.toISOString())
      if (end) params.set("endDate", end.toISOString())

      const response = await fetch(`/api/sessions?${params}`)
      if (response.ok) {
        const data = await response.json()
        setSessions(data)
      }
    } catch {
      toast.error("Erro ao carregar sessões")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchSessions()
  }, [fetchSessions])

  return { sessions, loading, fetchSessions }
}

// ============================================
// HOOK: usePatients
// ============================================

export function usePatients() {
  const [patients, setPatients] = useState<Patient[]>([])

  const fetchPatients = useCallback(async () => {
    try {
      const response = await fetch("/api/patients?status=ACTIVE")
      if (response.ok) {
        const data = await response.json()
        setPatients(data)
      }
    } catch {
      toast.error("Erro ao carregar pacientes")
    }
  }, [])

  useEffect(() => {
    fetchPatients()
  }, [fetchPatients])

  return { patients }
}

// ============================================
// HOOK: useSessionForm
// ============================================

export function useSessionForm(
  patients: Patient[],
  fetchSessions: () => void
) {
  const searchParams = useSearchParams()
  const initialPatientHandled = useRef(false)

  const [modalOpen, setModalOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [recurrenceDialogOpen, setRecurrenceDialogOpen] = useState(false)
  const [recurrenceActionType, setRecurrenceActionType] = useState<"delete" | null>(null)
  const [selectedSession, setSelectedSession] = useState<Session | null>(null)
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const [formData, setFormData] = useState<SessionFormData>(INITIAL_FORM_DATA)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")

  // Handle patientId from URL
  useEffect(() => {
    const patientId = searchParams.get("patientId")
    if (patientId && patients.length > 0 && !initialPatientHandled.current) {
      initialPatientHandled.current = true
      const now = new Date()
      setSelectedSession(null)
      setSelectedDate(now)
      setFormData({
        ...INITIAL_FORM_DATA,
        patientId,
        date: now.toISOString().split("T")[0],
        time: "09:00",
      })
      setError("")
      setModalOpen(true)
    }
  }, [searchParams, patients])

  const openNewSession = useCallback((date?: Date) => {
    const d = date || new Date()
    setSelectedSession(null)
    setSelectedDate(d)
    // Se a hora é 00:00 (clique no calendário modo mês), usar horário padrão 09:00
    const hour = d.getHours()
    const minute = d.getMinutes()
    const isDefaultTime = hour === 0 && minute === 0
    setFormData({
      ...INITIAL_FORM_DATA,
      date: d.toISOString().split("T")[0],
      time: isDefaultTime ? "09:00" : d.toTimeString().slice(0, 5),
    })
    setError("")
    setModalOpen(true)
  }, [])

  const openEditSession = useCallback((session: Session) => {
    const dateTime = new Date(session.dateTime)
    setSelectedSession(session)
    setFormData({
      ...INITIAL_FORM_DATA,
      patientId: session.patientId,
      date: dateTime.toISOString().split("T")[0],
      time: dateTime.toTimeString().slice(0, 5),
      duration: session.duration.toString(),
      status: session.status,
      isCourtesy: session.isCourtesy || false,
      observations: session.observations || "",
      clinicalNotes: session.clinicalNotes || "",
    })
    setError("")
    setModalOpen(true)
  }, [])

  const closeModal = useCallback(() => {
    setModalOpen(false)
    setSelectedSession(null)
    setError("")
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setError("")

    try {
      const dateTime = new Date(`${formData.date}T${formData.time}`)
      const body: Record<string, unknown> = {
        patientId: formData.patientId,
        dateTime: dateTime.toISOString(),
        duration: parseInt(formData.duration),
        status: formData.status,
        isCourtesy: formData.isCourtesy,
        observations: formData.observations,
        clinicalNotes: formData.clinicalNotes,
      }

      // Add recurrence fields for new recurring sessions
      if (!selectedSession && formData.isRecurring) {
        body.isRecurring = true
        body.recurrencePattern = formData.recurrencePattern
        body.recurrenceEndType = formData.recurrenceEndType
        if (formData.recurrenceEndType === "DATE") {
          body.recurrenceEndDate = formData.recurrenceEndDate
        } else {
          body.recurrenceOccurrences = formData.recurrenceOccurrences
        }

        // Calculate price per session if not courtesy
        if (!formData.isCourtesy && formData.customPrice) {
          const customValue = parseCurrency(formData.customPrice)
          if (formData.priceType === "total") {
            const numSessions = formData.recurrenceEndType === "OCCURRENCES"
              ? formData.recurrenceOccurrences
              : 1
            body.customSessionPrice = customValue / numSessions
          } else {
            body.customSessionPrice = customValue
          }
        }

        // Add payment info
        if (!formData.isCourtesy && formData.isPaid) {
          body.isPaid = true
          if (formData.paymentMethod) {
            body.paymentMethod = formData.paymentMethod
          }
          if (formData.receipt) {
            body.receiptUrl = formData.receipt.url
            body.receiptFileName = formData.receipt.fileName
            body.receiptFileType = formData.receipt.fileType
            body.receiptFileSize = formData.receipt.fileSize
          }
        }
      }

      const url = selectedSession
        ? `/api/sessions/${selectedSession.id}`
        : "/api/sessions"
      const method = selectedSession ? "PUT" : "POST"

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      })

      if (response.ok) {
        const data = await response.json()
        closeModal()
        fetchSessions()
        if (data.sessionsCreated) {
          toast.success(`${data.sessionsCreated} sessões criadas com sucesso!`)
        }
      } else {
        const data = await response.json()
        if (data.conflicts) {
          setError(`Conflito em ${data.conflicts.length} data(s). Escolha outro horário.`)
        } else {
          setError(data.error || "Erro ao salvar sessão")
        }
      }
    } catch {
      setError("Erro ao salvar sessão")
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!selectedSession) return

    // If recurring session, show options dialog
    if (selectedSession.recurrenceGroupId) {
      setRecurrenceActionType("delete")
      setRecurrenceDialogOpen(true)
      setDeleteDialogOpen(false)
      return
    }

    try {
      const response = await fetch(`/api/sessions/${selectedSession.id}`, {
        method: "DELETE",
      })

      if (response.ok) {
        setDeleteDialogOpen(false)
        closeModal()
        fetchSessions()
        toast.success("Sessão excluída")
      }
    } catch {
      toast.error("Erro ao excluir sessão")
    }
  }

  const handleRecurrenceDelete = async (deleteType: "SINGLE" | "FUTURE" | "ALL") => {
    if (!selectedSession?.recurrenceGroupId) return

    try {
      const response = await fetch(`/api/sessions/recurring/${selectedSession.recurrenceGroupId}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          deleteType,
          sessionId: selectedSession.id,
        }),
      })

      if (response.ok) {
        const data = await response.json()
        setRecurrenceDialogOpen(false)
        closeModal()
        fetchSessions()
        toast.success(`${data.deletedCount} sessão(ões) excluída(s)`)
      }
    } catch {
      toast.error("Erro ao excluir sessões recorrentes")
    }
  }

  return {
    modalOpen,
    setModalOpen,
    deleteDialogOpen,
    setDeleteDialogOpen,
    recurrenceDialogOpen,
    setRecurrenceDialogOpen,
    recurrenceActionType,
    selectedSession,
    selectedDate,
    formData,
    setFormData,
    saving,
    error,
    openNewSession,
    openEditSession,
    closeModal,
    handleSubmit,
    handleDelete,
    handleRecurrenceDelete,
  }
}
