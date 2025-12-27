"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"

interface Profile {
  id: string
  name: string
  email: string
  phone: string | null
  cpf: string | null
  crp: string | null
  specialties: string[]
  clinicName: string | null
  clinicCnpj: string | null
  clinicAddress: string | null
  clinicPhone: string | null
}

export default function PerfilPage() {
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null)

  useEffect(() => {
    fetchProfile()
  }, [])

  async function fetchProfile() {
    try {
      const response = await fetch("/api/profile")
      if (response.ok) {
        const data = await response.json()
        setProfile(data)
      }
    } catch (error) {
      console.error("Erro ao carregar perfil:", error)
    } finally {
      setLoading(false)
    }
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (!profile) return

    setSaving(true)
    setMessage(null)

    const formData = new FormData(e.currentTarget)

    try {
      const response = await fetch("/api/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.get("name"),
          phone: formData.get("phone"),
          cpf: formData.get("cpf"),
          crp: formData.get("crp"),
          clinicName: formData.get("clinicName"),
          clinicCnpj: formData.get("clinicCnpj"),
          clinicAddress: formData.get("clinicAddress"),
          clinicPhone: formData.get("clinicPhone"),
        }),
      })

      if (response.ok) {
        const data = await response.json()
        setProfile(data)
        setMessage({ type: "success", text: "Perfil atualizado com sucesso!" })
      } else {
        const error = await response.json()
        setMessage({ type: "error", text: error.error || "Erro ao atualizar perfil" })
      }
    } catch {
      setMessage({ type: "error", text: "Erro ao atualizar perfil" })
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-gray-500">Carregando...</p>
      </div>
    )
  }

  if (!profile) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-gray-500">Erro ao carregar perfil</p>
      </div>
    )
  }

  const initials = profile.name
    ?.split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2) || "PS"

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Perfil</h1>
        <p className="text-gray-600">Gerencie suas informações pessoais e da clínica</p>
      </div>

      {message && (
        <div
          className={`p-4 rounded-md ${
            message.type === "success"
              ? "bg-green-50 text-green-700"
              : "bg-red-50 text-red-700"
          }`}
        >
          {message.text}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div className="grid gap-6 md:grid-cols-3">
          <Card className="md:col-span-1">
            <CardContent className="pt-6 flex flex-col items-center">
              <Avatar className="h-24 w-24">
                <AvatarFallback className="bg-blue-100 text-blue-700 text-2xl">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <h3 className="mt-4 text-lg font-semibold">{profile.name}</h3>
              <p className="text-gray-500 text-sm">{profile.email}</p>
              {profile.crp && (
                <p className="text-gray-500 text-sm mt-1">CRP: {profile.crp}</p>
              )}
            </CardContent>
          </Card>

          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle>Dados Pessoais</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="name">Nome completo</Label>
                  <Input
                    id="name"
                    name="name"
                    defaultValue={profile.name}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    defaultValue={profile.email}
                    disabled
                    className="bg-gray-50"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Telefone</Label>
                  <Input
                    id="phone"
                    name="phone"
                    defaultValue={profile.phone || ""}
                    placeholder="(00) 00000-0000"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="cpf">CPF</Label>
                  <Input
                    id="cpf"
                    name="cpf"
                    defaultValue={profile.cpf || ""}
                    placeholder="000.000.000-00"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="crp">CRP</Label>
                  <Input
                    id="crp"
                    name="crp"
                    defaultValue={profile.crp || ""}
                    placeholder="00/00000"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="md:col-span-3">
            <CardHeader>
              <CardTitle>Dados da Clínica</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="clinicName">Nome da Clínica</Label>
                  <Input
                    id="clinicName"
                    name="clinicName"
                    defaultValue={profile.clinicName || ""}
                    placeholder="Nome do consultório ou clínica"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="clinicCnpj">CNPJ</Label>
                  <Input
                    id="clinicCnpj"
                    name="clinicCnpj"
                    defaultValue={profile.clinicCnpj || ""}
                    placeholder="00.000.000/0000-00"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="clinicPhone">Telefone da Clínica</Label>
                  <Input
                    id="clinicPhone"
                    name="clinicPhone"
                    defaultValue={profile.clinicPhone || ""}
                    placeholder="(00) 0000-0000"
                  />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="clinicAddress">Endereço</Label>
                  <Input
                    id="clinicAddress"
                    name="clinicAddress"
                    defaultValue={profile.clinicAddress || ""}
                    placeholder="Rua, número, bairro, cidade - UF"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="md:col-span-3">
            <Button type="submit" disabled={saving}>
              {saving ? "Salvando..." : "Salvar alterações"}
            </Button>
          </div>
        </div>
      </form>
    </div>
  )
}
