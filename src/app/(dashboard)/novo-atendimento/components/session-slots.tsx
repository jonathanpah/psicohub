"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Plus, Trash2, Calendar } from "lucide-react"
import { DURATION_OPTIONS, type SessionSlot } from "../types"

interface SessionSlotsProps {
  sessionSlots: SessionSlot[]
  filledCount: number
  maxSlots?: number
  showRemainingMessage?: boolean
  onAddSlot: () => void
  onRemoveSlot: (id: string) => void
  onUpdateSlot: (id: string, field: keyof SessionSlot, value: string | number) => void
}

export function SessionSlots({
  sessionSlots,
  filledCount,
  maxSlots,
  showRemainingMessage = false,
  onAddSlot,
  onRemoveSlot,
  onUpdateSlot,
}: SessionSlotsProps) {
  const canAddMore = maxSlots ? sessionSlots.length < maxSlots : true
  const remainingSlots = maxSlots ? maxSlots - sessionSlots.length : null

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <Calendar className="h-4 w-4" />
          Agendar Sessões
          {maxSlots && (
            <span className="text-xs font-normal text-gray-500">
              ({filledCount} de {maxSlots} {showRemainingMessage ? "disponíveis" : "agendadas"})
            </span>
          )}
        </CardTitle>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={onAddSlot}
          disabled={!canAddMore}
        >
          <Plus className="h-4 w-4 mr-1" />
          Adicionar
        </Button>
      </CardHeader>
      <CardContent className="space-y-4">
        {sessionSlots.map((slot, index) => (
          <div
            key={slot.id}
            className="flex items-end gap-3 p-3 bg-gray-50 rounded-lg"
          >
            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-sm font-medium text-gray-600">
              {index + 1}
            </div>

            <div className="flex-1 grid grid-cols-3 gap-3">
              <div className="space-y-1">
                <Label className="text-xs">Data</Label>
                <Input
                  type="date"
                  value={slot.date}
                  onChange={(e) => onUpdateSlot(slot.id, "date", e.target.value)}
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Horário</Label>
                <Input
                  type="time"
                  value={slot.time}
                  onChange={(e) => onUpdateSlot(slot.id, "time", e.target.value)}
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Duração</Label>
                <Select
                  value={slot.duration.toString()}
                  onValueChange={(value) => onUpdateSlot(slot.id, "duration", parseInt(value))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {DURATION_OPTIONS.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {sessionSlots.length > 1 && (
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => onRemoveSlot(slot.id)}
                className="text-red-500 hover:text-red-600"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
          </div>
        ))}

        {remainingSlots !== null && remainingSlots > 0 && (
          <div className="text-center py-4 border-2 border-dashed border-gray-200 rounded-lg">
            <p className="text-sm text-gray-500">
              {showRemainingMessage
                ? `Ainda restam ${remainingSlots} slots disponíveis`
                : `Você pode agendar as ${remainingSlots} sessões restantes depois.`}
            </p>
            <Button
              type="button"
              variant="link"
              size="sm"
              onClick={onAddSlot}
              className="mt-1"
            >
              <Plus className="h-4 w-4 mr-1" />
              Adicionar mais uma {showRemainingMessage ? "sessão" : "data"}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
