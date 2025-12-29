/**
 * Sistema de Logging Estruturado
 *
 * Em desenvolvimento: logs no console
 * Em produção: logs silenciosos (integrar com Sentry/LogRocket depois)
 */

type LogLevel = "debug" | "info" | "warn" | "error"

interface LogContext {
  userId?: string
  action?: string
  entityType?: string
  entityId?: string
  [key: string]: unknown
}

const isDev = process.env.NODE_ENV === "development"

/**
 * Lista de chaves sensíveis que devem ser redatadas nos logs
 */
const SENSITIVE_KEYS = [
  "password",
  "senha",
  "token",
  "secret",
  "credential",
  "authorization",
  "apiKey",
  "api_key",
  "accessToken",
  "refreshToken",
  "cpf",
  "cnpj",
]

/**
 * Sanitiza objetos removendo dados sensíveis dos logs
 */
function sanitizeForLog(obj: unknown, depth = 0): unknown {
  // Evitar recursão infinita
  if (depth > 10) return "[MAX_DEPTH]"

  if (obj === null || obj === undefined) return obj
  if (typeof obj !== "object") return obj

  if (Array.isArray(obj)) {
    return obj.map((item) => sanitizeForLog(item, depth + 1))
  }

  const sanitized: Record<string, unknown> = {}
  for (const [key, value] of Object.entries(obj as Record<string, unknown>)) {
    const lowerKey = key.toLowerCase()
    // Verificar se a chave contém alguma palavra sensível
    const isSensitive = SENSITIVE_KEYS.some((sensitive) =>
      lowerKey.includes(sensitive.toLowerCase())
    )

    if (isSensitive) {
      sanitized[key] = "[REDACTED]"
    } else if (typeof value === "object" && value !== null) {
      sanitized[key] = sanitizeForLog(value, depth + 1)
    } else {
      sanitized[key] = value
    }
  }
  return sanitized
}

function formatMessage(level: LogLevel, message: string, context?: LogContext): string {
  const timestamp = new Date().toISOString()
  const sanitizedContext = context ? sanitizeForLog(context) : undefined
  const contextStr = sanitizedContext ? ` ${JSON.stringify(sanitizedContext)}` : ""
  return `[${timestamp}] [${level.toUpperCase()}] ${message}${contextStr}`
}

/**
 * Logger para uso em toda a aplicação
 * Em produção, pode ser integrado com serviços externos
 */
export const logger = {
  debug(message: string, context?: LogContext) {
    if (isDev) {
      console.debug(formatMessage("debug", message, context))
    }
  },

  info(message: string, context?: LogContext) {
    if (isDev) {
      console.info(formatMessage("info", message, context))
    }
    // TODO: Em produção, enviar para serviço de logging
  },

  warn(message: string, context?: LogContext) {
    if (isDev) {
      console.warn(formatMessage("warn", message, context))
    }
    // TODO: Em produção, enviar para serviço de logging
  },

  error(message: string, error?: unknown, context?: LogContext) {
    const errorDetails = error instanceof Error
      ? { name: error.name, message: error.message, stack: error.stack }
      : { raw: String(error) }

    // Sanitizar tanto o contexto quanto os detalhes do erro
    const sanitizedError = sanitizeForLog(errorDetails) as Record<string, unknown>
    const fullContext = { ...context, error: sanitizedError }

    if (isDev) {
      console.error(formatMessage("error", message, fullContext))
    }
    // TODO: Em produção, enviar para Sentry/LogRocket
    // Sentry.captureException(error, { extra: sanitizeForLog(context) })
  },
}

/**
 * Logger específico para APIs
 */
export function logApiError(
  endpoint: string,
  method: string,
  error: unknown,
  context?: LogContext
) {
  logger.error(`API Error: ${method} ${endpoint}`, error, context)
}

/**
 * Logger específico para operações de banco
 */
export function logDbError(
  operation: string,
  error: unknown,
  context?: LogContext
) {
  logger.error(`Database Error: ${operation}`, error, context)
}
