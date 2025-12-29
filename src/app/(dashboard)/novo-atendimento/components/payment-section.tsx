"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { FileUpload, type FileData } from "@/components/ui/file-upload"
import { DollarSign } from "lucide-react"
import { PAYMENT_METHOD_OPTIONS } from "../types"

interface PaymentSectionProps {
  isPaid: boolean
  paymentMethod: string
  receipt: FileData | null
  onIsPaidChange: (isPaid: boolean) => void
  onPaymentMethodChange: (method: string) => void
  onReceiptChange: (data: FileData | null) => void
}

export function PaymentSection({
  isPaid,
  paymentMethod,
  receipt,
  onIsPaidChange,
  onPaymentMethodChange,
  onReceiptChange,
}: PaymentSectionProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <DollarSign className="h-4 w-4" />
          Pagamento
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-2">
          <Checkbox
            id="isPaid"
            checked={isPaid}
            onCheckedChange={(checked) => onIsPaidChange(checked === true)}
          />
          <Label htmlFor="isPaid" className="text-sm font-normal cursor-pointer">
            Já foi pago integralmente
          </Label>
        </div>

        {isPaid && (
          <div className="pl-6 space-y-4">
            <div className="space-y-2">
              <Label className="text-sm text-gray-600">
                Forma de pagamento
              </Label>
              <Select value={paymentMethod} onValueChange={onPaymentMethodChange}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione a forma de pagamento" />
                </SelectTrigger>
                <SelectContent>
                  {PAYMENT_METHOD_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-sm text-gray-600">
                Comprovante de pagamento (opcional)
              </Label>
              <FileUpload
                value={receipt}
                onChange={onReceiptChange}
              />
              <p className="text-xs text-gray-400">
                O comprovante será vinculado a todas as sessões do atendimento
              </p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
