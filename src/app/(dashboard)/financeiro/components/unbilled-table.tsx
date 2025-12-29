"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { MoreHorizontal, Trash2 } from "lucide-react"
import { formatCurrency } from "@/lib/formatters"
import type { UnbilledItem } from "../types"

interface UnbilledTableProps {
  items: UnbilledItem[]
  onRefresh: () => void
}

export function UnbilledTable({ items, onRefresh }: UnbilledTableProps) {
  const [packageToDelete, setPackageToDelete] = useState<UnbilledItem | null>(null)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const handleDeleteClick = (item: UnbilledItem) => {
    setPackageToDelete(item)
    setDeleteDialogOpen(true)
  }

  const handleDeleteConfirm = async () => {
    if (!packageToDelete) return

    setDeleting(true)
    try {
      const res = await fetch(`/api/packages/${packageToDelete.id}`, {
        method: "DELETE",
      })

      if (res.ok) {
        setDeleteDialogOpen(false)
        setPackageToDelete(null)
        onRefresh()
      } else {
        const error = await res.json()
        alert(error.error || "Erro ao excluir pacote")
      }
    } catch (error) {
      console.error("Erro ao excluir pacote:", error)
      alert("Erro ao excluir pacote")
    } finally {
      setDeleting(false)
    }
  }

  if (items.length === 0) {
    return null
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium">Sessões Não Agendadas</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table
              className="w-full"
              role="table"
              aria-label="Sessões não agendadas / não faturadas"
            >
              <thead>
                <tr className="border-b border-gray-100">
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
                    Pacote
                  </th>
                  <th
                    scope="col"
                    className="text-left py-3 px-4 text-xs font-medium text-gray-500"
                  >
                    Sessões Restantes
                  </th>
                  <th
                    scope="col"
                    className="text-left py-3 px-4 text-xs font-medium text-gray-500"
                  >
                    Valor/Sessão
                  </th>
                  <th
                    scope="col"
                    className="text-left py-3 px-4 text-xs font-medium text-gray-500"
                  >
                    Total Pendente
                  </th>
                  <th
                    scope="col"
                    className="text-left py-3 px-4 text-xs font-medium text-gray-500"
                  >
                    Status
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
                {items.map((item) => (
                  <tr
                    key={item.id}
                    className="border-b border-gray-50 hover:bg-gray-50/50"
                  >
                    <td className="py-3 px-4 text-sm text-gray-900">
                      <a
                        href={`/pacientes/${item.patientId}`}
                        className="hover:underline"
                      >
                        {item.patientName}
                      </a>
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-500">
                      {item.packageName}
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-900">
                      {item.remainingSessions} sessões
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-500">
                      {formatCurrency(item.pricePerSession)}
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-900 font-medium">
                      {formatCurrency(item.totalRemaining)}
                    </td>
                    <td className="py-3 px-4">
                      <Badge
                        style={{
                          backgroundColor: "#3b82f6",
                          color: "#ffffff",
                        }}
                      >
                        Não Agendado
                      </Badge>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            className="text-red-600 focus:text-red-600"
                            onClick={() => handleDeleteClick(item)}
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Excluir Pacote
                          </DropdownMenuItem>
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

      {/* Delete Package Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir Pacote</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir o pacote de{" "}
              <strong>{packageToDelete?.patientName}</strong>?
              <span className="block mt-2 text-amber-600 font-medium">
                Todas as sessões agendadas e pagamentos pendentes deste pacote serão excluídos.
              </span>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              disabled={deleting}
              className="bg-red-600 hover:bg-red-700"
            >
              {deleting ? "Excluindo..." : "Excluir Pacote"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
