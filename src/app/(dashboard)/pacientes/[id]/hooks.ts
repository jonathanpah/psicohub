import { useState, useCallback, useEffect } from "react"
import { useRouter, useParams } from "next/navigation"
import { toast } from "sonner"
import type { Patient, SessionPackage, Session } from "./types"

// ============================================
// HOOK: usePatientData
// ============================================

export function usePatientData() {
  const router = useRouter()
  const params = useParams()
  const [patient, setPatient] = useState<Patient | null>(null)
  const [sessionPackages, setSessionPackages] = useState<SessionPackage[]>([])
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
    } finally {
      setLoading(false)
    }
  }, [params.id, router])

  const fetchPackages = useCallback(async () => {
    try {
      const response = await fetch(`/api/packages?patientId=${params.id}`)
      if (response.ok) {
        const data = await response.json()
        setSessionPackages(data)
      }
    } catch {
      toast.error("Ocorreu um erro")
    }
  }, [params.id])

  useEffect(() => {
    fetchPatient()
    fetchPackages()
  }, [fetchPatient, fetchPackages])

  const refetch = useCallback(() => {
    fetchPatient()
    fetchPackages()
  }, [fetchPatient, fetchPackages])

  return { patient, setPatient, sessionPackages, loading, refetch }
}

// ============================================
// HOOK: usePatientActions
// ============================================

export function usePatientActions(
  patient: Patient | null,
  setPatient: (p: Patient) => void,
  _refetch: () => void
) {
  const router = useRouter()
  const [deleting, setDeleting] = useState(false)
  const [statusLoading, setStatusLoading] = useState(false)

  const handleStatusChange = async (newStatus: string) => {
    if (!patient) return
    setStatusLoading(true)
    try {
      const response = await fetch(`/api/patients/${patient.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: patient.name, status: newStatus }),
      })
      if (response.ok) {
        setPatient({ ...patient, status: newStatus as Patient["status"] })
      }
    } catch {
      toast.error("Ocorreu um erro")
    } finally {
      setStatusLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!patient) return
    setDeleting(true)
    try {
      const response = await fetch(`/api/patients/${patient.id}`, {
        method: "DELETE",
      })
      if (response.ok) {
        router.push("/pacientes")
      }
    } catch {
      toast.error("Ocorreu um erro")
    } finally {
      setDeleting(false)
    }
  }

  return {
    deleting,
    statusLoading,
    handleStatusChange,
    handleDelete,
  }
}

// ============================================
// HOOK: useSessionDeleteActions
// ============================================

export function useSessionDeleteActions(refetch: () => void) {
  const [sessionToDelete, setSessionToDelete] = useState<Session | null>(null)
  const [deleteSessionDialogOpen, setDeleteSessionDialogOpen] = useState(false)
  const [recurrenceDeleteDialogOpen, setRecurrenceDeleteDialogOpen] = useState(false)
  const [deletingSession, setDeletingSession] = useState(false)

  const handleDeleteSessionClick = (session: Session) => {
    setSessionToDelete(session)
    if (session.recurrenceGroupId) {
      setRecurrenceDeleteDialogOpen(true)
    } else {
      setDeleteSessionDialogOpen(true)
    }
  }

  const handleDeleteSession = async () => {
    if (!sessionToDelete) return
    setDeletingSession(true)

    try {
      const response = await fetch(`/api/sessions/${sessionToDelete.id}`, {
        method: "DELETE",
      })

      if (response.ok) {
        setDeleteSessionDialogOpen(false)
        setSessionToDelete(null)
        refetch()
      } else {
        const data = await response.json()
        toast.error(data.error || "Erro ao excluir sessão")
      }
    } catch {
      toast.error("Erro ao excluir sessão")
    } finally {
      setDeletingSession(false)
    }
  }

  const handleRecurrenceDelete = async (deleteType: "SINGLE" | "FUTURE" | "ALL") => {
    if (!sessionToDelete?.recurrenceGroupId) return
    setDeletingSession(true)

    try {
      const response = await fetch(`/api/sessions/recurring/${sessionToDelete.recurrenceGroupId}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          deleteType,
          sessionId: sessionToDelete.id,
        }),
      })

      if (response.ok) {
        const data = await response.json()
        setRecurrenceDeleteDialogOpen(false)
        setSessionToDelete(null)
        refetch()
        toast.success(`${data.deletedCount} sessão(ões) excluída(s)`)
      } else {
        const data = await response.json()
        toast.error(data.error || "Erro ao excluir sessões")
      }
    } catch {
      toast.error("Erro ao excluir sessões")
    } finally {
      setDeletingSession(false)
    }
  }

  return {
    sessionToDelete,
    deleteSessionDialogOpen,
    setDeleteSessionDialogOpen,
    recurrenceDeleteDialogOpen,
    setRecurrenceDeleteDialogOpen,
    deletingSession,
    handleDeleteSessionClick,
    handleDeleteSession,
    handleRecurrenceDelete,
  }
}
