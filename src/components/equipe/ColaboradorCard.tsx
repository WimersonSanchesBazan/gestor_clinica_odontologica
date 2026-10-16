import { formatDistanceToNow } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { ShieldCheck, Edit2 } from 'lucide-react'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Switch } from '@/components/ui/switch'
import { Button } from '@/components/ui/button'
import { updateColaborador, type Colaborador } from '@/services/colaboradores'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

interface ColaboradorCardProps {
  colaborador: Colaborador
  onEdit: () => void
}

const profileColors: Record<string, string> = {
  admin: 'bg-lavender-soft text-lavender border-lavender/20',
  medico: 'bg-mint-soft text-mint border-mint/20',
  secretaria: 'bg-orange-50 text-orange-600 border-orange-200',
  financeiro: 'bg-blue-50 text-blue-600 border-blue-200',
}

export function ColaboradorCard({ colaborador, onEdit }: ColaboradorCardProps) {
  const handleToggle = async (checked: boolean) => {
    try {
      await updateColaborador(colaborador.id, { ativo: checked })
      toast.success(`Status de ${colaborador.nome} atualizado.`)
    } catch (e) {
      toast.error('Erro ao atualizar status.')
    }
  }

  const initials = colaborador.nome
    .split(' ')
    .map((n) => n[0])
    .join('')
    .substring(0, 2)
    .toUpperCase()

  const admissao = colaborador.dataAdmissao ? new Date(colaborador.dataAdmissao) : null
  const timeAtCompany =
    admissao && !isNaN(admissao.getTime()) ? formatDistanceToNow(admissao, { locale: ptBR }) : '—'

  return (
    <div
      className={cn(
        'group relative bg-white border rounded-xl p-5 shadow-subtle hover:shadow-elevation transition-all flex flex-col',
        !colaborador.ativo && 'opacity-60 grayscale-[0.5]',
      )}
    >
      <div className="flex justify-between items-start mb-4">
        <div className="flex items-center gap-3">
          <Avatar className="h-12 w-12 border border-gray-100 shadow-sm">
            <AvatarFallback className="bg-gray-50 text-gray-700 font-medium text-lg">
              {initials}
            </AvatarFallback>
          </Avatar>
          <div>
            <h3 className="font-display font-medium text-gray-900 flex items-center gap-1.5 line-clamp-1">
              {colaborador.nome}
              {colaborador.perfilAcesso === 'admin' && (
                <ShieldCheck className="w-4 h-4 text-lavender" />
              )}
            </h3>
            <p className="text-sm text-gray-500">{colaborador.cargo}</p>
          </div>
        </div>
      </div>

      <div className="flex flex-wrap gap-2 mb-6">
        <span
          className={cn(
            'px-2.5 py-0.5 rounded-full text-xs font-medium border capitalize',
            profileColors[colaborador.perfilAcesso] || 'bg-gray-100 text-gray-600 border-gray-200',
          )}
        >
          {colaborador.perfilAcesso}
        </span>
        <span className="px-2.5 py-0.5 rounded-full text-xs font-medium border bg-gray-50 text-gray-600 border-gray-200 uppercase">
          {colaborador.tipoContrato}
        </span>
      </div>

      <div className="mt-auto flex items-center justify-between border-t border-gray-100 pt-4">
        <div className="text-xs text-gray-500 font-mono">
          Tempo: <span className="text-gray-900">{timeAtCompany}</span>
        </div>
        <div className="flex items-center gap-3">
          <Switch checked={colaborador.ativo} onCheckedChange={handleToggle} />
          <Button
            variant="ghost"
            size="icon"
            onClick={onEdit}
            className="h-8 w-8 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-lavender-soft hover:text-lavender"
          >
            <Edit2 className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  )
}
