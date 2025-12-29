/**
 * Sistema de Auditoria - Conformidade LGPD
 *
 * Registra todas as ações importantes no sistema para:
 * - Rastreabilidade de acessos a dados sensíveis
 * - Conformidade com LGPD/GDPR
 * - Investigação de incidentes de segurança
 */

import { prisma } from "./prisma"
import { AuditAction } from "@prisma/client"
import { logger } from "./logger"

interface AuditLogParams {
  userId: string
  action: AuditAction
  entityType: string
  entityId?: string
  details?: Record<string, unknown>
  request?: Request
}

/**
 * Registra uma ação no log de auditoria
 * Não lança exceção para não interromper operações principais
 */
export async function logAudit({
  userId,
  action,
  entityType,
  entityId,
  details,
  request,
}: AuditLogParams): Promise<void> {
  try {
    let ipAddress: string | null = null
    let userAgent: string | null = null

    if (request) {
      // Extrair IP
      const forwarded = request.headers.get("x-forwarded-for")
      ipAddress = forwarded
        ? forwarded.split(",")[0].trim()
        : request.headers.get("x-real-ip") || null

      // Extrair User Agent
      userAgent = request.headers.get("user-agent")
    }

    await prisma.auditLog.create({
      data: {
        userId,
        action,
        entityType,
        entityId,
        details: details ? JSON.stringify(details) : null,
        ipAddress,
        userAgent,
      },
    })
  } catch (error: unknown) {
    // Log de erro silencioso - não deve interromper a operação principal
    logger.error("Falha ao registrar log de auditoria", error, { action, entityType, entityId })
  }
}

/**
 * Helper para log de autenticação
 */
export async function logAuthEvent(
  action: "LOGIN_SUCCESS" | "LOGIN_FAILED" | "LOGOUT" | "PASSWORD_CHANGE",
  userId: string,
  details?: Record<string, unknown>,
  request?: Request
): Promise<void> {
  await logAudit({
    userId,
    action,
    entityType: "Auth",
    details,
    request,
  })
}

/**
 * Helper para log de pacientes
 */
export async function logPatientEvent(
  action: "PATIENT_CREATE" | "PATIENT_UPDATE" | "PATIENT_DELETE" | "PATIENT_VIEW",
  userId: string,
  patientId: string,
  details?: Record<string, unknown>,
  request?: Request
): Promise<void> {
  await logAudit({
    userId,
    action,
    entityType: "Patient",
    entityId: patientId,
    details,
    request,
  })
}

/**
 * Helper para log de sessões
 */
export async function logSessionEvent(
  action: "SESSION_CREATE" | "SESSION_UPDATE" | "SESSION_DELETE" | "SESSION_VIEW",
  userId: string,
  sessionId: string,
  details?: Record<string, unknown>,
  request?: Request
): Promise<void> {
  await logAudit({
    userId,
    action,
    entityType: "Session",
    entityId: sessionId,
    details,
    request,
  })
}

/**
 * Helper para log de pagamentos
 */
export async function logPaymentEvent(
  action: "PAYMENT_CREATE" | "PAYMENT_UPDATE" | "PAYMENT_DELETE",
  userId: string,
  paymentId: string,
  details?: Record<string, unknown>,
  request?: Request
): Promise<void> {
  await logAudit({
    userId,
    action,
    entityType: "Payment",
    entityId: paymentId,
    details,
    request,
  })
}

/**
 * Helper para log de documentos
 */
export async function logDocumentEvent(
  action: "DOCUMENT_UPLOAD" | "DOCUMENT_VIEW" | "DOCUMENT_DOWNLOAD" | "DOCUMENT_DELETE",
  userId: string,
  documentId: string,
  details?: Record<string, unknown>,
  request?: Request
): Promise<void> {
  await logAudit({
    userId,
    action,
    entityType: "Document",
    entityId: documentId,
    details,
    request,
  })
}

/**
 * Helper para log de acesso a dados sensíveis
 */
export async function logSensitiveDataAccess(
  userId: string,
  entityType: string,
  entityId: string,
  dataFields: string[],
  request?: Request
): Promise<void> {
  await logAudit({
    userId,
    action: "SENSITIVE_DATA_ACCESS",
    entityType,
    entityId,
    details: { fields: dataFields },
    request,
  })
}

/**
 * Helper para log de alterações de perfil/configurações
 */
export async function logSettingsEvent(
  action: "SETTINGS_UPDATE" | "PROFILE_UPDATE",
  userId: string,
  details?: Record<string, unknown>,
  request?: Request
): Promise<void> {
  await logAudit({
    userId,
    action,
    entityType: "Settings",
    entityId: userId,
    details,
    request,
  })
}

/**
 * Buscar logs de auditoria com filtros
 */
export async function getAuditLogs(params: {
  userId?: string
  entityType?: string
  entityId?: string
  action?: AuditAction
  startDate?: Date
  endDate?: Date
  limit?: number
  offset?: number
}) {
  const { userId, entityType, entityId, action, startDate, endDate, limit = 50, offset = 0 } = params

  return prisma.auditLog.findMany({
    where: {
      ...(userId && { userId }),
      ...(entityType && { entityType }),
      ...(entityId && { entityId }),
      ...(action && { action }),
      ...((startDate || endDate) && {
        createdAt: {
          ...(startDate && { gte: startDate }),
          ...(endDate && { lte: endDate }),
        },
      }),
    },
    orderBy: { createdAt: "desc" },
    take: limit,
    skip: offset,
  })
}
