"use client"

import { SESSION_CALENDAR_COLORS, SESSION_STATUS_LABELS } from "@/constants/status"

export function StatusLegend() {
  return (
    <div className="flex flex-wrap gap-4">
      {Object.entries(SESSION_STATUS_LABELS).map(([key, label]) => (
        <div key={key} className="flex items-center gap-2">
          <div
            className="w-3 h-3 rounded-full"
            style={{ backgroundColor: SESSION_CALENDAR_COLORS[key as keyof typeof SESSION_CALENDAR_COLORS]?.bg }}
          />
          <span className="text-sm text-gray-600">{label}</span>
        </div>
      ))}
    </div>
  )
}
