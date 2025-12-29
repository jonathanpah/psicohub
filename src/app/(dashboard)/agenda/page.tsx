"use client"

import { Suspense } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Plus } from "lucide-react"
import { useSessions, usePatients, useSessionForm } from "./hooks"
import {
  SessionCalendar,
  SessionModal,
  DeleteSessionDialog,
  RecurrenceDeleteDialog,
  StatusLegend,
} from "./components"

function AgendaPageContent() {
  const { sessions, loading, fetchSessions } = useSessions()
  const { patients } = usePatients()
  const {
    modalOpen,
    setModalOpen,
    deleteDialogOpen,
    setDeleteDialogOpen,
    recurrenceDialogOpen,
    setRecurrenceDialogOpen,
    recurrenceActionType,
    selectedSession,
    formData,
    setFormData,
    saving,
    error,
    openNewSession,
    openEditSession,
    handleSubmit,
    handleDelete,
    handleRecurrenceDelete,
  } = useSessionForm(patients, fetchSessions)

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-medium text-gray-900 tracking-tight">Agenda</h1>
          <p className="text-sm text-gray-500 mt-1">Gerencie suas sessões</p>
        </div>
        <Button onClick={() => openNewSession()}>
          <Plus className="h-4 w-4 mr-2" />
          Nova Sessão
        </Button>
      </div>

      {/* Status Legend */}
      <StatusLegend />

      {/* Calendar */}
      <Card>
        <CardContent className="p-4">
          <SessionCalendar
            sessions={sessions}
            loading={loading}
            onDateSelect={openNewSession}
            onSessionClick={openEditSession}
            onDatesChange={(start, end) => fetchSessions(start, end)}
          />
        </CardContent>
      </Card>

      {/* Session Modal */}
      <SessionModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        selectedSession={selectedSession}
        formData={formData}
        setFormData={setFormData}
        patients={patients}
        saving={saving}
        error={error}
        onSubmit={handleSubmit}
        onDeleteClick={() => setDeleteDialogOpen(true)}
      />

      {/* Delete Dialog */}
      <DeleteSessionDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        onConfirm={handleDelete}
      />

      {/* Recurrence Delete Dialog */}
      <RecurrenceDeleteDialog
        open={recurrenceDialogOpen}
        onOpenChange={setRecurrenceDialogOpen}
        selectedSession={selectedSession}
        actionType={recurrenceActionType}
        onDelete={handleRecurrenceDelete}
      />
    </div>
  )
}

export default function AgendaPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center h-96"><p className="text-gray-400">Carregando agenda...</p></div>}>
      <AgendaPageContent />
    </Suspense>
  )
}
