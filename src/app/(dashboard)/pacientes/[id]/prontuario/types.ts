export interface Document {
  id: string
  name: string
  description: string | null
  fileName: string
  fileUrl: string
  fileType: string
  fileSize: number
  category: string
  sessionId: string | null
  uploadedAt: string
}

export interface Session {
  id: string
  dateTime: string
  duration: number
  status: "SCHEDULED" | "CONFIRMED" | "COMPLETED" | "CANCELLED" | "NO_SHOW"
  clinicalNotes: string | null
  observations: string | null
}

export interface Patient {
  id: string
  name: string
  birthDate: string | null
  sessions: Session[]
}

// Clinical document categories
export const CLINICAL_CATEGORIES = [
  "ANAMNESIS",
  "PSYCHOLOGICAL_REPORT",
  "EXTERNAL_REPORT",
  "MEDICAL_EXAM",
  "SCHOOL_REPORT",
  "PSYCHOLOGICAL_EVALUATION",
  "CLINICAL_EVOLUTION",
  "OTHER",
]

export const CLINICAL_CATEGORY_OPTIONS = [
  { value: "ANAMNESIS", label: "Ficha de Anamnese" },
  { value: "PSYCHOLOGICAL_REPORT", label: "Laudo Psicológico" },
  { value: "EXTERNAL_REPORT", label: "Laudo de Outros Profissionais" },
  { value: "MEDICAL_EXAM", label: "Exames Médicos" },
  { value: "SCHOOL_REPORT", label: "Relatório Escolar" },
  { value: "PSYCHOLOGICAL_EVALUATION", label: "Avaliação Psicológica" },
  { value: "CLINICAL_EVOLUTION", label: "Evolução Clínica" },
  { value: "OTHER", label: "Outro Documento" },
]

export const CLINICAL_CATEGORY_LABELS: Record<string, string> = {
  ANAMNESIS: "Anamnese",
  PSYCHOLOGICAL_REPORT: "Laudo Psicológico",
  EXTERNAL_REPORT: "Laudo Externo",
  MEDICAL_EXAM: "Exame Médico",
  SCHOOL_REPORT: "Relatório Escolar",
  PSYCHOLOGICAL_EVALUATION: "Avaliação",
  CLINICAL_EVOLUTION: "Evolução",
  OTHER: "Outro",
}
