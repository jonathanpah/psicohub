import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

// Função para converter número por extenso
function numberToWords(num: number): string {
  const units = ["", "um", "dois", "três", "quatro", "cinco", "seis", "sete", "oito", "nove"]
  const teens = ["dez", "onze", "doze", "treze", "quatorze", "quinze", "dezesseis", "dezessete", "dezoito", "dezenove"]
  const tens = ["", "", "vinte", "trinta", "quarenta", "cinquenta", "sessenta", "setenta", "oitenta", "noventa"]
  const hundreds = ["", "cento", "duzentos", "trezentos", "quatrocentos", "quinhentos", "seiscentos", "setecentos", "oitocentos", "novecentos"]

  if (num === 0) return "zero"
  if (num === 100) return "cem"

  let words = ""

  if (num >= 1000) {
    const thousands = Math.floor(num / 1000)
    if (thousands === 1) {
      words += "mil"
    } else {
      words += units[thousands] + " mil"
    }
    num %= 1000
    if (num > 0) words += " e "
  }

  if (num >= 100) {
    words += hundreds[Math.floor(num / 100)]
    num %= 100
    if (num > 0) words += " e "
  }

  if (num >= 20) {
    words += tens[Math.floor(num / 10)]
    num %= 10
    if (num > 0) words += " e "
  } else if (num >= 10) {
    words += teens[num - 10]
    return words
  }

  if (num > 0) {
    words += units[num]
  }

  return words
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value)
}

function formatCurrencyExtended(value: number): string {
  const reais = Math.floor(value)
  const centavos = Math.round((value - reais) * 100)

  let text = numberToWords(reais)
  text += reais === 1 ? " real" : " reais"

  if (centavos > 0) {
    text += " e " + numberToWords(centavos)
    text += centavos === 1 ? " centavo" : " centavos"
  }

  return text
}

const methodLabels: Record<string, string> = {
  PIX: "PIX",
  DINHEIRO: "Dinheiro",
  CARTAO_CREDITO: "Cartão de Crédito",
  CARTAO_DEBITO: "Cartão de Débito",
  TRANSFERENCIA: "Transferência Bancária",
}

// GET - Obter dados para gerar recibo PDF
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    const { id } = await params

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Não autorizado" },
        { status: 401 }
      )
    }

    const payment = await prisma.payment.findFirst({
      where: {
        id,
        userId: session.user.id,
      },
      include: {
        session: {
          include: {
            patient: {
              select: {
                id: true,
                name: true,
                cpf: true,
                email: true,
                phone: true,
              },
            },
          },
        },
        user: {
          select: {
            name: true,
            crp: true,
            cpf: true,
            phone: true,
            email: true,
            clinicName: true,
            clinicCnpj: true,
            clinicAddress: true,
            clinicPhone: true,
            // Configurações do recibo
            receiptShowName: true,
            receiptShowCpf: true,
            receiptShowCrp: true,
            receiptShowPhone: true,
            receiptShowClinicName: true,
            receiptShowClinicCnpj: true,
            receiptShowClinicAddress: true,
            receiptShowClinicPhone: true,
          },
        },
      },
    })

    if (!payment) {
      return NextResponse.json(
        { error: "Pagamento não encontrado" },
        { status: 404 }
      )
    }

    if (payment.status !== "PAID") {
      return NextResponse.json(
        { error: "Recibo só pode ser gerado para pagamentos realizados" },
        { status: 400 }
      )
    }

    const amount = Number(payment.amount)

    // Formatar dados do recibo
    const receiptData = {
      receiptNumber: payment.id.slice(-8).toUpperCase(),
      issueDate: new Date().toLocaleDateString("pt-BR"),

      // Dados do psicólogo
      psychologist: {
        name: payment.user.name,
        crp: payment.user.crp,
        cpf: payment.user.cpf,
        phone: payment.user.phone,
        email: payment.user.email,
        clinicName: payment.user.clinicName,
        clinicCnpj: payment.user.clinicCnpj,
        clinicAddress: payment.user.clinicAddress,
        clinicPhone: payment.user.clinicPhone,
      },

      // Configurações de exibição do recibo
      settings: {
        showName: payment.user.receiptShowName,
        showCpf: payment.user.receiptShowCpf,
        showCrp: payment.user.receiptShowCrp,
        showPhone: payment.user.receiptShowPhone,
        showClinicName: payment.user.receiptShowClinicName,
        showClinicCnpj: payment.user.receiptShowClinicCnpj,
        showClinicAddress: payment.user.receiptShowClinicAddress,
        showClinicPhone: payment.user.receiptShowClinicPhone,
      },

      // Dados do paciente
      patient: {
        name: payment.session.patient.name,
        cpf: payment.session.patient.cpf,
      },

      // Dados da sessão
      session: {
        date: new Date(payment.session.dateTime).toLocaleDateString("pt-BR"),
        time: new Date(payment.session.dateTime).toLocaleTimeString("pt-BR", {
          hour: "2-digit",
          minute: "2-digit",
        }),
        duration: payment.session.duration,
      },

      // Dados do pagamento
      payment: {
        amount: formatCurrency(amount),
        amountExtended: formatCurrencyExtended(amount),
        method: payment.method ? methodLabels[payment.method] || payment.method : "Não informado",
        paidAt: payment.paidAt
          ? new Date(payment.paidAt).toLocaleDateString("pt-BR")
          : new Date().toLocaleDateString("pt-BR"),
      },
    }

    return NextResponse.json(receiptData)
  } catch (error) {
    console.error("Erro ao gerar dados do recibo:", error)
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    )
  }
}
