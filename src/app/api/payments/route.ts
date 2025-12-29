import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { logApiError } from "@/lib/logger"
import { prisma } from "@/lib/prisma"

// GET - Listar pagamentos com filtros e resumo
export async function GET(request: Request) {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Não autorizado" },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const status = searchParams.get("status")
    const patientId = searchParams.get("patientId")
    const monthParam = searchParams.get("month")
    const yearParam = searchParams.get("year")
    const startDate = searchParams.get("startDate")
    const endDate = searchParams.get("endDate")

    // Validar e parsear mês e ano
    const month = monthParam ? parseInt(monthParam, 10) : null
    const year = yearParam ? parseInt(yearParam, 10) : null

    // Validar intervalos
    const isValidMonth = month !== null && !isNaN(month) && month >= 1 && month <= 12
    const isValidYear = year !== null && !isNaN(year) && year >= 2020 && year <= 2100

    // Construir filtro de data
    let dateFilter = {}
    if (isValidMonth && isValidYear) {
      // Filtro por mês e ano específico
      const startOfMonth = new Date(year, month - 1, 1)
      const endOfMonth = new Date(year, month, 0, 23, 59, 59)
      dateFilter = {
        session: {
          dateTime: {
            gte: startOfMonth,
            lte: endOfMonth,
          },
        },
      }
    } else if (isValidYear && !isValidMonth) {
      // Filtro só por ano (todos os meses do ano)
      const startOfYear = new Date(year, 0, 1)
      const endOfYear = new Date(year, 11, 31, 23, 59, 59)
      dateFilter = {
        session: {
          dateTime: {
            gte: startOfYear,
            lte: endOfYear,
          },
        },
      }
    } else if (startDate && endDate) {
      dateFilter = {
        session: {
          dateTime: {
            gte: new Date(startDate),
            lte: new Date(endDate),
          },
        },
      }
    }
    // Se não tiver month, year, startDate, ou endDate, retorna todos os pagamentos

    // Executar todas as queries em paralelo para otimização
    const baseWhere = {
      userId: session.user.id,
      ...dateFilter,
    }

    const [payments, summaryByStatus, sessionsWithDates] = await Promise.all([
      // Query 1: Buscar pagamentos com filtros
      prisma.payment.findMany({
        where: {
          ...baseWhere,
          ...(status && { status: status as "PENDING" | "PAID" | "CANCELLED" }),
          ...(patientId && { session: { patientId } }),
        },
        include: {
          session: {
            include: {
              patient: {
                select: {
                  id: true,
                  name: true,
                  phone: true,
                  email: true,
                },
              },
            },
          },
        },
        orderBy: {
          session: {
            dateTime: "desc",
          },
        },
      }),

      // Query 2: Agregação por status para resumo (mais eficiente que buscar todos)
      prisma.payment.groupBy({
        by: ["status"],
        where: baseWhere,
        _sum: { amount: true },
        _count: { id: true },
      }),

      // Query 3: Anos disponíveis (usando distinct)
      prisma.session.findMany({
        where: { userId: session.user.id },
        select: { dateTime: true },
        distinct: ["dateTime"],
      }),
    ])

    // Processar resumo a partir da agregação
    const summaryMap = summaryByStatus.reduce((acc, item) => {
      acc[item.status] = {
        total: Number(item._sum.amount || 0),
        count: item._count.id,
      }
      return acc
    }, {} as Record<string, { total: number; count: number }>)

    const summary = {
      totalBilled: (summaryMap.PAID?.total || 0) + (summaryMap.PENDING?.total || 0),
      totalPaid: summaryMap.PAID?.total || 0,
      totalPending: summaryMap.PENDING?.total || 0,
      countPaid: summaryMap.PAID?.count || 0,
      countPending: summaryMap.PENDING?.count || 0,
      countCancelled: summaryMap.CANCELLED?.count || 0,
    }

    const currentYear = new Date().getFullYear()
    const yearsFromData = new Set(
      sessionsWithDates.map((s) => new Date(s.dateTime).getFullYear())
    )
    // Sempre incluir 2025 e 2026 no mínimo, além dos anos com dados
    yearsFromData.add(2025)
    yearsFromData.add(2026)
    yearsFromData.add(currentYear)

    const availableYears = Array.from(yearsFromData).sort((a, b) => b - a)

    return NextResponse.json({ payments, summary, availableYears })
  } catch (error: unknown) {
    logApiError("API", "ERROR", error)
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    )
  }
}
