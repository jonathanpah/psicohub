"use client"

import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { FileUpload } from "@/components/ui/file-upload"
import { MaskedInput, parseCurrency } from "@/components/ui/masked-input"
import { DollarSign } from "lucide-react"
import type { SessionFormData, RecurrencePattern } from "../types"

interface RecurrenceFormProps {
  formData: SessionFormData
  setFormData: (data: SessionFormData) => void
}

export function RecurrenceForm({ formData, setFormData }: RecurrenceFormProps) {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Checkbox
          id="isRecurring"
          checked={formData.isRecurring}
          onCheckedChange={(checked) =>
            setFormData({ ...formData, isRecurring: checked === true })
          }
        />
        <Label htmlFor="isRecurring" className="text-sm font-normal cursor-pointer">
          Agendar sessão recorrente
        </Label>
      </div>

      {formData.isRecurring && (
        <div className="pl-6 space-y-4 border-l-2 border-gray-200">
          {/* Frequency */}
          <div className="space-y-2">
            <Label>Frequência</Label>
            <Select
              value={formData.recurrencePattern}
              onValueChange={(value: RecurrencePattern) =>
                setFormData({ ...formData, recurrencePattern: value })
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="WEEKLY">Semanal</SelectItem>
                <SelectItem value="BIWEEKLY">Quinzenal</SelectItem>
                <SelectItem value="MONTHLY">Mensal</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* End Type */}
          <div className="space-y-2">
            <Label>Terminar após</Label>
            <Select
              value={formData.recurrenceEndType}
              onValueChange={(value: "DATE" | "OCCURRENCES") =>
                setFormData({ ...formData, recurrenceEndType: value })
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="OCCURRENCES">Número de sessões</SelectItem>
                <SelectItem value="DATE">Data específica</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {formData.recurrenceEndType === "OCCURRENCES" && (
            <div className="space-y-2">
              <Label>Quantidade de sessões</Label>
              <Select
                value={formData.recurrenceOccurrences.toString()}
                onValueChange={(value) =>
                  setFormData({ ...formData, recurrenceOccurrences: parseInt(value) })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {[4, 8, 12, 16, 24, 52].map((n) => (
                    <SelectItem key={n} value={n.toString()}>
                      {n} sessões
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {formData.recurrenceEndType === "DATE" && (
            <div className="space-y-2">
              <Label>Data de término</Label>
              <Input
                type="date"
                value={formData.recurrenceEndDate}
                onChange={(e) =>
                  setFormData({ ...formData, recurrenceEndDate: e.target.value })
                }
                min={formData.date}
              />
            </div>
          )}

          {/* Price Section - only if not courtesy */}
          {!formData.isCourtesy && (
            <div className="space-y-3 pt-2 border-t border-gray-200">
              <Label className="flex items-center gap-2">
                <DollarSign className="h-4 w-4" />
                Valor das sessões
              </Label>

              {/* Price Type */}
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <input
                    type="radio"
                    id="priceTypePerSession"
                    name="priceType"
                    value="per_session"
                    checked={formData.priceType === "per_session"}
                    onChange={() => setFormData({ ...formData, priceType: "per_session" })}
                    className="h-4 w-4 text-gray-900"
                  />
                  <label htmlFor="priceTypePerSession" className="text-sm cursor-pointer">
                    Por sessão
                  </label>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="radio"
                    id="priceTypeTotal"
                    name="priceType"
                    value="total"
                    checked={formData.priceType === "total"}
                    onChange={() => setFormData({ ...formData, priceType: "total" })}
                    className="h-4 w-4 text-gray-900"
                  />
                  <label htmlFor="priceTypeTotal" className="text-sm cursor-pointer">
                    Valor total (dividido)
                  </label>
                </div>
              </div>

              {/* Price Input */}
              <div className="flex items-center gap-2">
                <MaskedInput
                  mask="currency"
                  value={formData.customPrice}
                  onChange={(value) => setFormData({ ...formData, customPrice: value })}
                  placeholder="R$ 0,00"
                  className="w-44"
                />
                {formData.priceType === "total" && formData.customPrice && formData.recurrenceOccurrences && (
                  <span className="text-sm text-gray-500">
                    ({(parseCurrency(formData.customPrice) / formData.recurrenceOccurrences).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}/sessão)
                  </span>
                )}
              </div>

              {/* Already Paid Checkbox */}
              <div className="pt-2 border-t border-gray-100">
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="isPaid"
                    checked={formData.isPaid}
                    onCheckedChange={(checked) =>
                      setFormData({ ...formData, isPaid: checked === true })
                    }
                  />
                  <Label htmlFor="isPaid" className="text-sm font-normal cursor-pointer">
                    Já foi pago integralmente
                  </Label>
                </div>

                {/* Payment Fields */}
                {formData.isPaid && (
                  <div className="mt-3 pl-6 space-y-4">
                    <div className="space-y-2">
                      <Label className="text-sm text-gray-600">
                        Forma de pagamento
                      </Label>
                      <Select
                        value={formData.paymentMethod}
                        onValueChange={(value) => setFormData({ ...formData, paymentMethod: value })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione a forma de pagamento" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="PIX">PIX</SelectItem>
                          <SelectItem value="DINHEIRO">Dinheiro</SelectItem>
                          <SelectItem value="CARTAO_CREDITO">Cartão de Crédito</SelectItem>
                          <SelectItem value="CARTAO_DEBITO">Cartão de Débito</SelectItem>
                          <SelectItem value="TRANSFERENCIA">Transferência Bancária</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label className="text-sm text-gray-600">
                        Comprovante de pagamento (opcional)
                      </Label>
                      <FileUpload
                        value={formData.receipt}
                        onChange={(data) => setFormData({ ...formData, receipt: data })}
                      />
                      <p className="text-xs text-gray-400">
                        O comprovante será vinculado a todas as sessões
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Preview */}
          <div className="text-sm text-gray-500 bg-gray-50 p-3 rounded-md">
            Serão criadas {formData.recurrenceEndType === "OCCURRENCES" ? formData.recurrenceOccurrences : "várias"} sessões
            {formData.recurrencePattern === "WEEKLY" && ", toda semana"}
            {formData.recurrencePattern === "BIWEEKLY" && ", a cada 2 semanas"}
            {formData.recurrencePattern === "MONTHLY" && ", todo mês"}
            , às {formData.time || "horário selecionado"}.
            {!formData.isCourtesy && formData.customPrice && (
              <span className="block mt-1">
                Valor total: {formData.priceType === "total"
                  ? parseCurrency(formData.customPrice).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })
                  : (parseCurrency(formData.customPrice) * (formData.recurrenceEndType === "OCCURRENCES" ? formData.recurrenceOccurrences : 1)).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })
                }
                {formData.isPaid && " (Pago)"}
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
