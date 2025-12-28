"use client"

import { useEffect, useState, useCallback, useRef, Suspense } from "react"
import { useSearchParams } from "next/navigation"
import FullCalendar from "@fullcalendar/react"
import dayGridPlugin from "@fullcalendar/daygrid"
import timeGridPlugin from "@fullcalendar/timegrid"
import interactionPlugin from "@fullcalendar/interaction"
import listPlugin from "@fullcalendar/list"
import ptBrLocale from "@fullcalendar/core/locales/pt-br"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Checkbox } from "@/components/ui/checkbox"
import { FileUpload, type FileData } from "@/components/ui/file-upload"
import { MaskedInput, parseCurrency } from "@/components/ui/masked-input"
import { Plus, Clock, User, Phone, Mail, Trash2, FileText, DollarSign, Package, Repeat } from "lucide-react"
import Link from "next/link"
import type { EventClickArg, DateSelectArg } from "@fullcalendar/core"

interface Patient {
  id: string
  name: string
  phone: string | null
  email: string | null
}

interface Payment {
  id: string
  amount: string
  status: "PENDING" | "PAID" | "CANCELLED"
  method: string | null
}

interface SessionPackageInfo {
  id: string
  name: string | null
  totalSessions: number
}

interface Session {
  id: string
  patientId: string
  patient: Patient
  dateTime: string
  duration: number
  status: "SCHEDULED" | "CONFIRMED" | "COMPLETED" | "CANCELLED" | "NO_SHOW"
  isCourtesy: boolean
  clinicalNotes: string | null
  observations: string | null
  payment: Payment | null
  packageId: string | null
  packageOrder: number | null
  package: SessionPackageInfo | null
  // Campos de recorrência
  recurrenceGroupId: string | null
  recurrencePattern: "WEEKLY" | "BIWEEKLY" | "MONTHLY" | null
  recurrenceEndDate: string | null
  recurrenceCount: number | null
  recurrenceIndex: number | null
}

const statusColors: Record<string, string> = {
  SCHEDULED: "#475368", // RGB 71 83 104
  CONFIRMED: "#B1CF95", // RGB 177 207 149
  COMPLETED: "#3E552A", // RGB 62 85 42
  CANCELLED: "#B02418", // RGB 176 36 24
  NO_SHOW: "#F5C242", // RGB 245 194 66
}

const statusLabels: Record<string, string> = {
  SCHEDULED: "Agendada",
  CONFIRMED: "Confirmada",
  COMPLETED: "Realizada",
  CANCELLED: "Cancelada",
  NO_SHOW: "Falta",
}

const paymentStatusColors: Record<string, { bg: string; text: string }> = {
  PENDING: { bg: "#F5C242", text: "#1f2937" },
  PAID: { bg: "#3E552A", text: "#ffffff" },
  CANCELLED: { bg: "#B02418", text: "#ffffff" },
}

const paymentStatusLabels: Record<string, string> = {
  PENDING: "Pendente",
  PAID: "Pago",
  CANCELLED: "Cancelado",
}

