import { addWeeks, addMonths, isBefore, isEqual, format } from "date-fns"
import { ptBR } from "date-fns/locale"

export type RecurrencePattern = "WEEKLY" | "BIWEEKLY" | "MONTHLY"

export const RECURRENCE_PATTERNS: { value: RecurrencePattern; label: string }[] = [
  { value: "WEEKLY", label: "Semanal" },
  { value: "BIWEEKLY", label: "Quinzenal" },
  { value: "MONTHLY", label: "Mensal" },
]

export const RECURRENCE_COUNTS = [4, 8, 12, 16, 24, 52]

interface RecurrenceOptions {
  startDate: Date
  pattern: RecurrencePattern
  endDate?: Date        // Termina em data específica
  occurrences?: number  // OU termina após N sessões
}

/**
 * Gera datas para sessões recorrentes
 * @param options - Configurações da recorrência
 * @returns Array de datas para as sessões
 */
export function generateRecurrenceDates(options: RecurrenceOptions): Date[] {
  const { startDate, pattern, endDate, occurrences } = options
  const dates: Date[] = [new Date(startDate)]

  let currentDate = new Date(startDate)
  const maxOccurrences = occurrences || 52 // máximo 1 ano semanal

  while (dates.length < maxOccurrences) {
    // Calcular próxima data baseado no padrão
    switch (pattern) {
      case "WEEKLY":
        currentDate = addWeeks(currentDate, 1)
        break
      case "BIWEEKLY":
        currentDate = addWeeks(currentDate, 2)
        break
      case "MONTHLY":
        currentDate = addMonths(currentDate, 1)
        break
    }

    // Verificar se passou da data final
    if (endDate && !isBefore(currentDate, endDate) && !isEqual(currentDate, endDate)) {
      break
    }

    dates.push(new Date(currentDate))
  }

  return dates
}

/**
 * Gera um ID único para grupo de recorrência
 */
export function generateRecurrenceGroupId(): string {
  return `rec_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`
}

/**
 * Retorna o label em português para o padrão de recorrência
 */
export function getRecurrencePatternLabel(pattern: RecurrencePattern): string {
  const labels: Record<RecurrencePattern, string> = {
    WEEKLY: "Semanal",
    BIWEEKLY: "Quinzenal",
    MONTHLY: "Mensal",
  }
  return labels[pattern]
}

/**
 * Formata uma data para exibição no preview
 * @param date - Data a formatar
 * @returns String formatada (ex: "Seg, 15 Jan 14:00")
 */
export function formatRecurrenceDate(date: Date): string {
  return format(date, "EEE, d MMM HH:mm", { locale: ptBR })
}

/**
 * Retorna descrição resumida da recorrência
 * @param pattern - Padrão de recorrência
 * @param count - Número de sessões
 * @returns Descrição (ex: "8 sessões, toda semana")
 */
export function getRecurrenceDescription(pattern: RecurrencePattern, count: number): string {
  const patternText: Record<RecurrencePattern, string> = {
    WEEKLY: "toda semana",
    BIWEEKLY: "a cada 2 semanas",
    MONTHLY: "todo mês",
  }
  return `${count} sessões, ${patternText[pattern]}`
}
