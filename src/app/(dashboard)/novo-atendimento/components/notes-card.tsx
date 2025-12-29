"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"

interface NotesCardProps {
  notes: string
  onNotesChange: (notes: string) => void
}

export function NotesCard({ notes, onNotesChange }: NotesCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm font-medium">
          Observações (opcional)
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Textarea
          value={notes}
          onChange={(e) => onNotesChange(e.target.value)}
          placeholder="Observações sobre o atendimento..."
          rows={3}
        />
      </CardContent>
    </Card>
  )
}
