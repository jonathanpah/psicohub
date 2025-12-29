"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  DollarSign,
  TrendingUp,
  AlertCircle,
  CheckCircle,
  Package,
} from "lucide-react"
import { formatCurrency } from "@/lib/formatters"
import type { Summary, UnbilledData } from "../types"

interface SummaryCardsProps {
  summary: Summary
  unbilledData: UnbilledData
  selectedMonth: string
  selectedYear: string
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

export function SummaryCards({
  summary,
  unbilledData,
  selectedMonth,
  selectedYear,
}: SummaryCardsProps) {
  const getSessionsTitle = () => {
    if (selectedMonth === "all" && selectedYear === "all") {
      return "Total de Sessões"
    }
    if (selectedMonth === "all") {
      return `Sessões de ${selectedYear}`
    }
    if (selectedYear === "all") {
      return `Sessões de ${months.find((m) => m.value === selectedMonth)?.label}`
    }
    return "Sessões do Período"
  }

  return (
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
            Pendente Total
          </CardTitle>
          <AlertCircle className="h-4 w-4 text-gray-300" strokeWidth={1.5} />
        </CardHeader>
        <CardContent>
          <div className="text-xl font-medium text-gray-900">
            {formatCurrency(summary.totalPending + unbilledData.totalUnbilled)}
          </div>
          <p className="text-xs text-gray-400 mt-1">
            {summary.countPending} agendadas + {unbilledData.sessionsRemaining} não agendadas
          </p>
        </CardContent>
      </Card>

      <Card
        className={
          unbilledData.totalUnbilled > 0 ? "border-amber-200 bg-amber-50/50" : ""
        }
      >
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-normal text-gray-500">
            Não Agendado
          </CardTitle>
          <Package className="h-4 w-4 text-gray-300" strokeWidth={1.5} />
        </CardHeader>
        <CardContent>
          <div
            className={`text-xl font-medium ${
              unbilledData.totalUnbilled > 0 ? "text-amber-700" : "text-gray-900"
            }`}
          >
            {formatCurrency(unbilledData.totalUnbilled)}
          </div>
          {unbilledData.sessionsRemaining > 0 && (
            <p className="text-xs text-amber-600 mt-1">
              {unbilledData.sessionsRemaining} sessões pendentes de pacotes
            </p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-normal text-gray-500">
            {getSessionsTitle()}
          </CardTitle>
          <TrendingUp className="h-4 w-4 text-gray-300" strokeWidth={1.5} />
        </CardHeader>
        <CardContent>
          <div className="text-xl font-medium text-gray-900">
            {summary.countPaid + summary.countPending}
          </div>
          <p className="text-xs text-gray-400 mt-1">
            {summary.countPaid} realizadas + {summary.countPending} pendentes
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
