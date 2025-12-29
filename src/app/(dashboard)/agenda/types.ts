import type { FileData } from "@/components/ui/file-upload"

export interface Patient {
  id: string
  name: string
  phone: string | null
  email: string | null
}

export interface Payment {
  id: string
  amount: string
  status: "PENDING" | "PAID" | "CANCELLED"
  method: string | null
}

export interface SessionPackageInfo {
  id: string
  name: string | null
  totalSessions: number
}

export type RecurrencePattern = "WEEKLY" | "BIWEEKLY" | "MONTHLY"

export interface Session {
  id: string
  patientId: string
  patient: Patient
  dateTime: string
  duration: number
  status: "SCHEDULED" | "CONFIRMED" | "COMPLETED" | "CANCELLED" | "NO_SHOW"
  isCourtesy: boolean
  clinicalNotes: string | null
  observations: string | null
  payment: Payment | null
  packageId: string | null
  packageOrder: number | null
  package: SessionPackageInfo | null
  recurrenceGroupId: string | null
  recurrencePattern: RecurrencePattern | null
  recurrenceEndDate: string | null
  recurrenceCount: number | null
  recurrenceIndex: number | null
}

export interface SessionFormData {
  patientId: string
  date: string
  time: string
  duration: string
  status: string
  isCourtesy: boolean
  observations: string
  clinicalNotes: string
  isRecurring: boolean
  recurrencePattern: RecurrencePattern
  recurrenceEndType: "DATE" | "OCCURRENCES"
  recurrenceEndDate: string
  recurrenceOccurrences: number
  priceType: "per_session" | "total"
  customPrice: string
  isPaid: boolean
  paymentMethod: string
  receipt: FileData | null
}

export const INITIAL_FORM_DATA: SessionFormData = {
  patientId: "",
  date: "",
  time: "",
  duration: "50",
  status: "SCHEDULED",
  isCourtesy: false,
  observations: "",
  clinicalNotes: "",
  isRecurring: false,
  recurrencePattern: "WEEKLY",
  recurrenceEndType: "OCCURRENCES",
  recurrenceEndDate: "",
  recurrenceOccurrences: 8,
  priceType: "per_session",
  customPrice: "",
  isPaid: false,
  paymentMethod: "",
  receipt: null,
}
