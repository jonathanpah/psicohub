"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { User } from "lucide-react"
import type { Patient } from "../types"

interface PatientSelectorProps {
  patients: Patient[]
  selectedPatient: string
  loading: boolean
  onSelectPatient: (patientId: string) => void
}

export function PatientSelector({
  patients,
  selectedPatient,
  loading,
  onSelectPatient,
}: PatientSelectorProps) {
  return (
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
          <Select value={selectedPatient} onValueChange={onSelectPatient}>
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
  )
}
