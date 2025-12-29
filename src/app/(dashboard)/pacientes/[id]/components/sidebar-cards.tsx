"use client"

import { useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
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
import { DollarSign, Clock, Package, Plus, MoreVertical, Trash2 } from "lucide-react"
import { formatCurrency } from "@/lib/formatters"
import type { Patient, SessionPackage } from "../types"

// ============================================
// STATUS CARD
// ============================================

interface StatusCardProps {
  patient: Patient
  statusLoading: boolean
  onStatusChange: (status: string) => void
}

export function StatusCard({ patient, statusLoading, onStatusChange }: StatusCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm font-medium">Status do Paciente</CardTitle>
      </CardHeader>
      <CardContent>
        <Select
          value={patient.status}
          onValueChange={onStatusChange}
          disabled={statusLoading}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ACTIVE">Ativo</SelectItem>
            <SelectItem value="INACTIVE">Inativo</SelectItem>
            <SelectItem value="ARCHIVED">Arquivado</SelectItem>
          </SelectContent>
        </Select>
      </CardContent>
    </Card>
  )
}

// ============================================
// SESSION SUMMARY CARD (Histórico de Sessões)
// ============================================

interface SessionSummaryCardProps {
  patient: Patient
  packages: SessionPackage[]
}

export function SessionSummaryCard({ patient, packages }: SessionSummaryCardProps) {
  const sessions = patient.sessions

  // Agrupar por status
  const completed = sessions.filter((s) => s.status === "COMPLETED")
  const scheduled = sessions.filter((s) => s.status === "SCHEDULED")
  const confirmed = sessions.filter((s) => s.status === "CONFIRMED")
  const cancelled = sessions.filter((s) => s.status === "CANCELLED")
  const noShow = sessions.filter((s) => s.status === "NO_SHOW")

  // Calcular sessões não agendadas de pacotes ativos
  const activePackages = packages.filter((p) => p.status === "ACTIVE")
  const unbilledCount = activePackages.reduce((sum, p) => sum + p.stats.remainingSlots, 0)
  const unbilledValue = activePackages.reduce(
    (sum, p) => sum + p.stats.remainingSlots * Number(p.pricePerSession),
    0
  )

  // Calcular valores (apenas para sessões que têm pagamento)
  const calcTotal = (sessionList: typeof sessions) =>
    sessionList
      .filter((s) => s.payment && s.payment.status !== "CANCELLED")
      .reduce((sum, s) => sum + Number(s.payment?.amount || 0), 0)

  const completedValue = calcTotal(completed)
  const scheduledValue = calcTotal(scheduled)
  const confirmedValue = calcTotal(confirmed)
  const noShowValue = calcTotal(noShow) // Falta também é cobrada

  const totalSessions = sessions.length
  const totalValue = completedValue + scheduledValue + confirmedValue + noShowValue

  const statusRows = [
    { label: "Realizadas", count: completed.length, value: completedValue, color: "text-green-600", icon: "✅" },
    { label: "Confirmadas", count: confirmed.length, value: confirmedValue, color: "text-blue-600", icon: "✓" },
    { label: "Agendadas", count: scheduled.length, value: scheduledValue, color: "text-purple-600", icon: "📅" },
    { label: "Não agendadas", count: unbilledCount, value: unbilledValue, color: "text-blue-500", icon: "📋" },
    { label: "Canceladas", count: cancelled.length, value: null, color: "text-red-600", icon: "❌" },
    { label: "Faltas", count: noShow.length, value: noShowValue, color: "text-amber-600", icon: "⚠️" },
  ]

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-sm font-medium">
          <Clock className="h-4 w-4 text-gray-400" />
          Histórico de Sessões
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {statusRows.map((row) => (
          row.count > 0 && (
            <div key={row.label} className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                <span>{row.icon}</span>
                <span className={row.color}>{row.label}</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="font-medium">{row.count}</span>
                {row.value !== null && row.value > 0 && (
                  <span className="text-gray-500 text-xs w-20 text-right">
                    {formatCurrency(row.value)}
                  </span>
                )}
              </div>
            </div>
          )
        ))}

        {totalSessions === 0 ? (
          <p className="text-gray-500 text-center py-4 text-xs">
            Nenhuma sessão registrada
          </p>
        ) : (
          <div className="pt-3 mt-3 border-t">
            <div className="flex items-center justify-between text-sm font-medium">
              <span>Total</span>
              <div className="flex items-center gap-3">
                <span>{totalSessions} sessões</span>
                {totalValue > 0 && (
                  <span className="text-gray-600 text-xs w-20 text-right">
                    {formatCurrency(totalValue)}
                  </span>
                )}
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

// ============================================
// ACTIVE PACKAGES CARD
// ============================================

interface ActivePackagesCardProps {
  patientId: string
  packages: SessionPackage[]
  onRefresh: () => void
}

export function ActivePackagesCard({ patientId, packages, onRefresh }: ActivePackagesCardProps) {
  const [packageToDelete, setPackageToDelete] = useState<SessionPackage | null>(null)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const activePackages = packages.filter((p) => p.status === "ACTIVE")

  const handleDeleteClick = (pkg: SessionPackage) => {
    setPackageToDelete(pkg)
    setDeleteDialogOpen(true)
  }

  const handleDeleteConfirm = async () => {
    if (!packageToDelete) return

    setDeleting(true)
    try {
      const res = await fetch(`/api/packages/${packageToDelete.id}`, {
        method: "DELETE",
      })

      if (res.ok) {
        setDeleteDialogOpen(false)
        setPackageToDelete(null)
        onRefresh()
      } else {
        const error = await res.json()
        alert(error.error || "Erro ao excluir pacote")
      }
    } catch (error) {
      console.error("Erro ao excluir pacote:", error)
      alert("Erro ao excluir pacote")
    } finally {
      setDeleting(false)
    }
  }

  if (activePackages.length === 0) return null

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-sm font-medium">
            <Package className="h-4 w-4 text-gray-400" />
            Pacotes Ativos
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {activePackages.map((pkg) => (
            <div key={pkg.id} className="space-y-3">
              <div className="flex items-center justify-between">
                <p className="font-medium text-sm">
                  {pkg.name || `Pacote de ${pkg.totalSessions} sessões`}
                </p>
                <div className="flex items-center gap-1">
                  <Badge variant="outline" className="text-xs">
                    {pkg.stats.completed + pkg.stats.scheduled}/{pkg.totalSessions}
                  </Badge>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-6 w-6">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem
                        className="text-red-600 focus:text-red-600"
                        onClick={() => handleDeleteClick(pkg)}
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Excluir Pacote
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>

              {/* Progress bar */}
              <div className="w-full bg-gray-100 rounded-full h-2">
                <div
                  className="bg-gray-900 h-2 rounded-full transition-all"
                  style={{
                    width: `${((pkg.stats.completed + pkg.stats.scheduled) / pkg.totalSessions) * 100}%`,
                  }}
                />
              </div>

              <div className="grid grid-cols-3 gap-2 text-center text-xs">
                <div className="p-2 bg-gray-50 rounded">
                  <p className="font-medium text-gray-900">{pkg.stats.completed}</p>
                  <p className="text-gray-500">Realizadas</p>
                </div>
                <div className="p-2 bg-gray-50 rounded">
                  <p className="font-medium text-gray-900">{pkg.stats.scheduled}</p>
                  <p className="text-gray-500">Agendadas</p>
                </div>
                <div className="p-2 bg-gray-50 rounded">
                  <p className="font-medium text-gray-900">{pkg.stats.remainingSlots}</p>
                  <p className="text-gray-500">Restantes</p>
                </div>
              </div>

              {pkg.stats.remainingSlots > 0 && (
                <Link href={`/novo-atendimento?patientId=${patientId}&packageId=${pkg.id}`}>
                  <Button variant="outline" size="sm" className="w-full">
                    <Plus className="h-4 w-4 mr-1" />
                    Agendar Próxima ({pkg.stats.remainingSlots} restante{pkg.stats.remainingSlots > 1 ? "s" : ""})
                  </Button>
                </Link>
              )}
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Delete Package Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir Pacote</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir este pacote?
              {packageToDelete && packageToDelete.stats.completed > 0 && (
                <span className="block mt-2 text-red-600 font-medium">
                  Este pacote possui {packageToDelete.stats.completed} sessão(ões) realizada(s).
                  Pacotes com sessões realizadas não podem ser excluídos.
                </span>
              )}
              {packageToDelete && packageToDelete.stats.completed === 0 && (
                <span className="block mt-2 text-amber-600 font-medium">
                  Todas as sessões agendadas e pagamentos pendentes serão excluídos.
                </span>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              disabled={deleting || (packageToDelete?.stats.completed ?? 0) > 0}
              className="bg-red-600 hover:bg-red-700"
            >
              {deleting ? "Excluindo..." : "Excluir"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}

// ============================================
// FINANCIAL CARD
// ============================================

interface FinancialCardProps {
  patient: Patient
  packages: SessionPackage[]
}

export function FinancialCard({ patient, packages }: FinancialCardProps) {
  // Recebido = sessões com pagamento PAID
  const totalReceived = patient.sessions
    .filter((s) => s.payment?.status === "PAID")
    .reduce((sum, s) => sum + Number(s.payment?.amount || 0), 0)

  // Pendente de sessões agendadas = pagamentos com status PENDING
  const pendingFromScheduled = patient.sessions
    .filter((s) => s.payment?.status === "PENDING")
    .reduce((sum, s) => sum + Number(s.payment?.amount || 0), 0)

  // Pendente de sessões NÃO agendadas (pacotes ativos com slots restantes)
  // Essas sessões já foram "comprometidas" no pacote, então são pendência
  const activePackages = packages.filter((p) => p.status === "ACTIVE")
  const pendingFromUnscheduled = activePackages.reduce(
    (sum, p) => sum + p.stats.remainingSlots * Number(p.pricePerSession),
    0
  )

  // Total pendente = agendadas pendentes + não agendadas de pacotes
  const totalPending = pendingFromScheduled + pendingFromUnscheduled

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-sm font-medium">
          <DollarSign className="h-4 w-4 text-gray-400" />
          Financeiro
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div>
          <p className="text-xs text-gray-500">Total Recebido</p>
          <p className="text-lg font-semibold text-green-600">
            {formatCurrency(totalReceived)}
          </p>
        </div>
        <div>
          <p className="text-xs text-gray-500">Total Pendente</p>
          <p className="text-lg font-semibold text-amber-600">
            {formatCurrency(totalPending)}
          </p>
          {pendingFromUnscheduled > 0 && (
            <p className="text-xs text-gray-400 mt-0.5">
              (inclui {formatCurrency(pendingFromUnscheduled)} não agendadas)
            </p>
          )}
        </div>
        <div className="pt-2 border-t">
          <Link href={`/financeiro?patientId=${patient.id}`}>
            <Button variant="outline" className="w-full text-xs" size="sm">
              Ver Histórico Financeiro
            </Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  )
}
