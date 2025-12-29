"use client"

import { useState } from "react"
import Link from "next/link"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
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
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { MaskedInput, parseCurrency } from "@/components/ui/masked-input"
import {
  Calendar,
  FileText,
  Package,
  Trash2,
  ChevronRight,
  MoreHorizontal,
  CheckCircle,
  X,
  Edit,
  Eye,
  Download,
  Upload,
  Loader2,
} from "lucide-react"
import { formatCurrency, formatDate, formatTime } from "@/lib/formatters"
import {
  SESSION_STATUS_COLORS,
  SESSION_STATUS_LABELS,
  PAYMENT_STATUS_COLORS,
  PAYMENT_STATUS_LABELS,
} from "@/constants/status"
import { SessionNotesDialog } from "./session-notes-dialog"
import type { Patient, Session } from "../types"

interface SessionsListProps {
  patient: Patient
  onDeleteSession: (session: Session) => void
  onRefresh: () => void
}

interface PaymentFormData {
  status: string
  method: string
  amount: string
  notes: string
}

const paymentMethods = [
  { value: "PIX", label: "PIX" },
  { value: "DINHEIRO", label: "Dinheiro" },
  { value: "CARTAO_CREDITO", label: "Cartão de Crédito" },
  { value: "CARTAO_DEBITO", label: "Cartão de Débito" },
  { value: "TRANSFERENCIA", label: "Transferência Bancária" },
]

function formatSessionDateDisplay(dateString: string) {
  const date = new Date(dateString)
  const day = date.getDate().toString().padStart(2, "0")
  const month = (date.getMonth() + 1).toString().padStart(2, "0")
  const weekday = date.toLocaleDateString("pt-BR", { weekday: "short" }).replace(".", "")

  return {
    dateFormatted: `${day}/${month}`,
    time: date.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }),
    weekday: weekday.charAt(0).toUpperCase() + weekday.slice(1),
  }
}

function formatAmountForForm(amount: string): string {
  const amountNum = parseFloat(amount)
  if (amountNum > 0) {
    return `R$ ${amountNum.toLocaleString("pt-BR", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`
  }
  return ""
}

