"use client"

import { useEffect, useState } from "react"
import { useRouter, useParams } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { MaskedInput } from "@/components/ui/masked-input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { ArrowLeft } from "lucide-react"

interface Patient {
  id: string
  name: string
  email: string | null
  phone: string | null
  cpf: string | null
  birthDate: string | null
  address: string | null
  guardian: string | null
  guardianCpf: string | null
  guardianEmail: string | null
  guardianPhone: string | null
  guardianAddress: string | null
  guardianRelation: string | null
  guardian2: string | null
  guardian2Cpf: string | null
  guardian2Email: string | null
  guardian2Phone: string | null
  guardian2Address: string | null
  guardian2Relation: string | null
  notes: string | null
  status: "ACTIVE" | "INACTIVE" | "ARCHIVED"
}

export default function EditarPacientePage() {
  const router = useRouter()
  const params = useParams()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")
  const [patient, setPatient] = useState<Patient | null>(null)
  const [guardianRelation, setGuardianRelation] = useState("")
  const [guardian2Relation, setGuardian2Relation] = useState("")

  useEffect(() => {
    fetchPatient()
  }, [params.id])

  async function fetchPatient() {
    try {
      const response = await fetch(`/api/patients/${params.id}`)
      if (response.ok) {
        const data = await response.json()
        setPatient(data)
        setGuardianRelation(data.guardianRelation || "")
        setGuardian2Relation(data.guardian2Relation || "")
      } else if (response.status === 404) {
        router.push("/pacientes")
      }
    } catch (error: unknown) {
      setError("Erro ao carregar dados do paciente")
    } finally {
      setLoading(false)
    }
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setSaving(true)
    setError("")

    const formData = new FormData(e.currentTarget)

    try {
      const response = await fetch(`/api/patients/${params.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.get("name"),
          email: formData.get("email"),
          phone: formData.get("phone"),
          cpf: formData.get("cpf"),
          birthDate: formData.get("birthDate") || null,
          address: formData.get("address"),
          // Dados do responsável 1
          guardian: formData.get("guardian"),
          guardianCpf: formData.get("guardianCpf"),
          guardianEmail: formData.get("guardianEmail"),
          guardianPhone: formData.get("guardianPhone"),
          guardianAddress: formData.get("guardianAddress"),
          guardianRelation: guardianRelation || null,
          // Dados do responsável 2
          guardian2: formData.get("guardian2"),
          guardian2Cpf: formData.get("guardian2Cpf"),
          guardian2Email: formData.get("guardian2Email"),
          guardian2Phone: formData.get("guardian2Phone"),
          guardian2Address: formData.get("guardian2Address"),
          guardian2Relation: guardian2Relation || null,
          notes: formData.get("notes"),
          status: patient?.status,
        }),
      })

      if (response.ok) {
        router.push(`/pacientes/${params.id}`)
      } else {
        const data = await response.json()
        setError(data.error || "Erro ao atualizar paciente")
      }
    } catch {
      setError("Erro ao atualizar paciente")
    } finally {
      setSaving(false)
    }
  }

  function formatDateForInput(dateString: string | null) {
    if (!dateString) return ""
    const date = new Date(dateString)
    return date.toISOString().split("T")[0]
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-gray-500">Carregando...</p>
      </div>
    )
  }

  if (!patient) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-gray-500">Paciente não encontrado</p>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-4">
        <Link href={`/pacientes/${patient.id}`}>
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-xl font-medium text-gray-900 tracking-tight">Editar Paciente</h1>
          <p className="text-sm text-gray-500 mt-1">{patient.name}</p>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 text-red-600 p-4 rounded-md">{error}</div>
      )}

      <form onSubmit={handleSubmit}>
        <div className="grid gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Dados Pessoais</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="name">Nome completo *</Label>
                <Input
                  id="name"
                  name="name"
                  placeholder="Nome do paciente"
                  defaultValue={patient.name}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="email@exemplo.com"
                  defaultValue={patient.email || ""}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Telefone</Label>
                <MaskedInput
                  id="phone"
                  name="phone"
                  mask="phone"
                  placeholder="(00) 00000-0000"
                  defaultValue={patient.phone || ""}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="cpf">CPF</Label>
                <MaskedInput
                  id="cpf"
                  name="cpf"
                  mask="cpf"
                  placeholder="000.000.000-00"
                  defaultValue={patient.cpf || ""}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="birthDate">Data de Nascimento</Label>
                <Input
                  id="birthDate"
                  name="birthDate"
                  type="date"
                  defaultValue={formatDateForInput(patient.birthDate)}
                />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="address">Endereço</Label>
                <Input
                  id="address"
                  name="address"
                  placeholder="Rua, número, bairro, cidade - UF"
                  defaultValue={patient.address || ""}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Responsável 1 (para menores de idade)</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="guardian">Nome do Responsável</Label>
                <Input
                  id="guardian"
                  name="guardian"
                  placeholder="Nome completo do responsável"
                  defaultValue={patient.guardian || ""}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="guardianRelation">Relação com o Menor</Label>
                <Select
                  value={guardianRelation}
                  onValueChange={setGuardianRelation}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione a relação" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pai">Pai</SelectItem>
                    <SelectItem value="mae">Mãe</SelectItem>
                    <SelectItem value="avo">Avô/Avó</SelectItem>
                    <SelectItem value="tio">Tio/Tia</SelectItem>
                    <SelectItem value="padrasto">Padrasto/Madrasta</SelectItem>
                    <SelectItem value="tutor">Tutor Legal</SelectItem>
                    <SelectItem value="outro">Outro</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="guardianCpf">CPF do Responsável</Label>
                <MaskedInput
                  id="guardianCpf"
                  name="guardianCpf"
                  mask="cpf"
                  placeholder="000.000.000-00"
                  defaultValue={patient.guardianCpf || ""}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="guardianPhone">Telefone do Responsável</Label>
                <MaskedInput
                  id="guardianPhone"
                  name="guardianPhone"
                  mask="phone"
                  placeholder="(00) 00000-0000"
                  defaultValue={patient.guardianPhone || ""}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="guardianEmail">Email do Responsável</Label>
                <Input
                  id="guardianEmail"
                  name="guardianEmail"
                  type="email"
                  placeholder="email@exemplo.com"
                  defaultValue={patient.guardianEmail || ""}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="guardianAddress">Endereço do Responsável</Label>
                <Input
                  id="guardianAddress"
                  name="guardianAddress"
                  placeholder="Rua, número, bairro, cidade - UF"
                  defaultValue={patient.guardianAddress || ""}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Responsável 2 (opcional)</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="guardian2">Nome do Responsável</Label>
                <Input
                  id="guardian2"
                  name="guardian2"
                  placeholder="Nome completo do responsável"
                  defaultValue={patient.guardian2 || ""}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="guardian2Relation">Relação com o Menor</Label>
                <Select
                  value={guardian2Relation}
                  onValueChange={setGuardian2Relation}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione a relação" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pai">Pai</SelectItem>
                    <SelectItem value="mae">Mãe</SelectItem>
                    <SelectItem value="avo">Avô/Avó</SelectItem>
                    <SelectItem value="tio">Tio/Tia</SelectItem>
                    <SelectItem value="padrasto">Padrasto/Madrasta</SelectItem>
                    <SelectItem value="tutor">Tutor Legal</SelectItem>
                    <SelectItem value="outro">Outro</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="guardian2Cpf">CPF do Responsável</Label>
                <MaskedInput
                  id="guardian2Cpf"
                  name="guardian2Cpf"
                  mask="cpf"
                  placeholder="000.000.000-00"
                  defaultValue={patient.guardian2Cpf || ""}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="guardian2Phone">Telefone do Responsável</Label>
                <MaskedInput
                  id="guardian2Phone"
                  name="guardian2Phone"
                  mask="phone"
                  placeholder="(00) 00000-0000"
                  defaultValue={patient.guardian2Phone || ""}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="guardian2Email">Email do Responsável</Label>
                <Input
                  id="guardian2Email"
                  name="guardian2Email"
                  type="email"
                  placeholder="email@exemplo.com"
                  defaultValue={patient.guardian2Email || ""}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="guardian2Address">Endereço do Responsável</Label>
                <Input
                  id="guardian2Address"
                  name="guardian2Address"
                  placeholder="Rua, número, bairro, cidade - UF"
                  defaultValue={patient.guardian2Address || ""}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Observações</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Textarea
                  id="notes"
                  name="notes"
                  placeholder="Informações adicionais sobre o paciente..."
                  rows={4}
                  defaultValue={patient.notes || ""}
                />
              </div>
            </CardContent>
          </Card>

          <div className="flex gap-4">
            <Button type="submit" disabled={saving}>
              {saving ? "Salvando..." : "Salvar Alterações"}
            </Button>
            <Link href={`/pacientes/${patient.id}`}>
              <Button type="button" variant="outline">
                Cancelar
              </Button>
            </Link>
          </div>
        </div>
      </form>
    </div>
  )
}
