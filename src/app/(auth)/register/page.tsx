"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { MaskedInput } from "@/components/ui/masked-input"

export default function RegisterPage() {
  const router = useRouter()
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError("")
    setLoading(true)

    const formData = new FormData(e.currentTarget)

    // Validação segura dos campos
    const name = formData.get("name")
    const email = formData.get("email")
    const phone = formData.get("phone")
    const cpf = formData.get("cpf")
    const crp = formData.get("crp")
    const password = formData.get("password")

    // Verificar se todos os campos obrigatórios são strings válidas
    if (typeof name !== "string" || !name.trim()) {
      setError("Nome é obrigatório")
      setLoading(false)
      return
    }

    if (typeof email !== "string" || !email.trim()) {
      setError("Email é obrigatório")
      setLoading(false)
      return
    }

    // Validar formato de email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      setError("Email inválido")
      setLoading(false)
      return
    }

    if (typeof phone !== "string" || !phone.trim()) {
      setError("Telefone é obrigatório")
      setLoading(false)
      return
    }

    // Validar telefone (mínimo 10 dígitos)
    const phoneDigits = phone.replace(/\D/g, "")
    if (phoneDigits.length < 10) {
      setError("Telefone inválido")
      setLoading(false)
      return
    }

    if (typeof cpf !== "string" || !cpf.trim()) {
      setError("CPF é obrigatório")
      setLoading(false)
      return
    }

    // Validar CPF (11 dígitos)
    const cpfDigits = cpf.replace(/\D/g, "")
    if (cpfDigits.length !== 11) {
      setError("CPF inválido")
      setLoading(false)
      return
    }

    if (typeof password !== "string" || password.length < 12) {
      setError("Senha deve ter pelo menos 12 caracteres")
      setLoading(false)
      return
    }

    // CRP é opcional, mas se preenchido, validar
    const crpValue = typeof crp === "string" ? crp.trim() : ""

    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim().toLowerCase(),
          phone: phone.trim(),
          cpf: cpf.trim(),
          crp: crpValue || undefined,
          password,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || "Erro ao criar conta")
      } else {
        router.push("/login?registered=true")
      }
    } catch {
      setError("Ocorreu um erro. Tente novamente.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#fafafa] px-4 py-12">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-semibold tracking-tight text-gray-900">
            PsicoHub
          </h1>
          <p className="text-sm text-gray-500 mt-2">
            Crie sua conta gratuita
          </p>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 p-8 shadow-sm">
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="bg-red-50 text-red-600 px-4 py-3 rounded-lg text-sm">
                {error}
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="name" className="text-sm text-gray-600">
                Nome completo
              </Label>
              <Input
                id="name"
                name="name"
                type="text"
                placeholder="Seu nome completo"
                required
                className="h-11"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm text-gray-600">
                Email
              </Label>
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="seu@email.com"
                required
                className="h-11"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="phone" className="text-sm text-gray-600">
                  Telefone
                </Label>
                <MaskedInput
                  id="phone"
                  name="phone"
                  mask="phone"
                  placeholder="(00) 00000-0000"
                  required
                  className="h-11"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="cpf" className="text-sm text-gray-600">
                  CPF
                </Label>
                <MaskedInput
                  id="cpf"
                  name="cpf"
                  mask="cpf"
                  placeholder="000.000.000-00"
                  required
                  className="h-11"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="crp" className="text-sm text-gray-600">
                CRP <span className="text-gray-400">(opcional)</span>
              </Label>
              <MaskedInput
                id="crp"
                name="crp"
                mask="crp"
                placeholder="00/00000"
                className="h-11"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-sm text-gray-600">
                Senha
              </Label>
              <Input
                id="password"
                name="password"
                type="password"
                placeholder="Mínimo 6 caracteres"
                minLength={6}
                required
                className="h-11"
              />
            </div>

            <Button
              type="submit"
              className="w-full h-11 mt-2"
              disabled={loading}
            >
              {loading ? "Criando conta..." : "Criar conta"}
            </Button>
          </form>
        </div>

        <p className="text-sm text-gray-500 text-center mt-6">
          Já tem uma conta?{" "}
          <Link
            href="/login"
            className="text-gray-900 font-medium hover:underline"
          >
            Entrar
          </Link>
        </p>
      </div>
    </div>
  )
}
