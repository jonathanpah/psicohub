import { describe, it, expect } from "vitest"
import {
  maskCPF,
  maskCNPJ,
  maskPhone,
  maskEmail,
  maskCRP,
  maskName,
} from "@/lib/data-masking"

describe("Data Masking", () => {
  describe("maskCPF", () => {
    it("should mask a valid CPF", () => {
      expect(maskCPF("123.456.789-00")).toBe("123.***.***-00")
      expect(maskCPF("12345678900")).toBe("123.***.***-00")
    })

    it("should return null for null/undefined", () => {
      expect(maskCPF(null)).toBeNull()
      expect(maskCPF(undefined)).toBeNull()
    })

    it("should return original for invalid CPF", () => {
      expect(maskCPF("123")).toBe("123")
    })
  })

  describe("maskCNPJ", () => {
    it("should mask a valid CNPJ", () => {
      expect(maskCNPJ("12.345.678/0001-90")).toBe("12.***.***/*****-90")
    })

    it("should return null for null/undefined", () => {
      expect(maskCNPJ(null)).toBeNull()
    })
  })

  describe("maskPhone", () => {
    it("should mask a valid phone", () => {
      expect(maskPhone("(11) 98765-4321")).toBe("(11) *****-4321")
      expect(maskPhone("11987654321")).toBe("(11) *****-4321")
    })

    it("should return null for null/undefined", () => {
      expect(maskPhone(null)).toBeNull()
    })
  })

  describe("maskEmail", () => {
    it("should mask a valid email", () => {
      expect(maskEmail("usuario@dominio.com")).toBe("u***o@dominio.com")
    })

    it("should return null for null/undefined", () => {
      expect(maskEmail(null)).toBeNull()
    })

    it("should handle short local parts", () => {
      expect(maskEmail("a@b.com")).toBe("a@b.com")
    })
  })

  describe("maskCRP", () => {
    it("should mask a valid CRP", () => {
      expect(maskCRP("06/12345")).toBe("06/***45")
    })

    it("should return null for null/undefined", () => {
      expect(maskCRP(null)).toBeNull()
    })
  })

  describe("maskName", () => {
    it("should mask a name", () => {
      expect(maskName("João Silva")).toBe("J*** S***")
      expect(maskName("Maria")).toBe("M***")
    })

    it("should return null for null/undefined", () => {
      expect(maskName(null)).toBeNull()
    })
  })
})
