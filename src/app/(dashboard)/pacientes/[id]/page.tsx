"use client"

import { usePatientData, usePatientActions, useSessionDeleteActions } from "./hooks"
import {
  PatientHeader,
  PersonalDataCard,
  GuardianCard,
  NotesCard,
  SessionsList,
  StatusCard,
  SessionSummaryCard,
  ActivePackagesCard,
  FinancialCard,
  DeleteSessionDialog,
  RecurrenceDeleteDialog,
} from "./components"

export default function PacienteDetalhesPage() {
  const { patient, setPatient, sessionPackages, loading, refetch } = usePatientData()

  const {
    deleting,
    statusLoading,
    handleStatusChange,
    handleDelete,
  } = usePatientActions(patient, setPatient, refetch)

  const {
    sessionToDelete,
    deleteSessionDialogOpen,
    setDeleteSessionDialogOpen,
    recurrenceDeleteDialogOpen,
    setRecurrenceDeleteDialogOpen,
    deletingSession,
    handleDeleteSessionClick,
    handleDeleteSession,
    handleRecurrenceDelete,
  } = useSessionDeleteActions(refetch)

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-gray-500">Carregando...</p>
      </div>
    )
  }

  if (!patient) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-gray-500">Paciente não encontrado</p>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <PatientHeader
        patient={patient}
        deleting={deleting}
        onDelete={handleDelete}
      />

      {/* Main Content */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left Column */}
        <div className="lg:col-span-2 space-y-6">
          <PersonalDataCard patient={patient} />
          <GuardianCard patient={patient} />
          <NotesCard patient={patient} />
          <SessionsList
            patient={patient}
            onDeleteSession={handleDeleteSessionClick}
            onRefresh={refetch}
          />
        </div>

        {/* Right Column (Sidebar) */}
        <div className="space-y-6">
          <StatusCard
            patient={patient}
            statusLoading={statusLoading}
            onStatusChange={handleStatusChange}
          />
          <SessionSummaryCard patient={patient} packages={sessionPackages} />
          <ActivePackagesCard
            patientId={patient.id}
            packages={sessionPackages}
            onRefresh={refetch}
          />
          <FinancialCard patient={patient} packages={sessionPackages} />
        </div>
      </div>

      {/* Dialogs */}
      <DeleteSessionDialog
        open={deleteSessionDialogOpen}
        onOpenChange={setDeleteSessionDialogOpen}
        session={sessionToDelete}
        deleting={deletingSession}
        onConfirm={handleDeleteSession}
      />

      <RecurrenceDeleteDialog
        open={recurrenceDeleteDialogOpen}
        onOpenChange={setRecurrenceDeleteDialogOpen}
        session={sessionToDelete}
        deleting={deletingSession}
        onDelete={handleRecurrenceDelete}
      />
    </div>
  )
}
