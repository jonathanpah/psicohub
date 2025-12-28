"use client"

import { useEffect, useState, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { MaskedInput, parseCurrency } from "@/components/ui/masked-input"
import {
  DollarSign,
  TrendingUp,
  AlertCircle,
  CheckCircle,
  MoreHorizontal,
  FileText,
  X,
  Upload,
  Eye,
  Download,
  Trash2,
  Loader2,
  Package,
} from "lucide-react"
import { jsPDF } from "jspdf"
import { ReceiptViewer, useReceiptViewer } from "@/components/receipt-viewer"

interface Patient {
  id: string
  name: string
  phone: string | null
  email: string | null
}

interface Session {
  id: string
  dateTime: string
  duration: number
  patient: Patient
}

interface Payment {
  id: string
  sessionId: string
  session: Session
  amount: string
  status: "PENDING" | "PAID" | "CANCELLED"
  method: string | null
  paidAt: string | null
  notes: string | null
  receiptUrl: string | null
  receiptFileName: string | null
  receiptFileType: string | null
  receiptFileSize: number | null
  createdAt: string
}

interface Summary {
  totalBilled: number
  totalPaid: number
  totalPending: number
  countPaid: number
  countPending: number
  countCancelled: number
}

interface UnbilledData {
  totalUnbilled: number
  packagesCount: number
  sessionsRemaining: number
}

interface UnbilledItem {
  id: string
  patientId: string
  patientName: string
  packageName: string
  remainingSessions: number
  pricePerSession: number
  totalRemaining: number
}

const statusColors: Record<string, { bg: string; text: string }> = {
  PENDING: { bg: "#F5C242", text: "#1f2937" },
  PAID: { bg: "#3E552A", text: "#ffffff" },
  CANCELLED: { bg: "#B02418", text: "#ffffff" },
  NAO_FATURADO: { bg: "#3b82f6", text: "#ffffff" },
}

const statusLabels: Record<string, string> = {
  PENDING: "Pendente",
  PAID: "Pago",
  CANCELLED: "Cancelado",
  NAO_FATURADO: "Não Faturado",
}

const paymentMethods = [
  { value: "PIX", label: "PIX" },
  { value: "DINHEIRO", label: "Dinheiro" },
  { value: "CARTAO_CREDITO", label: "Cartão de Crédito" },
  { value: "CARTAO_DEBITO", label: "Cartão de Débito" },
  { value: "TRANSFERENCIA", label: "Transferência Bancária" },
]

const methodLabels: Record<string, string> = {
  PIX: "PIX",
  DINHEIRO: "Dinheiro",
  CARTAO_CREDITO: "Cartão de Crédito",
  CARTAO_DEBITO: "Cartão de Débito",
  TRANSFERENCIA: "Transferência",
}

function formatCurrency(value: number | string): string {
  const num = typeof value === "string" ? parseFloat(value) : value
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(num)
}

function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString("pt-BR")
}

function formatTime(dateString: string): string {
  return new Date(dateString).toLocaleTimeString("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
  })
}

