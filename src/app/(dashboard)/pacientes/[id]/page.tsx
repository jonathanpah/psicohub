"use client"

import { useEffect, useState } from "react"
import { useRouter, useParams } from "next/navigation"
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
import {
  ArrowLeft,
  Edit,
  Trash2,
  User,
  Phone,
  Mail,
  Calendar,
  MapPin,
  FileText,
  DollarSign,
  Clock,
  Users,
  Plus,
  Package,
  FolderOpen,
} from "lucide-react"

interface PricingPlan {
  id: string
  type: "SESSION" | "PACKAGE"
  sessionPrice: number | null
  packageSessions: number | null
  packagePrice: number | null
  startDate: string
  active: boolean
  notes: string | null
  createdAt: string
}

interface Session {
  id: string
  dateTime: string
  duration: number
  status: "SCHEDULED" | "CONFIRMED" | "COMPLETED" | "CANCELLED" | "NO_SHOW"
  clinicalNotes: string | null
  payment: {
    id: string
    amount: number
    status: "PENDING" | "PAID" | "CANCELLED"
  } | null
  // Campos de recorrência
  recurrenceGroupId: string | null
  recurrencePattern: string | null
  recurrenceCount: number | null
  recurrenceIndex: number | null
  // Campos de pacote
  packageId: string | null
  packageOrder: number | null
  package: {
    id: string
    name: string | null
    totalSessions: number
  } | null
}

interface SessionPackage {
  id: string
  name: string | null
  totalSessions: number
  pricePerSession: number
  status: "ACTIVE" | "COMPLETED" | "CANCELLED"
  pricingPlan: PricingPlan
  sessions: {
    id: string
    dateTime: string
    status: string
    packageOrder: number | null
  }[]
  stats: {
    scheduled: number
    completed: number
    cancelled: number
    remainingSlots: number
    totalScheduled: number
  }
  createdAt: string
}

interface Patient {
  id: string
  name: string
  email: string | null
  phone: string | null
  cpf: string | null
  birthDate: string | null
  address: string | null
  guardian: string | null
  guardianCpf: string | null
  guardianEmail: string | null
  guardianPhone: string | null
  guardianAddress: string | null
  guardianRelation: string | null
  notes: string | null
  status: "ACTIVE" | "INACTIVE" | "ARCHIVED"
  createdAt: string
  sessions: Session[]
  pricingPlans: PricingPlan[]
}

