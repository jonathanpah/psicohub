"use client"

import { Card, CardContent } from "@/components/ui/card"
import { CheckCircle, Calendar, User } from "lucide-react"
import { formatCurrency } from "@/lib/formatters"

interface SuccessScreenProps {
  isAddToPackageMode: boolean
  sessionsCount: number
  patientName?: string
  totalValue?: number
}

export function SuccessScreen({
  isAddToPackageMode,
  sessionsCount,
  patientName,
  totalValue,
}: SuccessScreenProps) {
  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <Card className="w-full max-w-md">
        <CardContent className="pt-6">
          <div className="text-center space-y-4">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
            <h2 className="text-xl font-medium text-gray-900">
              {isAddToPackageMode ? "Sessões Adicionadas!" : "Atendimento Criado!"}
            </h2>

            <div className="space-y-2 text-gray-600">
              <div className="flex items-center justify-center gap-2">
                <Calendar className="h-4 w-4" />
                <span>{sessionsCount} sessão(ões) agendada(s)</span>
              </div>
              {patientName && (
                <div className="flex items-center justify-center gap-2">
                  <User className="h-4 w-4" />
                  <span>{patientName}</span>
                </div>
              )}
              {totalValue !== undefined && totalValue > 0 && (
                <p className="font-medium text-gray-900">
                  {formatCurrency(totalValue)}
                </p>
              )}
            </div>

            <p className="text-sm text-gray-400">
              Redirecionando...
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
