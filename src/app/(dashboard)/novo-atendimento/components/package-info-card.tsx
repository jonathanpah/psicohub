"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Package, CheckCircle } from "lucide-react"
import { formatCurrency } from "@/lib/formatters"
import type { ExistingPackage } from "../types"

interface PackageInfoCardProps {
  package: ExistingPackage
}

export function PackageInfoCard({ package: pkg }: PackageInfoCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <Package className="h-4 w-4" />
          Informações do Pacote
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="bg-gray-50 rounded-lg p-4 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">Paciente</span>
            <span className="font-medium text-gray-900">{pkg.patient.name}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">Pacote</span>
            <span className="font-medium text-gray-900">{pkg.name}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">Valor por sessão</span>
            <span className="font-medium text-gray-900">
              {formatCurrency(pkg.pricePerSession)}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">Sessões restantes</span>
            <span className="font-medium text-green-600">
              {pkg.remainingSlots} de {pkg.totalSessions}
            </span>
          </div>
          {pkg.existingReceipt && (
            <div className="pt-2 border-t border-gray-200">
              <p className="text-xs text-green-600 flex items-center gap-1">
                <CheckCircle className="h-3 w-3" />
                Pacote pago - recibo será copiado para as novas sessões
              </p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
