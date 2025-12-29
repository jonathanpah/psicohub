/**
 * Funções de mascaramento de dados sensíveis
 * Conformidade LGPD - proteção de dados pessoais
 */

/**
 * Mascara CPF: 123.456.789-00 → 123.***.***-00
 */
export function maskCPF(cpf: string | null | undefined): string | null {
  if (!cpf) return null

  // Remove formatação
  const cleaned = cpf.replace(/\D/g, "")

  if (cleaned.length < 11) return cpf

  // Mostra apenas primeiros 3 e últimos 2 dígitos
  return `${cleaned.slice(0, 3)}.***.***-${cleaned.slice(-2)}`
}

/**
 * Mascara CNPJ: 12.345.678/0001-90 → 12.xxx.xxx/xxxxx-90
 */
export function maskCNPJ(cnpj: string | null | undefined): string | null {
  if (!cnpj) return null

  // Remove formatação
  const cleaned = cnpj.replace(/\D/g, "")

  if (cleaned.length < 14) return cnpj

  // Mostra apenas primeiros 2 e últimos 2 dígitos
  return `${cleaned.slice(0, 2)}.***.***/*****-${cleaned.slice(-2)}`
}

/**
 * Mascara telefone: (11) 98765-4321 → (11) *****-4321
 */
export function maskPhone(phone: string | null | undefined): string | null {
  if (!phone) return null

  // Remove formatação
  const cleaned = phone.replace(/\D/g, "")

  if (cleaned.length < 10) return phone

  // Mostra DDD e últimos 4 dígitos
  const ddd = cleaned.slice(0, 2)
  const lastFour = cleaned.slice(-4)

  return `(${ddd}) *****-${lastFour}`
}

/**
 * Mascara email: usuario@dominio.com → u***o@dominio.com
 */
export function maskEmail(email: string | null | undefined): string | null {
  if (!email) return null

  const [localPart, domain] = email.split("@")

  if (!domain || localPart.length < 2) return email

  // Mostra primeira e última letra do local part
  const maskedLocal =
    localPart[0] + "***" + localPart[localPart.length - 1]

  return `${maskedLocal}@${domain}`
}

/**
 * Mascara CRP: 06/12345 → 06/***45
 */
export function maskCRP(crp: string | null | undefined): string | null {
  if (!crp) return null

  // Remove formatação
  const cleaned = crp.replace(/\D/g, "")

  if (cleaned.length < 5) return crp

  // Formato: XX/XXXXX - mostra região e últimos 2 dígitos
  const region = cleaned.slice(0, 2)
  const lastTwo = cleaned.slice(-2)

  return `${region}/***${lastTwo}`
}

/**
 * Mascara nome: João Silva → J*** S***
 */
export function maskName(name: string | null | undefined): string | null {
  if (!name) return null

  const parts = name.trim().split(" ")

  return parts
    .map((part) => {
      if (part.length <= 1) return part
      return part[0] + "***"
    })
    .join(" ")
}

/**
 * Mascara endereço: mostra apenas cidade/UF
 * "Rua das Flores, 123, Centro, São Paulo - SP" → "***, São Paulo - SP"
 */
export function maskAddress(address: string | null | undefined): string | null {
  if (!address) return null

  // Tenta extrair cidade e estado do final
  const match = address.match(/([^,]+)\s*-\s*([A-Z]{2})\s*$/)

  if (match) {
    return `***, ${match[1].trim()} - ${match[2]}`
  }

  // Se não conseguir, mascara tudo exceto últimos 10 chars
  if (address.length > 15) {
    return "*** " + address.slice(-10)
  }

  return "***"
}

/**
 * Interface para dados do psicólogo com opção de mascaramento
 */
export interface PsychologistData {
  name: string | null
  cpf: string | null
  crp: string | null
  phone: string | null
  email: string | null
  clinicName: string | null
  clinicCnpj: string | null
  clinicAddress: string | null
  clinicPhone: string | null
}

/**
 * Mascara todos os dados sensíveis do psicólogo para logs/APIs externas
 */
export function maskPsychologistData(
  data: PsychologistData,
  options?: {
    keepName?: boolean
    keepCrp?: boolean
    keepClinicName?: boolean
  }
): PsychologistData {
  return {
    name: options?.keepName ? data.name : maskName(data.name),
    cpf: maskCPF(data.cpf),
    crp: options?.keepCrp ? data.crp : maskCRP(data.crp),
    phone: maskPhone(data.phone),
    email: maskEmail(data.email),
    clinicName: options?.keepClinicName ? data.clinicName : data.clinicName,
    clinicCnpj: maskCNPJ(data.clinicCnpj),
    clinicAddress: maskAddress(data.clinicAddress),
    clinicPhone: maskPhone(data.clinicPhone),
  }
}

/**
 * Interface para dados do paciente
 */
export interface PatientData {
  name: string | null
  cpf: string | null
  phone: string | null
  email: string | null
  address: string | null
}

/**
 * Mascara todos os dados sensíveis do paciente para logs/APIs externas
 */
export function maskPatientData(
  data: PatientData,
  options?: {
    keepName?: boolean
  }
): PatientData {
  return {
    name: options?.keepName ? data.name : maskName(data.name),
    cpf: maskCPF(data.cpf),
    phone: maskPhone(data.phone),
    email: maskEmail(data.email),
    address: maskAddress(data.address),
  }
}
