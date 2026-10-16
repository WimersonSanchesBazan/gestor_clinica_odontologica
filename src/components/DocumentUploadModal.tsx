import { useState, useRef } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { UploadCloud, File as FileIcon, X } from 'lucide-react'
import pb from '@/lib/pocketbase/client'
import { toast } from 'sonner'
import { format } from 'date-fns'

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  pacienteId: string
  onSuccess: () => void
}

export function DocumentUploadModal({ open, onOpenChange, pacienteId, onSuccess }: Props) {
  const [file, setFile] = useState<File | null>(null)
  const [tipo, setTipo] = useState('receita')
  const [descricao, setDescricao] = useState('')
  const [data, setData] = useState(format(new Date(), 'yyyy-MM-dd'))
  const [isSubmitting, setIsSubmitting] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      setFile(e.dataTransfer.files[0])
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!file) {
      toast.error('Selecione um arquivo para enviar')
      return
    }
    setIsSubmitting(true)
    try {
      const formData = new FormData()
      formData.append('paciente', pacienteId)
      formData.append('arquivo', file)
      formData.append('tipo', tipo)
      formData.append('descricao', descricao)
      formData.append('data', data + ' 12:00:00.000Z')

      await pb.collection('documentos_paciente').create(formData)
      toast.success('Documento enviado com sucesso')
      setFile(null)
      setDescricao('')
      setTipo('receita')
      onSuccess()
      onOpenChange(false)
    } catch (err) {
      toast.error('Erro ao enviar documento')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Adicionar Documento</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          <div
            className={`border-2 border-dashed rounded-lg p-6 flex flex-col items-center justify-center transition-colors cursor-pointer ${
              file ? 'border-lavender bg-lavender-soft/10' : 'border-gray-300 hover:bg-gray-50'
            }`}
            onDragOver={(e) => e.preventDefault()}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
          >
            <input
              type="file"
              ref={fileInputRef}
              className="hidden"
              accept=".pdf,.jpg,.jpeg,.png,.webp"
              onChange={(e) => e.target.files && setFile(e.target.files[0])}
            />
            {file ? (
              <div className="flex items-center gap-2 text-lavender font-medium">
                <FileIcon className="w-6 h-6" />
                <span className="truncate max-w-[200px]">{file.name}</span>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation()
                    setFile(null)
                  }}
                  className="p-1 hover:bg-lavender-soft rounded-full"
                >
                  <X className="w-4 h-4 text-gray-500" />
                </button>
              </div>
            ) : (
              <>
                <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mb-3">
                  <UploadCloud className="w-6 h-6 text-gray-400" />
                </div>
                <p className="text-sm font-medium text-gray-700">Clique ou arraste o arquivo</p>
                <p className="text-xs text-gray-500 mt-1">PDF, JPG, PNG, WEBP (max. 10MB)</p>
              </>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Tipo de Documento</Label>
              <Select value={tipo} onValueChange={setTipo}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="receita">Receita</SelectItem>
                  <SelectItem value="atestado">Atestado</SelectItem>
                  <SelectItem value="pedido_exame">Pedido de Exame</SelectItem>
                  <SelectItem value="resultado">Resultado</SelectItem>
                  <SelectItem value="documento_pessoal">Doc. Pessoal</SelectItem>
                  <SelectItem value="outros">Outros</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Data do Documento</Label>
              <Input type="date" value={data} onChange={(e) => setData(e.target.value)} required />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Descrição (Opcional)</Label>
            <Input
              value={descricao}
              onChange={(e) => setDescricao(e.target.value)}
              placeholder="Ex: Receita de antibiótico"
            />
          </div>
        </form>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit} disabled={isSubmitting || !file}>
            {isSubmitting ? 'Enviando...' : 'Salvar Documento'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
