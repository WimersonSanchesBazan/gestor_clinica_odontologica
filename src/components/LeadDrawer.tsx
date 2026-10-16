import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
} from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import pb from '@/lib/pocketbase/client'
import { maskPhone } from '@/lib/masks'
import { toast } from 'sonner'
import { extractFieldErrors } from '@/lib/pocketbase/errors'

interface LeadDrawerProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  lead?: any
  onSuccess: () => void
}

export function LeadDrawer({ open, onOpenChange, lead, onSuccess }: LeadDrawerProps) {
  const navigate = useNavigate()
  const [formData, setFormData] = useState({
    nome: '',
    telefone: '',
    email: '',
    procedimentoInteresse: '',
    origem: 'instagram',
    etapaFunil: 'novo',
    observacoes: '',
    motivoPerda: '',
  })
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    if (lead) {
      setFormData({
        nome: lead.nome || '',
        telefone: lead.telefone || '',
        email: lead.email || '',
        procedimentoInteresse: lead.procedimentoInteresse || '',
        origem: lead.origem || 'instagram',
        etapaFunil: lead.etapaFunil || 'novo',
        observacoes: lead.observacoes || '',
        motivoPerda: lead.motivoPerda || '',
      })
    } else {
      setFormData({
        nome: '',
        telefone: '',
        email: '',
        procedimentoInteresse: '',
        origem: 'instagram',
        etapaFunil: 'novo',
        observacoes: '',
        motivoPerda: '',
      })
    }
  }, [lead, open])

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: field === 'telefone' ? maskPhone(value) : value,
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    try {
      const payload = { ...formData }
      if (!payload.email) delete (payload as any).email

      if (lead) {
        await pb.collection('crm_leads').update(lead.id, payload)
        toast.success('Lead atualizado com sucesso!')
      } else {
        await pb.collection('crm_leads').create(payload)
        toast.success('Lead criado com sucesso!')
      }
      onSuccess()
      onOpenChange(false)
    } catch (err) {
      const errors = extractFieldErrors(err)
      toast.error('Erro ao salvar: ' + (Object.values(errors)[0] || 'Verifique os dados.'))
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleConvert = async () => {
    if (!lead) return
    setIsSubmitting(true)
    try {
      const password = Math.random().toString(36).slice(-10) + 'A@1!'
      // Patients are stored as auth users, which require an e-mail. When the lead
      // has none, generate a unique placeholder so the conversion never fails.
      const email =
        lead.email && lead.email.trim()
          ? lead.email.trim()
          : `paciente-${lead.id}@sem-email.clinica`

      const userData: any = {
        name: lead.nome,
        telefone: lead.telefone,
        email,
        password,
        passwordConfirm: password,
      }

      const newUser = await pb.collection('users').create(userData)

      await pb.collection('crm_leads').update(lead.id, {
        etapaFunil: 'convertido',
        pacienteConvertido: newUser.id,
        dataConversao: new Date().toISOString(),
      })

      toast.success('Lead convertido com sucesso!', {
        action: {
          label: 'Ver Paciente',
          onClick: () => navigate(`/pacientes/${newUser.id}/historico`),
        },
      })
      onSuccess()
      onOpenChange(false)
    } catch (err) {
      const errors = extractFieldErrors(err)
      toast.error('Erro ao converter: ' + (Object.values(errors)[0] || 'Erro desconhecido'))
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-[500px] overflow-y-auto z-[60]">
        <SheetHeader className="mb-6">
          <SheetTitle>{lead ? 'Editar Lead' : 'Novo Lead'}</SheetTitle>
          <SheetDescription>
            Preencha os dados do lead para acompanhamento no funil.
          </SheetDescription>
        </SheetHeader>

        <form id="lead-form" onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="nome">Nome Completo</Label>
            <Input
              id="nome"
              value={formData.nome}
              onChange={(e) => handleChange('nome', e.target.value)}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="telefone">Telefone</Label>
              <Input
                id="telefone"
                value={formData.telefone}
                onChange={(e) => handleChange('telefone', e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">E-mail</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => handleChange('email', e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="procedimentoInteresse">Procedimento de Interesse</Label>
            <Input
              id="procedimentoInteresse"
              value={formData.procedimentoInteresse}
              onChange={(e) => handleChange('procedimentoInteresse', e.target.value)}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Origem</Label>
              <Select value={formData.origem} onValueChange={(v) => handleChange('origem', v)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="indicacao">Indicação</SelectItem>
                  <SelectItem value="instagram">Instagram</SelectItem>
                  <SelectItem value="google">Google</SelectItem>
                  <SelectItem value="site">Site</SelectItem>
                  <SelectItem value="whatsapp">WhatsApp</SelectItem>
                  <SelectItem value="outros">Outros</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Etapa do Funil</Label>
              <Select
                value={formData.etapaFunil}
                onValueChange={(v) => handleChange('etapaFunil', v)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="novo">Novo</SelectItem>
                  <SelectItem value="contato">Em Contato</SelectItem>
                  <SelectItem value="agendado">Agendado</SelectItem>
                  <SelectItem value="convertido">Convertido</SelectItem>
                  <SelectItem value="perdido">Perdido</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {formData.etapaFunil === 'perdido' && (
            <div className="space-y-2">
              <Label htmlFor="motivoPerda">Motivo da Perda</Label>
              <Input
                id="motivoPerda"
                value={formData.motivoPerda}
                onChange={(e) => handleChange('motivoPerda', e.target.value)}
                required
              />
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="observacoes">Observações</Label>
            <Textarea
              id="observacoes"
              value={formData.observacoes}
              onChange={(e) => handleChange('observacoes', e.target.value)}
              rows={3}
            />
          </div>
        </form>

        <SheetFooter className="mt-8 flex-col sm:flex-row gap-3">
          {lead && lead.etapaFunil === 'agendado' && (
            <Button
              type="button"
              variant="default"
              className="w-full sm:w-auto bg-green-600 hover:bg-green-700 text-white"
              onClick={handleConvert}
              disabled={isSubmitting}
            >
              Converter em Paciente
            </Button>
          )}
          <div className="flex gap-2 w-full sm:w-auto justify-end">
            <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
              Cancelar
            </Button>
            <Button type="submit" form="lead-form" disabled={isSubmitting}>
              {isSubmitting ? 'Salvando...' : 'Salvar Lead'}
            </Button>
          </div>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}
