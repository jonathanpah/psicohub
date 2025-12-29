"use client"

import { useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { ArrowLeft, Upload, Search } from "lucide-react"
import { DocumentViewer, useDocumentViewer } from "@/components/file-viewer"
import {
  useProntuarioData,
  useSessionEditor,
  useDocumentUpload,
  useDocumentActions,
} from "./hooks"
import {
  StatsCards,
  DocumentList,
  SessionTimeline,
  UploadDialog,
  DeleteDocDialog,
} from "./components"

export default function ProntuarioPage() {
  const { patient, sessions, setSessions, documents, loading, fetchDocuments, patientId } =
    useProntuarioData()

  const {
    expandedSessions,
    editingSession,
    editedNotes,
    setEditedNotes,
    saving,
    toggleSession,
    startEditing,
    cancelEditing,
    saveNotes,
  } = useSessionEditor(sessions, setSessions)

  const {
    fileInputRef,
    uploadDialogOpen,
    setUploadDialogOpen,
    uploadSessionId,
    selectedFile,
    uploading,
    uploadForm,
    setUploadForm,
    openUploadDialog,
    handleFileChange,
    handleUpload,
    closeUploadDialog,
    removeSelectedFile,
  } = useDocumentUpload(patientId, fetchDocuments)

  const {
    deleteDialogOpen,
    setDeleteDialogOpen,
    selectedDoc,
    handleDeleteDoc,
    handleDownload,
    confirmDeleteDoc,
  } = useDocumentActions(patientId, fetchDocuments)

  const { viewerOpen, viewingDoc, openViewer, closeViewer } = useDocumentViewer()
  const [searchTerm, setSearchTerm] = useState("")

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
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href={`/pacientes/${patient.id}`}>
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-xl font-medium text-gray-900 tracking-tight">Prontuário</h1>
            <p className="text-sm text-gray-500 mt-1">{patient.name}</p>
          </div>
        </div>
        <Button onClick={() => openUploadDialog()}>
          <Upload className="h-4 w-4 mr-2" />
          Anexar Documento
        </Button>
      </div>

      {/* Stats */}
      <StatsCards sessions={sessions} documents={documents} />

      {/* General Documents */}
      <DocumentList
        documents={documents}
        onView={openViewer}
        onDownload={handleDownload}
        onDelete={confirmDeleteDoc}
      />

      {/* Search */}
      <Card>
        <CardContent className="pt-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Buscar nas notas clínicas..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Session Timeline */}
      <SessionTimeline
        sessions={sessions}
        documents={documents}
        expandedSessions={expandedSessions}
        editingSession={editingSession}
        editedNotes={editedNotes}
        saving={saving}
        searchTerm={searchTerm}
        onToggleSession={toggleSession}
        onStartEditing={startEditing}
        onCancelEditing={cancelEditing}
        onSaveNotes={saveNotes}
        onSetEditedNotes={setEditedNotes}
        onOpenUploadDialog={openUploadDialog}
        onViewDoc={openViewer}
        onDownloadDoc={handleDownload}
        onDeleteDoc={confirmDeleteDoc}
      />

      {/* Upload Dialog */}
      <UploadDialog
        open={uploadDialogOpen}
        onOpenChange={setUploadDialogOpen}
        sessionId={uploadSessionId}
        fileInputRef={fileInputRef}
        selectedFile={selectedFile}
        uploading={uploading}
        uploadForm={uploadForm}
        onFormChange={setUploadForm}
        onFileChange={handleFileChange}
        onRemoveFile={removeSelectedFile}
        onSubmit={handleUpload}
        onClose={closeUploadDialog}
      />

      {/* Delete Confirmation */}
      <DeleteDocDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        document={selectedDoc}
        onConfirm={handleDeleteDoc}
      />

      {/* Document Viewer */}
      <DocumentViewer
        document={viewingDoc}
        patientId={patientId}
        open={viewerOpen}
        onClose={closeViewer}
      />
    </div>
  )
}
