import { NextResponse } from "next/server"
import { z } from "zod"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

const checkConflictsSchema = z.object({
  dates: z.array(z.string()).min(1),
  duration: z.number().min(15).max(180).default(50),
})

/**
 * POST /api/sessions/check-conflicts
 * Verifica conflitos de horário para uma lista de datas
 * Retorna as datas que têm conflito
 */
export async function POST(request: Request) {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Não autorizado" },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { dates, duration } = checkConflictsSchema.parse(body)

    const conflicts: string[] = []

    for (const dateStr of dates) {
      const dateTime = new Date(dateStr)
      const endTime = new Date(dateTime.getTime() + duration * 60 * 1000)

      // Buscar sessões que podem conflitar (dentro de 3 horas antes até o fim)
      const conflictingSession = await prisma.session.findFirst({
        where: {
          userId: session.user.id,
          status: { notIn: ["CANCELLED"] },
          dateTime: {
            gte: new Date(dateTime.getTime() - 180 * 60 * 1000),
            lte: endTime,
          },
        },
      })

      if (conflictingSession) {
        const existingEnd = new Date(
          conflictingSession.dateTime.getTime() + conflictingSession.duration * 60 * 1000
        )

        // Verificar sobreposição real
        const hasOverlap =
          (dateTime >= conflictingSession.dateTime && dateTime < existingEnd) ||
          (endTime > conflictingSession.dateTime && endTime <= existingEnd) ||
          (dateTime <= conflictingSession.dateTime && endTime >= existingEnd)

        if (hasOverlap) {
          conflicts.push(dateStr)
        }
      }
    }

    return NextResponse.json({
      hasConflicts: conflicts.length > 0,
      conflicts,
      checkedCount: dates.length,
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.issues[0].message },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    )
  }
}
