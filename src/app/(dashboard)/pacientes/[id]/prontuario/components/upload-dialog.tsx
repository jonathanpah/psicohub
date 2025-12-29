"use client"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Upload } from "lucide-react"
import { FileIcon } from "@/components/file-viewer"
import { formatFileSize } from "@/lib/formatters"
import { CLINICAL_CATEGORY_OPTIONS } from "../types"

interface UploadDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  sessionId: string | null
  fileInputRef: React.RefObject<HTMLInputElement | null>
  selectedFile: File | null
  uploading: boolean
  uploadForm: {
    name: string
    description: string
    category: string
  }
  onFormChange: (form: { name: string; description: string; category: string }) => void
  onFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void
  onRemoveFile: () => void
  onSubmit: (e: React.FormEvent) => void
  onClose: () => void
}

export function UploadDialog({
  open,
  onOpenChange,
  sessionId,
  fileInputRef,
  selectedFile,
  uploading,
  uploadForm,
  onFormChange,
  onFileChange,
  onRemoveFile,
  onSubmit,
  onClose,
}: UploadDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>
            {sessionId ? "Anexar Documento à Sessão" : "Anexar Documento ao Prontuário"}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={onSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Arquivo *</Label>
            <div className="border-2 border-dashed rounded-lg p-6 text-center">
              <input
                ref={fileInputRef}
                type="file"
                onChange={onFileChange}
                accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.jpg,.jpeg,.png,.webp"
                className="hidden"
                id="file-upload-prontuario"
              />
              {selectedFile ? (
                <div className="flex items-center justify-center gap-2">
                  <FileIcon fileType={selectedFile.type} className="h-8 w-8" />
                  <div>
                    <p className="font-medium">{selectedFile.name}</p>
                    <p className="text-sm text-gray-500">
                      {formatFileSize(selectedFile.size)}
                    </p>
                  </div>
                </div>
              ) : (
                <label htmlFor="file-upload-prontuario" className="cursor-pointer">
                  <Upload className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                  <p className="text-sm text-gray-600">
                    Clique para selecionar ou arraste o arquivo
                  </p>
                  <p className="text-xs text-gray-400 mt-1">
                    PDF, DOC, DOCX, XLS, XLSX, PPT, PPTX, JPG, PNG (máx. 10MB)
                  </p>
                </label>
              )}
            </div>
            {selectedFile && (
              <Button type="button" variant="outline" size="sm" onClick={onRemoveFile}>
                Remover arquivo
              </Button>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="doc-name">Nome do Documento *</Label>
            <Input
              id="doc-name"
              value={uploadForm.name}
              onChange={(e) => onFormChange({ ...uploadForm, name: e.target.value })}
              placeholder="Ex: Laudo Psicológico"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="doc-category">Categoria *</Label>
            <Select
              value={uploadForm.category}
              onValueChange={(value) => onFormChange({ ...uploadForm, category: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione a categoria" />
              </SelectTrigger>
              <SelectContent>
                {CLINICAL_CATEGORY_OPTIONS.map((cat) => (
                  <SelectItem key={cat.value} value={cat.value}>
                    {cat.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="doc-description">Descrição</Label>
            <Textarea
              id="doc-description"
              value={uploadForm.description}
              onChange={(e) => onFormChange({ ...uploadForm, description: e.target.value })}
              placeholder="Descrição ou observações sobre o documento..."
              rows={3}
            />
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={uploading || !selectedFile || !uploadForm.name || !uploadForm.category}
            >
              {uploading ? "Enviando..." : "Anexar"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
