"use client"

import { Button } from "@/components/ui/button"
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
import type { Session } from "../types"

interface DeleteDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onConfirm: () => void
}

export function DeleteSessionDialog({
  open,
  onOpenChange,
  onConfirm,
}: DeleteDialogProps) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
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
            onClick={onConfirm}
            className="bg-red-600 hover:bg-red-700"
          >
            Excluir
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}

interface RecurrenceDeleteDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  selectedSession: Session | null
  actionType: "delete" | null
  onDelete: (deleteType: "SINGLE" | "FUTURE" | "ALL") => void
}

export function RecurrenceDeleteDialog({
  open,
  onOpenChange,
  selectedSession,
  actionType,
  onDelete,
}: RecurrenceDeleteDialogProps) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>
            {actionType === "delete" ? "Excluir sessão recorrente" : "Ação em sessão recorrente"}
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
            onClick={() => onDelete("SINGLE")}
          >
            Apenas esta sessão
          </Button>
          <Button
            variant="outline"
            className="w-full justify-start"
            onClick={() => onDelete("FUTURE")}
          >
            Esta e todas as sessões futuras
          </Button>
          <Button
            variant="outline"
            className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50"
            onClick={() => onDelete("ALL")}
          >
            Todas as sessões da série
          </Button>
        </div>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancelar</AlertDialogCancel>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
