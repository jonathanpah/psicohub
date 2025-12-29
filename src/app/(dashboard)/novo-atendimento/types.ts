import type { FileData } from "@/components/ui/file-upload"

export interface Patient {
  id: string
  name: string
  email: string | null
  phone: string | null
}

export interface SessionSlot {
  id: string
  date: string
  time: string
  duration: number
}

export interface ExistingPackage {
  id: string
  name: string
  patientId: string
  patient: {
    id: string
    name: string
  }
  totalSessions: number
  pricePerSession: number
  remainingSlots: number
  existingReceipt: {
    url: string
    fileName: string | null
    fileType: string | null
    fileSize: number | null
  } | null
}

export interface UploadForm {
  name: string
  description: string
  category: string
}

export interface NovoAtendimentoFormState {
  selectedPatient: string
  type: "SESSION" | "PACKAGE"
  sessionPrice: string
  totalSessions: string
  packagePrice: string
  packageName: string
  notes: string
  isPaid: boolean
  paymentMethod: string
  receipt: FileData | null
  sessionSlots: SessionSlot[]
}

export const DURATION_OPTIONS = [
  { value: "30", label: "30 min" },
  { value: "45", label: "45 min" },
  { value: "50", label: "50 min" },
  { value: "60", label: "60 min" },
  { value: "90", label: "90 min" },
  { value: "120", label: "120 min" },
] as const

export const PAYMENT_METHOD_OPTIONS = [
  { value: "PIX", label: "PIX" },
  { value: "DINHEIRO", label: "Dinheiro" },
  { value: "CARTAO_CREDITO", label: "Cartão de Crédito" },
  { value: "CARTAO_DEBITO", label: "Cartão de Débito" },
  { value: "TRANSFERENCIA", label: "Transferência Bancária" },
] as const
