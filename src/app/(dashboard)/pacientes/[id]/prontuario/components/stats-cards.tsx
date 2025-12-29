"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Calendar, Clock, FileText, Paperclip } from "lucide-react"
import type { Session, Document } from "../types"

interface StatsCardsProps {
  sessions: Session[]
  documents: Document[]
}

export function StatsCards({ sessions, documents }: StatsCardsProps) {
  const completedCount = sessions.filter((s) => s.status === "COMPLETED").length
  const notesCount = sessions.filter((s) => s.clinicalNotes).length

  return (
    <div className="grid gap-4 md:grid-cols-4">
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-4">
            <div className="p-2 bg-gray-100 rounded-full">
              <Calendar className="h-4 w-4 text-gray-400" />
            </div>
            <div>
              <p className="text-2xl font-semibold text-gray-900">{sessions.length}</p>
              <p className="text-xs text-gray-500">Total de Sessões</p>
            </div>
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-4">
            <div className="p-2 bg-green-50 rounded-full">
              <Clock className="h-4 w-4 text-green-500" />
            </div>
            <div>
              <p className="text-2xl font-semibold text-gray-900">{completedCount}</p>
              <p className="text-xs text-gray-500">Sessões Realizadas</p>
            </div>
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-4">
            <div className="p-2 bg-purple-50 rounded-full">
              <FileText className="h-4 w-4 text-purple-500" />
            </div>
            <div>
              <p className="text-2xl font-semibold text-gray-900">{notesCount}</p>
              <p className="text-xs text-gray-500">Sessões com Notas</p>
            </div>
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-4">
            <div className="p-2 bg-orange-50 rounded-full">
              <Paperclip className="h-4 w-4 text-orange-500" />
            </div>
            <div>
              <p className="text-2xl font-semibold text-gray-900">{documents.length}</p>
              <p className="text-xs text-gray-500">Documentos Anexados</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
