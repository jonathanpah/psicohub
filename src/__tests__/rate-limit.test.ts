import { describe, it, expect } from "vitest"
import { checkRateLimit, checkRateLimitSync, rateLimitConfigs } from "@/lib/rate-limit"

describe("Rate Limiting", () => {
  describe("checkRateLimit (async)", () => {
    it("should allow requests under the limit", async () => {
      const key = `test-async-${Date.now()}`
      const config = { limit: 5, windowInSeconds: 60 }

      const result1 = await checkRateLimit(key, config)
      expect(result1.success).toBe(true)
      expect(result1.remaining).toBe(4)

      const result2 = await checkRateLimit(key, config)
      expect(result2.success).toBe(true)
      expect(result2.remaining).toBe(3)
    })

    it("should block requests over the limit", async () => {
      const key = `test-async-block-${Date.now()}`
      const config = { limit: 2, windowInSeconds: 60 }

      await checkRateLimit(key, config) // 1
      await checkRateLimit(key, config) // 2

      const result = await checkRateLimit(key, config) // 3 - should fail
      expect(result.success).toBe(false)
      expect(result.remaining).toBe(0)
    })
  })

  describe("checkRateLimitSync", () => {
    it("should allow requests under the limit", () => {
      const key = `test-sync-${Date.now()}`
      const config = { limit: 5, windowInSeconds: 60 }

      const result1 = checkRateLimitSync(key, config)
      expect(result1.success).toBe(true)
      expect(result1.remaining).toBe(4)

      const result2 = checkRateLimitSync(key, config)
      expect(result2.success).toBe(true)
      expect(result2.remaining).toBe(3)
    })

    it("should block requests over the limit", () => {
      const key = `test-sync-block-${Date.now()}`
      const config = { limit: 2, windowInSeconds: 60 }

      checkRateLimitSync(key, config) // 1
      checkRateLimitSync(key, config) // 2

      const result = checkRateLimitSync(key, config) // 3 - should fail
      expect(result.success).toBe(false)
      expect(result.remaining).toBe(0)
    })
  })

  describe("rateLimitConfigs", () => {
    it("should have correct config for auth", () => {
      expect(rateLimitConfigs.auth.limit).toBe(5)
      expect(rateLimitConfigs.auth.windowInSeconds).toBe(60)
    })

    it("should have correct config for register", () => {
      expect(rateLimitConfigs.register.limit).toBe(3)
      expect(rateLimitConfigs.register.windowInSeconds).toBe(60)
    })

    it("should have correct config for api", () => {
      expect(rateLimitConfigs.api.limit).toBe(100)
      expect(rateLimitConfigs.api.windowInSeconds).toBe(60)
    })

    it("should have correct config for password reset", () => {
      expect(rateLimitConfigs.passwordReset.limit).toBe(3)
      expect(rateLimitConfigs.passwordReset.windowInSeconds).toBe(3600)
    })
  })
})
