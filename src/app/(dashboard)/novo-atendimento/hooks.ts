"use client"

import { useEffect, useState, useRef, useMemo, useCallback } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { parseCurrency } from "@/components/ui/masked-input"
import type { FileData } from "@/components/ui/file-upload"
import type { Patient, SessionSlot, ExistingPackage } from "./types"
import {
  type RecurrencePattern,
  generateRecurrenceDates,
  generateRecurrenceGroupId,
} from "@/lib/recurrence"

export function useNovoAtendimento() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const preselectedPatientId = searchParams.get("patientId")
  const packageId = searchParams.get("packageId")

  const [patients, setPatients] = useState<Patient[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  // Existing package mode
  const [existingPackage, setExistingPackage] = useState<ExistingPackage | null>(null)
  const isAddToPackageMode = !!packageId

  // Form state
  const [selectedPatient, setSelectedPatient] = useState<string>(preselectedPatientId || "")
  const [type, setType] = useState<"SESSION" | "PACKAGE">("SESSION")
  const [sessionPrice, setSessionPrice] = useState("")
  const [totalSessions, setTotalSessions] = useState("1")
  const [packagePrice, setPackagePrice] = useState("")
  const [packageName, setPackageName] = useState("")
  const [notes, setNotes] = useState("")
  const [isPaid, setIsPaid] = useState(false)
  const [paymentMethod, setPaymentMethod] = useState("")
  const [receipt, setReceipt] = useState<FileData | null>(null)
  const [sessionSlots, setSessionSlots] = useState<SessionSlot[]>([
    { id: "1", date: "", time: "", duration: 50 },
  ])

  // Recurrence state
  const [isRecurring, setIsRecurring] = useState(false)
  const [recurrencePattern, setRecurrencePattern] = useState<RecurrencePattern>("WEEKLY")
  const [recurrenceCount, setRecurrenceCount] = useState(8)
  const [recurrenceConflicts, setRecurrenceConflicts] = useState<string[]>([])
  const [isCheckingConflicts, setIsCheckingConflicts] = useState(false)

  // Ref para controlar navegação após unmount
  const navigationTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  // Cleanup do timeout ao desmontar
  useEffect(() => {
    return () => {
      if (navigationTimeoutRef.current) {
        clearTimeout(navigationTimeoutRef.current)
      }
    }
  }, [])

  useEffect(() => {
    if (packageId) {
      fetchPackage(packageId)
    } else {
      fetchPatients()
    }
  }, [packageId])

  async function fetchPackage(pkgId: string) {
    try {
      const response = await fetch(`/api/packages/${pkgId}`)
      if (response.ok) {
        const data = await response.json()

        // Find existing paid receipt
        let existingReceipt = null
        for (const session of data.sessions || []) {
          if (session.payment?.status === "PAID" && session.payment?.receiptUrl) {
            existingReceipt = {
              url: session.payment.receiptUrl,
              fileName: session.payment.receiptFileName || null,
              fileType: session.payment.receiptFileType || null,
              fileSize: session.payment.receiptFileSize || null,
            }
            break
          }
        }

        setExistingPackage({
          id: data.id,
          name: data.name,
          patientId: data.patientId,
          patient: data.patient,
          totalSessions: data.totalSessions,
          pricePerSession: Number(data.pricePerSession),
          remainingSlots: data.stats?.remainingSlots || 0,
          existingReceipt,
        })
        setSelectedPatient(data.patientId)
      } else {
        setError("Pacote não encontrado")
      }
    } catch {
      setError("Erro ao carregar pacote")
    } finally {
      setLoading(false)
    }
  }

  async function fetchPatients() {
    try {
      const response = await fetch("/api/patients?status=ACTIVE")
      if (response.ok) {
        const data = await response.json()
        setPatients(data)
      }
    } catch {
      // Silently fail
    } finally {
      setLoading(false)
    }
  }

  // Gerar datas recorrentes baseado no primeiro slot
  const generatedDates = useMemo(() => {
    if (!isRecurring) return []
    const firstSlot = sessionSlots[0]
    if (!firstSlot?.date || !firstSlot?.time) return []

    const startDateTime = new Date(`${firstSlot.date}T${firstSlot.time}`)
    if (isNaN(startDateTime.getTime())) return []

    return generateRecurrenceDates({
      startDate: startDateTime,
      pattern: recurrencePattern,
      occurrences: recurrenceCount,
    })
  }, [isRecurring, sessionSlots, recurrencePattern, recurrenceCount])

  // Verificar conflitos quando as datas mudam
  const checkConflicts = useCallback(async (dates: Date[], duration: number) => {
    if (dates.length === 0) {
      setRecurrenceConflicts([])
      return
    }

    setIsCheckingConflicts(true)
    try {
      const response = await fetch("/api/sessions/check-conflicts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          dates: dates.map((d) => d.toISOString()),
          duration,
        }),
      })

      if (response.ok) {
        const data = await response.json()
        setRecurrenceConflicts(data.conflicts || [])
      }
    } catch {
      // Silently fail
    } finally {
      setIsCheckingConflicts(false)
    }
  }, [])

  // Effect para verificar conflitos quando datas mudam
  useEffect(() => {
    if (generatedDates.length > 0) {
      const duration = sessionSlots[0]?.duration || 50
      checkConflicts(generatedDates, duration)
    } else {
      setRecurrenceConflicts([])
    }
  }, [generatedDates, sessionSlots, checkConflicts])

  // Resetar recorrência quando desabilita
  useEffect(() => {
    if (!isRecurring) {
      setRecurrenceConflicts([])
    }
  }, [isRecurring])

  function addSessionSlot() {
    const newId = Date.now().toString()
    setSessionSlots([...sessionSlots, { id: newId, date: "", time: "", duration: 50 }])
  }

  function removeSessionSlot(id: string) {
    if (sessionSlots.length > 1) {
      setSessionSlots(sessionSlots.filter((s) => s.id !== id))
    }
  }

  function updateSessionSlot(id: string, field: keyof SessionSlot, value: string | number) {
    setSessionSlots(
      sessionSlots.map((s) => (s.id === id ? { ...s, [field]: value } : s))
    )
  }

  // Calcular preço por sessão para pacotes
  const calculatedPricePerSession =
    type === "PACKAGE" && parseInt(totalSessions) > 0 && parseCurrency(packagePrice) > 0
      ? parseCurrency(packagePrice) / parseInt(totalSessions)
      : 0

  // Validar sessões preenchidas
  const filledSessions = sessionSlots.filter((s) => s.date && s.time)

  // Validação considera recorrência
  const hasRecurrenceConflicts = isRecurring && recurrenceConflicts.length > 0
  const effectiveSessionsCount = isRecurring ? generatedDates.length : filledSessions.length

  // Validation differs based on mode
  const isValid = isAddToPackageMode
    ? !!(existingPackage && filledSessions.length > 0 && filledSessions.length <= existingPackage.remainingSlots && !hasRecurrenceConflicts)
    : !!(selectedPatient &&
      effectiveSessionsCount > 0 &&
      !hasRecurrenceConflicts &&
      ((type === "SESSION" && parseCurrency(sessionPrice) >= 0) ||
        (type === "PACKAGE" && parseInt(totalSessions) > 0 && parseCurrency(packagePrice) >= 0)))

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!isValid) return

    setSaving(true)
    setError(null)

    try {
      // Preparar sessões - usar recorrência se habilitada
      let sessions
      if (isRecurring && generatedDates.length > 0) {
        const firstSlot = sessionSlots[0]
        sessions = generatedDates.map((date, index) => ({
          dateTime: date.toISOString(),
          duration: firstSlot?.duration || 50,
          recurrenceIndex: index + 1,
        }))
      } else {
        sessions = filledSessions.map((slot) => ({
          dateTime: new Date(`${slot.date}T${slot.time}`).toISOString(),
          duration: slot.duration,
        }))
      }

      if (isAddToPackageMode && existingPackage) {
        // Mode: Add sessions to existing package
        const response = await fetch(`/api/packages/${existingPackage.id}/sessions`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            sessions,
            // Pass receipt info to copy to new payments if package was paid
            ...(existingPackage.existingReceipt ? {
              copyReceipt: true,
              receiptUrl: existingPackage.existingReceipt.url,
              receiptFileName: existingPackage.existingReceipt.fileName,
              receiptFileType: existingPackage.existingReceipt.fileType,
              receiptFileSize: existingPackage.existingReceipt.fileSize,
            } : {}),
          }),
        })

        if (!response.ok) {
          const data = await response.json()
          throw new Error(data.error || "Erro ao adicionar sessões")
        }

        setSuccess(true)
        navigationTimeoutRef.current = setTimeout(() => {
          router.push(`/pacientes/${existingPackage.patientId}`)
        }, 2000)
      } else {
        // Mode: Create new package
        const payload = {
          patientId: selectedPatient,
          type,
          ...(type === "SESSION"
            ? { sessionPrice: parseCurrency(sessionPrice) }
            : {
                totalSessions: parseInt(totalSessions),
                packagePrice: parseCurrency(packagePrice),
              }),
          sessions,
          packageName: packageName || undefined,
          notes: notes || undefined,
          isPaid,
          ...(isPaid ? {
            paymentMethod: paymentMethod || undefined,
            ...(receipt ? {
              receiptUrl: receipt.url,
              receiptFileName: receipt.fileName,
              receiptFileType: receipt.fileType,
              receiptFileSize: receipt.fileSize,
            } : {}),
          } : {}),
          // Recurrence data
          ...(isRecurring ? {
            isRecurring: true,
            recurrencePattern,
            recurrenceCount,
            recurrenceGroupId: generateRecurrenceGroupId(),
          } : {}),
        }

        const response = await fetch("/api/packages", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        })

        if (!response.ok) {
          const data = await response.json()
          throw new Error(data.error || "Erro ao criar atendimento")
        }

        setSuccess(true)
        navigationTimeoutRef.current = setTimeout(() => {
          router.push("/agenda")
        }, 2000)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao criar atendimento")
    } finally {
      setSaving(false)
    }
  }

  return {
    // State
    patients,
    loading,
    saving,
    error,
    success,
    existingPackage,
    isAddToPackageMode,
    // Form state
    selectedPatient,
    setSelectedPatient,
    type,
    setType,
    sessionPrice,
    setSessionPrice,
    totalSessions,
    setTotalSessions,
    packagePrice,
    setPackagePrice,
    packageName,
    setPackageName,
    notes,
    setNotes,
    isPaid,
    setIsPaid,
    paymentMethod,
    setPaymentMethod,
    receipt,
    setReceipt,
    sessionSlots,
    // Recurrence state
    isRecurring,
    setIsRecurring,
    recurrencePattern,
    setRecurrencePattern,
    recurrenceCount,
    setRecurrenceCount,
    recurrenceConflicts,
    isCheckingConflicts,
    generatedDates,
    // Computed
    calculatedPricePerSession,
    filledSessions,
    isValid,
    // Actions
    addSessionSlot,
    removeSessionSlot,
    updateSessionSlot,
    handleSubmit,
  }
}
