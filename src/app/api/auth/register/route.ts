import { NextResponse } from "next/server"
import { hash } from "bcryptjs"
import { z } from "zod"
import { prisma } from "@/lib/prisma"
import { logApiError } from "@/lib/logger"
import {
  checkRateLimit,
  rateLimitConfigs,
  getClientIP,
  rateLimitExceededResponse,
} from "@/lib/rate-limit"

const registerSchema = z.object({
  name: z.string().min(2, "Nome deve ter pelo menos 2 caracteres"),
  email: z.string().email("Email inválido"),
  phone: z.string().min(10, "Telefone inválido"),
  cpf: z.string().min(11, "CPF inválido"),
  crp: z.string().optional(),
  password: z.string().min(12, "Senha deve ter pelo menos 12 caracteres"),
})

export async function POST(request: Request) {
  // Rate limiting - proteção contra brute force
  const clientIP = getClientIP(request)
  const rateLimitResult = await checkRateLimit(`register:${clientIP}`, rateLimitConfigs.register)

  if (!rateLimitResult.success) {
    return rateLimitExceededResponse(rateLimitResult)
  }

  try {
    const body = await request.json()
    const { name, email, phone, cpf, crp, password } = registerSchema.parse(body)

    const existingUser = await prisma.user.findUnique({
      where: { email },
    })

    // Hash a senha independente do resultado para evitar timing attacks
    const hashedPassword = await hash(password, 12)

    if (existingUser) {
      // Retornar mesma mensagem de sucesso para evitar email enumeration
      // O usuário não saberá se o email já existe ou se foi criado com sucesso
      return NextResponse.json(
        { message: "Se o email não estiver em uso, sua conta foi criada. Verifique seu email." },
        { status: 201 }
      )
    }

    const user = await prisma.user.create({
      data: {
        name,
        email,
        phone,
        cpf,
        crp,
        password: hashedPassword,
      },
    })

    return NextResponse.json(
      { message: "Se o email não estiver em uso, sua conta foi criada. Verifique seu email.", userId: user.id },
      { status: 201 }
    )
  } catch (error: unknown) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.issues[0].message },
        { status: 400 }
      )
    }

    logApiError("API", "ERROR", error)
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    )
  }
}
