"use client"

import { useEffect, useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { MaskedInput } from "@/components/ui/masked-input"
import { Camera, FileText } from "lucide-react"
import { Checkbox } from "@/components/ui/checkbox"

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
  avatar: string | null
  // Configurações do recibo
  receiptShowName: boolean
  receiptShowCpf: boolean
  receiptShowCrp: boolean
  receiptShowPhone: boolean
  receiptShowClinicName: boolean
  receiptShowClinicCnpj: boolean
  receiptShowClinicAddress: boolean
  receiptShowClinicPhone: boolean
}

export default function PerfilPage() {
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

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

  async function handleAvatarUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    setUploading(true)
    setMessage(null)

    const formData = new FormData()
    formData.append("file", file)

    try {
      const response = await fetch("/api/upload/avatar", {
        method: "POST",
        body: formData,
      })

      if (response.ok) {
        const data = await response.json()
        setProfile((prev) => prev ? { ...prev, avatar: data.url } : null)
        setMessage({ type: "success", text: "Foto atualizada com sucesso!" })
      } else {
        const error = await response.json()
        setMessage({ type: "error", text: error.error || "Erro ao enviar foto" })
      }
    } catch {
      setMessage({ type: "error", text: "Erro ao enviar foto" })
    } finally {
      setUploading(false)
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
          // Configurações do recibo
          receiptShowName: profile.receiptShowName,
          receiptShowCpf: profile.receiptShowCpf,
          receiptShowCrp: profile.receiptShowCrp,
          receiptShowPhone: profile.receiptShowPhone,
          receiptShowClinicName: profile.receiptShowClinicName,
          receiptShowClinicCnpj: profile.receiptShowClinicCnpj,
          receiptShowClinicAddress: profile.receiptShowClinicAddress,
          receiptShowClinicPhone: profile.receiptShowClinicPhone,
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
        <p className="text-gray-400">Carregando...</p>
      </div>
    )
  }

  if (!profile) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-gray-400">Erro ao carregar perfil</p>
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
    <div className="space-y-8">
      <div>
        <h1 className="text-xl font-medium text-gray-900 tracking-tight">Perfil</h1>
        <p className="text-sm text-gray-500 mt-1">Gerencie suas informações pessoais e da clínica</p>
      </div>

      {message && (
        <div
          className={`px-4 py-3 rounded-lg text-sm ${
            message.type === "success"
              ? "bg-emerald-50 text-emerald-600"
              : "bg-red-50 text-red-600"
          }`}
        >
          {message.text}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div className="grid gap-6 md:grid-cols-3">
          <Card className="md:col-span-1">
            <CardContent className="pt-6 flex flex-col items-center">
              <div className="relative">
                <Avatar className="h-24 w-24">
                  <AvatarImage src={profile.avatar || undefined} alt={profile.name} />
                  <AvatarFallback className="bg-gray-100 text-gray-600 text-xl font-medium">
                    {initials}
                  </AvatarFallback>
                </Avatar>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                  className="absolute bottom-0 right-0 bg-gray-900 text-white p-2 rounded-full hover:bg-gray-800 transition-colors disabled:opacity-50"
                >
                  <Camera className="h-3.5 w-3.5" />
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarUpload}
                  className="hidden"
                />
              </div>
              {uploading && (
                <p className="text-xs text-gray-400 mt-2">Enviando...</p>
              )}
              <h3 className="mt-4 text-base font-medium text-gray-900">{profile.name}</h3>
              <p className="text-gray-500 text-sm">{profile.email}</p>
              {profile.crp && (
                <p className="text-gray-400 text-xs mt-1">CRP: {profile.crp}</p>
              )}
            </CardContent>
          </Card>

          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle className="text-sm font-medium">Dados Pessoais</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="name" className="text-sm text-gray-600">Nome completo</Label>
                  <Input
                    id="name"
                    name="name"
                    defaultValue={profile.name}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-sm text-gray-600">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    defaultValue={profile.email}
                    disabled
                    className="bg-gray-50"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone" className="text-sm text-gray-600">Telefone</Label>
                  <MaskedInput
                    id="phone"
                    name="phone"
                    mask="phone"
                    defaultValue={profile.phone || ""}
                    placeholder="(00) 00000-0000"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="cpf" className="text-sm text-gray-600">CPF</Label>
                  <MaskedInput
                    id="cpf"
                    name="cpf"
                    mask="cpf"
                    defaultValue={profile.cpf || ""}
                    placeholder="000.000.000-00"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="crp" className="text-sm text-gray-600">CRP</Label>
                  <MaskedInput
                    id="crp"
                    name="crp"
                    mask="crp"
                    defaultValue={profile.crp || ""}
                    placeholder="00/00000"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="md:col-span-3">
            <CardHeader>
              <CardTitle className="text-sm font-medium">Dados da Clínica</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="clinicName" className="text-sm text-gray-600">Nome da Clínica</Label>
                  <Input
                    id="clinicName"
                    name="clinicName"
                    defaultValue={profile.clinicName || ""}
                    placeholder="Nome do consultório ou clínica"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="clinicCnpj" className="text-sm text-gray-600">CNPJ</Label>
                  <MaskedInput
                    id="clinicCnpj"
                    name="clinicCnpj"
                    mask="cnpj"
                    defaultValue={profile.clinicCnpj || ""}
                    placeholder="00.000.000/0000-00"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="clinicPhone" className="text-sm text-gray-600">Telefone da Clínica</Label>
                  <MaskedInput
                    id="clinicPhone"
                    name="clinicPhone"
                    mask="phone"
                    defaultValue={profile.clinicPhone || ""}
                    placeholder="(00) 0000-0000"
                  />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="clinicAddress" className="text-sm text-gray-600">Endereço</Label>
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

          {/* Configurações do Recibo */}
          <Card className="md:col-span-3">
            <CardHeader>
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Configurações do Recibo para Paciente
              </CardTitle>
              <p className="text-xs text-gray-500 mt-1">
                Escolha quais informações aparecerão no recibo gerado para o paciente
              </p>
            </CardHeader>
            <CardContent>
              <div className="grid gap-6 md:grid-cols-2">
                {/* Dados Pessoais no Recibo */}
                <div className="space-y-4">
                  <h4 className="text-sm font-medium text-gray-700">Dados Pessoais</h4>
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <Checkbox
                        id="receiptShowName"
                        checked={profile.receiptShowName}
                        onCheckedChange={(checked) =>
                          setProfile({ ...profile, receiptShowName: checked === true })
                        }
                      />
                      <Label htmlFor="receiptShowName" className="text-sm font-normal cursor-pointer">
                        Meu nome completo
                      </Label>
                    </div>
                    <div className="flex items-center gap-2">
                      <Checkbox
                        id="receiptShowCpf"
                        checked={profile.receiptShowCpf}
                        onCheckedChange={(checked) =>
                          setProfile({ ...profile, receiptShowCpf: checked === true })
                        }
                      />
                      <Label htmlFor="receiptShowCpf" className="text-sm font-normal cursor-pointer">
                        Meu CPF
                      </Label>
                    </div>
                    <div className="flex items-center gap-2">
                      <Checkbox
                        id="receiptShowCrp"
                        checked={profile.receiptShowCrp}
                        onCheckedChange={(checked) =>
                          setProfile({ ...profile, receiptShowCrp: checked === true })
                        }
                      />
                      <Label htmlFor="receiptShowCrp" className="text-sm font-normal cursor-pointer">
                        Meu CRP
                      </Label>
                    </div>
                    <div className="flex items-center gap-2">
                      <Checkbox
                        id="receiptShowPhone"
                        checked={profile.receiptShowPhone}
                        onCheckedChange={(checked) =>
                          setProfile({ ...profile, receiptShowPhone: checked === true })
                        }
                      />
                      <Label htmlFor="receiptShowPhone" className="text-sm font-normal cursor-pointer">
                        Meu telefone pessoal
                      </Label>
                    </div>
                  </div>
                </div>

                {/* Dados da Clínica no Recibo */}
                <div className="space-y-4">
                  <h4 className="text-sm font-medium text-gray-700">Dados da Clínica</h4>
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <Checkbox
                        id="receiptShowClinicName"
                        checked={profile.receiptShowClinicName}
                        onCheckedChange={(checked) =>
                          setProfile({ ...profile, receiptShowClinicName: checked === true })
                        }
                      />
                      <Label htmlFor="receiptShowClinicName" className="text-sm font-normal cursor-pointer">
                        Nome da clínica
                      </Label>
                    </div>
                    <div className="flex items-center gap-2">
                      <Checkbox
                        id="receiptShowClinicCnpj"
                        checked={profile.receiptShowClinicCnpj}
                        onCheckedChange={(checked) =>
                          setProfile({ ...profile, receiptShowClinicCnpj: checked === true })
                        }
                      />
                      <Label htmlFor="receiptShowClinicCnpj" className="text-sm font-normal cursor-pointer">
                        CNPJ da clínica
                      </Label>
                    </div>
                    <div className="flex items-center gap-2">
                      <Checkbox
                        id="receiptShowClinicAddress"
                        checked={profile.receiptShowClinicAddress}
                        onCheckedChange={(checked) =>
                          setProfile({ ...profile, receiptShowClinicAddress: checked === true })
                        }
                      />
                      <Label htmlFor="receiptShowClinicAddress" className="text-sm font-normal cursor-pointer">
                        Endereço da clínica
                      </Label>
                    </div>
                    <div className="flex items-center gap-2">
                      <Checkbox
                        id="receiptShowClinicPhone"
                        checked={profile.receiptShowClinicPhone}
                        onCheckedChange={(checked) =>
                          setProfile({ ...profile, receiptShowClinicPhone: checked === true })
                        }
                      />
                      <Label htmlFor="receiptShowClinicPhone" className="text-sm font-normal cursor-pointer">
                        Telefone da clínica
                      </Label>
                    </div>
                  </div>
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
