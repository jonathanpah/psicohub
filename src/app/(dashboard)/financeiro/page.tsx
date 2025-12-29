"use client"

import { useState, useCallback } from "react"
import { toast } from "sonner"
import { parseCurrency } from "@/components/ui/masked-input"
import { ReceiptViewer, useReceiptViewer } from "@/components/receipt-viewer"
import {
  SummaryCards,
  PaymentFilters,
  PaymentsTable,
  UnbilledTable,
  PaymentModal,
  formatAmountForForm,
} from "./components"
import {
  usePayments,
  usePatients,
  useUnbilledData,
  usePaymentActions,
} from "./hooks"
import { generateReceipt } from "./receipt-generator"
import type { Payment, PaymentFormData } from "./types"

export default function FinanceiroPage() {
  // Filtros
  const [selectedMonth, setSelectedMonth] = useState("all")
  const [selectedYear, setSelectedYear] = useState("all")
  const [selectedStatus, setSelectedStatus] = useState("all")
  const [selectedPatient, setSelectedPatient] = useState("all")

  // Modal
  const [modalOpen, setModalOpen] = useState(false)
  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null)
  const [formData, setFormData] = useState<PaymentFormData>({
    status: "PENDING",
    method: "",
    amount: "",
    notes: "",
  })

  // Receipt viewer
  const { viewerOpen, viewingReceipt, openViewer, closeViewer } = useReceiptViewer()

  // Hooks de dados
  const filters = {
    selectedMonth,
    selectedYear,
    selectedStatus,
    selectedPatient,
  }
  const { payments, summary, loading, availableYears, refetch } = usePayments(filters)
  const { patients } = usePatients()
  const { unbilledData, unbilledItems, refetch: refetchUnbilled } = useUnbilledData()

  // Ações
  const { markAsPaid, cancelPayment } = usePaymentActions(refetch)

  const openPaymentModal = useCallback((payment: Payment) => {
    setSelectedPayment(payment)
    setFormData({
      status: payment.status,
      method: payment.method || "",
      amount: formatAmountForForm(payment.amount),
      notes: payment.notes || "",
    })
    setModalOpen(true)
  }, [])

  const handleSubmit = useCallback(async () => {
    if (!selectedPayment) return

    try {
      const response = await fetch(`/api/payments/${selectedPayment.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: formData.status,
          method: formData.method || null,
          amount: parseCurrency(formData.amount),
          notes: formData.notes || null,
        }),
      })

      if (response.ok) {
        setModalOpen(false)
        refetch()
        toast.success("Pagamento atualizado")
      }
    } catch {
      toast.error("Erro ao salvar pagamento")
    }
  }, [selectedPayment, formData, refetch])

  const handleMarkAsPaid = useCallback(
    (payment: Payment) => {
      markAsPaid(payment.id)
    },
    [markAsPaid]
  )

  const handleCancelPayment = useCallback(
    (payment: Payment) => {
      cancelPayment(payment.id)
    },
    [cancelPayment]
  )

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-xl font-medium text-gray-900 tracking-tight">
          Financeiro
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          Controle de pagamentos e faturamento
        </p>
      </div>

      <SummaryCards
        summary={summary}
        unbilledData={unbilledData}
        selectedMonth={selectedMonth}
        selectedYear={selectedYear}
      />

      <PaymentFilters
        selectedMonth={selectedMonth}
        selectedYear={selectedYear}
        selectedStatus={selectedStatus}
        selectedPatient={selectedPatient}
        availableYears={availableYears}
        patients={patients}
        onMonthChange={setSelectedMonth}
        onYearChange={setSelectedYear}
        onStatusChange={setSelectedStatus}
        onPatientChange={setSelectedPatient}
      />

      {selectedStatus !== "NAO_FATURADO" && (
        <PaymentsTable
          payments={payments}
          loading={loading}
          onEditPayment={openPaymentModal}
          onMarkAsPaid={handleMarkAsPaid}
          onCancelPayment={handleCancelPayment}
          onGenerateReceipt={generateReceipt}
          onViewReceipt={openViewer}
        />
      )}

      {(selectedStatus === "all" || selectedStatus === "NAO_FATURADO") && (
        <UnbilledTable
          items={unbilledItems}
          onRefresh={() => {
            refetch()
            refetchUnbilled()
          }}
        />
      )}

      <PaymentModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        payment={selectedPayment}
        formData={formData}
        onFormChange={setFormData}
        onSubmit={handleSubmit}
        onViewReceipt={openViewer}
        onRefresh={refetch}
      />

      <ReceiptViewer
        receipt={viewingReceipt}
        open={viewerOpen}
        onClose={closeViewer}
      />
    </div>
  )
}
