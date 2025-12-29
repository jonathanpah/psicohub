/**
 * Rate Limiter - Proteção contra brute force e DoS
 *
 * Usa Upstash Redis em produção (quando configurado)
 * Fallback para implementação em memória em desenvolvimento
 */

import { Ratelimit } from "@upstash/ratelimit"
import { Redis } from "@upstash/redis"

// ============================================
// TIPOS
// ============================================

interface RateLimitConfig {
  /** Número máximo de requisições permitidas */
  limit: number
  /** Janela de tempo em segundos */
  windowInSeconds: number
}

interface RateLimitResult {
  success: boolean
  limit: number
  remaining: number
  reset: number
}

// ============================================
// UPSTASH REDIS (PRODUÇÃO)
// ============================================

let redisRateLimiter: Ratelimit | null = null

// Inicializar Upstash Redis se as variáveis de ambiente estiverem configuradas
if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
  const redis = new Redis({
    url: process.env.UPSTASH_REDIS_REST_URL,
    token: process.env.UPSTASH_REDIS_REST_TOKEN,
  })

  redisRateLimiter = new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(100, "1 m"), // Default: 100 req/min
    analytics: true,
    prefix: "psicohub:ratelimit",
  })
}

// ============================================
// IN-MEMORY STORE (DESENVOLVIMENTO/FALLBACK)
// ============================================

interface RateLimitEntry {
  count: number
  resetTime: number
}

const rateLimitStore = new Map<string, RateLimitEntry>()

// Limpar entradas expiradas periodicamente (apenas em desenvolvimento)
if (typeof window === "undefined" && !redisRateLimiter) {
  setInterval(() => {
    const now = Date.now()
    for (const [key, entry] of rateLimitStore.entries()) {
      if (entry.resetTime < now) {
        rateLimitStore.delete(key)
      }
    }
  }, 60000)
}

// ============================================
// RATE LIMITERS ESPECIALIZADOS
// ============================================

// Rate limiters com configurações específicas para cada tipo de endpoint
const rateLimiters: Record<string, Ratelimit | null> = {}

function getRedisRateLimiter(config: RateLimitConfig): Ratelimit | null {
  if (!process.env.UPSTASH_REDIS_REST_URL || !process.env.UPSTASH_REDIS_REST_TOKEN) {
    return null
  }

  const key = `${config.limit}-${config.windowInSeconds}`
  if (!rateLimiters[key]) {
    const redis = new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL,
      token: process.env.UPSTASH_REDIS_REST_TOKEN,
    })

    rateLimiters[key] = new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(config.limit, `${config.windowInSeconds} s`),
      analytics: true,
      prefix: `psicohub:ratelimit:${key}`,
    })
  }

  return rateLimiters[key]
}

// ============================================
// FUNÇÃO PRINCIPAL
// ============================================

/**
 * Verifica rate limit para um identificador (IP, userId, etc)
 * Usa Upstash Redis em produção, fallback para memória em desenvolvimento
 */
export async function checkRateLimit(
  identifier: string,
  config: RateLimitConfig
): Promise<RateLimitResult> {
  // Tentar usar Redis primeiro
  const limiter = getRedisRateLimiter(config)

  if (limiter) {
    try {
      const result = await limiter.limit(identifier)
      return {
        success: result.success,
        limit: result.limit,
        remaining: result.remaining,
        reset: result.reset,
      }
    } catch (error) {
      // Se Redis falhar, usar fallback em memória
      console.warn("Upstash Redis rate limit failed, using in-memory fallback:", error)
    }
  }

  // Fallback: implementação em memória
  return checkRateLimitInMemory(identifier, config)
}

/**
 * Versão síncrona para compatibilidade (usa apenas memória)
 */
export function checkRateLimitSync(
  identifier: string,
  config: RateLimitConfig
): RateLimitResult {
  return checkRateLimitInMemory(identifier, config)
}

function checkRateLimitInMemory(
  identifier: string,
  config: RateLimitConfig
): RateLimitResult {
  const now = Date.now()
  const windowMs = config.windowInSeconds * 1000
  const key = identifier

  let entry = rateLimitStore.get(key)

  // Se não existe ou expirou, criar nova entrada
  if (!entry || entry.resetTime < now) {
    entry = {
      count: 1,
      resetTime: now + windowMs,
    }
    rateLimitStore.set(key, entry)

    return {
      success: true,
      limit: config.limit,
      remaining: config.limit - 1,
      reset: entry.resetTime,
    }
  }

  // Incrementar contador
  entry.count++

  // Verificar se excedeu o limite
  if (entry.count > config.limit) {
    return {
      success: false,
      limit: config.limit,
      remaining: 0,
      reset: entry.resetTime,
    }
  }

  return {
    success: true,
    limit: config.limit,
    remaining: config.limit - entry.count,
    reset: entry.resetTime,
  }
}

// ============================================
// CONFIGURAÇÕES PRÉ-DEFINIDAS
// ============================================

export const rateLimitConfigs = {
  // Login: 5 tentativas por minuto (proteção brute force)
  auth: { limit: 5, windowInSeconds: 60 },

  // Registro: 3 por minuto (proteção spam)
  register: { limit: 3, windowInSeconds: 60 },

  // API geral: 100 requisições por minuto
  api: { limit: 100, windowInSeconds: 60 },

  // Endpoints sensíveis: 10 requisições por minuto
  sensitive: { limit: 10, windowInSeconds: 60 },

  // Upload: 10 uploads por minuto
  upload: { limit: 10, windowInSeconds: 60 },

  // Reset de senha: 3 por hora
  passwordReset: { limit: 3, windowInSeconds: 3600 },

  // DELETE: 20 por minuto (proteção contra exclusão em massa)
  delete: { limit: 20, windowInSeconds: 60 },
}

// ============================================
// HELPERS
// ============================================

/**
 * Extrai IP do request
 */
export function getClientIP(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for")
  if (forwarded) {
    return forwarded.split(",")[0].trim()
  }

  const realIp = request.headers.get("x-real-ip")
  if (realIp) {
    return realIp
  }

  // Vercel specific
  const cfConnectingIp = request.headers.get("cf-connecting-ip")
  if (cfConnectingIp) {
    return cfConnectingIp
  }

  return "unknown"
}

/**
 * Cria resposta de rate limit excedido
 */
export function rateLimitExceededResponse(result: RateLimitResult): Response {
  const retryAfter = Math.ceil((result.reset - Date.now()) / 1000)

  return new Response(
    JSON.stringify({
      error: "Muitas requisições. Tente novamente em alguns instantes.",
      retryAfter,
    }),
    {
      status: 429,
      headers: {
        "Content-Type": "application/json",
        "X-RateLimit-Limit": result.limit.toString(),
        "X-RateLimit-Remaining": result.remaining.toString(),
        "X-RateLimit-Reset": result.reset.toString(),
        "Retry-After": retryAfter.toString(),
      },
    }
  )
}

/**
 * Verifica se o Upstash Redis está configurado
 */
export function isRedisConfigured(): boolean {
  return !!(process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN)
}
