import { jsPDF } from "jspdf"
import { toast } from "sonner"
import type { Payment } from "./types"

interface ReceiptData {
  receiptNumber: string
  issueDate: string
  psychologist: {
    name: string
    crp: string | null
    cpf: string | null
    phone: string | null
    clinicName: string | null
    clinicCnpj: string | null
    clinicAddress: string | null
    clinicPhone: string | null
  }
  patient: {
    name: string
    cpf: string | null
  }
  session: {
    date: string
    time: string
    duration: number
  }
  payment: {
    amount: string
    amountExtended: string
    method: string
    paidAt: string
  }
  settings?: {
    showName?: boolean
    showCpf?: boolean
    showCrp?: boolean
    showPhone?: boolean
    showClinicName?: boolean
    showClinicCnpj?: boolean
    showClinicAddress?: boolean
    showClinicPhone?: boolean
  }
}

export async function generateReceipt(payment: Payment): Promise<void> {
  try {
    const response = await fetch(`/api/payments/${payment.id}/receipt`)
    if (!response.ok) {
      const error = await response.json()
      toast.error(error.error || "Erro ao gerar recibo")
      return
    }

    const data: ReceiptData = await response.json()

    const doc = new jsPDF()
    const pageWidth = doc.internal.pageSize.getWidth()
    const margin = 20
    let y = 20

    // Título
    doc.setFontSize(18)
    doc.setFont("helvetica", "bold")
    doc.text("RECIBO DE PAGAMENTO", pageWidth / 2, y, { align: "center" })
    y += 10

    doc.setFontSize(10)
    doc.setFont("helvetica", "normal")
    doc.text(`N° ${data.receiptNumber}`, pageWidth / 2, y, { align: "center" })
    y += 15

    // Linha divisória
    doc.setLineWidth(0.5)
    doc.line(margin, y, pageWidth - margin, y)
    y += 10

    // Dados do Profissional
    doc.setFontSize(11)
    doc.setFont("helvetica", "bold")
    doc.text("DADOS DO PROFISSIONAL", margin, y)
    y += 7

    doc.setFontSize(10)
    doc.setFont("helvetica", "normal")

    if (data.settings?.showName !== false && data.psychologist.name) {
      doc.text(`Nome: ${data.psychologist.name}`, margin, y)
      y += 5
    }
    if (data.settings?.showCrp !== false && data.psychologist.crp) {
      doc.text(`CRP: ${data.psychologist.crp}`, margin, y)
      y += 5
    }
    if (data.settings?.showCpf && data.psychologist.cpf) {
      doc.text(`CPF: ${data.psychologist.cpf}`, margin, y)
      y += 5
    }
    if (data.settings?.showClinicName !== false && data.psychologist.clinicName) {
      doc.text(`Clínica: ${data.psychologist.clinicName}`, margin, y)
      y += 5
    }
    if (data.settings?.showClinicCnpj !== false && data.psychologist.clinicCnpj) {
      doc.text(`CNPJ: ${data.psychologist.clinicCnpj}`, margin, y)
      y += 5
    }
    if (data.settings?.showClinicAddress !== false && data.psychologist.clinicAddress) {
      doc.text(`Endereço: ${data.psychologist.clinicAddress}`, margin, y)
      y += 5
    }
    if (data.settings?.showClinicPhone && data.psychologist.clinicPhone) {
      doc.text(`Telefone: ${data.psychologist.clinicPhone}`, margin, y)
      y += 5
    } else if (data.settings?.showPhone && data.psychologist.phone) {
      doc.text(`Telefone: ${data.psychologist.phone}`, margin, y)
      y += 5
    }
    y += 5

    // Dados do Paciente
    doc.setFontSize(11)
    doc.setFont("helvetica", "bold")
    doc.text("DADOS DO PACIENTE", margin, y)
    y += 7

    doc.setFontSize(10)
    doc.setFont("helvetica", "normal")
    doc.text(`Nome: ${data.patient.name}`, margin, y)
    y += 5
    if (data.patient.cpf) {
      doc.text(`CPF: ${data.patient.cpf}`, margin, y)
      y += 5
    }
    y += 5

    // Dados do Serviço
    doc.setFontSize(11)
    doc.setFont("helvetica", "bold")
    doc.text("SERVIÇO PRESTADO", margin, y)
    y += 7

    doc.setFontSize(10)
    doc.setFont("helvetica", "normal")
    doc.text("Descrição: Sessão de atendimento psicológico", margin, y)
    y += 5
    doc.text(`Data: ${data.session.date}`, margin, y)
    y += 5
    doc.text(`Horário: ${data.session.time}`, margin, y)
    y += 5
    doc.text(`Duração: ${data.session.duration} minutos`, margin, y)
    y += 10

    // Dados do Pagamento
    doc.setFontSize(11)
    doc.setFont("helvetica", "bold")
    doc.text("PAGAMENTO", margin, y)
    y += 7

    doc.setFontSize(10)
    doc.setFont("helvetica", "normal")
    doc.text(`Valor: ${data.payment.amount}`, margin, y)
    y += 5
    doc.text(`(${data.payment.amountExtended})`, margin, y)
    y += 5
    doc.text(`Forma de pagamento: ${data.payment.method}`, margin, y)
    y += 5
    doc.text(`Data do pagamento: ${data.payment.paidAt}`, margin, y)
    y += 15

    // Linha divisória
    doc.line(margin, y, pageWidth - margin, y)
    y += 10

    // Assinatura
    if (data.settings?.showClinicAddress !== false && data.psychologist.clinicAddress) {
      doc.text(`${data.psychologist.clinicAddress}`, pageWidth / 2, y, {
        align: "center",
      })
      y += 5
    }
    doc.text(`${data.issueDate}`, pageWidth / 2, y, { align: "center" })
    y += 15

    doc.line(pageWidth / 2 - 40, y, pageWidth / 2 + 40, y)
    y += 5
    if (data.settings?.showName !== false && data.psychologist.name) {
      doc.text(data.psychologist.name, pageWidth / 2, y, { align: "center" })
      y += 5
    }
    if (data.settings?.showCrp !== false && data.psychologist.crp) {
      doc.text(`CRP: ${data.psychologist.crp}`, pageWidth / 2, y, {
        align: "center",
      })
    }
    y += 15

    // Rodapé
    doc.setFontSize(8)
    doc.setTextColor(128)
    doc.text("Documento válido como comprovante de pagamento", pageWidth / 2, y, {
      align: "center",
    })

    // Salvar
    doc.save(`recibo-${data.receiptNumber}.pdf`)
    toast.success("Recibo gerado com sucesso")
  } catch {
    toast.error("Erro ao gerar recibo")
  }
}
