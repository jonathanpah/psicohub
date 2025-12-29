/**
 * Constantes de status centralizadas
 * Cores e labels para sessões, pagamentos e pacientes
 */

// ============================================
// TIPOS
// ============================================

export type SessionStatus = "SCHEDULED" | "CONFIRMED" | "COMPLETED" | "CANCELLED" | "NO_SHOW"
export type PaymentStatus = "PENDING" | "PAID" | "CANCELLED"
export type PatientStatus = "ACTIVE" | "INACTIVE" | "ARCHIVED"
export type PackageStatus = "ACTIVE" | "COMPLETED" | "CANCELLED"

// ============================================
// SESSÕES
// ============================================

export const SESSION_STATUS_COLORS: Record<SessionStatus, string> = {
  SCHEDULED: "bg-gray-100 text-gray-600",
  CONFIRMED: "bg-gray-900 text-white",
  COMPLETED: "bg-emerald-50 text-emerald-600",
  CANCELLED: "bg-red-50 text-red-600",
  NO_SHOW: "bg-amber-50 text-amber-600",
}

export const SESSION_STATUS_LABELS: Record<SessionStatus, string> = {
  SCHEDULED: "Agendada",
  CONFIRMED: "Confirmada",
  COMPLETED: "Realizada",
  CANCELLED: "Cancelada",
  NO_SHOW: "Falta",
}

// Cores para o calendário (FullCalendar) - RGB definidos pelo usuário
export const SESSION_CALENDAR_COLORS: Record<SessionStatus, { bg: string; border: string; text: string }> = {
  SCHEDULED: { bg: "rgb(104, 52, 154)", border: "rgb(104, 52, 154)", text: "#ffffff" },
  CONFIRMED: { bg: "rgb(47, 110, 186)", border: "rgb(47, 110, 186)", text: "#ffffff" },
  COMPLETED: { bg: "rgb(62, 85, 42)", border: "rgb(62, 85, 42)", text: "#ffffff" },
  CANCELLED: { bg: "rgb(176, 36, 24)", border: "rgb(176, 36, 24)", text: "#ffffff" },
  NO_SHOW: { bg: "rgb(245, 194, 66)", border: "rgb(245, 194, 66)", text: "#000000" },
}

// ============================================
// PAGAMENTOS
// ============================================

export const PAYMENT_STATUS_COLORS: Record<PaymentStatus, string> = {
  PENDING: "bg-yellow-100 text-yellow-700",
  PAID: "bg-green-100 text-green-700",
  CANCELLED: "bg-red-100 text-red-700",
}

// Cores de pagamento para badges (formato hex)
export const PAYMENT_STATUS_HEX_COLORS: Record<PaymentStatus, { bg: string; text: string }> = {
  PENDING: { bg: "#F5C242", text: "#1f2937" },
  PAID: { bg: "#3E552A", text: "#ffffff" },
  CANCELLED: { bg: "#B02418", text: "#ffffff" },
}

export const PAYMENT_STATUS_LABELS: Record<PaymentStatus, string> = {
  PENDING: "Pendente",
  PAID: "Pago",
  CANCELLED: "Cancelado",
}

// Métodos de pagamento
export const PAYMENT_METHODS = [
  { value: "PIX", label: "PIX" },
  { value: "CREDIT_CARD", label: "Cartão de Crédito" },
  { value: "DEBIT_CARD", label: "Cartão de Débito" },
  { value: "CASH", label: "Dinheiro" },
  { value: "BANK_TRANSFER", label: "Transferência Bancária" },
  { value: "OTHER", label: "Outro" },
] as const

export const PAYMENT_METHOD_LABELS: Record<string, string> = {
  PIX: "PIX",
  CREDIT_CARD: "Cartão de Crédito",
  DEBIT_CARD: "Cartão de Débito",
  CASH: "Dinheiro",
  BANK_TRANSFER: "Transferência",
  OTHER: "Outro",
}

// ============================================
// PACIENTES
// ============================================

export const PATIENT_STATUS_COLORS: Record<PatientStatus, string> = {
  ACTIVE: "bg-green-100 text-green-700",
  INACTIVE: "bg-yellow-100 text-yellow-700",
  ARCHIVED: "bg-gray-100 text-gray-700",
}

export const PATIENT_STATUS_LABELS: Record<PatientStatus, string> = {
  ACTIVE: "Ativo",
  INACTIVE: "Inativo",
  ARCHIVED: "Arquivado",
}

// ============================================
// PACOTES
// ============================================

export const PACKAGE_STATUS_COLORS: Record<PackageStatus, string> = {
  ACTIVE: "bg-blue-100 text-blue-700",
  COMPLETED: "bg-green-100 text-green-700",
  CANCELLED: "bg-red-100 text-red-700",
}

export const PACKAGE_STATUS_LABELS: Record<PackageStatus, string> = {
  ACTIVE: "Ativo",
  COMPLETED: "Concluído",
  CANCELLED: "Cancelado",
}

// ============================================
// RECORRÊNCIA
// ============================================

export const RECURRENCE_PATTERNS = [
  { value: "WEEKLY", label: "Semanal" },
  { value: "BIWEEKLY", label: "Quinzenal" },
  { value: "MONTHLY", label: "Mensal" },
] as const

export const RECURRENCE_END_TYPES = [
  { value: "OCCURRENCES", label: "Número de sessões" },
  { value: "DATE", label: "Data específica" },
] as const

export const RECURRENCE_OCCURRENCES_OPTIONS = [4, 8, 12, 16, 24, 52] as const

// ============================================
// DURAÇÃO DE SESSÕES
// ============================================

export const SESSION_DURATIONS = [
  { value: 30, label: "30 minutos" },
  { value: 45, label: "45 minutos" },
  { value: 50, label: "50 minutos" },
  { value: 60, label: "1 hora" },
  { value: 90, label: "1h30" },
  { value: 120, label: "2 horas" },
] as const

// ============================================
// RELAÇÕES DE RESPONSÁVEL
// ============================================

export const GUARDIAN_RELATIONS = [
  { value: "pai", label: "Pai" },
  { value: "mae", label: "Mãe" },
  { value: "avo", label: "Avô/Avó" },
  { value: "tio", label: "Tio/Tia" },
  { value: "padrasto", label: "Padrasto/Madrasta" },
  { value: "tutor", label: "Tutor Legal" },
  { value: "outro", label: "Outro" },
] as const

export const GUARDIAN_RELATION_LABELS: Record<string, string> = {
  pai: "Pai",
  mae: "Mãe",
  avo: "Avô/Avó",
  tio: "Tio/Tia",
  padrasto: "Padrasto/Madrasta",
  tutor: "Tutor Legal",
  outro: "Outro",
}
