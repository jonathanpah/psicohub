"use client"

import { useEffect, useState, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { MaskedInput, parseCurrency } from "@/components/ui/masked-input"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { FileUpload, type FileData } from "@/components/ui/file-upload"
import {
  ArrowLeft,
  Plus,
  Trash2,
  Calendar,
  DollarSign,
  Package,
  User,
  CheckCircle,
  AlertCircle,
} from "lucide-react"

interface Patient {
  id: string
  name: string
  email: string | null
  phone: string | null
}

interface SessionSlot {
  id: string
  date: string
  time: string
  duration: number
}

interface ExistingPackage {
  id: string
  name: string
  patientId: string
  patient: {
    id: string
    name: string
  }
  totalSessions: number
  pricePerSession: number
  remainingSlots: number
  existingReceipt: {
    url: string
    fileName: string | null
    fileType: string | null
    fileSize: number | null
  } | null
}

function NovoAtendimentoContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const preselectedPatientId = searchParams.get("patientId")
  const packageId = searchParams.get("packageId")

  const [patients, setPatients] = useState<Patient[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  // Existing package mode
  const [existingPackage, setExistingPackage] = useState<ExistingPackage | null>(null)
  const isAddToPackageMode = !!packageId

  // Form state
  const [selectedPatient, setSelectedPatient] = useState<string>(preselectedPatientId || "")
  const [type, setType] = useState<"SESSION" | "PACKAGE">("SESSION")
  const [sessionPrice, setSessionPrice] = useState("")
  const [totalSessions, setTotalSessions] = useState("1")
  const [packagePrice, setPackagePrice] = useState("")
  const [packageName, setPackageName] = useState("")
  const [notes, setNotes] = useState("")
  const [isPaid, setIsPaid] = useState(false)
  const [paymentMethod, setPaymentMethod] = useState("")
  const [receipt, setReceipt] = useState<FileData | null>(null)
  const [sessionSlots, setSessionSlots] = useState<SessionSlot[]>([
    { id: "1", date: "", time: "", duration: 50 },
  ])

  useEffect(() => {
    if (packageId) {
      fetchPackage(packageId)
    } else {
      fetchPatients()
    }
  }, [packageId])

  async function fetchPackage(pkgId: string) {
    try {
      const response = await fetch(`/api/packages/${pkgId}`)
      if (response.ok) {
        const data = await response.json()

        // Find existing paid receipt
        let existingReceipt = null
        for (const session of data.sessions || []) {
          if (session.payment?.status === "PAID" && session.payment?.receiptUrl) {
            existingReceipt = {
              url: session.payment.receiptUrl,
              fileName: session.payment.receiptFileName || null,
              fileType: session.payment.receiptFileType || null,
              fileSize: session.payment.receiptFileSize || null,
            }
            break
          }
        }

        setExistingPackage({
          id: data.id,
          name: data.name,
          patientId: data.patientId,
          patient: data.patient,
          totalSessions: data.totalSessions,
          pricePerSession: Number(data.pricePerSession),
          remainingSlots: data.stats?.remainingSlots || 0,
          existingReceipt,
        })
        setSelectedPatient(data.patientId)
      } else {
        setError("Pacote não encontrado")
      }
    } catch (err) {
      console.error("Erro ao carregar pacote:", err)
      setError("Erro ao carregar pacote")
    } finally {
      setLoading(false)
    }
  }

  async function fetchPatients() {
    try {
      const response = await fetch("/api/patients?status=ACTIVE")
      if (response.ok) {
        const data = await response.json()
        setPatients(data)
      }
    } catch (err) {
      console.error("Erro ao carregar pacientes:", err)
    } finally {
      setLoading(false)
    }
  }

  function addSessionSlot() {
    const newId = Date.now().toString()
    setSessionSlots([...sessionSlots, { id: newId, date: "", time: "", duration: 50 }])
  }

  function removeSessionSlot(id: string) {
    if (sessionSlots.length > 1) {
      setSessionSlots(sessionSlots.filter((s) => s.id !== id))
    }
  }

  function updateSessionSlot(id: string, field: keyof SessionSlot, value: string | number) {
    setSessionSlots(
      sessionSlots.map((s) => (s.id === id ? { ...s, [field]: value } : s))
    )
  }

  // Calcular preço por sessão para pacotes
  const calculatedPricePerSession =
    type === "PACKAGE" && parseInt(totalSessions) > 0 && parseCurrency(packagePrice) > 0
      ? parseCurrency(packagePrice) / parseInt(totalSessions)
      : 0

  // Validar sessões preenchidas
  const filledSessions = sessionSlots.filter((s) => s.date && s.time)

  // Validation differs based on mode
  const isValid = isAddToPackageMode
    ? existingPackage && filledSessions.length > 0 && filledSessions.length <= existingPackage.remainingSlots
    : selectedPatient &&
      filledSessions.length > 0 &&
      ((type === "SESSION" && parseCurrency(sessionPrice) >= 0) ||
        (type === "PACKAGE" && parseInt(totalSessions) > 0 && parseCurrency(packagePrice) >= 0))

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!isValid) return

    setSaving(true)
    setError(null)

    try {
      // Preparar sessões
      const sessions = filledSessions.map((slot) => ({
        dateTime: new Date(`${slot.date}T${slot.time}`).toISOString(),
        duration: slot.duration,
      }))

      if (isAddToPackageMode && existingPackage) {
        // Mode: Add sessions to existing package
        const response = await fetch(`/api/packages/${existingPackage.id}/sessions`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            sessions,
            // Pass receipt info to copy to new payments if package was paid
            ...(existingPackage.existingReceipt ? {
              copyReceipt: true,
              receiptUrl: existingPackage.existingReceipt.url,
              receiptFileName: existingPackage.existingReceipt.fileName,
              receiptFileType: existingPackage.existingReceipt.fileType,
              receiptFileSize: existingPackage.existingReceipt.fileSize,
            } : {}),
          }),
        })

        if (!response.ok) {
          const data = await response.json()
          throw new Error(data.error || "Erro ao adicionar sessões")
        }

        setSuccess(true)
        setTimeout(() => {
          router.push(`/pacientes/${existingPackage.patientId}`)
        }, 2000)
      } else {
        // Mode: Create new package
        const payload = {
          patientId: selectedPatient,
          type,
          ...(type === "SESSION"
            ? { sessionPrice: parseCurrency(sessionPrice) }
            : {
                totalSessions: parseInt(totalSessions),
                packagePrice: parseCurrency(packagePrice),
              }),
          sessions,
          packageName: packageName || undefined,
          notes: notes || undefined,
          isPaid,
          ...(isPaid ? {
            paymentMethod: paymentMethod || undefined,
            ...(receipt ? {
              receiptUrl: receipt.url,
              receiptFileName: receipt.fileName,
              receiptFileType: receipt.fileType,
              receiptFileSize: receipt.fileSize,
            } : {}),
          } : {}),
        }

        const response = await fetch("/api/packages", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        })

        if (!response.ok) {
          const data = await response.json()
          throw new Error(data.error || "Erro ao criar atendimento")
        }

        setSuccess(true)
        setTimeout(() => {
          router.push("/agenda")
        }, 2000)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao criar atendimento")
    } finally {
      setSaving(false)
    }
  }

  if (success) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="text-center space-y-4">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                <CheckCircle className="h-8 w-8 text-green-600" />
              </div>
              <h2 className="text-xl font-medium text-gray-900">
                {isAddToPackageMode ? "Sessões Adicionadas!" : "Atendimento Criado!"}
              </h2>
              <p className="text-gray-500">
                {filledSessions.length} sessão(ões) agendada(s) com sucesso.
              </p>
              <p className="text-sm text-gray-400">
                Redirecionando...
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Mode: Add to existing package
  if (isAddToPackageMode) {
    if (loading) {
      return (
        <div className="flex items-center justify-center h-96">
          <p className="text-gray-400">Carregando pacote...</p>
        </div>
      )
    }

    if (!existingPackage) {
      return (
        <div className="flex items-center justify-center h-96">
          <Card className="w-full max-w-md">
            <CardContent className="pt-6">
              <div className="text-center space-y-4">
                <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto">
                  <AlertCircle className="h-8 w-8 text-red-600" />
                </div>
                <h2 className="text-xl font-medium text-gray-900">
                  Pacote não encontrado
                </h2>
                <p className="text-gray-500">
                  O pacote solicitado não foi encontrado ou não pertence a você.
                </p>
                <Link href="/agenda">
                  <Button>Voltar para Agenda</Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      )
    }

    return (
      <div className="max-w-3xl mx-auto space-y-6">
        <div className="flex items-center gap-4">
          <Link href={`/pacientes/${existingPackage.patientId}`}>
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-xl font-medium text-gray-900 tracking-tight">
              Agendar Sessões do Pacote
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              Adicione sessões ao pacote existente
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Info do Pacote */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Package className="h-4 w-4" />
                Informações do Pacote
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Paciente</span>
                  <span className="font-medium text-gray-900">{existingPackage.patient.name}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Pacote</span>
                  <span className="font-medium text-gray-900">{existingPackage.name}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Valor por sessão</span>
                  <span className="font-medium text-gray-900">
                    {existingPackage.pricePerSession.toLocaleString("pt-BR", {
                      style: "currency",
                      currency: "BRL",
                    })}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Sessões restantes</span>
                  <span className="font-medium text-green-600">
                    {existingPackage.remainingSlots} de {existingPackage.totalSessions}
                  </span>
                </div>
                {existingPackage.existingReceipt && (
                  <div className="pt-2 border-t border-gray-200">
                    <p className="text-xs text-green-600 flex items-center gap-1">
                      <CheckCircle className="h-3 w-3" />
                      Pacote pago - recibo será copiado para as novas sessões
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Agendamento de Sessões */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Agendar Sessões
                <span className="text-xs font-normal text-gray-500">
                  ({filledSessions.length} de {existingPackage.remainingSlots} disponíveis)
                </span>
              </CardTitle>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addSessionSlot}
                disabled={sessionSlots.length >= existingPackage.remainingSlots}
              >
                <Plus className="h-4 w-4 mr-1" />
                Adicionar
              </Button>
            </CardHeader>
            <CardContent className="space-y-4">
              {sessionSlots.map((slot, index) => (
                <div
                  key={slot.id}
                  className="flex items-end gap-3 p-3 bg-gray-50 rounded-lg"
                >
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-sm font-medium text-gray-600">
                    {index + 1}
                  </div>

                  <div className="flex-1 grid grid-cols-3 gap-3">
                    <div className="space-y-1">
                      <Label className="text-xs">Data</Label>
                      <Input
                        type="date"
                        value={slot.date}
                        onChange={(e) =>
                          updateSessionSlot(slot.id, "date", e.target.value)
                        }
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Horário</Label>
                      <Input
                        type="time"
                        value={slot.time}
                        onChange={(e) =>
                          updateSessionSlot(slot.id, "time", e.target.value)
                        }
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Duração</Label>
                      <Select
                        value={slot.duration.toString()}
                        onValueChange={(value) =>
                          updateSessionSlot(slot.id, "duration", parseInt(value))
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="30">30 min</SelectItem>
                          <SelectItem value="45">45 min</SelectItem>
                          <SelectItem value="50">50 min</SelectItem>
                          <SelectItem value="60">60 min</SelectItem>
                          <SelectItem value="90">90 min</SelectItem>
                          <SelectItem value="120">120 min</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {sessionSlots.length > 1 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => removeSessionSlot(slot.id)}
                      className="text-red-500 hover:text-red-600"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              ))}

              {sessionSlots.length < existingPackage.remainingSlots && (
                <div className="text-center py-4 border-2 border-dashed border-gray-200 rounded-lg">
                  <p className="text-sm text-gray-500">
                    Ainda restam {existingPackage.remainingSlots - sessionSlots.length} slots disponíveis
                  </p>
                  <Button
                    type="button"
                    variant="link"
                    size="sm"
                    onClick={addSessionSlot}
                    className="mt-1"
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    Adicionar mais uma sessão
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Error message */}
          {error && (
            <div className="flex items-center gap-2 p-4 bg-red-50 border border-red-100 rounded-lg">
              <AlertCircle className="h-5 w-5 text-red-500" />
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          {/* Ações */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <p className="text-sm text-gray-500">Resumo</p>
                  <p className="font-medium text-gray-900">
                    {filledSessions.length} sessão(ões) •{" "}
                    {(existingPackage.pricePerSession * filledSessions.length).toLocaleString("pt-BR", {
                      style: "currency",
                      currency: "BRL",
                    })}
                  </p>
                </div>

                <div className="flex gap-2">
                  <Link href={`/pacientes/${existingPackage.patientId}`}>
                    <Button type="button" variant="outline">
                      Cancelar
                    </Button>
                  </Link>
                  <Button type="submit" disabled={!isValid || saving}>
                    {saving ? "Salvando..." : "Adicionar Sessões"}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </form>
      </div>
    )
  }

  // Mode: Create new package/session
  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/agenda">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-xl font-medium text-gray-900 tracking-tight">
            Novo Atendimento
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Cadastre sessões avulsas ou pacotes de atendimento
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Seleção de Paciente */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <User className="h-4 w-4" />
              Paciente
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <p className="text-gray-500 text-sm">Carregando pacientes...</p>
            ) : (
              <Select value={selectedPatient} onValueChange={setSelectedPatient}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione um paciente" />
                </SelectTrigger>
                <SelectContent>
                  {patients.map((patient) => (
                    <SelectItem key={patient.id} value={patient.id}>
                      {patient.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </CardContent>
        </Card>

        {/* Tipo de Atendimento */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Package className="h-4 w-4" />
              Tipo de Atendimento
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <RadioGroup
              value={type}
              onValueChange={(value) => setType(value as "SESSION" | "PACKAGE")}
              className="grid grid-cols-2 gap-4"
            >
              <div>
                <RadioGroupItem
                  value="SESSION"
                  id="session"
                  className="peer sr-only"
                />
                <Label
                  htmlFor="session"
                  className="flex flex-col items-center justify-center rounded-lg border-2 border-gray-200 p-4 cursor-pointer hover:border-gray-300 peer-data-[state=checked]:border-gray-900 peer-data-[state=checked]:bg-gray-50"
                >
                  <DollarSign className="h-6 w-6 mb-2 text-gray-500" />
                  <span className="font-medium">Sessão Avulsa</span>
                  <span className="text-xs text-gray-500">Cobrança por sessão</span>
                </Label>
              </div>

              <div>
                <RadioGroupItem
                  value="PACKAGE"
                  id="package"
                  className="peer sr-only"
                />
                <Label
                  htmlFor="package"
                  className="flex flex-col items-center justify-center rounded-lg border-2 border-gray-200 p-4 cursor-pointer hover:border-gray-300 peer-data-[state=checked]:border-gray-900 peer-data-[state=checked]:bg-gray-50"
                >
                  <Package className="h-6 w-6 mb-2 text-gray-500" />
                  <span className="font-medium">Pacote de Sessões</span>
                  <span className="text-xs text-gray-500">Valor fechado</span>
                </Label>
              </div>
            </RadioGroup>

            {type === "SESSION" ? (
              <div className="space-y-2">
                <Label htmlFor="sessionPrice">Valor por Sessão</Label>
                <MaskedInput
                  id="sessionPrice"
                  mask="currency"
                  value={sessionPrice}
                  onChange={setSessionPrice}
                  placeholder="R$ 0,00"
                />
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="totalSessions">Total de Sessões</Label>
                  <Input
                    id="totalSessions"
                    type="number"
                    min="1"
                    value={totalSessions}
                    onChange={(e) => setTotalSessions(e.target.value)}
                    placeholder="10"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="packagePrice">Valor do Pacote</Label>
                  <MaskedInput
                    id="packagePrice"
                    mask="currency"
                    value={packagePrice}
                    onChange={setPackagePrice}
                    placeholder="R$ 0,00"
                  />
                </div>
                {calculatedPricePerSession > 0 && (
                  <div className="col-span-2 bg-gray-50 rounded-lg p-3">
                    <p className="text-sm text-gray-600">
                      Valor por sessão:{" "}
                      <span className="font-medium text-gray-900">
                        {calculatedPricePerSession.toLocaleString("pt-BR", {
                          style: "currency",
                          currency: "BRL",
                        })}
                      </span>
                    </p>
                  </div>
                )}
              </div>
            )}

            {type === "PACKAGE" && (
              <div className="space-y-2">
                <Label htmlFor="packageName">Nome do Pacote (opcional)</Label>
                <Input
                  id="packageName"
                  value={packageName}
                  onChange={(e) => setPackageName(e.target.value)}
                  placeholder="Ex: Pacote Janeiro 2026"
                />
              </div>
            )}
          </CardContent>
        </Card>

        {/* Agendamento de Sessões */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Agendar Sessões
              {type === "PACKAGE" && parseInt(totalSessions) > 0 && (
                <span className="text-xs font-normal text-gray-500">
                  ({filledSessions.length} de {totalSessions} agendadas)
                </span>
              )}
            </CardTitle>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={addSessionSlot}
              disabled={
                type === "PACKAGE" &&
                sessionSlots.length >= parseInt(totalSessions)
              }
            >
              <Plus className="h-4 w-4 mr-1" />
              Adicionar
            </Button>
          </CardHeader>
          <CardContent className="space-y-4">
            {sessionSlots.map((slot, index) => (
              <div
                key={slot.id}
                className="flex items-end gap-3 p-3 bg-gray-50 rounded-lg"
              >
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-sm font-medium text-gray-600">
                  {index + 1}
                </div>

                <div className="flex-1 grid grid-cols-3 gap-3">
                  <div className="space-y-1">
                    <Label className="text-xs">Data</Label>
                    <Input
                      type="date"
                      value={slot.date}
                      onChange={(e) =>
                        updateSessionSlot(slot.id, "date", e.target.value)
                      }
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Horário</Label>
                    <Input
                      type="time"
                      value={slot.time}
                      onChange={(e) =>
                        updateSessionSlot(slot.id, "time", e.target.value)
                      }
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Duração</Label>
                    <Select
                      value={slot.duration.toString()}
                      onValueChange={(value) =>
                        updateSessionSlot(slot.id, "duration", parseInt(value))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="30">30 min</SelectItem>
                        <SelectItem value="45">45 min</SelectItem>
                        <SelectItem value="50">50 min</SelectItem>
                        <SelectItem value="60">60 min</SelectItem>
                        <SelectItem value="90">90 min</SelectItem>
                        <SelectItem value="120">120 min</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {sessionSlots.length > 1 && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => removeSessionSlot(slot.id)}
                    className="text-red-500 hover:text-red-600"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>
            ))}

            {type === "PACKAGE" &&
              parseInt(totalSessions) > sessionSlots.length && (
                <div className="text-center py-4 border-2 border-dashed border-gray-200 rounded-lg">
                  <p className="text-sm text-gray-500">
                    Você pode agendar as{" "}
                    {parseInt(totalSessions) - sessionSlots.length} sessões
                    restantes depois.
                  </p>
                  <Button
                    type="button"
                    variant="link"
                    size="sm"
                    onClick={addSessionSlot}
                    className="mt-1"
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    Adicionar mais uma data
                  </Button>
                </div>
              )}
          </CardContent>
        </Card>

        {/* Observações */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">
              Observações (opcional)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Observações sobre o atendimento..."
              rows={3}
            />
          </CardContent>
        </Card>

        {/* Pagamento */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <DollarSign className="h-4 w-4" />
              Pagamento
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-2">
              <Checkbox
                id="isPaid"
                checked={isPaid}
                onCheckedChange={(checked) => setIsPaid(checked === true)}
              />
              <Label htmlFor="isPaid" className="text-sm font-normal cursor-pointer">
                Já foi pago integralmente
              </Label>
            </div>

            {isPaid && (
              <div className="pl-6 space-y-4">
                <div className="space-y-2">
                  <Label className="text-sm text-gray-600">
                    Forma de pagamento
                  </Label>
                  <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione a forma de pagamento" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="PIX">PIX</SelectItem>
                      <SelectItem value="DINHEIRO">Dinheiro</SelectItem>
                      <SelectItem value="CARTAO_CREDITO">Cartão de Crédito</SelectItem>
                      <SelectItem value="CARTAO_DEBITO">Cartão de Débito</SelectItem>
                      <SelectItem value="TRANSFERENCIA">Transferência Bancária</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label className="text-sm text-gray-600">
                    Comprovante de pagamento (opcional)
                  </Label>
                  <FileUpload
                    value={receipt}
                    onChange={(data) => setReceipt(data)}
                  />
                  <p className="text-xs text-gray-400">
                    O comprovante será vinculado a todas as sessões do atendimento
                  </p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Error message */}
        {error && (
          <div className="flex items-center gap-2 p-4 bg-red-50 border border-red-100 rounded-lg">
            <AlertCircle className="h-5 w-5 text-red-500" />
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        {/* Resumo e Ações */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-sm text-gray-500">Resumo</p>
                <p className="font-medium text-gray-900">
                  {filledSessions.length} sessão(ões) •{" "}
                  {type === "SESSION"
                    ? parseCurrency(sessionPrice) > 0
                      ? `${(parseCurrency(sessionPrice) * filledSessions.length).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })} total`
                      : "Valor não definido"
                    : parseCurrency(packagePrice) > 0
                      ? `${parseCurrency(packagePrice).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })} (pacote)`
                      : "Valor não definido"}
                </p>
              </div>

              <div className="flex gap-2">
                <Link href="/agenda">
                  <Button type="button" variant="outline">
                    Cancelar
                  </Button>
                </Link>
                <Button type="submit" disabled={!isValid || saving}>
                  {saving ? "Salvando..." : "Criar Atendimento"}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </form>
    </div>
  )
}

export default function NovoAtendimentoPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center h-96"><p className="text-gray-400">Carregando...</p></div>}>
      <NovoAtendimentoContent />
    </Suspense>
  )
}
