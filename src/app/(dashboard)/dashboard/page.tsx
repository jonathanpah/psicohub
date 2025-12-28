"use client"

import { useEffect, useState, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Users, Calendar, DollarSign, Clock, AlertCircle, CheckCircle } from "lucide-react"
import Link from "next/link"

interface Patient {
  id: string
  name: string
}

interface Session {
  id: string
  dateTime: string
  duration: number
  status: string
  patient: Patient
  payment?: {
    status: string
    amount: string
  }
}

interface PendingPayment {
  id: string
  amount: string
  session: {
    id: string
    dateTime: string
    patient: {
      id: string
      name: string
    }
  }
}

interface DashboardStats {
  totalPatients: number
  todaySessions: number
  monthlyRevenue: number
  pendingPayments: number
  nextSession: Session | null
  todaySessionsList: Session[]
  pendingPaymentsList: PendingPayment[]
}

function formatCurrency(value: number | string): string {
  const num = typeof value === "string" ? parseFloat(value) : value
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(num)
}

function formatTime(dateString: string): string {
  return new Date(dateString).toLocaleTimeString("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
  })
}

function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString("pt-BR")
}

const statusColors: Record<string, { bg: string; text: string }> = {
  SCHEDULED: { bg: "#3b82f6", text: "#ffffff" },
  CONFIRMED: { bg: "#3E552A", text: "#ffffff" },
  COMPLETED: { bg: "#6b7280", text: "#ffffff" },
  CANCELLED: { bg: "#B02418", text: "#ffffff" },
  NO_SHOW: { bg: "#F5C242", text: "#1f2937" },
}

