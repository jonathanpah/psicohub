"use client"

import FullCalendar from "@fullcalendar/react"
import dayGridPlugin from "@fullcalendar/daygrid"
import timeGridPlugin from "@fullcalendar/timegrid"
import interactionPlugin from "@fullcalendar/interaction"
import listPlugin from "@fullcalendar/list"
import ptBrLocale from "@fullcalendar/core/locales/pt-br"
import type { EventClickArg, DateSelectArg } from "@fullcalendar/core"
import type { Session } from "../types"
import { SESSION_CALENDAR_COLORS } from "@/constants/status"

interface SessionCalendarProps {
  sessions: Session[]
  loading: boolean
  onDateSelect: (date: Date) => void
  onSessionClick: (session: Session) => void
  onDatesChange: (start: Date, end: Date) => void
}

// Format time as "14h" or "13h30"
function formatTimeShort(dateString: string) {
  const date = new Date(dateString)
  const hours = date.getHours()
  const minutes = date.getMinutes()
  if (minutes === 0) {
    return `${hours}h`
  }
  return `${hours}h${minutes.toString().padStart(2, "0")}`
}

export function SessionCalendar({
  sessions,
  loading,
  onDateSelect,
  onSessionClick,
  onDatesChange,
}: SessionCalendarProps) {
  const handleDateSelect = (selectInfo: DateSelectArg) => {
    onDateSelect(selectInfo.start)
  }

  const handleEventClick = (clickInfo: EventClickArg) => {
    const session = sessions.find((s) => s.id === clickInfo.event.id)
    if (session) {
      onSessionClick(session)
    }
  }

  const calendarEvents = sessions.map((session) => {
    let title = session.patient.name

    // Mostrar X/Y para pacotes
    if (session.packageId && session.packageOrder && session.package?.totalSessions) {
      title += ` (${session.packageOrder}/${session.package.totalSessions})`
    }
    // Mostrar X/Y para recorrências (apenas se NÃO for pacote)
    else if (session.recurrenceGroupId && session.recurrenceIndex && session.recurrenceCount) {
      title += ` (${session.recurrenceIndex}/${session.recurrenceCount})`
    }

    return {
      id: session.id,
      title,
      start: session.dateTime,
      end: new Date(
        new Date(session.dateTime).getTime() + session.duration * 60 * 1000
      ).toISOString(),
      backgroundColor: SESSION_CALENDAR_COLORS[session.status]?.bg || "#475368",
      borderColor: SESSION_CALENDAR_COLORS[session.status]?.border || "#475368",
      extendedProps: {
        status: session.status,
        formattedTime: formatTimeShort(session.dateTime),
        session,
        isRecurring: !!session.recurrenceGroupId,
        recurrenceIndex: session.recurrenceIndex,
        recurrenceCount: session.recurrenceCount,
      },
    }
  })

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <p className="text-gray-500">Carregando...</p>
      </div>
    )
  }

  return (
    <FullCalendar
      plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin, listPlugin]}
      initialView="dayGridMonth"
      locale={ptBrLocale}
      headerToolbar={{
        left: "prev,next today",
        center: "title",
        right: "dayGridMonth,timeGridWeek,timeGridDay,listWeek",
      }}
      events={calendarEvents}
      selectable={true}
      selectMirror={true}
      dayMaxEvents={true}
      weekends={true}
      select={handleDateSelect}
      eventClick={handleEventClick}
      slotMinTime="06:00:00"
      slotMaxTime="22:00:00"
      slotDuration="00:30:00"
      allDaySlot={false}
      height="auto"
      datesSet={(dateInfo) => {
        onDatesChange(dateInfo.start, dateInfo.end)
      }}
      eventContent={(eventInfo) => {
        const isMonthView = eventInfo.view.type === "dayGridMonth"
        const status = eventInfo.event.extendedProps?.status || "SCHEDULED"
        const formattedTime = eventInfo.event.extendedProps?.formattedTime || eventInfo.timeText
        const colors = SESSION_CALENDAR_COLORS[status as keyof typeof SESSION_CALENDAR_COLORS] || SESSION_CALENDAR_COLORS.SCHEDULED

        if (isMonthView) {
          return (
            <div
              className="px-1.5 py-0.5 rounded overflow-hidden border"
              style={{
                backgroundColor: colors.bg,
                borderColor: colors.border
              }}
            >
              <div
                className="font-medium text-xs truncate"
                style={{ color: colors.text }}
              >
                {eventInfo.event.title}
              </div>
              <div
                className="text-xs font-medium"
                style={{ color: colors.text, opacity: 0.8 }}
              >
                {formattedTime}
              </div>
            </div>
          )
        }

        return (
          <div className="p-1 overflow-hidden">
            <div className="font-medium text-xs truncate">
              {eventInfo.event.title}
            </div>
            <div className="text-xs opacity-75">
              {formattedTime}
            </div>
          </div>
        )
      }}
    />
  )
}
