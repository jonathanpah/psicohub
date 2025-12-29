"use client"

import { useMemo } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import {
  FileText,
  Edit,
  Save,
  X,
  ChevronDown,
  ChevronUp,
  Upload,
  Paperclip,
  Eye,
  Download,
  Trash2,
} from "lucide-react"
import { FileIcon } from "@/components/file-viewer"
import { formatFileSize } from "@/lib/formatters"
import { SESSION_CALENDAR_COLORS, SESSION_STATUS_LABELS } from "@/constants/status"
import type { Session, Document } from "../types"

interface SessionTimelineProps {
  sessions: Session[]
  documents: Document[]
  expandedSessions: Set<string>
  editingSession: string | null
  editedNotes: string
  saving: boolean
  searchTerm: string
  onToggleSession: (sessionId: string) => void
  onStartEditing: (session: Session) => void
  onCancelEditing: () => void
  onSaveNotes: (sessionId: string) => void
  onSetEditedNotes: (notes: string) => void
  onOpenUploadDialog: (sessionId: string) => void
  onViewDoc: (doc: Document) => void
  onDownloadDoc: (doc: Document) => void
  onDeleteDoc: (doc: Document) => void
}

function formatTime(dateString: string) {
  return new Date(dateString).toLocaleTimeString("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
  })
}

function formatDate(dateString: string) {
  return new Date(dateString).toLocaleDateString("pt-BR", {
    weekday: "long",
    day: "2-digit",
    month: "long",
    year: "numeric",
  })
}

