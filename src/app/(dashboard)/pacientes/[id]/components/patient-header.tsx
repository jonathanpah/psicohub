"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
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
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { ArrowLeft, Edit, Trash2, FileText, FolderOpen } from "lucide-react"
import { formatDate } from "@/lib/formatters"
import { PATIENT_STATUS_COLORS, PATIENT_STATUS_LABELS } from "@/constants/status"
import type { Patient } from "../types"

interface PatientHeaderProps {
  patient: Patient
  deleting: boolean
  onDelete: () => void
}

export function PatientHeader({ patient, deleting, onDelete }: PatientHeaderProps) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-4">
        <Link href="/pacientes">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div className="flex items-center gap-4">
          <div className="h-12 w-12 rounded-full bg-gray-100 flex items-center justify-center">
            <span className="text-gray-600 font-medium text-lg">
              {patient.name.charAt(0).toUpperCase()}
            </span>
          </div>
          <div>
            <h1 className="text-xl font-medium text-gray-900 tracking-tight">{patient.name}</h1>
            <div className="flex items-center gap-2">
              <Badge className={PATIENT_STATUS_COLORS[patient.status]}>
                {PATIENT_STATUS_LABELS[patient.status]}
              </Badge>
              <span className="text-sm text-gray-500">
                Cadastrado em {formatDate(patient.createdAt)}
              </span>
            </div>
          </div>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <Link href={`/pacientes/${patient.id}/prontuario`}>
          <Button variant="outline">
            <FileText className="h-4 w-4 mr-2" />
            Prontuário
          </Button>
        </Link>
        <Link href={`/pacientes/${patient.id}/documentos`}>
          <Button variant="outline">
            <FolderOpen className="h-4 w-4 mr-2" />
            Documentos
          </Button>
        </Link>
        <Link href={`/pacientes/${patient.id}/editar`}>
          <Button variant="outline">
            <Edit className="h-4 w-4 mr-2" />
            Editar
          </Button>
        </Link>
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="destructive">
              <Trash2 className="h-4 w-4 mr-2" />
              Excluir
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Excluir paciente?</AlertDialogTitle>
              <AlertDialogDescription>
                Esta ação não pode ser desfeita. Todos os dados do paciente,
                incluindo sessões e pagamentos, serão permanentemente excluídos.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction
                onClick={onDelete}
                disabled={deleting}
                className="bg-red-600 hover:bg-red-700"
              >
                {deleting ? "Excluindo..." : "Excluir"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  )
}
