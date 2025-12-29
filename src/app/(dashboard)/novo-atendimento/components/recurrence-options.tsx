"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Repeat, AlertCircle, Calendar } from "lucide-react"
import {
  type RecurrencePattern,
  RECURRENCE_PATTERNS,
  RECURRENCE_COUNTS,
  formatRecurrenceDate,
  getRecurrenceDescription,
} from "@/lib/recurrence"

interface RecurrenceOptionsProps {
  enabled: boolean
  onEnabledChange: (enabled: boolean) => void
  pattern: RecurrencePattern
  onPatternChange: (pattern: RecurrencePattern) => void
  count: number
  onCountChange: (count: number) => void
  generatedDates: Date[]
  conflicts: string[]
  isChecking: boolean
}

export function RecurrenceOptions({
  enabled,
  onEnabledChange,
  pattern,
  onPatternChange,
  count,
  onCountChange,
  generatedDates,
  conflicts,
  isChecking,
}: RecurrenceOptionsProps) {
  const hasConflicts = conflicts.length > 0

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <Repeat className="h-4 w-4" />
          Agendamento Recorrente
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-2">
          <Checkbox
            id="isRecurring"
            checked={enabled}
            onCheckedChange={(checked) => onEnabledChange(checked === true)}
          />
          <Label
            htmlFor="isRecurring"
            className="text-sm font-normal cursor-pointer"
          >
            Criar sessões recorrentes automaticamente
          </Label>
        </div>

        {enabled && (
          <div className="pl-6 space-y-4 border-l-2 border-gray-200">
            {/* Frequência */}
            <div className="space-y-2">
              <Label className="text-xs text-gray-500">Frequência</Label>
              <Select
                value={pattern}
                onValueChange={(value) => onPatternChange(value as RecurrencePattern)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {RECURRENCE_PATTERNS.map((p) => (
                    <SelectItem key={p.value} value={p.value}>
                      {p.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Quantidade */}
            <div className="space-y-2">
              <Label className="text-xs text-gray-500">Quantidade de sessões</Label>
              <Select
                value={count.toString()}
                onValueChange={(value) => onCountChange(parseInt(value))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {RECURRENCE_COUNTS.map((n) => (
                    <SelectItem key={n} value={n.toString()}>
                      {n} sessões
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Preview das datas */}
            {generatedDates.length > 0 && (
              <div className="space-y-2">
                <Label className="text-xs text-gray-500 flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  Preview das sessões
                  {isChecking && (
                    <span className="text-blue-500 ml-2">Verificando conflitos...</span>
                  )}
                </Label>
                <div className="bg-gray-50 rounded-md p-3 max-h-48 overflow-y-auto">
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    {generatedDates.map((date, index) => {
                      const dateStr = date.toISOString()
                      const isConflict = conflicts.includes(dateStr)
                      return (
                        <div
                          key={index}
                          className={`flex items-center gap-2 p-1.5 rounded ${
                            isConflict
                              ? "bg-red-100 text-red-700"
                              : "bg-white text-gray-700"
                          }`}
                        >
                          <span className="font-medium text-gray-400 w-5">
                            {index + 1}.
                          </span>
                          <span className="capitalize">
                            {formatRecurrenceDate(date)}
                          </span>
                          {isConflict && (
                            <AlertCircle className="h-3 w-3 text-red-500 ml-auto" />
                          )}
                        </div>
                      )
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* Alerta de conflitos */}
            {hasConflicts && (
              <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-md">
                <AlertCircle className="h-4 w-4 text-red-500 mt-0.5 flex-shrink-0" />
                <div className="text-sm text-red-700">
                  <p className="font-medium">
                    {conflicts.length === 1
                      ? "1 data tem conflito de horário"
                      : `${conflicts.length} datas têm conflito de horário`}
                  </p>
                  <p className="text-xs mt-1">
                    Ajuste a data/hora inicial ou escolha outra frequência.
                  </p>
                </div>
              </div>
            )}

            {/* Resumo */}
            {!hasConflicts && generatedDates.length > 0 && (
              <div className="text-sm text-gray-500 bg-green-50 p-3 rounded-md border border-green-200">
                <span className="text-green-700">
                  {getRecurrenceDescription(pattern, count)}
                </span>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
