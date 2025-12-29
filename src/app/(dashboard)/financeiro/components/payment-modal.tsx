"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { MaskedInput, parseCurrency } from "@/components/ui/masked-input"
import {
  FileText,
  Eye,
  Download,
  Trash2,
  Loader2,
  Upload,
} from "lucide-react"
import { toast } from "sonner"
import { formatDate, formatTime } from "@/lib/formatters"
import type { Payment, PaymentFormData } from "../types"
import type { ReceiptData } from "@/components/file-viewer"

interface PaymentModalProps {
  open: boolean
  onClose: () => void
  payment: Payment | null
  formData: PaymentFormData
  onFormChange: (data: PaymentFormData) => void
  onSubmit: () => Promise<void>
  onViewReceipt: (receipt: ReceiptData) => void
  onRefresh: () => void
}

const paymentMethods = [
  { value: "PIX", label: "PIX" },
  { value: "DINHEIRO", label: "Dinheiro" },
  { value: "CARTAO_CREDITO", label: "Cartão de Crédito" },
  { value: "CARTAO_DEBITO", label: "Cartão de Débito" },
  { value: "TRANSFERENCIA", label: "Transferência Bancária" },
]

export function PaymentModal({
  open,
  onClose,
  payment,
  formData,
  onFormChange,
  onSubmit,
  onViewReceipt,
  onRefresh,
}: PaymentModalProps) {
  const [saving, setSaving] = useState(false)
  const [uploadingReceipt, setUploadingReceipt] = useState(false)
  const [deletingReceipt, setDeletingReceipt] = useState(false)
  const [localPayment, setLocalPayment] = useState<Payment | null>(payment)

  // Atualizar localPayment quando payment mudar
  if (payment?.id !== localPayment?.id) {
    setLocalPayment(payment)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    try {
      await onSubmit()
    } finally {
      setSaving(false)
    }
  }

  const handleReceiptUpload = async (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    if (!localPayment || !e.target.files || e.target.files.length === 0) return

    const file = e.target.files[0]

    const allowedTypes = [
      "application/pdf",
      "image/jpeg",
      "image/png",
      "image/webp",
    ]
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
      const patientId = localPayment.session.patient.id
      const uploadFormData = new FormData()
      uploadFormData.append("file", file)
      uploadFormData.append(
        "name",
        `Recibo - ${formatDate(localPayment.session.dateTime)}`
      )
      uploadFormData.append("category", "PAYMENT_RECEIPT")
      uploadFormData.append("sessionId", localPayment.session.id)

      const uploadResponse = await fetch(
        `/api/patients/${patientId}/documents`,
        {
          method: "POST",
          body: uploadFormData,
        }
      )

      if (!uploadResponse.ok) {
        const error = await uploadResponse.json()
        toast.error(error.error || "Erro ao fazer upload")
        return
      }

      const document = await uploadResponse.json()

      const updateResponse = await fetch(
        `/api/payments/${localPayment.id}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            receiptUrl: document.fileUrl,
            receiptFileName: file.name,
            receiptFileType: file.type,
          }),
        }
      )

      if (updateResponse.ok) {
        setLocalPayment({
          ...localPayment,
          receiptUrl: document.fileUrl,
          receiptFileName: file.name,
          receiptFileType: file.type,
        })
        onRefresh()
        toast.success("Recibo anexado")
      }
    } catch {
      toast.error("Erro ao fazer upload do recibo")
    } finally {
      setUploadingReceipt(false)
    }
  }

  const handleRemoveReceipt = async () => {
    if (!localPayment) return

    setDeletingReceipt(true)
    try {
      const response = await fetch(`/api/payments/${localPayment.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          receiptUrl: null,
          receiptFileName: null,
          receiptFileType: null,
        }),
      })

      if (response.ok) {
        setLocalPayment({
          ...localPayment,
          receiptUrl: null,
          receiptFileName: null,
          receiptFileType: null,
        })
        onRefresh()
        toast.success("Recibo removido")
      }
    } catch {
      toast.error("Erro ao remover recibo")
    } finally {
      setDeletingReceipt(false)
    }
  }

  const getReceiptData = (): ReceiptData | null => {
    if (!localPayment) return null
    return {
      paymentId: localPayment.id,
      fileName: localPayment.receiptFileName,
      fileType: localPayment.receiptFileType,
      fileSize: localPayment.receiptFileSize,
    }
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[450px] overflow-hidden">
        <DialogHeader>
          <DialogTitle>Editar Pagamento</DialogTitle>
        </DialogHeader>

        {localPayment && (
          <div className="space-y-4 overflow-hidden">
            <div className="bg-gray-50 p-3 rounded-lg space-y-1">
              <p className="text-sm font-medium text-gray-900">
                {localPayment.session.patient.name}
              </p>
              <p className="text-xs text-gray-500">
                {formatDate(localPayment.session.dateTime)} às{" "}
                {formatTime(localPayment.session.dateTime)}
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 overflow-hidden">
              <div className="space-y-2">
                <Label htmlFor="amount">Valor</Label>
                <MaskedInput
                  id="amount"
                  mask="currency"
                  defaultValue={formData.amount}
                  onChange={(value) =>
                    onFormChange({ ...formData, amount: value })
                  }
                  placeholder="R$ 0,00"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <Select
                  value={formData.status}
                  onValueChange={(value) =>
                    onFormChange({ ...formData, status: value })
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
                    onFormChange({ ...formData, method: value })
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
                    onFormChange({ ...formData, notes: e.target.value })
                  }
                  placeholder="Observações sobre o pagamento..."
                  rows={2}
                />
              </div>

              {/* Seção de Recibo */}
              <div className="space-y-2 pt-2 border-t overflow-hidden">
                <Label>Recibo/Comprovante</Label>
                {localPayment.receiptUrl ? (
                  <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg w-full overflow-hidden">
                    <FileText className="h-5 w-5 text-gray-400 shrink-0" />
                    <div className="flex-1 min-w-0 overflow-hidden">
                      <p className="text-sm text-gray-600 truncate" title={localPayment.receiptFileName || "Recibo anexado"}>
                        {localPayment.receiptFileName || "Recibo anexado"}
                      </p>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0"
                        onClick={() => {
                          const receipt = getReceiptData()
                          if (receipt) onViewReceipt(receipt)
                        }}
                        aria-label="Visualizar recibo"
                      >
                        <Eye className="h-4 w-4" aria-hidden="true" />
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0"
                        onClick={() =>
                          window.open(
                            `/api/receipts/${localPayment.id}/download`,
                            "_blank"
                          )
                        }
                        aria-label="Baixar recibo"
                      >
                        <Download className="h-4 w-4" aria-hidden="true" />
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
                        onClick={handleRemoveReceipt}
                        disabled={deletingReceipt}
                        aria-label="Remover recibo"
                      >
                        {deletingReceipt ? (
                          <Loader2
                            className="h-4 w-4 animate-spin"
                            aria-hidden="true"
                          />
                        ) : (
                          <Trash2 className="h-4 w-4" aria-hidden="true" />
                        )}
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="relative">
                    <label htmlFor="receipt-upload" className="sr-only">
                      Upload de recibo
                    </label>
                    <input
                      type="file"
                      id="receipt-upload"
                      accept=".pdf,.jpg,.jpeg,.png,.webp"
                      onChange={handleReceiptUpload}
                      disabled={uploadingReceipt}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
                      aria-describedby="receipt-upload-help"
                    />
                    <div className="flex items-center justify-center gap-2 p-4 border-2 border-dashed border-gray-200 rounded-lg hover:border-gray-300 transition-colors">
                      {uploadingReceipt ? (
                        <>
                          <Loader2
                            className="h-5 w-5 text-gray-400 animate-spin"
                            aria-hidden="true"
                          />
                          <span className="text-sm text-gray-500">
                            Enviando...
                          </span>
                        </>
                      ) : (
                        <>
                          <Upload
                            className="h-5 w-5 text-gray-400"
                            aria-hidden="true"
                          />
                          <span
                            id="receipt-upload-help"
                            className="text-sm text-gray-500"
                          >
                            Clique para anexar recibo (PDF, JPG, PNG)
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <Button type="button" variant="outline" onClick={onClose}>
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
  )
}

// Utilitário para formatar valor inicial do formulário
export function formatAmountForForm(amount: string): string {
  const amountNum = parseFloat(amount)
  if (amountNum > 0) {
    return `R$ ${amountNum.toLocaleString("pt-BR", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`
  }
  return ""
}
