"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { AlertCircle } from "lucide-react"
import { parseCurrency } from "@/components/ui/masked-input"
import { formatCurrency } from "@/lib/formatters"

interface SummaryActionsProps {
  filledSessionsCount: number
  type: "SESSION" | "PACKAGE"
  sessionPrice: string
  packagePrice: string
  pricePerSession?: number
  isValid: boolean
  saving: boolean
  error: string | null
  cancelHref: string
  submitLabel: string
}

export function SummaryActions({
  filledSessionsCount,
  type,
  sessionPrice,
  packagePrice,
  pricePerSession,
  isValid,
  saving,
  error,
  cancelHref,
  submitLabel,
}: SummaryActionsProps) {
  const getSummaryText = () => {
    if (pricePerSession !== undefined) {
      // Package mode - add to existing
      return `${filledSessionsCount} sessão(ões) • ${formatCurrency(pricePerSession * filledSessionsCount)}`
    }

    if (type === "SESSION") {
      const price = parseCurrency(sessionPrice)
      if (price > 0) {
        return `${filledSessionsCount} sessão(ões) • ${formatCurrency(price * filledSessionsCount)} total`
      }
      return `${filledSessionsCount} sessão(ões) • Valor não definido`
    }

    const price = parseCurrency(packagePrice)
    if (price > 0) {
      return `${filledSessionsCount} sessão(ões) • ${formatCurrency(price)} (pacote)`
    }
    return `${filledSessionsCount} sessão(ões) • Valor não definido`
  }

  return (
    <>
      {error && (
        <div className="flex items-center gap-2 p-4 bg-red-50 border border-red-100 rounded-lg">
          <AlertCircle className="h-5 w-5 text-red-500" />
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}

      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-sm text-gray-500">Resumo</p>
              <p className="font-medium text-gray-900">{getSummaryText()}</p>
            </div>

            <div className="flex gap-2">
              <Link href={cancelHref}>
                <Button type="button" variant="outline">
                  Cancelar
                </Button>
              </Link>
              <Button type="submit" disabled={!isValid || saving}>
                {saving ? "Salvando..." : submitLabel}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </>
  )
}