export default function FinanceiroPage() {
  const [payments, setPayments] = useState<Payment[]>([])
  const [patients, setPatients] = useState<Patient[]>([])
  const [summary, setSummary] = useState<Summary>({
    totalBilled: 0,
    totalPaid: 0,
    totalPending: 0,
    countPaid: 0,
    countPending: 0,
    countCancelled: 0,
  })
  const [loading, setLoading] = useState(true)
  const [unbilledData, setUnbilledData] = useState<UnbilledData>({
    totalUnbilled: 0,
    packagesCount: 0,
    sessionsRemaining: 0,
  })
  const [unbilledItems, setUnbilledItems] = useState<UnbilledItem[]>([])

  // Filtros
  const [selectedMonth, setSelectedMonth] = useState<string>("all")
  const [selectedYear, setSelectedYear] = useState<string>("all")
  const [selectedStatus, setSelectedStatus] = useState<string>("all")
  const [selectedPatient, setSelectedPatient] = useState<string>("all")
  const [availableYears, setAvailableYears] = useState<number[]>([2025, 2026])

  // Modal
  const [modalOpen, setModalOpen] = useState(false)
  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null)
  const [saving, setSaving] = useState(false)
  const [uploadingReceipt, setUploadingReceipt] = useState(false)
  const [deletingReceipt, setDeletingReceipt] = useState(false)
  const [formData, setFormData] = useState({
    status: "PENDING",
    method: "",
    amount: "",
    notes: "",
  })

  // Receipt viewer
  const { viewerOpen, viewingReceipt, openViewer, closeViewer } = useReceiptViewer()

  const fetchPayments = useCallback(async () => {
    try {
      const params = new URLSearchParams()
      if (selectedMonth !== "all") {
        params.set("month", selectedMonth)
      }
      if (selectedYear !== "all") {
        params.set("year", selectedYear)
      }
      if (selectedStatus !== "all") {
        params.set("status", selectedStatus)
      }
      if (selectedPatient !== "all") {
        params.set("patientId", selectedPatient)
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
    } catch (error) {
      console.error("Erro ao carregar pagamentos:", error)
    } finally {
      setLoading(false)
    }
  }, [selectedMonth, selectedYear, selectedStatus, selectedPatient])

  const fetchPatients = useCallback(async () => {
    try {
      const response = await fetch("/api/patients?status=ACTIVE")
      if (response.ok) {
        const data = await response.json()
        setPatients(data)
      }
    } catch (error) {
      console.error("Erro ao carregar pacientes:", error)
    }
  }, [])

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
          // A API retorna stats.remainingSlots com as sessões ainda não agendadas
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
    } catch (error) {
      console.error("Erro ao carregar dados não faturados:", error)
    }
  }, [])

  useEffect(() => {
    fetchPatients()
    fetchUnbilledData()
  }, [fetchPatients, fetchUnbilledData])

  useEffect(() => {
    fetchPayments()
  }, [fetchPayments])

  const openPaymentModal = (payment: Payment) => {
    setSelectedPayment(payment)
    // Formata o valor como moeda brasileira para o input
    const amountNum = parseFloat(payment.amount)
    const formattedAmount = amountNum > 0
      ? `R$ ${amountNum.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
      : ""
    setFormData({
      status: payment.status,
      method: payment.method || "",
      amount: formattedAmount,
      notes: payment.notes || "",
    })
    setModalOpen(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedPayment) return

    setSaving(true)
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
        fetchPayments()
      }
    } catch (error) {
      console.error("Erro ao atualizar pagamento:", error)
    } finally {
      setSaving(false)
    }
  }

  const handleReceiptUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!selectedPayment || !e.target.files || e.target.files.length === 0) return

    const file = e.target.files[0]

    // Validar tipo de arquivo
    const allowedTypes = ["application/pdf", "image/jpeg", "image/png", "image/webp"]
    if (!allowedTypes.includes(file.type)) {
      alert("Tipo de arquivo não permitido. Use PDF, JPG, PNG ou WEBP.")
      return
    }

    // Validar tamanho (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      alert("O arquivo deve ter no máximo 10MB")
      return
    }

    setUploadingReceipt(true)
    try {
      // Fazer upload do documento para o paciente com categoria PAYMENT_RECEIPT
      const patientId = selectedPayment.session.patient.id
      const formData = new FormData()
      formData.append("file", file)
      formData.append("name", `Recibo - ${formatDate(selectedPayment.session.dateTime)}`)
      formData.append("category", "PAYMENT_RECEIPT")
      formData.append("sessionId", selectedPayment.session.id)

      const uploadResponse = await fetch(`/api/patients/${patientId}/documents`, {
        method: "POST",
        body: formData,
      })

      if (!uploadResponse.ok) {
        const error = await uploadResponse.json()
        alert(error.error || "Erro ao fazer upload")
        return
      }

      const document = await uploadResponse.json()

      // Vincular recibo ao pagamento
      const updateResponse = await fetch(`/api/payments/${selectedPayment.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          receiptUrl: document.fileUrl,
        }),
      })

      if (updateResponse.ok) {
        // Atualizar o payment selecionado localmente
        setSelectedPayment({ ...selectedPayment, receiptUrl: document.fileUrl })
        fetchPayments()
      }
    } catch (error) {
      console.error("Erro ao fazer upload do recibo:", error)
      alert("Erro ao fazer upload do recibo")
    } finally {
      setUploadingReceipt(false)
    }
  }

  const handleRemoveReceipt = async () => {
    if (!selectedPayment) return

    setDeletingReceipt(true)
    try {
      const response = await fetch(`/api/payments/${selectedPayment.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          receiptUrl: null,
        }),
      })

      if (response.ok) {
        setSelectedPayment({ ...selectedPayment, receiptUrl: null })
        fetchPayments()
      }
    } catch (error) {
      console.error("Erro ao remover recibo:", error)
    } finally {
      setDeletingReceipt(false)
    }
  }

  const markAsPaid = async (payment: Payment) => {
    try {
      await fetch(`/api/payments/${payment.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: "PAID",
        }),
      })
      fetchPayments()
    } catch (error) {
      console.error("Erro ao marcar como pago:", error)
    }
  }

  const cancelPayment = async (payment: Payment) => {
    try {
      await fetch(`/api/payments/${payment.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: "CANCELLED",
        }),
      })
      fetchPayments()
    } catch (error) {
      console.error("Erro ao cancelar pagamento:", error)
    }
  }

  const generateReceipt = async (payment: Payment) => {
    try {
      const response = await fetch(`/api/payments/${payment.id}/receipt`)
      if (!response.ok) {
        const error = await response.json()
        alert(error.error || "Erro ao gerar recibo")
        return
      }

      const data = await response.json()

      // Gerar PDF com jsPDF
      const doc = new jsPDF()

      // Configurações
      const pageWidth = doc.internal.pageSize.getWidth()
      const margin = 20
      let y = 20

      // Título
      doc.setFontSize(18)
      doc.setFont("helvetica", "bold")
      doc.text("RECIBO DE PAGAMENTO", pageWidth / 2, y, { align: "center" })
      y += 10

      doc.setFontSize(10)
      doc.setFont("helvetica", "normal")
      doc.text(`N° ${data.receiptNumber}`, pageWidth / 2, y, { align: "center" })
      y += 15

      // Linha divisória
      doc.setLineWidth(0.5)
      doc.line(margin, y, pageWidth - margin, y)
      y += 10

      // Dados do Profissional
      doc.setFontSize(11)
      doc.setFont("helvetica", "bold")
      doc.text("DADOS DO PROFISSIONAL", margin, y)
      y += 7

      doc.setFontSize(10)
      doc.setFont("helvetica", "normal")

      // Nome do profissional (respeitando configuração)
      if (data.settings?.showName !== false && data.psychologist.name) {
        doc.text(`Nome: ${data.psychologist.name}`, margin, y)
        y += 5
      }
      // CRP (respeitando configuração)
      if (data.settings?.showCrp !== false && data.psychologist.crp) {
        doc.text(`CRP: ${data.psychologist.crp}`, margin, y)
        y += 5
      }
      // CPF do profissional (respeitando configuração)
      if (data.settings?.showCpf && data.psychologist.cpf) {
        doc.text(`CPF: ${data.psychologist.cpf}`, margin, y)
        y += 5
      }
      // Nome da clínica (respeitando configuração)
      if (data.settings?.showClinicName !== false && data.psychologist.clinicName) {
        doc.text(`Clínica: ${data.psychologist.clinicName}`, margin, y)
        y += 5
      }
      // CNPJ da clínica (respeitando configuração)
      if (data.settings?.showClinicCnpj !== false && data.psychologist.clinicCnpj) {
        doc.text(`CNPJ: ${data.psychologist.clinicCnpj}`, margin, y)
        y += 5
      }
      // Endereço da clínica (respeitando configuração)
      if (data.settings?.showClinicAddress !== false && data.psychologist.clinicAddress) {
        doc.text(`Endereço: ${data.psychologist.clinicAddress}`, margin, y)
        y += 5
      }
      // Telefone da clínica ou pessoal (respeitando configurações)
      if (data.settings?.showClinicPhone && data.psychologist.clinicPhone) {
        doc.text(`Telefone: ${data.psychologist.clinicPhone}`, margin, y)
        y += 5
      } else if (data.settings?.showPhone && data.psychologist.phone) {
        doc.text(`Telefone: ${data.psychologist.phone}`, margin, y)
        y += 5
      }
      y += 5

      // Dados do Paciente
      doc.setFontSize(11)
      doc.setFont("helvetica", "bold")
      doc.text("DADOS DO PACIENTE", margin, y)
      y += 7

      doc.setFontSize(10)
      doc.setFont("helvetica", "normal")
      doc.text(`Nome: ${data.patient.name}`, margin, y)
      y += 5
      if (data.patient.cpf) {
        doc.text(`CPF: ${data.patient.cpf}`, margin, y)
        y += 5
      }
      y += 5

      // Dados do Serviço
      doc.setFontSize(11)
      doc.setFont("helvetica", "bold")
      doc.text("SERVIÇO PRESTADO", margin, y)
      y += 7

      doc.setFontSize(10)
      doc.setFont("helvetica", "normal")
      doc.text("Descrição: Sessão de atendimento psicológico", margin, y)
      y += 5
      doc.text(`Data: ${data.session.date}`, margin, y)
      y += 5
      doc.text(`Horário: ${data.session.time}`, margin, y)
      y += 5
      doc.text(`Duração: ${data.session.duration} minutos`, margin, y)
      y += 10

      // Dados do Pagamento
      doc.setFontSize(11)
      doc.setFont("helvetica", "bold")
      doc.text("PAGAMENTO", margin, y)
      y += 7

      doc.setFontSize(10)
      doc.setFont("helvetica", "normal")
      doc.text(`Valor: ${data.payment.amount}`, margin, y)
      y += 5
      doc.text(`(${data.payment.amountExtended})`, margin, y)
      y += 5
      doc.text(`Forma de pagamento: ${data.payment.method}`, margin, y)
      y += 5
      doc.text(`Data do pagamento: ${data.payment.paidAt}`, margin, y)
      y += 15

      // Linha divisória
      doc.line(margin, y, pageWidth - margin, y)
      y += 10

      // Assinatura
      if (data.settings?.showClinicAddress !== false && data.psychologist.clinicAddress) {
        doc.text(`${data.psychologist.clinicAddress}`, pageWidth / 2, y, { align: "center" })
        y += 5
      }
      doc.text(`${data.issueDate}`, pageWidth / 2, y, { align: "center" })
      y += 15

      doc.line(pageWidth / 2 - 40, y, pageWidth / 2 + 40, y)
      y += 5
      if (data.settings?.showName !== false && data.psychologist.name) {
        doc.text(data.psychologist.name, pageWidth / 2, y, { align: "center" })
        y += 5
      }
      if (data.settings?.showCrp !== false && data.psychologist.crp) {
        doc.text(`CRP: ${data.psychologist.crp}`, pageWidth / 2, y, { align: "center" })
      }
      y += 15

      // Rodapé
      doc.setFontSize(8)
      doc.setTextColor(128)
      doc.text("Documento válido como comprovante de pagamento", pageWidth / 2, y, { align: "center" })

      // Salvar
      doc.save(`recibo-${data.receiptNumber}.pdf`)
    } catch (error) {
      console.error("Erro ao gerar recibo:", error)
      alert("Erro ao gerar recibo")
    }
  }

  const months = [
    { value: "1", label: "Janeiro" },
    { value: "2", label: "Fevereiro" },
    { value: "3", label: "Março" },
    { value: "4", label: "Abril" },
    { value: "5", label: "Maio" },
    { value: "6", label: "Junho" },
    { value: "7", label: "Julho" },
    { value: "8", label: "Agosto" },
    { value: "9", label: "Setembro" },
    { value: "10", label: "Outubro" },
    { value: "11", label: "Novembro" },
    { value: "12", label: "Dezembro" },
  ]

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-xl font-medium text-gray-900 tracking-tight">Financeiro</h1>
        <p className="text-sm text-gray-500 mt-1">Controle de pagamentos e faturamento</p>
      </div>

      {/* Cards de resumo */}
      <div className="grid gap-4 md:grid-cols-5">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-normal text-gray-500">
              Total Faturado
            </CardTitle>
            <DollarSign className="h-4 w-4 text-gray-300" strokeWidth={1.5} />
          </CardHeader>
          <CardContent>
            <div className="text-xl font-medium text-gray-900">
              {formatCurrency(summary.totalBilled)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-normal text-gray-500">
              Recebido
            </CardTitle>
            <CheckCircle className="h-4 w-4 text-gray-300" strokeWidth={1.5} />
          </CardHeader>
          <CardContent>
            <div className="text-xl font-medium text-gray-900">
              {formatCurrency(summary.totalPaid)}
            </div>
            <p className="text-xs text-gray-400 mt-1">
              {summary.countPaid} pagamentos
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-normal text-gray-500">
              Pendente
            </CardTitle>
            <AlertCircle className="h-4 w-4 text-gray-300" strokeWidth={1.5} />
          </CardHeader>
          <CardContent>
            <div className="text-xl font-medium text-gray-900">
              {formatCurrency(summary.totalPending)}
            </div>
            <p className="text-xs text-gray-400 mt-1">
              {summary.countPending} pagamentos
            </p>
          </CardContent>
        </Card>

        <Card className={unbilledData.totalUnbilled > 0 ? "border-blue-200 bg-blue-50/50" : ""}>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-normal text-gray-500">
              Não Faturado
            </CardTitle>
            <Package className="h-4 w-4 text-gray-300" strokeWidth={1.5} />
          </CardHeader>
          <CardContent>
            <div className={`text-xl font-medium ${unbilledData.totalUnbilled > 0 ? "text-blue-700" : "text-gray-900"}`}>
              {formatCurrency(unbilledData.totalUnbilled)}
            </div>
            {unbilledData.sessionsRemaining > 0 && (
              <p className="text-xs text-blue-600 mt-1">
                {unbilledData.sessionsRemaining} sessões em {unbilledData.packagesCount} pacote{unbilledData.packagesCount > 1 ? "s" : ""}
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-normal text-gray-500">
              {selectedMonth === "all" && selectedYear === "all"
                ? "Total de Sessões"
                : selectedMonth === "all"
                ? `Sessões de ${selectedYear}`
                : selectedYear === "all"
                ? `Sessões de ${months.find(m => m.value === selectedMonth)?.label}`
                : `Sessões do Período`}
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-gray-300" strokeWidth={1.5} />
          </CardHeader>
          <CardContent>
            <div className="text-xl font-medium text-gray-900">
              {summary.countPaid + summary.countPending + summary.countCancelled}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filtros */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-wrap gap-6">
            <div className="space-y-1.5">
              <Label className="text-xs text-gray-500">Mês</Label>
              <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                <SelectTrigger className="w-[130px]">
                  <SelectValue placeholder="Mês" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  {months.map((month) => (
                    <SelectItem key={month.value} value={month.value}>
                      {month.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs text-gray-500">Ano</Label>
              <Select value={selectedYear} onValueChange={setSelectedYear}>
                <SelectTrigger className="w-[100px]">
                  <SelectValue placeholder="Ano" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  {availableYears.map((year) => (
                    <SelectItem key={year} value={year.toString()}>
                      {year}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs text-gray-500">Status</Label>
              <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="PENDING">Pendente</SelectItem>
                  <SelectItem value="PAID">Pago</SelectItem>
                  <SelectItem value="CANCELLED">Cancelado</SelectItem>
                  <SelectItem value="NAO_FATURADO">Não Faturado</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs text-gray-500">Paciente</Label>
              <Select value={selectedPatient} onValueChange={setSelectedPatient}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Paciente" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  {patients.map((patient) => (
                    <SelectItem key={patient.id} value={patient.id}>
                      {patient.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabela de pagamentos */}
      {(selectedStatus !== "NAO_FATURADO") && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Pagamentos</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <p className="text-gray-400 text-sm">Carregando...</p>
              </div>
            ) : payments.length === 0 ? (
            <div className="flex items-center justify-center py-8">
              <p className="text-gray-400 text-sm">Nenhum pagamento encontrado</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-100">
                    <th className="text-left py-3 px-4 text-xs font-medium text-gray-500">
                      Data
                    </th>
                    <th className="text-left py-3 px-4 text-xs font-medium text-gray-500">
                      Paciente
                    </th>
                    <th className="text-left py-3 px-4 text-xs font-medium text-gray-500">
                      Horário
                    </th>
                    <th className="text-left py-3 px-4 text-xs font-medium text-gray-500">
                      Valor
                    </th>
                    <th className="text-left py-3 px-4 text-xs font-medium text-gray-500">
                      Método
                    </th>
                    <th className="text-left py-3 px-4 text-xs font-medium text-gray-500">
                      Status
                    </th>
                    <th className="text-center py-3 px-4 text-xs font-medium text-gray-500">
                      Recibo
                    </th>
                    <th className="text-right py-3 px-4 text-xs font-medium text-gray-500">
                      Ações
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {payments.map((payment) => (
                    <tr
                      key={payment.id}
                      className="border-b border-gray-50 hover:bg-gray-50/50"
                    >
                      <td className="py-3 px-4 text-sm text-gray-900">
                        {formatDate(payment.session.dateTime)}
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-900">
                        {payment.session.patient.name}
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-500">
                        {formatTime(payment.session.dateTime)}
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-900 font-medium">
                        {formatCurrency(payment.amount)}
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-500">
                        {payment.method ? methodLabels[payment.method] || payment.method : "-"}
                      </td>
                      <td className="py-3 px-4">
                        <Badge
                          style={{
                            backgroundColor: statusColors[payment.status].bg,
                            color: statusColors[payment.status].text,
                          }}
                        >
                          {statusLabels[payment.status]}
                        </Badge>
                      </td>
                      <td className="py-3 px-4 text-center">
                        {payment.receiptUrl ? (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openViewer({
                              paymentId: payment.id,
                              fileName: payment.receiptFileName,
                              fileType: payment.receiptFileType,
                              fileSize: payment.receiptFileSize,
                            })}
                            title="Ver recibo"
                          >
                            <FileText className="h-4 w-4 text-green-600" />
                          </Button>
                        ) : (
                          <span className="text-gray-300">-</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            {payment.status === "PENDING" && (
                              <DropdownMenuItem onClick={() => markAsPaid(payment)}>
                                <CheckCircle className="h-4 w-4 mr-2" />
                                Marcar como pago
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuItem onClick={() => openPaymentModal(payment)}>
                              <DollarSign className="h-4 w-4 mr-2" />
                              Editar pagamento
                            </DropdownMenuItem>
                            {payment.status === "PAID" && (
                              <DropdownMenuItem onClick={() => generateReceipt(payment)}>
                                <FileText className="h-4 w-4 mr-2" />
                                Gerar recibo para paciente
                              </DropdownMenuItem>
                            )}
                            {payment.receiptUrl && (
                              <>
                                <DropdownMenuItem onClick={() => openViewer({
                                  paymentId: payment.id,
                                  fileName: payment.receiptFileName,
                                  fileType: payment.receiptFileType,
                                  fileSize: payment.receiptFileSize,
                                })}>
                                  <Eye className="h-4 w-4 mr-2" />
                                  Ver recibo anexado
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => window.open(`/api/receipts/${payment.id}/download`, "_blank")}>
                                  <Download className="h-4 w-4 mr-2" />
                                  Baixar recibo
                                </DropdownMenuItem>
                              </>
                            )}
                            {payment.status === "PENDING" && (
                              <DropdownMenuItem
                                onClick={() => cancelPayment(payment)}
                                className="text-red-600"
                              >
                                <X className="h-4 w-4 mr-2" />
                                Cancelar cobrança
                              </DropdownMenuItem>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
      )}

      {/* Tabela de sessões não faturadas */}
      {(selectedStatus === "all" || selectedStatus === "NAO_FATURADO") && unbilledItems.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Sessões Não Faturadas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-100">
                    <th className="text-left py-3 px-4 text-xs font-medium text-gray-500">
                      Paciente
                    </th>
                    <th className="text-left py-3 px-4 text-xs font-medium text-gray-500">
                      Pacote
                    </th>
                    <th className="text-left py-3 px-4 text-xs font-medium text-gray-500">
                      Sessões Restantes
                    </th>
                    <th className="text-left py-3 px-4 text-xs font-medium text-gray-500">
                      Valor/Sessão
                    </th>
                    <th className="text-left py-3 px-4 text-xs font-medium text-gray-500">
                      Total Pendente
                    </th>
                    <th className="text-left py-3 px-4 text-xs font-medium text-gray-500">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {unbilledItems.map((item) => (
                    <tr
                      key={item.id}
                      className="border-b border-gray-50 hover:bg-gray-50/50"
                    >
                      <td className="py-3 px-4 text-sm text-gray-900">
                        <a
                          href={`/pacientes/${item.patientId}`}
                          className="hover:underline"
                        >
                          {item.patientName}
                        </a>
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-500">
                        {item.packageName}
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-900">
                        {item.remainingSessions} sessões
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-500">
                        {formatCurrency(item.pricePerSession)}
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-900 font-medium">
                        {formatCurrency(item.totalRemaining)}
                      </td>
                      <td className="py-3 px-4">
                        <Badge
                          style={{
                            backgroundColor: statusColors.NAO_FATURADO.bg,
                            color: statusColors.NAO_FATURADO.text,
                          }}
                        >
                          Não Faturado
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Modal de edição de pagamento */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="sm:max-w-[450px]">
          <DialogHeader>
            <DialogTitle>Editar Pagamento</DialogTitle>
          </DialogHeader>

          {selectedPayment && (
            <div className="space-y-4">
              <div className="bg-gray-50 p-3 rounded-lg space-y-1">
                <p className="text-sm font-medium text-gray-900">
                  {selectedPayment.session.patient.name}
                </p>
                <p className="text-xs text-gray-500">
                  {formatDate(selectedPayment.session.dateTime)} às{" "}
                  {formatTime(selectedPayment.session.dateTime)}
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="amount">Valor</Label>
                  <MaskedInput
                    id="amount"
                    mask="currency"
                    defaultValue={formData.amount}
                    onChange={(value) =>
                      setFormData({ ...formData, amount: value })
                    }
                    placeholder="R$ 0,00"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="status">Status</Label>
                  <Select
                    value={formData.status}
                    onValueChange={(value) =>
                      setFormData({ ...formData, status: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="PENDING">Pendente</SelectItem>
                      <SelectItem value="PAID">Pago</SelectItem>
                      <SelectItem value="CANCELLED">Cancelado</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="method">Método de Pagamento</Label>
                  <Select
                    value={formData.method}
                    onValueChange={(value) =>
                      setFormData({ ...formData, method: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione..." />
                    </SelectTrigger>
                    <SelectContent>
                      {paymentMethods.map((method) => (
                        <SelectItem key={method.value} value={method.value}>
                          {method.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="notes">Observações</Label>
                  <Textarea
                    id="notes"
                    value={formData.notes}
                    onChange={(e) =>
                      setFormData({ ...formData, notes: e.target.value })
                    }
                    placeholder="Observações sobre o pagamento..."
                    rows={2}
                  />
                </div>

                {/* Seção de Recibo */}
                <div className="space-y-2 pt-2 border-t">
                  <Label>Recibo/Comprovante</Label>
                  {selectedPayment.receiptUrl ? (
                    <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
                      <FileText className="h-5 w-5 text-gray-400" />
                      <span className="text-sm text-gray-600 flex-1 truncate">
                        {selectedPayment.receiptFileName || "Recibo anexado"}
                      </span>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => openViewer({
                          paymentId: selectedPayment.id,
                          fileName: selectedPayment.receiptFileName,
                          fileType: selectedPayment.receiptFileType,
                          fileSize: selectedPayment.receiptFileSize,
                        })}
                        title="Visualizar"
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => window.open(`/api/receipts/${selectedPayment.id}/download`, "_blank")}
                        title="Baixar"
                      >
                        <Download className="h-4 w-4" />
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={handleRemoveReceipt}
                        disabled={deletingReceipt}
                        className="text-red-600 hover:text-red-700"
                        title="Remover"
                      >
                        {deletingReceipt ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Trash2 className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  ) : (
                    <div className="relative">
                      <input
                        type="file"
                        id="receipt-upload"
                        accept=".pdf,.jpg,.jpeg,.png,.webp"
                        onChange={handleReceiptUpload}
                        disabled={uploadingReceipt}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
                      />
                      <div className="flex items-center justify-center gap-2 p-4 border-2 border-dashed border-gray-200 rounded-lg hover:border-gray-300 transition-colors">
                        {uploadingReceipt ? (
                          <>
                            <Loader2 className="h-5 w-5 text-gray-400 animate-spin" />
                            <span className="text-sm text-gray-500">Enviando...</span>
                          </>
                        ) : (
                          <>
                            <Upload className="h-5 w-5 text-gray-400" />
                            <span className="text-sm text-gray-500">
                              Clique para anexar recibo (PDF, JPG, PNG)
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex justify-end gap-2 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setModalOpen(false)}
                  >
                    Cancelar
                  </Button>
                  <Button type="submit" disabled={saving}>
                    {saving ? "Salvando..." : "Salvar"}
                  </Button>
                </div>
              </form>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Visualizador de Recibos */}
      <ReceiptViewer
        receipt={viewingReceipt}
        open={viewerOpen}
        onClose={closeViewer}
      />
    </div>
  )
}
