/**
 * Utilitários de formatação centralizados
 * Usados em toda a aplicação para garantir consistência
 */

/**
 * Formata um valor numérico como moeda brasileira (BRL)
 */
export function formatCurrency(value: number | string | null | undefined): string {
  if (value === null || value === undefined) return "-"
  const numValue = typeof value === "string" ? parseFloat(value) : value
  if (isNaN(numValue)) return "-"
  return numValue.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  })
}

/**
 * Formata uma data como dd/mm/yyyy
 */
export function formatDate(dateString: string | Date | null | undefined): string {
  if (!dateString) return "-"
  const date = typeof dateString === "string" ? new Date(dateString) : dateString
  if (isNaN(date.getTime())) return "-"
  return date.toLocaleDateString("pt-BR")
}

/**
 * Formata hora como HH:mm
 */
export function formatTime(dateString: string | Date | null | undefined): string {
  if (!dateString) return "-"
  const date = typeof dateString === "string" ? new Date(dateString) : dateString
  if (isNaN(date.getTime())) return "-"
  return date.toLocaleTimeString("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
  })
}

/**
 * Formata data e hora como dd/mm/yyyy HH:mm
 */
export function formatDateTime(dateString: string | Date | null | undefined): string {
  if (!dateString) return "-"
  const date = typeof dateString === "string" ? new Date(dateString) : dateString
  if (isNaN(date.getTime())) return "-"
  return date.toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })
}

/**
 * Formata data como "Segunda, 15 de Janeiro"
 */
export function formatDateLong(dateString: string | Date | null | undefined): string {
  if (!dateString) return "-"
  const date = typeof dateString === "string" ? new Date(dateString) : dateString
  if (isNaN(date.getTime())) return "-"
  return date.toLocaleDateString("pt-BR", {
    weekday: "long",
    day: "numeric",
    month: "long",
  })
}

/**
 * Formata data como "15 Jan 2025"
 */
export function formatDateShort(dateString: string | Date | null | undefined): string {
  if (!dateString) return "-"
  const date = typeof dateString === "string" ? new Date(dateString) : dateString
  if (isNaN(date.getTime())) return "-"
  return date.toLocaleDateString("pt-BR", {
    day: "numeric",
    month: "short",
    year: "numeric",
  })
}

/**
 * Calcula a idade a partir da data de nascimento
 */
export function calculateAge(birthDate: string | Date | null | undefined): number | null {
  if (!birthDate) return null
  const birth = typeof birthDate === "string" ? new Date(birthDate) : birthDate
  if (isNaN(birth.getTime())) return null

  const today = new Date()
  let age = today.getFullYear() - birth.getFullYear()
  const monthDiff = today.getMonth() - birth.getMonth()

  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age--
  }

  return age
}

/**
 * Formata duração em minutos para texto legível
 */
export function formatDuration(minutes: number): string {
  if (minutes < 60) {
    return `${minutes} min`
  }
  const hours = Math.floor(minutes / 60)
  const remainingMinutes = minutes % 60
  if (remainingMinutes === 0) {
    return `${hours}h`
  }
  return `${hours}h ${remainingMinutes}min`
}

/**
 * Formata número de telefone brasileiro
 */
export function formatPhone(phone: string | null | undefined): string {
  if (!phone) return "-"
  const cleaned = phone.replace(/\D/g, "")
  if (cleaned.length === 11) {
    return `(${cleaned.slice(0, 2)}) ${cleaned.slice(2, 7)}-${cleaned.slice(7)}`
  }
  if (cleaned.length === 10) {
    return `(${cleaned.slice(0, 2)}) ${cleaned.slice(2, 6)}-${cleaned.slice(6)}`
  }
  return phone
}

/**
 * Formata CPF brasileiro
 */
export function formatCPF(cpf: string | null | undefined): string {
  if (!cpf) return "-"
  const cleaned = cpf.replace(/\D/g, "")
  if (cleaned.length === 11) {
    return `${cleaned.slice(0, 3)}.${cleaned.slice(3, 6)}.${cleaned.slice(6, 9)}-${cleaned.slice(9)}`
  }
  return cpf
}

/**
 * Mascara CPF para exibição segura (ex: ***.456.789-**)
 * Mostra apenas os dígitos do meio para identificação
 */
export function maskCPF(cpf: string | null | undefined): string {
  if (!cpf) return "-"
  const cleaned = cpf.replace(/\D/g, "")
  if (cleaned.length === 11) {
    return `***.${cleaned.slice(3, 6)}.${cleaned.slice(6, 9)}-**`
  }
  return "***.***.***-**"
}

/**
 * Formata CNPJ brasileiro
 */
export function formatCNPJ(cnpj: string | null | undefined): string {
  if (!cnpj) return "-"
  const cleaned = cnpj.replace(/\D/g, "")
  if (cleaned.length === 14) {
    return `${cleaned.slice(0, 2)}.${cleaned.slice(2, 5)}.${cleaned.slice(5, 8)}/${cleaned.slice(8, 12)}-${cleaned.slice(12)}`
  }
  return cnpj
}

/**
 * Mascara CNPJ para exibição segura (ex: **.345.678/0001-**)
 */
export function maskCNPJ(cnpj: string | null | undefined): string {
  if (!cnpj) return "-"
  const cleaned = cnpj.replace(/\D/g, "")
  if (cleaned.length === 14) {
    return `**.${cleaned.slice(2, 5)}.${cleaned.slice(5, 8)}/${cleaned.slice(8, 12)}-**`
  }
  return "**.***.****/****-**"
}

/**
 * Retorna as iniciais de um nome (máximo 2 letras)
 */
export function getInitials(name: string | null | undefined): string {
  if (!name) return "??"
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2)
}

/**
 * Formata bytes para tamanho legível (KB, MB, GB)
 */
export function formatFileSize(bytes: number | null | undefined): string {
  if (!bytes || bytes === 0) return "0 B"
  const k = 1024
  const sizes = ["B", "KB", "MB", "GB"]
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`
}