export default function PacienteDetalhesPage() {
  const router = useRouter()
  const params = useParams()
  const [patient, setPatient] = useState<Patient | null>(null)
  const [sessionPackages, setSessionPackages] = useState<SessionPackage[]>([])
  const [loading, setLoading] = useState(true)
  const [deleting, setDeleting] = useState(false)
  const [statusLoading, setStatusLoading] = useState(false)
  const [deletingPlan, setDeletingPlan] = useState<string | null>(null)
  // Estados para exclusão de sessões
  const [sessionToDelete, setSessionToDelete] = useState<Session | null>(null)
  const [deleteSessionDialogOpen, setDeleteSessionDialogOpen] = useState(false)
  const [recurrenceDeleteDialogOpen, setRecurrenceDeleteDialogOpen] = useState(false)
  const [deletingSession, setDeletingSession] = useState(false)

  useEffect(() => {
    fetchPatient()
    fetchPackages()
  }, [params.id])

  async function fetchPatient() {
    try {
      const response = await fetch(`/api/patients/${params.id}`)
      if (response.ok) {
        const data = await response.json()
        setPatient(data)
      } else if (response.status === 404) {
        router.push("/pacientes")
      }
    } catch (error) {
      console.error("Erro ao carregar paciente:", error)
    } finally {
      setLoading(false)
    }
  }

  async function fetchPackages() {
    try {
      const response = await fetch(`/api/packages?patientId=${params.id}`)
      if (response.ok) {
        const data = await response.json()
        setSessionPackages(data)
      }
    } catch (error) {
      console.error("Erro ao carregar pacotes:", error)
    }
  }

  async function handleStatusChange(newStatus: string) {
    if (!patient) return
    setStatusLoading(true)
    try {
      const response = await fetch(`/api/patients/${patient.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: patient.name, status: newStatus }),
      })
      if (response.ok) {
        setPatient({ ...patient, status: newStatus as Patient["status"] })
      }
    } catch (error) {
      console.error("Erro ao atualizar status:", error)
    } finally {
      setStatusLoading(false)
    }
  }

  async function handleDelete() {
    if (!patient) return
    setDeleting(true)
    try {
      const response = await fetch(`/api/patients/${patient.id}`, {
        method: "DELETE",
      })
      if (response.ok) {
        router.push("/pacientes")
      }
    } catch (error) {
      console.error("Erro ao excluir paciente:", error)
    } finally {
      setDeleting(false)
    }
  }

  async function handleDeletePlan(planId: string) {
    if (!patient) return

    const confirmDelete = window.confirm(
      "Tem certeza que deseja excluir este plano?\n\nIsso também excluirá todas as sessões e pagamentos vinculados a ele."
    )

    if (!confirmDelete) return

    setDeletingPlan(planId)
    try {
      const response = await fetch(
        `/api/patients/${patient.id}/pricing-plans/${planId}`,
        { method: "DELETE" }
      )
      if (response.ok) {
        fetchPatient()
        fetchPackages()
      } else {
        const data = await response.json()
        alert(data.error || "Erro ao excluir plano")
      }
    } catch (error) {
      console.error("Erro ao excluir plano:", error)
      alert("Erro ao excluir plano")
    } finally {
      setDeletingPlan(null)
    }
  }

  // Iniciar processo de exclusão de sessão
  function handleDeleteSessionClick(session: Session) {
    setSessionToDelete(session)
    // Se for sessão recorrente, mostrar opções
    if (session.recurrenceGroupId) {
      setRecurrenceDeleteDialogOpen(true)
    } else {
      setDeleteSessionDialogOpen(true)
    }
  }

  // Excluir sessão individual
  async function handleDeleteSession() {
    if (!sessionToDelete) return
    setDeletingSession(true)

    try {
      const response = await fetch(`/api/sessions/${sessionToDelete.id}`, {
        method: "DELETE",
      })

      if (response.ok) {
        setDeleteSessionDialogOpen(false)
        setSessionToDelete(null)
        fetchPatient()
        fetchPackages()
      } else {
        const data = await response.json()
        alert(data.error || "Erro ao excluir sessão")
      }
    } catch (error) {
      console.error("Erro ao excluir sessão:", error)
      alert("Erro ao excluir sessão")
    } finally {
      setDeletingSession(false)
    }
  }

  // Excluir sessões de um grupo de recorrência
  async function handleRecurrenceDelete(deleteType: "SINGLE" | "FUTURE" | "ALL") {
    if (!sessionToDelete?.recurrenceGroupId) return
    setDeletingSession(true)

    try {
      const response = await fetch(`/api/sessions/recurring/${sessionToDelete.recurrenceGroupId}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          deleteType,
          sessionId: sessionToDelete.id,
        }),
      })

      if (response.ok) {
        const data = await response.json()
        setRecurrenceDeleteDialogOpen(false)
        setSessionToDelete(null)
        fetchPatient()
        fetchPackages()
        alert(`${data.deletedCount} sessão(ões) excluída(s)`)
      } else {
        const data = await response.json()
        alert(data.error || "Erro ao excluir sessões")
      }
    } catch (error) {
      console.error("Erro ao excluir sessões:", error)
      alert("Erro ao excluir sessões")
    } finally {
      setDeletingSession(false)
    }
  }

  function formatDate(dateString: string) {
    return new Date(dateString).toLocaleDateString("pt-BR")
  }

  function formatDateTime(dateString: string) {
    return new Date(dateString).toLocaleString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  function formatCurrency(value: number | null) {
    if (value === null) return "-"
    return Number(value).toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL",
    })
  }

  function calculateAge(birthDate: string) {
    const birth = new Date(birthDate)
    const today = new Date()
    let age = today.getFullYear() - birth.getFullYear()
    const monthDiff = today.getMonth() - birth.getMonth()
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--
    }
    return age
  }

  const statusColors = {
    ACTIVE: "bg-green-100 text-green-700",
    INACTIVE: "bg-yellow-100 text-yellow-700",
    ARCHIVED: "bg-gray-100 text-gray-700",
  }

  const statusLabels = {
    ACTIVE: "Ativo",
    INACTIVE: "Inativo",
    ARCHIVED: "Arquivado",
  }

  const sessionStatusColors = {
    SCHEDULED: "bg-gray-100 text-gray-600",
    CONFIRMED: "bg-gray-900 text-white",
    COMPLETED: "bg-emerald-50 text-emerald-600",
    CANCELLED: "bg-red-50 text-red-600",
    NO_SHOW: "bg-amber-50 text-amber-600",
  }

  const sessionStatusLabels = {
    SCHEDULED: "Agendada",
    CONFIRMED: "Confirmada",
    COMPLETED: "Realizada",
    CANCELLED: "Cancelada",
    NO_SHOW: "Falta",
  }

  const paymentStatusColors = {
    PENDING: "bg-yellow-100 text-yellow-700",
    PAID: "bg-green-100 text-green-700",
    CANCELLED: "bg-red-100 text-red-700",
  }

  const paymentStatusLabels = {
    PENDING: "Pendente",
    PAID: "Pago",
    CANCELLED: "Cancelado",
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-gray-500">Carregando...</p>
      </div>
    )
  }

  if (!patient) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-gray-500">Paciente não encontrado</p>
      </div>
    )
  }

  const activePlan = patient.pricingPlans.find((p) => p.active)

  return (
    <div className="space-y-6">
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
                <Badge className={statusColors[patient.status]}>
                  {statusLabels[patient.status]}
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
                  onClick={handleDelete}
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

      <div className="grid gap-6 md:grid-cols-3">
        <div className="md:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Dados Pessoais
              </CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-2">
              {patient.email && (
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-gray-400" />
                  <span>{patient.email}</span>
                </div>
              )}
              {patient.phone && (
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-gray-400" />
                  <span>{patient.phone}</span>
                </div>
              )}
              {patient.cpf && (
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-gray-400" />
                  <span>CPF: {patient.cpf}</span>
                </div>
              )}
              {patient.birthDate && (
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-gray-400" />
                  <span>
                    {formatDate(patient.birthDate)} ({calculateAge(patient.birthDate)} anos)
                  </span>
                </div>
              )}
              {patient.address && (
                <div className="flex items-center gap-2 md:col-span-2">
                  <MapPin className="h-4 w-4 text-gray-400" />
                  <span>{patient.address}</span>
                </div>
              )}
            </CardContent>
          </Card>

          {patient.guardian && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Responsável
                  {patient.guardianRelation && (
                    <span className="text-sm font-normal text-gray-500">
                      ({patient.guardianRelation === "pai" ? "Pai" :
                        patient.guardianRelation === "mae" ? "Mãe" :
                        patient.guardianRelation === "avo" ? "Avô/Avó" :
                        patient.guardianRelation === "tio" ? "Tio/Tia" :
                        patient.guardianRelation === "padrasto" ? "Padrasto/Madrasta" :
                        patient.guardianRelation === "tutor" ? "Tutor Legal" :
                        patient.guardianRelation})
                    </span>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent className="grid gap-4 md:grid-cols-2">
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-gray-400" />
                  <span>{patient.guardian}</span>
                </div>
                {patient.guardianCpf && (
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4 text-gray-400" />
                    <span>CPF: {patient.guardianCpf}</span>
                  </div>
                )}
                {patient.guardianPhone && (
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-gray-400" />
                    <span>{patient.guardianPhone}</span>
                  </div>
                )}
                {patient.guardianEmail && (
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4 text-gray-400" />
                    <span>{patient.guardianEmail}</span>
                  </div>
                )}
                {patient.guardianAddress && (
                  <div className="flex items-center gap-2 md:col-span-2">
                    <MapPin className="h-4 w-4 text-gray-400" />
                    <span>{patient.guardianAddress}</span>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {patient.notes && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Observações
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 whitespace-pre-wrap">{patient.notes}</p>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Últimas Sessões
              </CardTitle>
              <Link href={`/agenda?patientId=${patient.id}`}>
                <Button size="sm">
                  <Plus className="h-4 w-4 mr-1" />
                  Nova Sessão
                </Button>
              </Link>
            </CardHeader>
            <CardContent>
              {patient.sessions.length === 0 ? (
                <p className="text-gray-500 text-center py-8">
                  Nenhuma sessão registrada ainda.
                </p>
              ) : (
                <>
                  <div className="divide-y">
                    {patient.sessions.map((session) => (
                      <div
                        key={session.id}
                        className="flex items-center justify-between py-3 group"
                      >
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <p className="font-medium">
                              {formatDateTime(session.dateTime)}
                            </p>
                            {session.recurrenceGroupId && (
                              <span className="text-xs text-blue-600" title="Sessão recorrente">
                                🔄 {session.recurrenceIndex}/{session.recurrenceCount}
                              </span>
                            )}
                            {session.package && (
                              <Badge variant="outline" className="text-xs">
                                <Package className="h-3 w-3 mr-1" />
                                {session.packageOrder}/{session.package.totalSessions}
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm text-gray-500">
                            {session.duration} minutos
                            {session.clinicalNotes && (
                              <span className="ml-2 text-purple-600">
                                (com notas)
                              </span>
                            )}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge className={sessionStatusColors[session.status]}>
                            {sessionStatusLabels[session.status]}
                          </Badge>
                          {session.payment && (
                            <Badge className={paymentStatusColors[session.payment.status]}>
                              {paymentStatusLabels[session.payment.status]}
                            </Badge>
                          )}
                          {/* Botão de excluir - não mostrar para sessões já realizadas */}
                          {session.status !== "COMPLETED" && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-gray-400 hover:text-red-600 hover:bg-red-50 opacity-0 group-hover:opacity-100 transition-opacity"
                              onClick={() => handleDeleteSessionClick(session)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="pt-4 border-t mt-4">
                    <Link href={`/pacientes/${patient.id}/prontuario`}>
                      <Button variant="outline" className="w-full">
                        <FileText className="h-4 w-4 mr-2" />
                        Ver Prontuário Completo
                      </Button>
                    </Link>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Status do Paciente</CardTitle>
            </CardHeader>
            <CardContent>
              <Select
                value={patient.status}
                onValueChange={handleStatusChange}
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

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5" />
                Plano Atual
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {activePlan ? (
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    {activePlan.type === "SESSION" ? (
                      <DollarSign className="h-4 w-4 text-gray-500" />
                    ) : (
                      <Package className="h-4 w-4 text-gray-500" />
                    )}
                    <Badge
                      className={
                        activePlan.type === "SESSION"
                          ? "bg-gray-100 text-gray-600"
                          : "bg-gray-900 text-white"
                      }
                    >
                      {activePlan.type === "SESSION" ? "Por Sessão" : "Por Pacote"}
                    </Badge>
                  </div>

                  {activePlan.type === "SESSION" && (
                    <div>
                      <p className="text-sm text-gray-500">Valor por Sessão</p>
                      <p className="text-xl font-bold">
                        {formatCurrency(activePlan.sessionPrice)}
                      </p>
                    </div>
                  )}

                  {activePlan.type === "PACKAGE" && (
                    <>
                      <div>
                        <p className="text-sm text-gray-500">Sessões no Pacote</p>
                        <p className="text-xl font-bold">{activePlan.packageSessions}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Valor do Pacote</p>
                        <p className="text-xl font-bold">
                          {formatCurrency(activePlan.packagePrice)}
                        </p>
                      </div>
                      {activePlan.packageSessions && activePlan.packagePrice && (
                        <div>
                          <p className="text-sm text-gray-500">Valor por Sessão</p>
                          <p className="text-lg font-medium text-gray-600">
                            {formatCurrency(
                              Number(activePlan.packagePrice) / activePlan.packageSessions
                            )}
                          </p>
                        </div>
                      )}
                    </>
                  )}

                  <div>
                    <p className="text-sm text-gray-500">Início</p>
                    <p className="font-medium">{formatDate(activePlan.startDate)}</p>
                  </div>

                  {activePlan.notes && (
                    <div>
                      <p className="text-sm text-gray-500">Observações</p>
                      <p className="text-sm">{activePlan.notes}</p>
                    </div>
                  )}

                  <div className="pt-3 border-t">
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleDeletePlan(activePlan.id)}
                      disabled={deletingPlan === activePlan.id}
                      className="w-full"
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      {deletingPlan === activePlan.id ? "Excluindo..." : "Excluir Plano"}
                    </Button>
                  </div>
                </div>
              ) : (
                <p className="text-gray-500 text-center py-4">
                  Nenhum plano de pagamento definido
                </p>
              )}
            </CardContent>
          </Card>

          {patient.pricingPlans.length > 1 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Histórico de Planos</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {patient.pricingPlans
                    .filter((p) => !p.active)
                    .map((plan) => (
                      <div
                        key={plan.id}
                        className="flex items-center justify-between py-2 border-b last:border-0"
                      >
                        <div className="flex-1">
                          <p className="text-sm font-medium">
                            {plan.type === "SESSION"
                              ? `Sessão: ${formatCurrency(plan.sessionPrice)}`
                              : `Pacote: ${plan.packageSessions} sessões - ${formatCurrency(plan.packagePrice)}`}
                          </p>
                          <p className="text-xs text-gray-500">
                            {formatDate(plan.startDate)}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="text-xs">
                            Encerrado
                          </Badge>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDeletePlan(plan.id)}
                            disabled={deletingPlan === plan.id}
                            className="h-8 w-8 text-red-500 hover:text-red-600 hover:bg-red-50"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                </div>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Resumo
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm text-gray-500">Total de Sessões</p>
                <p className="text-xl font-bold">{patient.sessions.length}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Sessões Realizadas</p>
                <p className="text-xl font-bold">
                  {patient.sessions.filter((s) => s.status === "COMPLETED").length}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Pacotes Ativos */}
          {sessionPackages.filter((p) => p.status === "ACTIVE").length > 0 && (
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Package className="h-5 w-5" />
                  Pacotes Ativos
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {sessionPackages
                  .filter((p) => p.status === "ACTIVE")
                  .map((pkg) => (
                    <div key={pkg.id} className="space-y-3">
                      <div className="flex items-center justify-between">
                        <p className="font-medium text-sm">
                          {pkg.name || `Pacote de ${pkg.totalSessions} sessões`}
                        </p>
                        <Badge variant="outline" className="text-xs">
                          {pkg.stats.completed + pkg.stats.scheduled}/{pkg.totalSessions}
                        </Badge>
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
                        <Link href={`/novo-atendimento?patientId=${patient.id}&packageId=${pkg.id}`}>
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
          )}

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5" />
                Financeiro
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm text-gray-500">Total Recebido</p>
                <p className="text-xl font-bold text-green-600">
                  {formatCurrency(
                    patient.sessions
                      .filter((s) => s.payment?.status === "PAID")
                      .reduce((sum, s) => sum + Number(s.payment?.amount || 0), 0)
                  )}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Total Pendente</p>
                <p className="text-xl font-bold text-amber-600">
                  {formatCurrency(
                    patient.sessions
                      .filter((s) => s.payment?.status === "PENDING")
                      .reduce((sum, s) => sum + Number(s.payment?.amount || 0), 0)
                  )}
                </p>
              </div>
              <div className="pt-2 border-t">
                <Link href={`/financeiro?patientId=${patient.id}`}>
                  <Button variant="outline" className="w-full" size="sm">
                    Ver Histórico Financeiro
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Dialog de confirmação de exclusão de sessão simples */}
      <AlertDialog open={deleteSessionDialogOpen} onOpenChange={setDeleteSessionDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir Sessão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir esta sessão?
              {sessionToDelete?.packageId && (
                <span className="block mt-2 text-amber-600 font-medium">
                  Esta sessão faz parte de um pacote. Ao excluí-la, ficará um slot pendente no pacote.
                </span>
              )}
              {sessionToDelete?.payment?.status === "PAID" && (
                <span className="block mt-2 text-red-600 font-medium">
                  Atenção: Esta sessão já foi paga. O pagamento também será excluído.
                </span>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deletingSession}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteSession}
              disabled={deletingSession}
              className="bg-red-600 hover:bg-red-700"
            >
              {deletingSession ? "Excluindo..." : "Excluir"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Dialog de opções para exclusão de sessão recorrente */}
      <AlertDialog open={recurrenceDeleteDialogOpen} onOpenChange={setRecurrenceDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir Sessão Recorrente</AlertDialogTitle>
            <AlertDialogDescription>
              Esta sessão faz parte de uma série recorrente
              {sessionToDelete?.recurrenceIndex && sessionToDelete?.recurrenceCount && (
                <span> ({sessionToDelete.recurrenceIndex} de {sessionToDelete.recurrenceCount})</span>
              )}.
              O que você deseja fazer?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="space-y-2 py-4">
            <Button
              variant="outline"
              className="w-full justify-start"
              onClick={() => handleRecurrenceDelete("SINGLE")}
              disabled={deletingSession}
            >
              Apenas esta sessão
            </Button>
            <Button
              variant="outline"
              className="w-full justify-start"
              onClick={() => handleRecurrenceDelete("FUTURE")}
              disabled={deletingSession}
            >
              Esta e todas as sessões futuras
            </Button>
            <Button
              variant="outline"
              className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50"
              onClick={() => handleRecurrenceDelete("ALL")}
              disabled={deletingSession}
            >
              Todas as sessões da série
            </Button>
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deletingSession}>Cancelar</AlertDialogCancel>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
