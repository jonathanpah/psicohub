"use client"

import * as React from "react"
import { Input } from "./input"

type MaskType = "phone" | "cpf" | "cnpj" | "crp" | "currency" | "date" | "time"

interface MaskedInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "onChange"> {
  mask: MaskType
  onChange?: (value: string) => void
}

function applyMask(value: string, mask: MaskType): string {
  const digits = value.replace(/\D/g, "")

  switch (mask) {
    case "phone":
      // (00) 00000-0000
      if (digits.length <= 2) {
        return digits.length ? `(${digits}` : ""
      } else if (digits.length <= 7) {
        return `(${digits.slice(0, 2)}) ${digits.slice(2)}`
      } else {
        return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7, 11)}`
      }

    case "cpf":
      // 000.000.000-00
      if (digits.length <= 3) {
        return digits
      } else if (digits.length <= 6) {
        return `${digits.slice(0, 3)}.${digits.slice(3)}`
      } else if (digits.length <= 9) {
        return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6)}`
      } else {
        return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6, 9)}-${digits.slice(9, 11)}`
      }

    case "cnpj":
      // 00.000.000/0000-00
      if (digits.length <= 2) {
        return digits
      } else if (digits.length <= 5) {
        return `${digits.slice(0, 2)}.${digits.slice(2)}`
      } else if (digits.length <= 8) {
        return `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5)}`
      } else if (digits.length <= 12) {
        return `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5, 8)}/${digits.slice(8)}`
      } else {
        return `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5, 8)}/${digits.slice(8, 12)}-${digits.slice(12, 14)}`
      }

    case "crp":
      // 00/00000
      if (digits.length <= 2) {
        return digits
      } else {
        return `${digits.slice(0, 2)}/${digits.slice(2, 7)}`
      }

    case "currency":
      // R$ 1.500,00
      if (!digits) return ""

      // Convert to number (cents)
      const cents = parseInt(digits, 10)

      // Format as Brazilian currency
      const formatted = (cents / 100).toLocaleString("pt-BR", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })

      return `R$ ${formatted}`

    case "date":
      // DD/MM/AAAA
      if (digits.length <= 2) {
        return digits
      } else if (digits.length <= 4) {
        return `${digits.slice(0, 2)}/${digits.slice(2)}`
      } else {
        return `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4, 8)}`
      }

    case "time":
      // HH:MM
      if (digits.length <= 2) {
        return digits
      } else {
        return `${digits.slice(0, 2)}:${digits.slice(2, 4)}`
      }

    default:
      return value
  }
}

function getMaxLength(mask: MaskType): number {
  switch (mask) {
    case "phone":
      return 15 // (00) 00000-0000
    case "cpf":
      return 14 // 000.000.000-00
    case "cnpj":
      return 18 // 00.000.000/0000-00
    case "crp":
      return 8 // 00/00000
    case "currency":
      return 20 // R$ 999.999.999,99
    case "date":
      return 10 // DD/MM/AAAA
    case "time":
      return 5 // HH:MM
    default:
      return 100
  }
}

const MaskedInput = React.forwardRef<HTMLInputElement, MaskedInputProps>(
  ({ mask, onChange, defaultValue, ...props }, ref) => {
    const [value, setValue] = React.useState(() => {
      if (defaultValue) {
        return applyMask(String(defaultValue), mask)
      }
      return ""
    })

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const maskedValue = applyMask(e.target.value, mask)
      setValue(maskedValue)
      onChange?.(maskedValue)
    }

    return (
      <Input
        ref={ref}
        value={value}
        onChange={handleChange}
        maxLength={getMaxLength(mask)}
        {...props}
      />
    )
  }
)

MaskedInput.displayName = "MaskedInput"

// Helper function to parse Brazilian currency string to number
function parseCurrency(value: string): number {
  if (!value) return 0
  // Remove R$, spaces, and thousand separators, then replace comma with dot
  const cleaned = value
    .replace(/R\$\s?/g, "")
    .replace(/\./g, "")
    .replace(",", ".")
    .trim()
  return parseFloat(cleaned) || 0
}

// Helper function to parse Brazilian date (DD/MM/AAAA) to ISO format (YYYY-MM-DD)
function parseDate(value: string): string {
  if (!value) return ""
  const parts = value.split("/")
  if (parts.length !== 3) return ""
  const [day, month, year] = parts
  if (!day || !month || !year || year.length !== 4) return ""
  return `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`
}

// Helper function to format ISO date (YYYY-MM-DD) to Brazilian format (DD/MM/AAAA)
function formatDateToBR(isoDate: string): string {
  if (!isoDate) return ""
  const parts = isoDate.split("-")
  if (parts.length !== 3) return ""
  const [year, month, day] = parts
  return `${day}/${month}/${year}`
}

// Helper function to format time (keeps HH:MM format)
function parseTime(value: string): string {
  if (!value) return ""
  return value.replace(":", "").length >= 4
    ? `${value.slice(0, 2)}:${value.slice(3, 5)}`
    : value
}

export { MaskedInput, parseCurrency, parseDate, formatDateToBR, parseTime }
