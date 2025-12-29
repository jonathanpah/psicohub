"use client"

import { Suspense } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"
import { parseCurrency } from "@/components/ui/masked-input"
import { useNovoAtendimento } from "./hooks"
import {
  SuccessScreen,
  SessionSlots,
  PackageInfoCard,
  PatientSelector,
  TypeSelector,
  PaymentSection,
  NotesCard,
  SummaryActions,
  ErrorState,
  RecurrenceOptions,
} from "./components"

function NovoAtendimentoContent() {
  const {
    patients,
    loading,
    saving,
    error,
    success,
    existingPackage,
    isAddToPackageMode,
    selectedPatient,
    setSelectedPatient,
    type,
    setType,
    sessionPrice,
    setSessionPrice,
    totalSessions,
    setTotalSessions,
    packagePrice,
    setPackagePrice,
    notes,
    setNotes,
    isPaid,
    setIsPaid,
    paymentMethod,
    setPaymentMethod,
    receipt,
    setReceipt,
    sessionSlots,
    // Recurrence
    isRecurring,
    setIsRecurring,
    recurrencePattern,
    setRecurrencePattern,
    recurrenceCount,
    setRecurrenceCount,
    recurrenceConflicts,
    isCheckingConflicts,
    generatedDates,
    // Computed
    calculatedPricePerSession,
    filledSessions,
    isValid,
    addSessionSlot,
    removeSessionSlot,
    updateSessionSlot,
    handleSubmit,
  } = useNovoAtendimento()

  // Get patient name for success screen
  const getPatientName = () => {
    if (isAddToPackageMode && existingPackage) {
      return existingPackage.patient.name
    }
    return patients.find((p) => p.id === selectedPatient)?.name
  }

  // Get total value for success screen
  const getTotalValue = () => {
    if (isAddToPackageMode && existingPackage) {
      return existingPackage.pricePerSession * filledSessions.length
    }
    if (type === "SESSION") {
      // Se recorrente, usar a quantidade de datas geradas
      const sessionsCount = isRecurring && generatedDates.length > 0
        ? generatedDates.length
        : filledSessions.length
      return parseCurrency(sessionPrice) * sessionsCount
    }
    return parseCurrency(packagePrice)
  }

  // Get sessions count for success screen (considering recurrence)
  const getSessionsCount = () => {
    if (isRecurring && generatedDates.length > 0) {
      return generatedDates.length
    }
    return filledSessions.length
  }

  if (success) {
    return (
      <SuccessScreen
        isAddToPackageMode={isAddToPackageMode}
        sessionsCount={getSessionsCount()}
        patientName={getPatientName()}
        totalValue={getTotalValue()}
      />
    )
  }

  // Mode: Add to existing package
  if (isAddToPackageMode) {
    if (loading) {
      return (
        <div className="flex items-center justify-center h-96">
          <p className="text-gray-400">Carregando pacote...</p>
        </div>
      )
    }

    if (!existingPackage) {
      return (
        <ErrorState
          title="Pacote não encontrado"
          message="O pacote solicitado não foi encontrado ou não pertence a você."
          backHref="/agenda"
          backLabel="Voltar para Agenda"
        />
      )
    }

    return (
      <div className="max-w-3xl mx-auto space-y-8">
        <div className="flex items-center gap-4">
          <Link href={`/pacientes/${existingPackage.patientId}`}>
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-xl font-medium text-gray-900 tracking-tight">
              Agendar Sessões do Pacote
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              Adicione sessões ao pacote existente
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <PackageInfoCard package={existingPackage} />

          <SessionSlots
            sessionSlots={sessionSlots}
            filledCount={filledSessions.length}
            maxSlots={existingPackage.remainingSlots}
            showRemainingMessage
            onAddSlot={addSessionSlot}
            onRemoveSlot={removeSessionSlot}
            onUpdateSlot={updateSessionSlot}
          />

          <SummaryActions
            filledSessionsCount={filledSessions.length}
            type={type}
            sessionPrice={sessionPrice}
            packagePrice={packagePrice}
            pricePerSession={existingPackage.pricePerSession}
            isValid={isValid}
            saving={saving}
            error={error}
            cancelHref={`/pacientes/${existingPackage.patientId}`}
            submitLabel="Adicionar Sessões"
          />
        </form>
      </div>
    )
  }

  // Mode: Create new package/session
  return (
    <div className="max-w-3xl mx-auto space-y-8">
      <div className="flex items-center gap-4">
        <Link href="/agenda">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-xl font-medium text-gray-900 tracking-tight">
            Novo Atendimento
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Cadastre sessões avulsas ou pacotes de atendimento
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <PatientSelector
          patients={patients}
          selectedPatient={selectedPatient}
          loading={loading}
          onSelectPatient={setSelectedPatient}
        />

        <TypeSelector
          type={type}
          sessionPrice={sessionPrice}
          totalSessions={totalSessions}
          packagePrice={packagePrice}
          calculatedPricePerSession={calculatedPricePerSession}
          onTypeChange={setType}
          onSessionPriceChange={setSessionPrice}
          onTotalSessionsChange={setTotalSessions}
          onPackagePriceChange={setPackagePrice}
        />

        <SessionSlots
          sessionSlots={sessionSlots}
          filledCount={filledSessions.length}
          maxSlots={type === "PACKAGE" ? parseInt(totalSessions) : undefined}
          onAddSlot={isRecurring ? undefined : addSessionSlot}
          onRemoveSlot={removeSessionSlot}
          onUpdateSlot={updateSessionSlot}
        />

        {/* Opção de Recorrência - apenas se houver 1 sessão preenchida */}
        {filledSessions.length === 1 && (
          <RecurrenceOptions
            enabled={isRecurring}
            onEnabledChange={setIsRecurring}
            pattern={recurrencePattern}
            onPatternChange={setRecurrencePattern}
            count={recurrenceCount}
            onCountChange={setRecurrenceCount}
            generatedDates={generatedDates}
            conflicts={recurrenceConflicts}
            isChecking={isCheckingConflicts}
          />
        )}

        <NotesCard notes={notes} onNotesChange={setNotes} />

        <PaymentSection
          isPaid={isPaid}
          paymentMethod={paymentMethod}
          receipt={receipt}
          onIsPaidChange={setIsPaid}
          onPaymentMethodChange={setPaymentMethod}
          onReceiptChange={setReceipt}
        />

        <SummaryActions
          filledSessionsCount={getSessionsCount()}
          type={type}
          sessionPrice={sessionPrice}
          packagePrice={packagePrice}
          isValid={isValid}
          saving={saving}
          error={error}
          cancelHref="/agenda"
          submitLabel="Criar Atendimento"
        />
      </form>
    </div>
  )
}

export default function NovoAtendimentoPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center h-96">
          <p className="text-gray-400">Carregando...</p>
        </div>
      }
    >
      <NovoAtendimentoContent />
    </Suspense>
  )
}