function AgendaPageContent() {
  const searchParams = useSearchParams()
  const [sessions, setSessions] = useState<Session[]>([])
  const [patients, setPatients] = useState<Patient[]>([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [selectedSession, setSelectedSession] = useState<Session | null>(null)
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")
  const initialPatientHandled = useRef(false)

  // Form state
  const [formData, setFormData] = useState({
    patientId: "",
    date: "",
    time: "",
    duration: "50",
    status: "SCHEDULED",
    isCourtesy: false,
    observations: "",
    clinicalNotes: "",
    // Campos de recorrência
    isRecurring: false,
    recurrencePattern: "WEEKLY" as "WEEKLY" | "BIWEEKLY" | "MONTHLY",
    recurrenceEndType: "OCCURRENCES" as "DATE" | "OCCURRENCES",
    recurrenceEndDate: "",
    recurrenceOccurrences: 8,
    // Campos de valor (sempre manual agora)
    priceType: "per_session" as "per_session" | "total",
    customPrice: "",
    // Campos de pagamento
    isPaid: false,
    paymentMethod: "",
    receipt: null as FileData | null,
  })


  // State para dialog de ações em recorrência
  const [recurrenceDialogOpen, setRecurrenceDialogOpen] = useState(false)
  const [recurrenceActionType, setRecurrenceActionType] = useState<"delete" | null>(null)

  const fetchSessions = useCallback(async (start?: Date, end?: Date) => {
    try {
      const params = new URLSearchParams()
      if (start) params.set("startDate", start.toISOString())
      if (end) params.set("endDate", end.toISOString())

      const response = await fetch(`/api/sessions?${params}`)
      if (response.ok) {
        const data = await response.json()
        setSessions(data)
      }
    } catch (error) {
      console.error("Erro ao carregar sessões:", error)
    } finally {
      setLoading(false)
    }
  }, [])

  const fetchPatients = useCallback(async () => {
    try {
      const response = await fetch("/api/patients?status=ACTIVE")
      if (response.ok) {
        const data = await response.json()
        setPatients(data)
      }
    } catch (error) {
      console.error("Erro ao carregar pacientes:", error)
    }
  }, [])


  useEffect(() => {
    fetchSessions()
    fetchPatients()
  }, [fetchSessions, fetchPatients])

  // Handle patientId from URL (e.g., from patient details page)
  useEffect(() => {
    const patientId = searchParams.get("patientId")
    if (patientId && patients.length > 0 && !initialPatientHandled.current) {
      initialPatientHandled.current = true
      const now = new Date()
      setSelectedSession(null)
      setSelectedDate(now)
      setFormData({
        patientId,
        date: now.toISOString().split("T")[0],
        time: "09:00",
        duration: "50",
        status: "SCHEDULED",
        isCourtesy: false,
        observations: "",
        clinicalNotes: "",
        isRecurring: false,
        recurrencePattern: "WEEKLY",
        recurrenceEndType: "OCCURRENCES",
        recurrenceEndDate: "",
        recurrenceOccurrences: 8,
        priceType: "per_session",
        customPrice: "",
        isPaid: false,
        paymentMethod: "",
        receipt: null,
      })
      setError("")
      setModalOpen(true)
    }
  }, [searchParams, patients])

  const handleDateSelect = (selectInfo: DateSelectArg) => {
    const date = selectInfo.start
    setSelectedDate(date)
    setSelectedSession(null)
    setFormData({
      patientId: "",
      date: date.toISOString().split("T")[0],
      time: date.toTimeString().slice(0, 5),
      duration: "50",
      status: "SCHEDULED",
      isCourtesy: false,
      observations: "",
      clinicalNotes: "",
      isRecurring: false,
      recurrencePattern: "WEEKLY",
      recurrenceEndType: "OCCURRENCES",
      recurrenceEndDate: "",
      recurrenceOccurrences: 8,
      priceType: "per_session",
      customPrice: "",
      isPaid: false,
      paymentMethod: "",
      receipt: null,
    })
    setError("")
    setModalOpen(true)
  }

  const handleEventClick = (clickInfo: EventClickArg) => {
    const session = sessions.find((s) => s.id === clickInfo.event.id)
    if (session) {
      setSelectedSession(session)
      const dateTime = new Date(session.dateTime)
      setFormData({
        patientId: session.patientId,
        date: dateTime.toISOString().split("T")[0],
        time: dateTime.toTimeString().slice(0, 5),
        duration: session.duration.toString(),
        status: session.status,
        isCourtesy: session.isCourtesy || false,
        observations: session.observations || "",
        clinicalNotes: session.clinicalNotes || "",
        isRecurring: false,
        recurrencePattern: "WEEKLY",
        recurrenceEndType: "OCCURRENCES",
        recurrenceEndDate: "",
        recurrenceOccurrences: 8,
        priceType: "per_session",
        customPrice: "",
        isPaid: false,
        paymentMethod: "",
        receipt: null,
      })
      setError("")
      setModalOpen(true)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setError("")

    try {
      const dateTime = new Date(`${formData.date}T${formData.time}`)
      const body: Record<string, unknown> = {
        patientId: formData.patientId,
        dateTime: dateTime.toISOString(),
        duration: parseInt(formData.duration),
        status: formData.status,
        isCourtesy: formData.isCourtesy,
        observations: formData.observations,
        clinicalNotes: formData.clinicalNotes,
      }

      // Adicionar campos de recorrência se for nova sessão recorrente
      if (!selectedSession && formData.isRecurring) {
        body.isRecurring = true
        body.recurrencePattern = formData.recurrencePattern
        body.recurrenceEndType = formData.recurrenceEndType
        if (formData.recurrenceEndType === "DATE") {
          body.recurrenceEndDate = formData.recurrenceEndDate
        } else {
          body.recurrenceOccurrences = formData.recurrenceOccurrences
        }

        // Calcular preço por sessão se não for cortesia
        if (!formData.isCourtesy && formData.customPrice) {
          const customValue = parseCurrency(formData.customPrice)
          if (formData.priceType === "total") {
            // Dividir valor total pelo número de sessões
            const numSessions = formData.recurrenceEndType === "OCCURRENCES"
              ? formData.recurrenceOccurrences
              : 1 // Será calculado na API se for por data
            body.customSessionPrice = customValue / numSessions
          } else {
            // Valor por sessão
            body.customSessionPrice = customValue
          }
        }

        // Adicionar status de pagamento, método e recibo
        if (!formData.isCourtesy && formData.isPaid) {
          body.isPaid = true
          if (formData.paymentMethod) {
            body.paymentMethod = formData.paymentMethod
          }
          if (formData.receipt) {
            body.receiptUrl = formData.receipt.url
            body.receiptFileName = formData.receipt.fileName
            body.receiptFileType = formData.receipt.fileType
            body.receiptFileSize = formData.receipt.fileSize
          }
        }
      }

      const url = selectedSession
        ? `/api/sessions/${selectedSession.id}`
        : "/api/sessions"
      const method = selectedSession ? "PUT" : "POST"

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      })

      if (response.ok) {
        const data = await response.json()
        setModalOpen(false)
        fetchSessions()
        // Mostrar mensagem de sucesso para recorrência
        if (data.sessionsCreated) {
          alert(`${data.sessionsCreated} sessões criadas com sucesso!`)
        }
      } else {
        const data = await response.json()
        if (data.conflicts) {
          setError(`Conflito em ${data.conflicts.length} data(s). Escolha outro horário.`)
        } else {
          setError(data.error || "Erro ao salvar sessão")
        }
      }
    } catch {
      setError("Erro ao salvar sessão")
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!selectedSession) return

    // Se for sessão recorrente, mostrar dialog de opções
    if (selectedSession.recurrenceGroupId) {
      setRecurrenceActionType("delete")
      setRecurrenceDialogOpen(true)
      setDeleteDialogOpen(false)
      return
    }

    try {
      const response = await fetch(`/api/sessions/${selectedSession.id}`, {
        method: "DELETE",
      })

      if (response.ok) {
        setDeleteDialogOpen(false)
        setModalOpen(false)
        fetchSessions()
      }
    } catch (error) {
      console.error("Erro ao excluir sessão:", error)
    }
  }

  const handleRecurrenceDelete = async (deleteType: "SINGLE" | "FUTURE" | "ALL") => {
    if (!selectedSession?.recurrenceGroupId) return

    try {
      const response = await fetch(`/api/sessions/recurring/${selectedSession.recurrenceGroupId}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          deleteType,
          sessionId: selectedSession.id,
        }),
      })

      if (response.ok) {
        const data = await response.json()
        setRecurrenceDialogOpen(false)
        setModalOpen(false)
        fetchSessions()
        alert(`${data.deletedCount} sessão(ões) excluída(s)`)
      }
    } catch (error) {
      console.error("Erro ao excluir sessões:", error)
    }
  }

  // Função para formatar hora no estilo "14h" ou "13h30"
  const formatTimeShort = (dateString: string) => {
    const date = new Date(dateString)
    const hours = date.getHours()
    const minutes = date.getMinutes()
    if (minutes === 0) {
      return `${hours}h`
    }
    return `${hours}h${minutes.toString().padStart(2, "0")}`
  }

  const calendarEvents = sessions.map((session) => {
    // Adicionar info do pacote ou recorrência ao título (formato padronizado)
    let title = session.patient.name
    if (session.package && session.packageOrder) {
      // Pacote de sessões
      title += ` (${session.packageOrder}/${session.package.totalSessions})`
    } else if (session.recurrenceGroupId && session.recurrenceIndex && session.recurrenceCount) {
      // Sessão recorrente (mesmo formato do pacote)
      title += ` (${session.recurrenceIndex}/${session.recurrenceCount})`
    }

    // Indicador de recorrência (para uso interno, não visual)
    const isRecurring = !!session.recurrenceGroupId

    return {
      id: session.id,
      title,
      start: session.dateTime,
      end: new Date(
        new Date(session.dateTime).getTime() + session.duration * 60 * 1000
      ).toISOString(),
      backgroundColor: statusColors[session.status],
      borderColor: statusColors[session.status],
      extendedProps: {
        status: session.status,
        formattedTime: formatTimeShort(session.dateTime),
        session,
        isRecurring,
        recurrenceIndex: session.recurrenceIndex,
        recurrenceCount: session.recurrenceCount,
      },
    }
  })

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-medium text-gray-900 tracking-tight">Agenda</h1>
          <p className="text-sm text-gray-500 mt-1">Gerencie suas sessões</p>
        </div>
        <Button onClick={() => {
          setSelectedSession(null)
          setSelectedDate(new Date())
          const now = new Date()
          setFormData({
            patientId: "",
            date: now.toISOString().split("T")[0],
            time: "09:00",
            duration: "50",
            status: "SCHEDULED",
            isCourtesy: false,
            observations: "",
            clinicalNotes: "",
            isRecurring: false,
            recurrencePattern: "WEEKLY",
            recurrenceEndType: "OCCURRENCES",
            recurrenceEndDate: "",
            recurrenceOccurrences: 8,
            priceType: "per_session",
            customPrice: "",
            isPaid: false,
            paymentMethod: "",
            receipt: null,
          })
          setError("")
          setModalOpen(true)
        }}>
          <Plus className="h-4 w-4 mr-2" />
          Nova Sessão
        </Button>
      </div>

      {/* Legenda de status */}
      <div className="flex flex-wrap gap-4">
        {Object.entries(statusLabels).map(([key, label]) => (
          <div key={key} className="flex items-center gap-2">
            <div
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: statusColors[key] }}
            />
            <span className="text-sm text-gray-600">{label}</span>
          </div>
        ))}
      </div>

      <Card>
        <CardContent className="p-4">
          {loading ? (
            <div className="flex items-center justify-center h-96">
              <p className="text-gray-500">Carregando...</p>
            </div>
          ) : (
            <FullCalendar
              plugins={[
                dayGridPlugin,
                timeGridPlugin,
                interactionPlugin,
                listPlugin,
              ]}
              initialView="dayGridMonth"
              locale={ptBrLocale}
              headerToolbar={{
                left: "prev,next today",
                center: "title",
                right: "dayGridMonth,timeGridWeek,timeGridDay,listWeek",
              }}
              events={calendarEvents}
              selectable={true}
              selectMirror={true}
              dayMaxEvents={true}
              weekends={true}
              select={handleDateSelect}
              eventClick={handleEventClick}
              slotMinTime="06:00:00"
              slotMaxTime="22:00:00"
              slotDuration="00:30:00"
              allDaySlot={false}
              height="auto"
              datesSet={(dateInfo) => {
                fetchSessions(dateInfo.start, dateInfo.end)
              }}
              eventContent={(eventInfo) => {
                const isMonthView = eventInfo.view.type === "dayGridMonth"
                const status = eventInfo.event.extendedProps?.status || "SCHEDULED"
                const formattedTime = eventInfo.event.extendedProps?.formattedTime || eventInfo.timeText
                const statusColor = statusColors[status] || statusColors.SCHEDULED
                if (isMonthView) {
                  // Visão mensal: fundo branco com texto colorido
                  return (
                    <div
                      className="px-1.5 py-0.5 rounded overflow-hidden bg-white border"
                      style={{ borderColor: statusColor }}
                    >
                      <div
                        className="font-medium text-xs truncate"
                        style={{ color: statusColor }}
                      >
                        {eventInfo.event.title}
                      </div>
                      <div
                        className="text-xs font-medium"
                        style={{ color: statusColor, opacity: 0.8 }}
                      >
                        {formattedTime}
                      </div>
                    </div>
                  )
                }

                // Visão semanal/diária: fundo colorido
                return (
                  <div className="p-1 overflow-hidden">
                    <div className="font-medium text-xs truncate">
                      {eventInfo.event.title}
                    </div>
                    <div className="text-xs opacity-75">
                      {formattedTime}
                    </div>
                  </div>
                )
              }}
            />
          )}
        </CardContent>
      </Card>

      {/* Modal de criação/edição de sessão */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {selectedSession ? "Editar Sessão" : "Nova Sessão"}
            </DialogTitle>
          </DialogHeader>

          {error && (
            <div className="bg-red-50 text-red-600 p-3 rounded-md text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="patient">Paciente *</Label>
              <Select
                value={formData.patientId}
                onValueChange={(value) => setFormData({ ...formData, patientId: value })}
              >
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
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="date">Data *</Label>
                <Input
                  id="date"
                  type="date"
                  value={formData.date}
                  onChange={(e) =>
                    setFormData({ ...formData, date: e.target.value })
                  }
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="time">Horário *</Label>
                <Input
                  id="time"
                  type="time"
                  value={formData.time}
                  onChange={(e) =>
                    setFormData({ ...formData, time: e.target.value })
                  }
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="duration">Duração (min)</Label>
                <Select
                  value={formData.duration}
                  onValueChange={(value) =>
                    setFormData({ ...formData, duration: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="30">30 minutos</SelectItem>
                    <SelectItem value="45">45 minutos</SelectItem>
                    <SelectItem value="50">50 minutos</SelectItem>
                    <SelectItem value="60">60 minutos</SelectItem>
                    <SelectItem value="90">90 minutos</SelectItem>
                    <SelectItem value="120">120 minutos</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {selectedSession && (
                <div className="space-y-2">
                  <Label htmlFor="status">Status</Label>
                  <Select
                    value={formData.status}
                    onValueChange={(value) =>
                      setFormData({ ...formData, status: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="SCHEDULED">Agendada</SelectItem>
                      <SelectItem value="CONFIRMED">Confirmada</SelectItem>
                      <SelectItem value="COMPLETED">Realizada</SelectItem>
                      <SelectItem value="CANCELLED">Cancelada</SelectItem>
                      <SelectItem value="NO_SHOW">Falta</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>

            {/* Checkbox de sessão cortesia - apenas para novas sessões */}
            {!selectedSession && (
              <div className="flex items-center gap-2 py-2">
                <Checkbox
                  id="isCourtesy"
                  checked={formData.isCourtesy}
                  onCheckedChange={(checked) =>
                    setFormData({ ...formData, isCourtesy: checked === true })
                  }
                />
                <Label htmlFor="isCourtesy" className="text-sm font-normal cursor-pointer">
                  Sessão cortesia (sem cobrança)
                </Label>
              </div>
            )}

            {/* Checkbox de recorrência - apenas para novas sessões */}
            {!selectedSession && (
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="isRecurring"
                    checked={formData.isRecurring}
                    onCheckedChange={(checked) =>
                      setFormData({ ...formData, isRecurring: checked === true })
                    }
                  />
                  <Label htmlFor="isRecurring" className="text-sm font-normal cursor-pointer">
                    Agendar sessão recorrente
                  </Label>
                </div>

                {formData.isRecurring && (
                  <div className="pl-6 space-y-4 border-l-2 border-gray-200">
                    {/* Frequência */}
                    <div className="space-y-2">
                      <Label>Frequência</Label>
                      <Select
                        value={formData.recurrencePattern}
                        onValueChange={(value: "WEEKLY" | "BIWEEKLY" | "MONTHLY") =>
                          setFormData({ ...formData, recurrencePattern: value })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="WEEKLY">Semanal</SelectItem>
                          <SelectItem value="BIWEEKLY">Quinzenal</SelectItem>
                          <SelectItem value="MONTHLY">Mensal</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Término */}
                    <div className="space-y-2">
                      <Label>Terminar após</Label>
                      <Select
                        value={formData.recurrenceEndType}
                        onValueChange={(value: "DATE" | "OCCURRENCES") =>
                          setFormData({ ...formData, recurrenceEndType: value })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="OCCURRENCES">Número de sessões</SelectItem>
                          <SelectItem value="DATE">Data específica</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {formData.recurrenceEndType === "OCCURRENCES" && (
                      <div className="space-y-2">
                        <Label>Quantidade de sessões</Label>
                        <Select
                          value={formData.recurrenceOccurrences.toString()}
                          onValueChange={(value) =>
                            setFormData({ ...formData, recurrenceOccurrences: parseInt(value) })
                          }
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {[4, 8, 12, 16, 24, 52].map(n => (
                              <SelectItem key={n} value={n.toString()}>
                                {n} sessões
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    )}

                    {formData.recurrenceEndType === "DATE" && (
                      <div className="space-y-2">
                        <Label>Data de término</Label>
                        <Input
                          type="date"
                          value={formData.recurrenceEndDate}
                          onChange={(e) =>
                            setFormData({ ...formData, recurrenceEndDate: e.target.value })
                          }
                          min={formData.date}
                        />
                      </div>
                    )}

                    {/* Valor das sessões - apenas se não for cortesia */}
                    {!formData.isCourtesy && (
                      <div className="space-y-3 pt-2 border-t border-gray-200">
                        <Label className="flex items-center gap-2">
                          <DollarSign className="h-4 w-4" />
                          Valor das sessões
                        </Label>

                        {/* Tipo de valor */}
                        <div className="flex items-center gap-4">
                          <div className="flex items-center gap-2">
                            <input
                              type="radio"
                              id="priceTypePerSession"
                              name="priceType"
                              value="per_session"
                              checked={formData.priceType === "per_session"}
                              onChange={() => setFormData({ ...formData, priceType: "per_session" })}
                              className="h-4 w-4 text-gray-900"
                            />
                            <label htmlFor="priceTypePerSession" className="text-sm cursor-pointer">
                              Por sessão
                            </label>
                          </div>
                          <div className="flex items-center gap-2">
                            <input
                              type="radio"
                              id="priceTypeTotal"
                              name="priceType"
                              value="total"
                              checked={formData.priceType === "total"}
                              onChange={() => setFormData({ ...formData, priceType: "total" })}
                              className="h-4 w-4 text-gray-900"
                            />
                            <label htmlFor="priceTypeTotal" className="text-sm cursor-pointer">
                              Valor total (dividido)
                            </label>
                          </div>
                        </div>

                        {/* Input de valor */}
                        <div className="flex items-center gap-2">
                          <MaskedInput
                            mask="currency"
                            value={formData.customPrice}
                            onChange={(value) => setFormData({ ...formData, customPrice: value })}
                            placeholder={formData.priceType === "per_session" ? "R$ 0,00" : "R$ 0,00"}
                            className="w-44"
                          />
                          {formData.priceType === "total" && formData.customPrice && formData.recurrenceOccurrences && (
                            <span className="text-sm text-gray-500">
                              ({(parseCurrency(formData.customPrice) / formData.recurrenceOccurrences).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}/sessão)
                            </span>
                          )}
                        </div>

                        {/* Checkbox Já foi pago */}
                        <div className="pt-2 border-t border-gray-100">
                          <div className="flex items-center gap-2">
                            <Checkbox
                              id="isPaid"
                              checked={formData.isPaid}
                              onCheckedChange={(checked) =>
                                setFormData({ ...formData, isPaid: checked === true })
                              }
                            />
                            <Label htmlFor="isPaid" className="text-sm font-normal cursor-pointer">
                              Já foi pago integralmente
                            </Label>
                          </div>

                          {/* Campos de pagamento - só aparecem se marcou como pago */}
                          {formData.isPaid && (
                            <div className="mt-3 pl-6 space-y-4">
                              <div className="space-y-2">
                                <Label className="text-sm text-gray-600">
                                  Forma de pagamento
                                </Label>
                                <Select
                                  value={formData.paymentMethod}
                                  onValueChange={(value) => setFormData({ ...formData, paymentMethod: value })}
                                >
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
                                  value={formData.receipt}
                                  onChange={(data) => setFormData({ ...formData, receipt: data })}
                                />
                                <p className="text-xs text-gray-400">
                                  O comprovante será vinculado a todas as sessões
                                </p>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Preview */}
                    <div className="text-sm text-gray-500 bg-gray-50 p-3 rounded-md">
                      Serão criadas {formData.recurrenceEndType === "OCCURRENCES" ? formData.recurrenceOccurrences : "várias"} sessões
                      {formData.recurrencePattern === "WEEKLY" && ", toda semana"}
                      {formData.recurrencePattern === "BIWEEKLY" && ", a cada 2 semanas"}
                      {formData.recurrencePattern === "MONTHLY" && ", todo mês"}
                      , às {formData.time || "horário selecionado"}.
                      {!formData.isCourtesy && formData.customPrice && (
                        <span className="block mt-1">
                          Valor total: {formData.priceType === "total"
                            ? parseCurrency(formData.customPrice).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })
                            : (parseCurrency(formData.customPrice) * (formData.recurrenceEndType === "OCCURRENCES" ? formData.recurrenceOccurrences : 1)).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })
                          }
                          {formData.isPaid && " (Pago)"}
                        </span>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="observations">Observações</Label>
              <Textarea
                id="observations"
                value={formData.observations}
                onChange={(e) =>
                  setFormData({ ...formData, observations: e.target.value })
                }
                placeholder="Observações sobre a sessão..."
                rows={2}
              />
            </div>

            {/* Notas Clínicas - mostrar apenas ao editar sessão */}
            {selectedSession && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="clinicalNotes" className="flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    Notas Clínicas (Prontuário)
                  </Label>
                  <Link
                    href={`/pacientes/${selectedSession.patientId}/prontuario`}
                    className="text-xs text-gray-500 hover:text-gray-900 hover:underline"
                  >
                    Ver prontuário completo
                  </Link>
                </div>
                <Textarea
                  id="clinicalNotes"
                  value={formData.clinicalNotes}
                  onChange={(e) =>
                    setFormData({ ...formData, clinicalNotes: e.target.value })
                  }
                  placeholder="Anotações clínicas da sessão... (evolução do paciente, observações técnicas, etc.)"
                  rows={5}
                  className="font-mono text-sm"
                />
                <p className="text-xs text-gray-500">
                  Estas notas são confidenciais e fazem parte do prontuário do paciente.
                </p>
              </div>
            )}

            {/* Info do paciente selecionado */}
            {formData.patientId && (
              <div className="bg-gray-50 p-3 rounded-md space-y-2">
                {(() => {
                  const patient = patients.find(
                    (p) => p.id === formData.patientId
                  )
                  if (!patient) return null
                  return (
                    <>
                      <div className="flex items-center gap-2 text-sm">
                        <User className="h-4 w-4 text-gray-500" />
                        <span>{patient.name}</span>
                      </div>
                      {patient.phone && (
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <Phone className="h-4 w-4" />
                          <span>{patient.phone}</span>
                        </div>
                      )}
                      {patient.email && (
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <Mail className="h-4 w-4" />
                          <span>{patient.email}</span>
                        </div>
                      )}
                    </>
                  )
                })()}
              </div>
            )}

            {/* Info da sessão existente */}
            {selectedSession && (
              <div className="flex flex-wrap items-center gap-2">
                <Badge
                  style={{
                    backgroundColor: statusColors[selectedSession.status],
                    color: "white",
                  }}
                >
                  {statusLabels[selectedSession.status]}
                </Badge>
                <span className="text-sm text-gray-500 flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {selectedSession.duration} min
                </span>
                {selectedSession.isCourtesy ? (
                  <Badge variant="outline" className="text-gray-500">
                    Cortesia
                  </Badge>
                ) : selectedSession.payment ? (
                  <Badge
                    style={{
                      backgroundColor: paymentStatusColors[selectedSession.payment.status].bg,
                      color: paymentStatusColors[selectedSession.payment.status].text,
                    }}
                    className="flex items-center gap-1"
                  >
                    <DollarSign className="h-3 w-3" />
                    {paymentStatusLabels[selectedSession.payment.status]}
                  </Badge>
                ) : null}
                {selectedSession.package && (
                  <Badge variant="outline" className="flex items-center gap-1 text-gray-600">
                    <Package className="h-3 w-3" />
                    Pacote {selectedSession.packageOrder}/{selectedSession.package.totalSessions}
                  </Badge>
                )}
                {selectedSession.recurrenceGroupId && !selectedSession.package && (
                  <Badge variant="outline" className="flex items-center gap-1 text-gray-600">
                    <Repeat className="h-3 w-3" />
                    Recorrente {selectedSession.recurrenceIndex}/{selectedSession.recurrenceCount}
                  </Badge>
                )}
              </div>
            )}

            <div className="flex justify-between pt-4">
              <div>
                {selectedSession && (
                  <Button
                    type="button"
                    variant="destructive"
                    onClick={() => setDeleteDialogOpen(true)}
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Excluir
                  </Button>
                )}
              </div>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setModalOpen(false)}
                >
                  Cancelar
                </Button>
                <Button type="submit" disabled={saving || !formData.patientId}>
                  {saving ? "Salvando..." : selectedSession ? "Salvar" : "Agendar"}
                </Button>
              </div>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Dialog de confirmação de exclusão */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir Sessão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir esta sessão? Esta ação não pode ser
              desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-red-600 hover:bg-red-700"
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Dialog de ações em sessões recorrentes */}
      <AlertDialog open={recurrenceDialogOpen} onOpenChange={setRecurrenceDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {recurrenceActionType === "delete" ? "Excluir sessão recorrente" : "Ação em sessão recorrente"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              Esta sessão faz parte de uma série recorrente
              {selectedSession?.recurrenceIndex && selectedSession?.recurrenceCount &&
                ` (${selectedSession.recurrenceIndex} de ${selectedSession.recurrenceCount})`
              }.
              O que você deseja fazer?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="space-y-2 py-4">
            <Button
              variant="outline"
              className="w-full justify-start"
              onClick={() => handleRecurrenceDelete("SINGLE")}
            >
              Apenas esta sessão
            </Button>
            <Button
              variant="outline"
              className="w-full justify-start"
              onClick={() => handleRecurrenceDelete("FUTURE")}
            >
              Esta e todas as sessões futuras
            </Button>
            <Button
              variant="outline"
              className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50"
              onClick={() => handleRecurrenceDelete("ALL")}
            >
              Todas as sessões da série
            </Button>
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

export default function AgendaPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center h-96"><p className="text-gray-400">Carregando agenda...</p></div>}>
      <AgendaPageContent />
    </Suspense>
  )
}
