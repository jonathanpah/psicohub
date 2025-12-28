import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
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
    const month = searchParams.get("month")
    const year = searchParams.get("year")
    const startDate = searchParams.get("startDate")
    const endDate = searchParams.get("endDate")

    // Construir filtro de data
    let dateFilter = {}
    if (month && year) {
      // Filtro por mês e ano específico
      const startOfMonth = new Date(parseInt(year), parseInt(month) - 1, 1)
      const endOfMonth = new Date(parseInt(year), parseInt(month), 0, 23, 59, 59)
      dateFilter = {
        session: {
          dateTime: {
            gte: startOfMonth,
            lte: endOfMonth,
          },
        },
      }
    } else if (year && !month) {
      // Filtro só por ano (todos os meses do ano)
      const startOfYear = new Date(parseInt(year), 0, 1)
      const endOfYear = new Date(parseInt(year), 11, 31, 23, 59, 59)
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

    // Buscar pagamentos
    const payments = await prisma.payment.findMany({
      where: {
        userId: session.user.id,
        ...(status && { status: status as "PENDING" | "PAID" | "CANCELLED" }),
        ...(patientId && { session: { patientId } }),
        ...dateFilter,
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
    })

    // Calcular resumo
    const allPaymentsForSummary = await prisma.payment.findMany({
      where: {
        userId: session.user.id,
        ...dateFilter,
      },
      select: {
        amount: true,
        status: true,
      },
    })

    const summary = {
      totalBilled: allPaymentsForSummary
        .filter((p) => p.status !== "CANCELLED")
        .reduce((sum, p) => sum + Number(p.amount), 0),
      totalPaid: allPaymentsForSummary
        .filter((p) => p.status === "PAID")
        .reduce((sum, p) => sum + Number(p.amount), 0),
      totalPending: allPaymentsForSummary
        .filter((p) => p.status === "PENDING")
        .reduce((sum, p) => sum + Number(p.amount), 0),
      countPaid: allPaymentsForSummary.filter((p) => p.status === "PAID").length,
      countPending: allPaymentsForSummary.filter((p) => p.status === "PENDING").length,
      countCancelled: allPaymentsForSummary.filter((p) => p.status === "CANCELLED").length,
    }

    // Buscar anos disponíveis baseado nas sessões existentes
    const sessionsWithDates = await prisma.session.findMany({
      where: {
        userId: session.user.id,
      },
      select: {
        dateTime: true,
      },
    })

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
  } catch (error) {
    console.error("Erro ao listar pagamentos:", error)
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    )
  }
}