export function SessionTimeline({
  sessions,
  documents,
  expandedSessions,
  editingSession,
  editedNotes,
  saving,
  searchTerm,
  onToggleSession,
  onStartEditing,
  onCancelEditing,
  onSaveNotes,
  onSetEditedNotes,
  onOpenUploadDialog,
  onViewDoc,
  onDownloadDoc,
  onDeleteDoc,
}: SessionTimelineProps) {
  const filteredSessions = useMemo(() => {
    return sessions.filter((session) => {
      if (!searchTerm) return true
      const searchLower = searchTerm.toLowerCase()
      return (
        session.clinicalNotes?.toLowerCase().includes(searchLower) ||
        session.observations?.toLowerCase().includes(searchLower) ||
        formatDate(session.dateTime).toLowerCase().includes(searchLower)
      )
    })
  }, [sessions, searchTerm])

  const groupedSessions = useMemo(() => {
    return filteredSessions.reduce((acc, session) => {
      const date = new Date(session.dateTime)
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`
      const label = date.toLocaleDateString("pt-BR", { month: "long", year: "numeric" })

      if (!acc[key]) {
        acc[key] = { label, sessions: [] }
      }
      acc[key].sessions.push(session)
      return acc
    }, {} as Record<string, { label: string; sessions: Session[] }>)
  }, [filteredSessions])

  const getSessionDocuments = useMemo(() => {
    return (sessionId: string) => documents.filter((d) => d.sessionId === sessionId)
  }, [documents])

  if (filteredSessions.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          {searchTerm ? (
            <p className="text-gray-500">
              Nenhuma sessão encontrada para &quot;{searchTerm}&quot;
            </p>
          ) : (
            <p className="text-gray-500">Nenhuma sessão registrada ainda.</p>
          )}
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {Object.entries(groupedSessions)
        .sort((a, b) => b[0].localeCompare(a[0]))
        .map(([key, { label, sessions: groupSessions }]) => (
          <div key={key}>
            <h3 className="text-sm font-medium text-gray-500 mb-4 capitalize">
              {label}
            </h3>
            <div className="space-y-4">
              {groupSessions.map((session) => {
                const sessionDocs = getSessionDocuments(session.id)
                const colors = SESSION_CALENDAR_COLORS[session.status]

                return (
                  <Card key={session.id} className="overflow-hidden">
                    <div
                      className="flex items-center justify-between p-4 cursor-pointer hover:bg-gray-50"
                      onClick={() => onToggleSession(session.id)}
                    >
                      <div className="flex items-center gap-4">
                        <div className="text-center min-w-[60px]">
                          <p className="text-2xl font-bold text-gray-900">
                            {new Date(session.dateTime).getDate()}
                          </p>
                          <p className="text-xs text-gray-500 uppercase">
                            {new Date(session.dateTime).toLocaleDateString("pt-BR", {
                              weekday: "short",
                            })}
                          </p>
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-medium">
                              {formatTime(session.dateTime)}
                            </span>
                            <span className="text-gray-400">•</span>
                            <span className="text-sm text-gray-500">
                              {session.duration} min
                            </span>
                          </div>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge
                              style={{
                                backgroundColor: colors.bg,
                                color: colors.text,
                              }}
                            >
                              {SESSION_STATUS_LABELS[session.status]}
                            </Badge>
                            {session.clinicalNotes && (
                              <span className="text-xs text-gray-500 flex items-center gap-1">
                                <FileText className="h-3 w-3" />
                                Com notas
                              </span>
                            )}
                            {sessionDocs.length > 0 && (
                              <span className="text-xs text-gray-500 flex items-center gap-1">
                                <Paperclip className="h-3 w-3" />
                                {sessionDocs.length} anexo{sessionDocs.length > 1 ? "s" : ""}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      {expandedSessions.has(session.id) ? (
                        <ChevronUp className="h-5 w-5 text-gray-400" />
                      ) : (
                        <ChevronDown className="h-5 w-5 text-gray-400" />
                      )}
                    </div>

                    {expandedSessions.has(session.id) && (
                      <div className="border-t bg-gray-50 p-4 space-y-4">
                        {session.observations && (
                          <div>
                            <p className="text-sm font-medium text-gray-500 mb-1">
                              Observações
                            </p>
                            <p className="text-gray-700">{session.observations}</p>
                          </div>
                        )}

                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <p className="text-sm font-medium text-gray-500 flex items-center gap-2">
                              <FileText className="h-4 w-4" />
                              Notas Clínicas
                            </p>
                            {editingSession !== session.id && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  onStartEditing(session)
                                }}
                              >
                                <Edit className="h-4 w-4 mr-1" />
                                Editar
                              </Button>
                            )}
                          </div>

                          {editingSession === session.id ? (
                            <div className="space-y-2">
                              <Textarea
                                value={editedNotes}
                                onChange={(e) => onSetEditedNotes(e.target.value)}
                                placeholder="Digite as notas clínicas..."
                                rows={6}
                                className="font-mono text-sm"
                                onClick={(e) => e.stopPropagation()}
                              />
                              <div className="flex gap-2">
                                <Button
                                  size="sm"
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    onSaveNotes(session.id)
                                  }}
                                  disabled={saving}
                                >
                                  <Save className="h-4 w-4 mr-1" />
                                  {saving ? "Salvando..." : "Salvar"}
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    onCancelEditing()
                                  }}
                                >
                                  <X className="h-4 w-4 mr-1" />
                                  Cancelar
                                </Button>
                              </div>
                            </div>
                          ) : (
                            <div className="bg-white rounded-md border p-4 min-h-[100px]">
                              {session.clinicalNotes ? (
                                <p className="text-gray-700 whitespace-pre-wrap font-mono text-sm">
                                  {session.clinicalNotes}
                                </p>
                              ) : (
                                <p className="text-gray-400 italic">
                                  Nenhuma nota clínica registrada para esta sessão.
                                </p>
                              )}
                            </div>
                          )}
                        </div>

                        {/* Session Attachments */}
                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <p className="text-sm font-medium text-gray-500 flex items-center gap-2">
                              <Paperclip className="h-4 w-4" />
                              Anexos da Sessão
                            </p>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation()
                                onOpenUploadDialog(session.id)
                              }}
                            >
                              <Upload className="h-4 w-4 mr-1" />
                              Anexar
                            </Button>
                          </div>

                          {sessionDocs.length > 0 ? (
                            <div className="grid gap-2 md:grid-cols-2">
                              {sessionDocs.map((doc) => (
                                <div
                                  key={doc.id}
                                  className="bg-white border rounded-md p-2 flex items-center gap-2"
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  <FileIcon fileType={doc.fileType} className="h-5 w-5" />
                                  <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium truncate">
                                      {doc.name}
                                    </p>
                                    <p className="text-xs text-gray-500">
                                      {formatFileSize(doc.fileSize)}
                                    </p>
                                  </div>
                                  <div className="flex gap-1">
                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      onClick={() => onViewDoc(doc)}
                                    >
                                      <Eye className="h-3 w-3" />
                                    </Button>
                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      onClick={() => onDownloadDoc(doc)}
                                    >
                                      <Download className="h-3 w-3" />
                                    </Button>
                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      className="text-red-600"
                                      onClick={() => onDeleteDoc(doc)}
                                    >
                                      <Trash2 className="h-3 w-3" />
                                    </Button>
                                  </div>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <p className="text-sm text-gray-400 italic bg-white rounded-md border p-3">
                              Nenhum documento anexado a esta sessão.
                            </p>
                          )}
                        </div>
                      </div>
                    )}
                  </Card>
                )
              })}
            </div>
          </div>
        ))}
    </div>
  )
}
