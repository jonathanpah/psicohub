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

// ============================================
// DELETE SESSION DIALOG
// ============================================

interface DeleteSessionDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  session: Session | null
  deleting: boolean
  onConfirm: () => void
}

export function DeleteSessionDialog({
  open,
  onOpenChange,
  session,
  deleting,
  onConfirm,
}: DeleteSessionDialogProps) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Excluir Sessão</AlertDialogTitle>
          <AlertDialogDescription>
            Tem certeza que deseja excluir esta sessão?
            {session?.packageId && (
              <span className="block mt-2 text-amber-600 font-medium">
                Esta sessão faz parte de um pacote. Ao excluí-la, ficará um slot pendente no pacote.
              </span>
            )}
            {session?.payment?.status === "PAID" && (
              <span className="block mt-2 text-red-600 font-medium">
                Atenção: Esta sessão já foi paga. O pagamento também será excluído.
              </span>
            )}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={deleting}>Cancelar</AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            disabled={deleting}
            className="bg-red-600 hover:bg-red-700"
          >
            {deleting ? "Excluindo..." : "Excluir"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}

// ============================================
// RECURRENCE DELETE DIALOG
// ============================================

interface RecurrenceDeleteDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  session: Session | null
  deleting: boolean
  onDelete: (deleteType: "SINGLE" | "FUTURE" | "ALL") => void
}

export function RecurrenceDeleteDialog({
  open,
  onOpenChange,
  session,
  deleting,
  onDelete,
}: RecurrenceDeleteDialogProps) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Excluir Sessão Recorrente</AlertDialogTitle>
          <AlertDialogDescription>
            Esta sessão faz parte de uma série recorrente
            {session?.recurrenceIndex && session?.recurrenceCount && (
              <span> ({session.recurrenceIndex} de {session.recurrenceCount})</span>
            )}.
            O que você deseja fazer?
          </AlertDialogDescription>
        </AlertDialogHeader>
        <div className="space-y-2 py-4">
          <Button
            variant="outline"
            className="w-full justify-start"
            onClick={() => onDelete("SINGLE")}
            disabled={deleting}
          >
            Apenas esta sessão
          </Button>
          <Button
            variant="outline"
            className="w-full justify-start"
            onClick={() => onDelete("FUTURE")}
            disabled={deleting}
          >
            Esta e todas as sessões futuras
          </Button>
          <Button
            variant="outline"
            className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50"
            onClick={() => onDelete("ALL")}
            disabled={deleting}
          >
            Todas as sessões da série
          </Button>
        </div>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={deleting}>Cancelar</AlertDialogCancel>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}

