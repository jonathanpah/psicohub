/**
 * Tipos para a página Financeiro
 */

export interface Patient {
  id: string
  name: string
  phone: string | null
  email: string | null
}

export interface Session {
  id: string
  dateTime: string
  duration: number
  patient: Patient
}

export interface Payment {
  id: string
  sessionId: string
  session: Session
  amount: string
  status: "PENDING" | "PAID" | "CANCELLED"
  method: string | null
  paidAt: string | null
  notes: string | null
  receiptUrl: string | null
  receiptFileName: string | null
  receiptFileType: string | null
  receiptFileSize: number | null
  createdAt: string
}

export interface Summary {
  totalBilled: number
  totalPaid: number
  totalPending: number
  countPaid: number
  countPending: number
  countCancelled: number
}

export interface UnbilledData {
  totalUnbilled: number
  packagesCount: number
  sessionsRemaining: number
}

export interface UnbilledItem {
  id: string
  patientId: string
  patientName: string
  packageName: string
  remainingSessions: number
  pricePerSession: number
  totalRemaining: number
}

export interface PaymentFilters {
  selectedMonth: string
  selectedYear: string
  selectedStatus: string
  selectedPatient: string
}

export interface PaymentFormData {
  status: string
  method: string
  amount: string
  notes: string
}