export function SessionsList({ patient, onDeleteSession, onRefresh }: SessionsListProps) {
  const [selectedSession, setSelectedSession] = useState<Session | null>(null)
  const [dialogOpen, setDialogOpen] = useState(false)

  // Payment modal state
  const [paymentModalOpen, setPaymentModalOpen] = useState(false)
  const [editingSession, setEditingSession] = useState<Session | null>(null)
  const [paymentForm, setPaymentForm] = useState<PaymentFormData>({
    status: "PENDING",
    method: "",
    amount: "",
    notes: "",
  })
  const [saving, setSaving] = useState(false)
  const [uploadingReceipt, setUploadingReceipt] = useState(false)
  const [deletingReceipt, setDeletingReceipt] = useState(false)

  // Receipt viewer state
  const [receiptViewerOpen, setReceiptViewerOpen] = useState(false)
  const [viewingReceipt, setViewingReceipt] = useState<{url: string, type: string} | null>(null)
  const [loadingReceipt, setLoadingReceipt] = useState(false)

  // Filtrar apenas sessões pendentes (SCHEDULED e CONFIRMED)
  const pendingSessions = patient.sessions
    .filter((s) => s.status === "SCHEDULED" || s.status === "CONFIRMED")
    .sort((a, b) => new Date(a.dateTime).getTime() - new Date(b.dateTime).getTime())

  const handleSessionClick = (session: Session) => {
    setSelectedSession(session)
    setDialogOpen(true)
  }

  const handleDialogClose = (open: boolean) => {
    setDialogOpen(open)
    if (!open) {
      setSelectedSession(null)
    }
  }

  const handleMarkAsPaid = async (session: Session) => {
    if (!session.payment) return

    try {
      const response = await fetch(`/api/payments/${session.payment.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "PAID" }),
      })

      if (response.ok) {
        toast.success("Pagamento marcado como pago")
        onRefresh()
      } else {
        toast.error("Erro ao atualizar pagamento")
      }
    } catch {
      toast.error("Erro ao atualizar pagamento")
    }
  }

  const handleCancelPayment = async (session: Session) => {
    if (!session.payment) return

    try {
      const response = await fetch(`/api/payments/${session.payment.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "CANCELLED" }),
      })

      if (response.ok) {
        toast.success("Cobrança cancelada")
        onRefresh()
      } else {
        toast.error("Erro ao cancelar cobrança")
      }
    } catch {
      toast.error("Erro ao cancelar cobrança")
    }
  }

  const openPaymentModal = (session: Session) => {
    if (!session.payment) return
    setEditingSession(session)
    setPaymentForm({
      status: session.payment.status,
      method: session.payment.method || "",
      amount: formatAmountForForm(session.payment.amount),
      notes: session.payment.notes || "",
    })
    setPaymentModalOpen(true)
  }

  const handlePaymentSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingSession?.payment) return

    setSaving(true)
    try {
      const response = await fetch(`/api/payments/${editingSession.payment.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: paymentForm.status,
          method: paymentForm.method || null,
          amount: parseCurrency(paymentForm.amount),
          notes: paymentForm.notes || null,
        }),
      })

      if (response.ok) {
        toast.success("Pagamento atualizado")
        setPaymentModalOpen(false)
        onRefresh()
      } else {
        toast.error("Erro ao atualizar pagamento")
      }
    } catch {
      toast.error("Erro ao atualizar pagamento")
    } finally {
      setSaving(false)
    }
  }

  const handleReceiptUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!editingSession?.payment || !e.target.files || e.target.files.length === 0) return

    const file = e.target.files[0]
    const allowedTypes = ["application/pdf", "image/jpeg", "image/png", "image/webp"]

    if (!allowedTypes.includes(file.type)) {
      toast.error("Tipo de arquivo não permitido. Use PDF, JPG, PNG ou WEBP.")
      return
    }

    if (file.size > 10 * 1024 * 1024) {
      toast.error("O arquivo deve ter no máximo 10MB")
      return
    }

    setUploadingReceipt(true)
    try {
      const uploadFormData = new FormData()
      uploadFormData.append("file", file)
      uploadFormData.append("name", `Recibo - ${formatDate(editingSession.dateTime)}`)
      uploadFormData.append("category", "PAYMENT_RECEIPT")
      uploadFormData.append("sessionId", editingSession.id)

      const uploadResponse = await fetch(`/api/patients/${patient.id}/documents`, {
        method: "POST",
        body: uploadFormData,
      })

      if (!uploadResponse.ok) {
        const error = await uploadResponse.json()
        toast.error(error.error || "Erro ao fazer upload")
        return
      }

      const document = await uploadResponse.json()

      const updateResponse = await fetch(`/api/payments/${editingSession.payment.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          receiptUrl: document.fileUrl,
          receiptFileName: file.name,
          receiptFileType: file.type,
        }),
      })

      if (updateResponse.ok) {
        toast.success("Recibo anexado")
        // Atualizar estado local para refletir o recibo anexado
        setEditingSession({
          ...editingSession,
          payment: {
            ...editingSession.payment,
            receiptUrl: document.fileUrl,
          },
        })
        onRefresh()
      }
    } catch {
      toast.error("Erro ao fazer upload do recibo")
    } finally {
      setUploadingReceipt(false)
    }
  }

  const handleDeleteReceipt = async () => {
    if (!editingSession?.payment) return

    setDeletingReceipt(true)
    try {
      const response = await fetch(`/api/payments/${editingSession.payment.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          receiptUrl: null,
          receiptFileName: null,
          receiptFileType: null,
        }),
      })

      if (response.ok) {
        toast.success("Recibo removido")
        setEditingSession({
          ...editingSession,
          payment: {
            ...editingSession.payment,
            receiptUrl: null,
          },
        })
        onRefresh()
      } else {
        toast.error("Erro ao remover recibo")
      }
    } catch {
      toast.error("Erro ao remover recibo")
    } finally {
      setDeletingReceipt(false)
    }
  }

  const handleViewReceipt = async (session: Session) => {
    if (!session.payment?.id) return

    setLoadingReceipt(true)
    setReceiptViewerOpen(true)

    try {
      const response = await fetch(`/api/receipts/${session.payment.id}/view`)
      if (response.ok) {
        const blob = await response.blob()
        const url = URL.createObjectURL(blob)
        setViewingReceipt({ url, type: blob.type })
      } else {
        toast.error("Erro ao carregar recibo")
        setReceiptViewerOpen(false)
      }
    } catch {
      toast.error("Erro ao carregar recibo")
      setReceiptViewerOpen(false)
    } finally {
      setLoadingReceipt(false)
    }
  }

  const handleDownloadReceipt = async (session: Session) => {
    if (!session.payment?.id) return

    try {
      const response = await fetch(`/api/receipts/${session.payment.id}/download`)
      if (response.ok) {
        const blob = await response.blob()
        const url = URL.createObjectURL(blob)
        const a = document.createElement("a")
        a.href = url
        a.download = `recibo-${session.payment.id}.pdf`
        a.click()
        URL.revokeObjectURL(url)
      } else {
        toast.error("Erro ao baixar recibo")
      }
    } catch {
      toast.error("Erro ao baixar recibo")
    }
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-sm font-medium">
            <Calendar className="h-4 w-4 text-gray-400" />
            Próximas Sessões
            {pendingSessions.length > 0 && (
              <Badge variant="secondary" className="ml-2 text-xs">
                {pendingSessions.length}
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {pendingSessions.length === 0 ? (
            <div className="text-center py-6">
              <Calendar className="h-10 w-10 text-gray-200 mx-auto mb-2" />
              <p className="text-gray-500 text-sm">Nenhuma sessão agendada</p>
              <p className="text-gray-400 text-xs mt-1">
                Agende pela agenda ou novo atendimento
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {pendingSessions.map((session) => {
                const { dateFormatted, time, weekday } = formatSessionDateDisplay(session.dateTime)
                const hasReceipt = session.payment?.receiptUrl

                return (
                  <div
                    key={session.id}
                    className="group relative bg-gray-50 rounded-lg p-3 hover:bg-gray-100 transition-colors cursor-pointer"
                    onClick={() => handleSessionClick(session)}
                  >
                    <div className="flex items-center justify-between">
                      {/* Data e hora */}
                      <div className="flex items-center gap-3">
                        <div className="text-center min-w-[45px]">
                          <p className="text-sm font-medium text-gray-900">{dateFormatted}</p>
                          <p className="text-xs text-gray-500">{weekday}</p>
                        </div>

                        <div className="border-l border-gray-200 pl-3">
                          <div className="flex items-center gap-2">
                            <p className="text-sm font-medium text-gray-900">{time}</p>
                            <span className="text-xs text-gray-400">({session.duration}min)</span>
                          </div>

                          {/* Badges de pacote/recorrência */}
                          <div className="flex items-center gap-1.5 mt-1">
                            {session.package && (
                              <Badge variant="outline" className="text-xs py-0 px-1.5 h-5">
                                <Package className="h-3 w-3 mr-1" />
                                {session.packageOrder}/{session.package.totalSessions}
                              </Badge>
                            )}
                            {session.recurrenceGroupId && (
                              <Badge variant="outline" className="text-xs py-0 px-1.5 h-5 text-blue-600 border-blue-200">
                                🔄 {session.recurrenceIndex}/{session.recurrenceCount}
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Status e ações */}
                      <div className="flex items-center gap-2">
                        <div className="flex flex-col items-end gap-1">
                          <Badge className={`text-xs ${SESSION_STATUS_COLORS[session.status]}`}>
                            {SESSION_STATUS_LABELS[session.status]}
                          </Badge>
                          {session.payment && (
                            <div className="flex items-center gap-1.5">
                              <span className="text-xs font-medium text-gray-600">
                                {formatCurrency(session.payment.amount)}
                              </span>
                              <Badge className={`text-xs py-0 h-5 ${PAYMENT_STATUS_COLORS[session.payment.status]}`}>
                                {PAYMENT_STATUS_LABELS[session.payment.status]}
                              </Badge>
                            </div>
                          )}
                        </div>

                        {/* Dropdown de ações */}
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 text-gray-400 hover:text-gray-600"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
                            {/* Ações de pagamento pendente */}
                            {session.payment && session.payment.status === "PENDING" && (
                              <>
                                <DropdownMenuItem
                                  onClick={() => handleMarkAsPaid(session)}
                                  className="text-green-600"
                                >
                                  <CheckCircle className="h-4 w-4 mr-2" />
                                  Marcar como Pago
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => openPaymentModal(session)}>
                                  <Edit className="h-4 w-4 mr-2" />
                                  Editar Pagamento
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() => handleCancelPayment(session)}
                                  className="text-red-600"
                                >
                                  <X className="h-4 w-4 mr-2" />
                                  Cancelar Cobrança
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                              </>
                            )}
                            {/* Ações de pagamento pago */}
                            {session.payment && session.payment.status === "PAID" && (
                              <>
                                {hasReceipt && (
                                  <>
                                    <DropdownMenuItem onClick={() => handleViewReceipt(session)}>
                                      <Eye className="h-4 w-4 mr-2" />
                                      Ver Recibo
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => handleDownloadReceipt(session)}>
                                      <Download className="h-4 w-4 mr-2" />
                                      Baixar Recibo
                                    </DropdownMenuItem>
                                  </>
                                )}
                                <DropdownMenuItem onClick={() => openPaymentModal(session)}>
                                  <Edit className="h-4 w-4 mr-2" />
                                  Editar Pagamento
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                              </>
                            )}
                            {/* Ação de excluir sessão */}
                            <DropdownMenuItem
                              onClick={() => onDeleteSession(session)}
                              className="text-red-600"
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Excluir Sessão
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>

                        <ChevronRight className="h-4 w-4 text-gray-300 group-hover:text-gray-500 transition-colors" />
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}

          {/* Link para prontuário completo */}
          <div className="pt-4 mt-4 border-t">
            <Link href={`/pacientes/${patient.id}/prontuario`}>
              <Button variant="outline" className="w-full text-sm">
                <FileText className="h-4 w-4 mr-2" />
                Ver Prontuário Completo
              </Button>
            </Link>
          </div>
        </CardContent>

        {/* Dialog para notas da sessão */}
        <SessionNotesDialog
          open={dialogOpen}
          onOpenChange={handleDialogClose}
          session={selectedSession}
          patientId={patient.id}
          onSessionUpdate={onRefresh}
        />
      </Card>

      {/* Modal de edição de pagamento */}
      <Dialog open={paymentModalOpen} onOpenChange={setPaymentModalOpen}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle className="text-base font-medium">Editar Pagamento</DialogTitle>
          </DialogHeader>

          {editingSession && (
            <div className="space-y-4">
              <div className="bg-gray-50 p-3 rounded-lg">
                <p className="text-sm font-medium text-gray-900">{patient.name}</p>
                <p className="text-xs text-gray-500">
                  {formatDate(editingSession.dateTime)} às {formatTime(editingSession.dateTime)}
                </p>
              </div>

              <form onSubmit={handlePaymentSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="amount" className="text-xs">Valor</Label>
                  <MaskedInput
                    id="amount"
                    mask="currency"
                    defaultValue={paymentForm.amount}
                    onChange={(value) => setPaymentForm({ ...paymentForm, amount: value })}
                    placeholder="R$ 0,00"
                    className="text-sm"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="status" className="text-xs">Status</Label>
                  <Select
                    value={paymentForm.status}
                    onValueChange={(value) => setPaymentForm({ ...paymentForm, status: value })}
                  >
                    <SelectTrigger className="text-sm">
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
                  <Label htmlFor="method" className="text-xs">Método de Pagamento</Label>
                  <Select
                    value={paymentForm.method}
                    onValueChange={(value) => setPaymentForm({ ...paymentForm, method: value })}
                  >
                    <SelectTrigger className="text-sm">
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
                  <Label htmlFor="notes" className="text-xs">Observações</Label>
                  <Textarea
                    id="notes"
                    value={paymentForm.notes}
                    onChange={(e) => setPaymentForm({ ...paymentForm, notes: e.target.value })}
                    placeholder="Observações..."
                    rows={2}
                    className="text-sm"
                  />
                </div>

                {/* Upload de recibo */}
                <div className="space-y-2 pt-2 border-t">
                  <Label className="text-xs">Recibo/Comprovante</Label>
                  {editingSession.payment?.receiptUrl ? (
                    <div className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg text-sm">
                      <FileText className="h-4 w-4 text-gray-400 shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-gray-600 truncate" title="Recibo anexado">
                          Recibo anexado
                        </p>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="h-7 w-7 p-0"
                          onClick={() => handleViewReceipt(editingSession)}
                          disabled={deletingReceipt}
                        >
                          <Eye className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="h-7 w-7 p-0"
                          onClick={() => handleDownloadReceipt(editingSession)}
                          disabled={deletingReceipt}
                        >
                          <Download className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="h-7 w-7 p-0 text-red-500 hover:text-red-600 hover:bg-red-50"
                          onClick={handleDeleteReceipt}
                          disabled={deletingReceipt}
                        >
                          {deletingReceipt ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          ) : (
                            <Trash2 className="h-3.5 w-3.5" />
                          )}
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="relative">
                      <input
                        type="file"
                        accept=".pdf,.jpg,.jpeg,.png,.webp"
                        onChange={handleReceiptUpload}
                        disabled={uploadingReceipt}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                      />
                      <div className="flex items-center justify-center gap-2 p-3 border-2 border-dashed border-gray-200 rounded-lg hover:border-gray-300">
                        {uploadingReceipt ? (
                          <>
                            <Loader2 className="h-4 w-4 text-gray-400 animate-spin" />
                            <span className="text-xs text-gray-500">Enviando...</span>
                          </>
                        ) : (
                          <>
                            <Upload className="h-4 w-4 text-gray-400" />
                            <span className="text-xs text-gray-500">Anexar recibo</span>
                          </>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setPaymentModalOpen(false)}
                  >
                    Cancelar
                  </Button>
                  <Button type="submit" size="sm" disabled={saving}>
                    {saving ? "Salvando..." : "Salvar"}
                  </Button>
                </div>
              </form>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Modal de visualização de recibo */}
      <Dialog open={receiptViewerOpen} onOpenChange={setReceiptViewerOpen}>
        <DialogContent className="sm:max-w-[700px] max-h-[90vh]">
          <DialogHeader>
            <DialogTitle className="text-base font-medium">Recibo</DialogTitle>
          </DialogHeader>

          {loadingReceipt ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 text-gray-400 animate-spin" />
            </div>
          ) : viewingReceipt ? (
            <div className="mt-2">
              {viewingReceipt.type.startsWith("image/") ? (
                <img
                  src={viewingReceipt.url}
                  alt="Recibo"
                  className="max-w-full max-h-[70vh] mx-auto rounded-lg"
                />
              ) : viewingReceipt.type === "application/pdf" ? (
                <iframe
                  src={viewingReceipt.url}
                  className="w-full h-[70vh] rounded-lg border"
                  title="Recibo PDF"
                />
              ) : (
                <div className="text-center py-8 text-gray-500">
                  Tipo de arquivo não suportado para visualização
                </div>
              )}
            </div>
          ) : null}
        </DialogContent>
      </Dialog>
    </>
  )
}