const statusLabels: Record<string, string> = {
  SCHEDULED: "Agendada",
  CONFIRMED: "Confirmada",
  COMPLETED: "Realizada",
  CANCELLED: "Cancelada",
  NO_SHOW: "Faltou",
}

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats>({
    totalPatients: 0,
    todaySessions: 0,
    monthlyRevenue: 0,
    pendingPayments: 0,
    nextSession: null,
    todaySessionsList: [],
    pendingPaymentsList: [],
  })
  const [loading, setLoading] = useState(true)

  const fetchDashboardData = useCallback(async () => {
    try {
      // Fetch active patients count
      const patientsRes = await fetch("/api/patients?status=ACTIVE")
      const patients = patientsRes.ok ? await patientsRes.json() : []

      // Fetch today's sessions
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      const tomorrow = new Date(today)
      tomorrow.setDate(tomorrow.getDate() + 1)

      const sessionsRes = await fetch(
        `/api/sessions?startDate=${today.toISOString()}&endDate=${tomorrow.toISOString()}`
      )
      const todaySessions: Session[] = sessionsRes.ok ? await sessionsRes.json() : []

      // Fetch payments for current month
      const currentMonth = new Date().getMonth() + 1
      const currentYear = new Date().getFullYear()
      const paymentsRes = await fetch(
        `/api/payments?month=${currentMonth}&year=${currentYear}`
      )
      const paymentsData = paymentsRes.ok ? await paymentsRes.json() : { payments: [], summary: {} }

      // Fetch pending payments (all time, up to 10)
      const pendingPaymentsRes = await fetch("/api/payments?status=PENDING")
      const pendingPaymentsData = pendingPaymentsRes.ok
        ? await pendingPaymentsRes.json()
        : { payments: [] }

      // Find next session (first scheduled/confirmed session in the future)
      const now = new Date()
      const upcomingSessionsRes = await fetch(
        `/api/sessions?startDate=${now.toISOString()}`
      )
      const upcomingSessions: Session[] = upcomingSessionsRes.ok
        ? await upcomingSessionsRes.json()
        : []
      const nextSession = upcomingSessions
        .filter((s) => s.status === "SCHEDULED" || s.status === "CONFIRMED")
        .sort((a, b) => new Date(a.dateTime).getTime() - new Date(b.dateTime).getTime())[0] || null

      setStats({
        totalPatients: patients.length,
        todaySessions: todaySessions.filter(
          (s) => s.status !== "CANCELLED"
        ).length,
        monthlyRevenue: paymentsData.summary?.totalPaid || 0,
        pendingPayments: paymentsData.summary?.totalPending || 0,
        nextSession,
        todaySessionsList: todaySessions
          .filter((s) => s.status !== "CANCELLED")
          .sort((a, b) => new Date(a.dateTime).getTime() - new Date(b.dateTime).getTime()),
        pendingPaymentsList: (pendingPaymentsData.payments || []).slice(0, 5),
      })
    } catch (error) {
      console.error("Erro ao carregar dados do dashboard:", error)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchDashboardData()
  }, [fetchDashboardData])

  if (loading) {
    return (
      <div className="space-y-8">
        <div>
          <h1 className="text-xl font-medium text-gray-900 tracking-tight">Dashboard</h1>
          <p className="text-sm text-gray-500 mt-1">Visão geral do seu consultório</p>
        </div>
        <div className="flex items-center justify-center h-64">
          <p className="text-gray-400">Carregando...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-xl font-medium text-gray-900 tracking-tight">Dashboard</h1>
        <p className="text-sm text-gray-500 mt-1">Visão geral do seu consultório</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-medium text-gray-500 uppercase tracking-wide">
              Total de Pacientes
            </CardTitle>
            <Users className="h-4 w-4 text-gray-300" strokeWidth={1.5} />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold text-gray-900">{stats.totalPatients}</div>
            <p className="text-xs text-gray-400 mt-1">pacientes ativos</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-medium text-gray-500 uppercase tracking-wide">
              Sessões Hoje
            </CardTitle>
            <Calendar className="h-4 w-4 text-gray-300" strokeWidth={1.5} />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold text-gray-900">{stats.todaySessions}</div>
            <p className="text-xs text-gray-400 mt-1">agendadas para hoje</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-medium text-gray-500 uppercase tracking-wide">
              Faturamento Mensal
            </CardTitle>
            <DollarSign className="h-4 w-4 text-gray-300" strokeWidth={1.5} />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold text-gray-900">
              {formatCurrency(stats.monthlyRevenue)}
            </div>
            <p className="text-xs text-gray-400 mt-1">recebido este mês</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-medium text-gray-500 uppercase tracking-wide">
              Próxima Sessão
            </CardTitle>
            <Clock className="h-4 w-4 text-gray-300" strokeWidth={1.5} />
          </CardHeader>
          <CardContent>
            {stats.nextSession ? (
              <>
                <div className="text-2xl font-semibold text-gray-900">
                  {formatTime(stats.nextSession.dateTime)}
                </div>
                <p className="text-xs text-gray-400 mt-1">
                  {stats.nextSession.patient.name.split(" ")[0]} -{" "}
                  {formatDate(stats.nextSession.dateTime)}
                </p>
              </>
            ) : (
              <>
                <div className="text-2xl font-semibold text-gray-900">--:--</div>
                <p className="text-xs text-gray-400 mt-1">nenhuma agendada</p>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Pending Payments Alert */}
      {stats.pendingPayments > 0 && (
        <Card className="border-amber-200 bg-amber-50">
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <AlertCircle className="h-5 w-5 text-amber-600" />
              <div className="flex-1">
                <p className="text-sm font-medium text-amber-800">
                  Você tem {formatCurrency(stats.pendingPayments)} em pagamentos pendentes
                </p>
              </div>
              <Link
                href="/financeiro"
                className="text-sm font-medium text-amber-700 hover:text-amber-900"
              >
                Ver todos →
              </Link>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Sessões de Hoje</CardTitle>
          </CardHeader>
          <CardContent>
            {stats.todaySessionsList.length === 0 ? (
              <p className="text-gray-400 text-sm">Nenhuma sessão agendada para hoje.</p>
            ) : (
              <div className="space-y-3">
                {stats.todaySessionsList.map((session) => (
                  <div
                    key={session.id}
                    className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0"
                  >
                    <div className="flex items-center gap-3">
                      <div className="text-sm font-medium text-gray-900">
                        {formatTime(session.dateTime)}
                      </div>
                      <Link
                        href={`/pacientes/${session.patient.id}`}
                        className="text-sm text-gray-600 hover:text-gray-900"
                      >
                        {session.patient.name}
                      </Link>
                    </div>
                    <div className="flex items-center gap-2">
                      {session.payment?.status === "PAID" ? (
                        <CheckCircle className="h-4 w-4 text-green-600" />
                      ) : (
                        <AlertCircle className="h-4 w-4 text-amber-500" />
                      )}
                      <Badge
                        style={{
                          backgroundColor: statusColors[session.status]?.bg || "#6b7280",
                          color: statusColors[session.status]?.text || "#ffffff",
                        }}
                      >
                        {statusLabels[session.status] || session.status}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-sm font-medium">Pagamentos Pendentes</CardTitle>
            {stats.pendingPaymentsList.length > 0 && (
              <Link
                href="/financeiro?status=PENDING"
                className="text-xs text-gray-500 hover:text-gray-700"
              >
                Ver todos →
              </Link>
            )}
          </CardHeader>
          <CardContent>
            {stats.pendingPaymentsList.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-4">
                <CheckCircle className="h-8 w-8 text-green-200 mb-2" />
                <p className="text-gray-400 text-sm">Nenhum pagamento pendente.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {stats.pendingPaymentsList.map((payment) => (
                  <div
                    key={payment.id}
                    className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0"
                  >
                    <div>
                      <Link
                        href={`/pacientes/${payment.session.patient.id}`}
                        className="text-sm font-medium text-gray-900 hover:text-gray-700"
                      >
                        {payment.session.patient.name}
                      </Link>
                      <p className="text-xs text-gray-400">
                        {formatDate(payment.session.dateTime)}
                      </p>
                    </div>
                    <div className="text-sm font-medium text-gray-900">
                      {formatCurrency(payment.amount)}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
