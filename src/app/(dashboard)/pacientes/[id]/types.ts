export interface PricingPlan {
  id: string
  type: "SESSION" | "PACKAGE"
  sessionPrice: number | null
  packageSessions: number | null
  packagePrice: number | null
  startDate: string
  active: boolean
  notes: string | null
  createdAt: string
}

export interface Session {
  id: string
  dateTime: string
  duration: number
  status: "SCHEDULED" | "CONFIRMED" | "COMPLETED" | "CANCELLED" | "NO_SHOW"
  clinicalNotes: string | null
  payment: {
    id: string
    amount: string
    status: "PENDING" | "PAID" | "CANCELLED"
    method: string | null
    notes: string | null
    receiptUrl: string | null
  } | null
  recurrenceGroupId: string | null
  recurrencePattern: string | null
  recurrenceCount: number | null
  recurrenceIndex: number | null
  packageId: string | null
  packageOrder: number | null
  package: {
    id: string
    name: string | null
    totalSessions: number
  } | null
}

export interface SessionPackage {
  id: string
  name: string | null
  totalSessions: number
  pricePerSession: number
  status: "ACTIVE" | "COMPLETED" | "CANCELLED"
  pricingPlan: PricingPlan
  sessions: {
    id: string
    dateTime: string
    status: string
    packageOrder: number | null
  }[]
  stats: {
    scheduled: number
    completed: number
    cancelled: number
    remainingSlots: number
    totalScheduled: number
  }
  createdAt: string
}

export interface Patient {
  id: string
  name: string
  email: string | null
  phone: string | null
  cpf: string | null
  birthDate: string | null
  address: string | null
  guardian: string | null
  guardianCpf: string | null
  guardianEmail: string | null
  guardianPhone: string | null
  guardianAddress: string | null
  guardianRelation: string | null
  // Segundo responsável
  guardian2: string | null
  guardian2Cpf: string | null
  guardian2Email: string | null
  guardian2Phone: string | null
  guardian2Address: string | null
  guardian2Relation: string | null
  notes: string | null
  status: "ACTIVE" | "INACTIVE" | "ARCHIVED"
  createdAt: string
  sessions: Session[]
  pricingPlans: PricingPlan[]
}
