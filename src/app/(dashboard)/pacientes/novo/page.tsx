"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
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

export default function NovoPacientePage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setError("")

    const formData = new FormData(e.currentTarget)

    try {
      const response = await fetch("/api/patients", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.get("name"),
          email: formData.get("email"),
          phone: formData.get("phone"),
          cpf: formData.get("cpf"),
          birthDate: formData.get("birthDate"),
          address: formData.get("address"),
          // Dados do responsável
          guardian: formData.get("guardian"),
          guardianCpf: formData.get("guardianCpf"),
          guardianEmail: formData.get("guardianEmail"),
          guardianPhone: formData.get("guardianPhone"),
          guardianAddress: formData.get("guardianAddress"),
          guardianRelation: formData.get("guardianRelation"),
          notes: formData.get("notes"),
        }),
      })

      if (response.ok) {
        const patient = await response.json()
        // Redireciona para a página do paciente para adicionar plano de pagamento
        router.push(`/pacientes/${patient.id}`)
      } else {
        const data = await response.json()
        setError(data.error || "Erro ao cadastrar paciente")
      }
    } catch {
      setError("Erro ao cadastrar paciente")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/pacientes">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Novo Paciente</h1>
          <p className="text-gray-600">Cadastre um novo paciente</p>
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
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Telefone</Label>
                <MaskedInput
                  id="phone"
                  name="phone"
                  mask="phone"
                  placeholder="(00) 00000-0000"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="cpf">CPF</Label>
                <MaskedInput
                  id="cpf"
                  name="cpf"
                  mask="cpf"
                  placeholder="000.000.000-00"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="birthDate">Data de Nascimento</Label>
                <Input id="birthDate" name="birthDate" type="date" />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="address">Endereço</Label>
                <Input
                  id="address"
                  name="address"
                  placeholder="Rua, número, bairro, cidade - UF"
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Responsável (para menores de idade)</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="guardian">Nome do Responsável</Label>
                <Input
                  id="guardian"
                  name="guardian"
                  placeholder="Nome completo do responsável"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="guardianRelation">Relação com o Menor</Label>
                <Select name="guardianRelation">
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
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="guardianPhone">Telefone do Responsável</Label>
                <MaskedInput
                  id="guardianPhone"
                  name="guardianPhone"
                  mask="phone"
                  placeholder="(00) 00000-0000"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="guardianEmail">Email do Responsável</Label>
                <Input
                  id="guardianEmail"
                  name="guardianEmail"
                  type="email"
                  placeholder="email@exemplo.com"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="guardianAddress">Endereço do Responsável</Label>
                <Input
                  id="guardianAddress"
                  name="guardianAddress"
                  placeholder="Rua, número, bairro, cidade - UF"
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
                />
              </div>
            </CardContent>
          </Card>

          <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
            <p className="text-sm text-blue-800">
              <strong>Nota:</strong> O plano de pagamento (sessão ou pacote) pode ser adicionado
              após o cadastro, na página de detalhes do paciente.
            </p>
          </div>

          <div className="flex gap-4">
            <Button type="submit" disabled={loading}>
              {loading ? "Salvando..." : "Cadastrar Paciente"}
            </Button>
            <Link href="/pacientes">
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
