import { useState, useEffect } from 'react'
import pb from '@/lib/pocketbase/client'
import { Shield, Search, RefreshCw, Key, UserCheck, UserX, Mail, Database } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { format } from 'date-fns'

interface AuditRecord {
  id: string
  action: string
  userId?: string
  userEmail?: string
  targetEntity?: string
  targetId?: string
  details?: any
  created: string
}

const ACTION_LABELS: Record<string, { label: string; tone: string; icon: any }> = {
  login_success: {
    label: 'Login com Sucesso',
    tone: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    icon: UserCheck,
  },
  login_failed: {
    label: 'Falha de Login',
    tone: 'bg-rose-50 text-rose-700 border-rose-200',
    icon: UserX,
  },
  logout: { label: 'Logout', tone: 'bg-gray-50 text-gray-600 border-gray-200', icon: UserCheck },
  user_created: {
    label: 'Criação de Usuário',
    tone: 'bg-purple-50 text-purple-700 border-purple-200',
    icon: Database,
  },
  user_updated: {
    label: 'Alteração de Usuário/Perfil',
    tone: 'bg-amber-50 text-amber-700 border-amber-200',
    icon: Shield,
  },
  user_deleted: {
    label: 'Exclusão de Usuário',
    tone: 'bg-rose-50 text-rose-700 border-rose-200',
    icon: UserX,
  },
  password_reset_request: {
    label: 'Solicitação de Redefinição',
    tone: 'bg-blue-50 text-blue-700 border-blue-200',
    icon: Key,
  },
  password_reset_completed: {
    label: 'Senha Redefinida',
    tone: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    icon: Key,
  },
  email_test_success: {
    label: 'Teste de E-mail Enviado',
    tone: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    icon: Mail,
  },
  email_test_failed: {
    label: 'Falha Teste de E-mail',
    tone: 'bg-rose-50 text-rose-700 border-rose-200',
    icon: Mail,
  },
  email_settings_updated: {
    label: 'Configuração de E-mail Atualizada',
    tone: 'bg-blue-50 text-blue-700 border-blue-200',
    icon: Mail,
  },
  user_inactivated: {
    label: 'Inativação de Usuário',
    tone: 'bg-rose-50 text-rose-700 border-rose-200',
    icon: UserX,
  },
}

export default function Auditoria() {
  const [logs, setLogs] = useState<AuditRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  const loadLogs = async () => {
    setLoading(true)
    try {
      const records = await pb.collection('audit_logs').getFullList<AuditRecord>({
        sort: '-created',
        limit: 100,
      })
      setLogs(records)
    } catch (err) {
      console.error('Erro ao carregar auditoria:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadLogs()
  }, [])

  const filtered = logs.filter((log) => {
    const text =
      `${log.action} ${log.userEmail || ''} ${log.targetEntity || ''} ${JSON.stringify(log.details || {})}`.toLowerCase()
    return text.includes(search.toLowerCase())
  })

  return (
    <div className="flex flex-col gap-6 animate-fade-in pb-12">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-mono text-lavender font-semibold tracking-wider uppercase">
              Governança · Rastreabilidade
            </span>
          </div>
          <h1 className="text-3xl font-display font-bold text-gray-900 tracking-tight">
            Trilha de Auditoria
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Registro detalhado de eventos críticos de autenticação, acessos e configurações. Senhas
            e segredos são estritamente excluídos dos registros.
          </p>
        </div>

        <Button
          variant="outline"
          onClick={loadLogs}
          disabled={loading}
          className="text-xs bg-white"
        >
          <RefreshCw className={`w-3.5 h-3.5 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Atualizar Eventos
        </Button>
      </div>

      <div className="bg-white border border-gray-200 rounded-xl p-4 flex items-center justify-between shadow-sm">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <Input
            placeholder="Buscar por ação, usuário ou detalhe..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 bg-gray-50/50 border-gray-200 h-10 text-sm"
          />
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
        {loading ? (
          <div className="py-16 text-center text-sm text-gray-500">Carregando auditoria...</div>
        ) : filtered.length === 0 ? (
          <div className="py-16 text-center text-sm text-gray-500">
            Nenhum evento registrado ainda.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50 border-b border-gray-200 text-gray-500 text-xs uppercase tracking-wider">
                <tr>
                  <th className="px-6 py-3.5 font-semibold">Data e Hora</th>
                  <th className="px-6 py-3.5 font-semibold">Evento</th>
                  <th className="px-6 py-3.5 font-semibold">Responsável</th>
                  <th className="px-6 py-3.5 font-semibold">Alvo</th>
                  <th className="px-6 py-3.5 font-semibold">Detalhes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 font-mono text-xs">
                {filtered.map((log) => {
                  const actionMeta = ACTION_LABELS[log.action] || {
                    label: log.action,
                    tone: 'bg-gray-100 text-gray-700 border-gray-200',
                  }
                  let detailsStr = ''
                  if (typeof log.details === 'object') {
                    detailsStr = JSON.stringify(log.details)
                  } else if (typeof log.details === 'string') {
                    detailsStr = log.details
                  }

                  return (
                    <tr key={log.id} className="hover:bg-gray-50/70 transition-colors">
                      <td className="px-6 py-4 text-gray-600 whitespace-nowrap">
                        {log.created ? format(new Date(log.created), 'dd/MM/yyyy HH:mm:ss') : '-'}
                      </td>
                      <td className="px-6 py-4">
                        <Badge
                          variant="outline"
                          className={`${actionMeta.tone} text-[11px] font-sans font-medium`}
                        >
                          {actionMeta.label}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 text-gray-800 font-sans">
                        {log.userEmail || log.userId || 'Sistema'}
                      </td>
                      <td className="px-6 py-4 text-gray-600 font-sans">
                        {log.targetEntity || '-'}
                      </td>
                      <td className="px-6 py-4 text-gray-500 max-w-xs truncate" title={detailsStr}>
                        {detailsStr || '-'}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
