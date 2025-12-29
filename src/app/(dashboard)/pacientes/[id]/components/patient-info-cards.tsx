"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { User, Phone, Mail, Calendar, MapPin, FileText, Users } from "lucide-react"
import { formatDate, calculateAge } from "@/lib/formatters"
import { GUARDIAN_RELATION_LABELS } from "@/constants/status"
import type { Patient } from "../types"

interface PatientInfoCardsProps {
  patient: Patient
}

export function PersonalDataCard({ patient }: PatientInfoCardsProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-sm font-medium">
          <User className="h-4 w-4 text-gray-400" />
          Dados Pessoais
        </CardTitle>
      </CardHeader>
      <CardContent className="grid gap-3 md:grid-cols-2 text-sm">
        {patient.email && (
          <div className="flex items-center gap-2 text-gray-600">
            <Mail className="h-3.5 w-3.5 text-gray-400" />
            <span>{patient.email}</span>
          </div>
        )}
        {patient.phone && (
          <div className="flex items-center gap-2 text-gray-600">
            <Phone className="h-3.5 w-3.5 text-gray-400" />
            <span>{patient.phone}</span>
          </div>
        )}
        {patient.cpf && (
          <div className="flex items-center gap-2 text-gray-600">
            <FileText className="h-3.5 w-3.5 text-gray-400" />
            <span>CPF: {patient.cpf}</span>
          </div>
        )}
        {patient.birthDate && (
          <div className="flex items-center gap-2 text-gray-600">
            <Calendar className="h-3.5 w-3.5 text-gray-400" />
            <span>
              {formatDate(patient.birthDate)} ({calculateAge(patient.birthDate)} anos)
            </span>
          </div>
        )}
        {patient.address && (
          <div className="flex items-center gap-2 md:col-span-2 text-gray-600">
            <MapPin className="h-3.5 w-3.5 text-gray-400" />
            <span>{patient.address}</span>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

export function GuardianCard({ patient }: PatientInfoCardsProps) {
  // Se não tem nenhum responsável, não mostra o card
  if (!patient.guardian && !patient.guardian2) return null

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-sm font-medium">
          <Users className="h-4 w-4 text-gray-400" />
          Responsáveis
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-5 text-sm">
        {/* Responsável 1 */}
        {patient.guardian && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium text-gray-700 flex items-center gap-2">
              Responsável 1
              {patient.guardianRelation && (
                <span className="text-xs font-normal text-gray-500">
                  ({GUARDIAN_RELATION_LABELS[patient.guardianRelation] || patient.guardianRelation})
                </span>
              )}
            </h4>
            <div className="grid gap-2 md:grid-cols-2">
              <div className="flex items-center gap-2 text-gray-600">
                <User className="h-3.5 w-3.5 text-gray-400" />
                <span>{patient.guardian}</span>
              </div>
              {patient.guardianCpf && (
                <div className="flex items-center gap-2 text-gray-600">
                  <FileText className="h-3.5 w-3.5 text-gray-400" />
                  <span>CPF: {patient.guardianCpf}</span>
                </div>
              )}
              {patient.guardianPhone && (
                <div className="flex items-center gap-2 text-gray-600">
                  <Phone className="h-3.5 w-3.5 text-gray-400" />
                  <span>{patient.guardianPhone}</span>
                </div>
              )}
              {patient.guardianEmail && (
                <div className="flex items-center gap-2 text-gray-600">
                  <Mail className="h-3.5 w-3.5 text-gray-400" />
                  <span>{patient.guardianEmail}</span>
                </div>
              )}
              {patient.guardianAddress && (
                <div className="flex items-center gap-2 md:col-span-2 text-gray-600">
                  <MapPin className="h-3.5 w-3.5 text-gray-400" />
                  <span>{patient.guardianAddress}</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Responsável 2 */}
        {patient.guardian2 && (
          <div className="space-y-2">
            {patient.guardian && <div className="border-t pt-4" />}
            <h4 className="text-sm font-medium text-gray-700 flex items-center gap-2">
              Responsável 2
              {patient.guardian2Relation && (
                <span className="text-xs font-normal text-gray-500">
                  ({GUARDIAN_RELATION_LABELS[patient.guardian2Relation] || patient.guardian2Relation})
                </span>
              )}
            </h4>
            <div className="grid gap-2 md:grid-cols-2">
              <div className="flex items-center gap-2 text-gray-600">
                <User className="h-3.5 w-3.5 text-gray-400" />
                <span>{patient.guardian2}</span>
              </div>
              {patient.guardian2Cpf && (
                <div className="flex items-center gap-2 text-gray-600">
                  <FileText className="h-3.5 w-3.5 text-gray-400" />
                  <span>CPF: {patient.guardian2Cpf}</span>
                </div>
              )}
              {patient.guardian2Phone && (
                <div className="flex items-center gap-2 text-gray-600">
                  <Phone className="h-3.5 w-3.5 text-gray-400" />
                  <span>{patient.guardian2Phone}</span>
                </div>
              )}
              {patient.guardian2Email && (
                <div className="flex items-center gap-2 text-gray-600">
                  <Mail className="h-3.5 w-3.5 text-gray-400" />
                  <span>{patient.guardian2Email}</span>
                </div>
              )}
              {patient.guardian2Address && (
                <div className="flex items-center gap-2 md:col-span-2 text-gray-600">
                  <MapPin className="h-3.5 w-3.5 text-gray-400" />
                  <span>{patient.guardian2Address}</span>
                </div>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

export function NotesCard({ patient }: PatientInfoCardsProps) {
  if (!patient.notes) return null

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-sm font-medium">
          <FileText className="h-4 w-4 text-gray-400" />
          Observações
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-gray-600 whitespace-pre-wrap">{patient.notes}</p>
      </CardContent>
    </Card>
  )
}
