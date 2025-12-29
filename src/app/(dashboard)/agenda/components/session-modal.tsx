"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
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
import { Checkbox } from "@/components/ui/checkbox"
import {
  Clock,
  User,
  Phone,
  Mail,
  Trash2,
  FileText,
  DollarSign,
  Package,
  Repeat,
} from "lucide-react"
import type { Session, Patient, SessionFormData } from "../types"
import { RecurrenceForm } from "./recurrence-form"
import { SESSION_CALENDAR_COLORS, SESSION_STATUS_LABELS, PAYMENT_STATUS_HEX_COLORS, PAYMENT_STATUS_LABELS } from "@/constants/status"

interface SessionModalProps {
  open: boolean
  onClose: () => void
  selectedSession: Session | null
  formData: SessionFormData
  setFormData: (data: SessionFormData) => void
  patients: Patient[]
  saving: boolean
  error: string
  onSubmit: (e: React.FormEvent) => void
  onDeleteClick: () => void
}

export function SessionModal({
  open,
  onClose,
  selectedSession,
  formData,
  setFormData,
  patients,
  saving,
  error,
  onSubmit,
  onDeleteClick,
}: SessionModalProps) {
  const selectedPatient = patients.find((p) => p.id === formData.patientId)

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[85vh] overflow-y-auto scrollbar-thin">
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

        <form onSubmit={onSubmit} className="space-y-4">
          {/* Patient Select */}
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

          {/* Date and Time */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="date">Data *</Label>
              <Input
                id="date"
                type="date"
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="time">Horário *</Label>
              <Input
                id="time"
                type="time"
                value={formData.time}
                onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                required
              />
            </div>
          </div>

          {/* Duration and Status */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="duration">Duração (min)</Label>
              <Select
                value={formData.duration}
                onValueChange={(value) => setFormData({ ...formData, duration: value })}
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
                  onValueChange={(value) => setFormData({ ...formData, status: value })}
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

          {/* Courtesy Checkbox - only for new sessions */}
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

          {/* Recurrence - only for new sessions */}
          {!selectedSession && (
            <RecurrenceForm formData={formData} setFormData={setFormData} />
          )}

          {/* Observations */}
          <div className="space-y-2">
            <Label htmlFor="observations">Observações</Label>
            <Textarea
              id="observations"
              value={formData.observations}
              onChange={(e) => setFormData({ ...formData, observations: e.target.value })}
              placeholder="Observações sobre a sessão..."
              rows={2}
            />
          </div>

          {/* Clinical Notes - only when editing */}
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
                onChange={(e) => setFormData({ ...formData, clinicalNotes: e.target.value })}
                placeholder="Anotações clínicas da sessão... (evolução do paciente, observações técnicas, etc.)"
                rows={5}
                className="font-mono text-sm"
              />
              <p className="text-xs text-gray-500">
                Estas notas são confidenciais e fazem parte do prontuário do paciente.
              </p>
            </div>
          )}

          {/* Selected Patient Info */}
          {selectedPatient && (
            <div className="bg-gray-50 p-3 rounded-md space-y-2">
              <div className="flex items-center gap-2 text-sm">
                <User className="h-4 w-4 text-gray-500" aria-hidden="true" />
                <span>{selectedPatient.name}</span>
              </div>
              {selectedPatient.phone && (
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Phone className="h-4 w-4" aria-hidden="true" />
                  <span className="sr-only">Telefone:</span>
                  <span>{selectedPatient.phone}</span>
                </div>
              )}
              {selectedPatient.email && (
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Mail className="h-4 w-4" aria-hidden="true" />
                  <span className="sr-only">Email:</span>
                  <span>{selectedPatient.email}</span>
                </div>
              )}
            </div>
          )}

          {/* Existing Session Info */}
          {selectedSession && (
            <div className="flex flex-wrap items-center gap-2">
              <Badge
                style={{
                  backgroundColor: SESSION_CALENDAR_COLORS[selectedSession.status]?.bg,
                  color: SESSION_CALENDAR_COLORS[selectedSession.status]?.text,
                }}
              >
                {SESSION_STATUS_LABELS[selectedSession.status]}
              </Badge>
              <span className="text-sm text-gray-500 flex items-center gap-1">
                <Clock className="h-3 w-3" aria-hidden="true" />
                <span className="sr-only">Duração:</span>
                {selectedSession.duration} min
              </span>
              {selectedSession.isCourtesy ? (
                <Badge variant="outline" className="text-gray-500">
                  Cortesia
                </Badge>
              ) : selectedSession.payment ? (
                <Badge
                  style={{
                    backgroundColor: PAYMENT_STATUS_HEX_COLORS[selectedSession.payment.status]?.bg,
                    color: PAYMENT_STATUS_HEX_COLORS[selectedSession.payment.status]?.text,
                  }}
                  className="flex items-center gap-1"
                >
                  <DollarSign className="h-3 w-3" />
                  {PAYMENT_STATUS_LABELS[selectedSession.payment.status]}
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

          {/* Action Buttons */}
          <div className="flex justify-between pt-4">
            <div>
              {selectedSession && (
                <Button
                  type="button"
                  variant="destructive"
                  onClick={onDeleteClick}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Excluir
                </Button>
              )}
            </div>
            <div className="flex gap-2">
              <Button type="button" variant="outline" onClick={onClose}>
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
  )
}
