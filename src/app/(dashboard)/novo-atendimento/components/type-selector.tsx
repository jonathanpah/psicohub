"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { MaskedInput } from "@/components/ui/masked-input"
import { DollarSign, Package } from "lucide-react"

interface TypeSelectorProps {
  type: "SESSION" | "PACKAGE"
  sessionPrice: string
  totalSessions: string
  packagePrice: string
  calculatedPricePerSession: number
  onTypeChange: (type: "SESSION" | "PACKAGE") => void
  onSessionPriceChange: (value: string) => void
  onTotalSessionsChange: (value: string) => void
  onPackagePriceChange: (value: string) => void
}

export function TypeSelector({
  type,
  sessionPrice,
  totalSessions,
  packagePrice,
  calculatedPricePerSession,
  onTypeChange,
  onSessionPriceChange,
  onTotalSessionsChange,
  onPackagePriceChange,
}: TypeSelectorProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <Package className="h-4 w-4" />
          Tipo de Atendimento
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <RadioGroup
          value={type}
          onValueChange={(value) => onTypeChange(value as "SESSION" | "PACKAGE")}
          className="grid grid-cols-2 gap-4"
        >
          <div>
            <RadioGroupItem
              value="SESSION"
              id="session"
              className="peer sr-only"
            />
            <Label
              htmlFor="session"
              className="flex flex-col items-center justify-center rounded-lg border-2 border-gray-200 p-4 cursor-pointer hover:border-gray-300 peer-data-[state=checked]:border-gray-900 peer-data-[state=checked]:bg-gray-50"
            >
              <DollarSign className="h-6 w-6 mb-2 text-gray-500" />
              <span className="font-medium">Sessão Avulsa</span>
              <span className="text-xs text-gray-500">Cobrança por sessão</span>
            </Label>
          </div>

          <div>
            <RadioGroupItem
              value="PACKAGE"
              id="package"
              className="peer sr-only"
            />
            <Label
              htmlFor="package"
              className="flex flex-col items-center justify-center rounded-lg border-2 border-gray-200 p-4 cursor-pointer hover:border-gray-300 peer-data-[state=checked]:border-gray-900 peer-data-[state=checked]:bg-gray-50"
            >
              <Package className="h-6 w-6 mb-2 text-gray-500" />
              <span className="font-medium">Pacote de Sessões</span>
              <span className="text-xs text-gray-500">Valor fechado</span>
            </Label>
          </div>
        </RadioGroup>

        {type === "SESSION" ? (
          <div className="space-y-2">
            <Label htmlFor="sessionPrice">Valor por Sessão</Label>
            <MaskedInput
              id="sessionPrice"
              mask="currency"
              value={sessionPrice}
              onChange={onSessionPriceChange}
              placeholder="R$ 0,00"
            />
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="totalSessions">Total de Sessões</Label>
              <Input
                id="totalSessions"
                type="number"
                min="1"
                value={totalSessions}
                onChange={(e) => onTotalSessionsChange(e.target.value)}
                placeholder="10"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="packagePrice">Valor do Pacote</Label>
              <MaskedInput
                id="packagePrice"
                mask="currency"
                value={packagePrice}
                onChange={onPackagePriceChange}
                placeholder="R$ 0,00"
              />
            </div>
            {calculatedPricePerSession > 0 && (
              <div className="col-span-2 bg-gray-50 rounded-lg p-3">
                <p className="text-sm text-gray-600">
                  Valor por sessão:{" "}
                  <span className="font-medium text-gray-900">
                    {calculatedPricePerSession.toLocaleString("pt-BR", {
                      style: "currency",
                      currency: "BRL",
                    })}
                  </span>
                </p>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
