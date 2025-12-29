"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  DollarSign,
  MoreHorizontal,
  FileText,
  X,
  Eye,
  Download,
  CheckCircle,
} from "lucide-react"
import { formatCurrency, formatDate, formatTime } from "@/lib/formatters"
import type { Payment } from "../types"
import type { ReceiptData } from "@/components/file-viewer"

interface PaymentsTableProps {
  payments: Payment[]
  loading: boolean
  onEditPayment: (payment: Payment) => void
  onMarkAsPaid: (payment: Payment) => void
  onCancelPayment: (payment: Payment) => void
  onGenerateReceipt: (payment: Payment) => void
  onViewReceipt: (receipt: ReceiptData) => void
}

const statusColors: Record<string, { bg: string; text: string }> = {
  PENDING: { bg: "#F5C242", text: "#1f2937" },
  PAID: { bg: "#3E552A", text: "#ffffff" },
  CANCELLED: { bg: "#B02418", text: "#ffffff" },
}

const statusLabels: Record<string, string> = {
  PENDING: "Pendente",
  PAID: "Pago",
  CANCELLED: "Cancelado",
}

const methodLabels: Record<string, string> = {
  PIX: "PIX",
  DINHEIRO: "Dinheiro",
  CARTAO_CREDITO: "Cartão de Crédito",
  CARTAO_DEBITO: "Cartão de Débito",
  TRANSFERENCIA: "Transferência",
}

export function PaymentsTable({
  payments,
  loading,
  onEditPayment,
  onMarkAsPaid,
  onCancelPayment,
  onGenerateReceipt,
  onViewReceipt,
}: PaymentsTableProps) {
  const getReceiptData = (payment: Payment): ReceiptData => ({
    paymentId: payment.id,
    fileName: payment.receiptFileName,
    fileType: payment.receiptFileType,
    fileSize: payment.receiptFileSize,
  })

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium">Pagamentos</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <p className="text-gray-400 text-sm">Carregando...</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (payments.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium">Pagamentos</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <p className="text-gray-400 text-sm">Nenhum pagamento encontrado</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm font-medium">Pagamentos</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table
            className="w-full"
            role="table"
            aria-label="Lista de pagamentos"
          >
            <thead>
              <tr className="border-b border-gray-100">
                <th
                  scope="col"
                  className="text-left py-3 px-4 text-xs font-medium text-gray-500"
                >
                  Data
                </th>
                <th
                  scope="col"
                  className="text-left py-3 px-4 text-xs font-medium text-gray-500"
                >
                  Paciente
                </th>
                <th
                  scope="col"
                  className="text-left py-3 px-4 text-xs font-medium text-gray-500"
                >
                  Horário
                </th>
                <th
                  scope="col"
                  className="text-left py-3 px-4 text-xs font-medium text-gray-500"
                >
                  Valor
                </th>
                <th
                  scope="col"
                  className="text-left py-3 px-4 text-xs font-medium text-gray-500"
                >
                  Método
                </th>
                <th
                  scope="col"
                  className="text-left py-3 px-4 text-xs font-medium text-gray-500"
                >
                  Status
                </th>
                <th
                  scope="col"
                  className="text-center py-3 px-4 text-xs font-medium text-gray-500"
                >
                  Recibo
                </th>
                <th
                  scope="col"
                  className="text-right py-3 px-4 text-xs font-medium text-gray-500"
                >
                  Ações
                </th>
              </tr>
            </thead>
            <tbody>
              {payments.map((payment) => (
                <tr
                  key={payment.id}
                  className="border-b border-gray-50 hover:bg-gray-50/50"
                >
                  <td className="py-3 px-4 text-sm text-gray-900">
                    {formatDate(payment.session.dateTime)}
                  </td>
                  <td className="py-3 px-4 text-sm text-gray-900">
                    {payment.session.patient.name}
                  </td>
                  <td className="py-3 px-4 text-sm text-gray-500">
                    {formatTime(payment.session.dateTime)}
                  </td>
                  <td className="py-3 px-4 text-sm text-gray-900 font-medium">
                    {formatCurrency(payment.amount)}
                  </td>
                  <td className="py-3 px-4 text-sm text-gray-500">
                    {payment.method
                      ? methodLabels[payment.method] || payment.method
                      : "-"}
                  </td>
                  <td className="py-3 px-4">
                    <Badge
                      style={{
                        backgroundColor: statusColors[payment.status].bg,
                        color: statusColors[payment.status].text,
                      }}
                    >
                      {statusLabels[payment.status]}
                    </Badge>
                  </td>
                  <td className="py-3 px-4 text-center">
                    {payment.receiptUrl ? (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onViewReceipt(getReceiptData(payment))}
                        aria-label="Ver recibo anexado"
                      >
                        <FileText
                          className="h-4 w-4 text-green-600"
                          aria-hidden="true"
                        />
                      </Button>
                    ) : (
                      <span className="text-gray-300" aria-label="Sem recibo">
                        -
                      </span>
                    )}
                  </td>
                  <td className="py-3 px-4 text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          aria-label="Menu de ações"
                        >
                          <MoreHorizontal
                            className="h-4 w-4"
                            aria-hidden="true"
                          />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        {payment.status === "PENDING" && (
                          <DropdownMenuItem
                            onClick={() => onMarkAsPaid(payment)}
                          >
                            <CheckCircle className="h-4 w-4 mr-2" />
                            Marcar como pago
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuItem
                          onClick={() => onEditPayment(payment)}
                        >
                          <DollarSign className="h-4 w-4 mr-2" />
                          Editar pagamento
                        </DropdownMenuItem>
                        {payment.status === "PAID" && (
                          <DropdownMenuItem
                            onClick={() => onGenerateReceipt(payment)}
                          >
                            <FileText className="h-4 w-4 mr-2" />
                            Gerar recibo para paciente
                          </DropdownMenuItem>
                        )}
                        {payment.receiptUrl && (
                          <>
                            <DropdownMenuItem
                              onClick={() =>
                                onViewReceipt(getReceiptData(payment))
                              }
                            >
                              <Eye className="h-4 w-4 mr-2" />
                              Ver recibo anexado
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() =>
                                window.open(
                                  `/api/receipts/${payment.id}/download`,
                                  "_blank"
                                )
                              }
                            >
                              <Download className="h-4 w-4 mr-2" />
                              Baixar recibo
                            </DropdownMenuItem>
                          </>
                        )}
                        {payment.status === "PENDING" && (
                          <DropdownMenuItem
                            onClick={() => onCancelPayment(payment)}
                            className="text-red-600"
                          >
                            <X className="h-4 w-4 mr-2" />
                            Cancelar cobrança
                          </DropdownMenuItem>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  )
}
