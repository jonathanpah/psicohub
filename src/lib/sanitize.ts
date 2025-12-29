/**
 * Utilitários de sanitização de inputs
 * Garante que dados de entrada sejam limpos e seguros
 */

import { z } from "zod"

/**
 * String que aplica trim automaticamente
 */
export const trimmedString = z.string().transform((s) => s.trim())

/**
 * String opcional que aplica trim
 */
export const optionalTrimmedString = z
  .string()
  .optional()
  .transform((s) => s?.trim() || undefined)

/**
 * Email com trim e lowercase
 */
export const sanitizedEmail = z
  .string()
  .email("Email inválido")
  .transform((s) => s.trim().toLowerCase())

/**
 * Email opcional com trim e lowercase
 */
export const optionalSanitizedEmail = z
  .string()
  .email("Email inválido")
  .optional()
  .or(z.literal(""))
  .transform((s) => (s ? s.trim().toLowerCase() : undefined))

/**
 * Remove caracteres especiais de strings numéricas (CPF, CNPJ, telefone)
 */
export function cleanNumericString(value: string): string {
  return value.replace(/\D/g, "")
}

/**
 * Valida CPF (apenas formato, não checksum)
 */
export const sanitizedCPF = z
  .string()
  .optional()
  .transform((s) => {
    if (!s) return undefined
    const cleaned = cleanNumericString(s)
    return cleaned.length === 11 ? cleaned : undefined
  })

/**
 * Valida telefone brasileiro
 */
export const sanitizedPhone = z
  .string()
  .optional()
  .transform((s) => {
    if (!s) return undefined
    const cleaned = cleanNumericString(s)
    return cleaned.length >= 10 ? cleaned : undefined
  })

/**
 * Sanitiza texto livre (notas, observações)
 * Remove tags HTML potencialmente perigosas
 */
export function sanitizeText(text: string): string {
  return text
    .trim()
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
    .replace(/<[^>]*>/g, "")
}

/**
 * Texto livre sanitizado
 */
export const sanitizedText = z
  .string()
  .optional()
  .transform((s) => (s ? sanitizeText(s) : undefined))

/**
 * Valida e sanitiza valor monetário
 */
export const sanitizedMoney = z
  .number()
  .min(0, "Valor não pode ser negativo")
  .transform((n) => Math.round(n * 100) / 100) // Arredonda para 2 casas decimais
