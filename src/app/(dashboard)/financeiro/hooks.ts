"use client"

import { useState, useCallback, useEffect } from "react"
import { toast } from "sonner"
import type {
  Payment,
  Patient,
  Summary,
  UnbilledData,
  UnbilledItem,
  PaymentFilters,
} from "./types"

/**
 * Hook para gerenciar pagamentos e filtros
 */
export function usePayments(filters: PaymentFilters) {
  const [payments, setPayments] = useState<Payment[]>([])
  const [summary, setSummary] = useState<Summary>({
    totalBilled: 0,
    totalPaid: 0,
    totalPending: 0,
    countPaid: 0,
    countPending: 0,
    countCancelled: 0,
  })
  const [loading, setLoading] = useState(true)
  const [availableYears, setAvailableYears] = useState<number[]>([2025, 2026])

  const fetchPayments = useCallback(async () => {
    try {
      const params = new URLSearchParams()
      if (filters.selectedMonth !== "all") {
        params.set("month", filters.selectedMonth)
      }
      if (filters.selectedYear !== "all") {
        params.set("year", filters.selectedYear)
      }
      if (filters.selectedStatus !== "all" && filters.selectedStatus !== "NAO_FATURADO") {
        params.set("status", filters.selectedStatus)
      }
      if (filters.selectedPatient !== "all") {
        params.set("patientId", filters.selectedPatient)
      }

      const response = await fetch(`/api/payments?${params}`)
      if (response.ok) {
        const data = await response.json()
        setPayments(data.payments)
        setSummary(data.summary)
        if (data.availableYears && data.availableYears.length > 0) {
          setAvailableYears(data.availableYears)
        }
      }
    } catch {
      toast.error("Erro ao carregar pagamentos")
    } finally {
      setLoading(false)
    }
  }, [filters])

  useEffect(() => {
    fetchPayments()
  }, [fetchPayments])

  return {
    payments,
    summary,
    loading,
    availableYears,
    refetch: fetchPayments,
  }
}

/**
 * Hook para gerenciar lista de pacientes
 */
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

/**
 * Hook para gerenciar dados não faturados (pacotes)
 */
export function useUnbilledData() {
  const [unbilledData, setUnbilledData] = useState<UnbilledData>({
    totalUnbilled: 0,
    packagesCount: 0,
    sessionsRemaining: 0,
  })
  const [unbilledItems, setUnbilledItems] = useState<UnbilledItem[]>([])

  const fetchUnbilledData = useCallback(async () => {
    try {
      const response = await fetch("/api/packages?status=ACTIVE")
      if (response.ok) {
        const packages = await response.json()
        let totalUnbilled = 0
        let sessionsRemaining = 0
        let packagesCount = 0
        const items: UnbilledItem[] = []

        for (const pkg of packages) {
          const remaining = pkg.stats?.remainingSlots || 0
          if (remaining > 0) {
            const pricePerSession = Number(pkg.pricePerSession || 0)
            const totalRemaining = remaining * pricePerSession
            totalUnbilled += totalRemaining
            sessionsRemaining += remaining
            packagesCount++

            items.push({
              id: pkg.id,
              patientId: pkg.patient?.id || "",
              patientName: pkg.patient?.name || "Paciente",
              packageName: pkg.name || "Pacote",
              remainingSessions: remaining,
              pricePerSession,
              totalRemaining,
            })
          }
        }

        setUnbilledData({
          totalUnbilled,
          packagesCount,
          sessionsRemaining,
        })
        setUnbilledItems(items)
      }
    } catch {
      toast.error("Erro ao carregar dados não faturados")
    }
  }, [])

  useEffect(() => {
    fetchUnbilledData()
  }, [fetchUnbilledData])

  return { unbilledData, unbilledItems, refetch: fetchUnbilledData }
}

/**
 * Hook para ações de pagamento
 */
export function usePaymentActions(onSuccess: () => void) {
  const markAsPaid = useCallback(async (paymentId: string) => {
    try {
      await fetch(`/api/payments/${paymentId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "PAID" }),
      })
      onSuccess()
      toast.success("Pagamento marcado como pago")
    } catch {
      toast.error("Erro ao atualizar pagamento")
    }
  }, [onSuccess])

  const cancelPayment = useCallback(async (paymentId: string) => {
    try {
      await fetch(`/api/payments/${paymentId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "CANCELLED" }),
      })
      onSuccess()
      toast.success("Cobrança cancelada")
    } catch {
      toast.error("Erro ao cancelar cobrança")
    }
  }, [onSuccess])

  return { markAsPaid, cancelPayment }
}
