import { useState, useMemo } from 'react'
import { format, isToday, isWithinInterval, isSameMonth, startOfWeek, endOfWeek } from 'date-fns'
import { Plus, CircleDashed, AlertTriangle, Clock, Wallet } from 'lucide-react'
import { useLancamentos } from '@/hooks/use-lancamentos'
import { KPICard } from '@/components/KPICard'
import { Button } from '@/components/ui/button'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { TransactionModal } from '@/components/TransactionModal'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

export default function Financeiro() {
  const { lancamentos, refresh } = useLancamentos()
  const [modalOpen, setModalOpen] = useState(false)
  const [editingTx, setEditingTx] = useState<any>(null)
  const [tab, setTab] = useState('caixa')
  const [periodo, setPeriodo] = useState('hoje')

  const handleNew = () => {
    setEditingTx(null)
    setModalOpen(true)
  }

  const handleEdit = (tx: any) => {
    setEditingTx(tx)
    setModalOpen(true)
  }

  const filtered = useMemo(() => {
    const now = new Date()
    const periodMatch = (dateStr: string) => {
      const d = new Date(dateStr)
      if (isNaN(d.getTime())) return false
      if (periodo === 'semana')
        return isWithinInterval(d, {
          start: startOfWeek(now, { weekStartsOn: 1 }),
          end: endOfWeek(now, { weekStartsOn: 1 }),
        })
      if (periodo === 'mes') return isSameMonth(d, now)
      return isToday(d)
    }

    return lancamentos.filter((l) => {
      if (l.status === 'cancelado') return false
      if (tab === 'caixa') return l.status === 'pago' && periodMatch(l.data)
      if (tab === 'receber')
        return l.tipo === 'receita' && ['pendente', 'vencido'].includes(l.status)
      if (tab === 'pagar') return l.tipo === 'despesa' && ['pendente', 'vencido'].includes(l.status)
      if (tab === 'glosas') return l.status === 'glosado'
      return true
    })
  }, [lancamentos, tab, periodo])

  const kpiRecebido = useMemo(
    () =>
      lancamentos
        .filter(
          (l) =>
            l.tipo === 'receita' &&
            l.status === 'pago' &&
            l.data.startsWith(format(new Date(), 'yyyy-MM')),
        )
        .reduce((acc, l) => acc + l.valor, 0),
    [lancamentos],
  )

  const kpiAReceber = useMemo(
    () =>
      lancamentos
        .filter((l) => l.tipo === 'receita' && ['pendente', 'vencido'].includes(l.status))
        .reduce((acc, l) => acc + l.valor, 0),
    [lancamentos],
  )

  const kpiGlosas = useMemo(
    () => lancamentos.filter((l) => l.status === 'glosado').length,
    [lancamentos],
  )

  const periodoLabel = periodo === 'semana' ? 'na semana' : periodo === 'mes' ? 'no mês' : 'hoje'

  return (
    <div className="flex flex-col h-full gap-6 animate-fade-in relative">
      <div className="absolute top-0 right-0 w-[600px] h-[300px] pointer-events-none overflow-hidden rounded-bl-3xl opacity-5 mix-blend-multiply z-0">
        <img
          src="https://img.usecurling.com/p/800/300?q=vintage%20medical%20apothecary%20herbs&color=black&dpr=2"
          alt=""
          className="w-full h-full object-cover object-right-top"
        />
      </div>

      <div className="flex justify-between items-end relative z-10 pt-2 shrink-0">
        <div>
          <h1 className="font-display text-3xl md:text-4xl font-bold tracking-tight text-gray-900 mb-2">
            Fluxo de caixa.
          </h1>
          <p className="text-gray-500 font-medium">Gestão financeira e faturamento</p>
        </div>
        <Button onClick={handleNew} className="bg-lavender hover:bg-lavender/90 text-white">
          <Plus className="w-4 h-4 mr-2" /> Novo lançamento
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 relative z-10 shrink-0">
        <KPICard
          title="Recebido (mês)"
          value={`R$ ${kpiRecebido.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
          icon={Wallet}
          tone="success"
        />
        <KPICard
          title="A receber"
          value={`R$ ${kpiAReceber.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
          icon={Clock}
          tone="primary"
        />
        <KPICard
          title="Glosas pendentes"
          value={kpiGlosas}
          icon={AlertTriangle}
          tone="error"
          subtext="total acumulado"
        />
      </div>

      <div className="flex-1 flex flex-col min-h-0 bg-white border border-gray-200 rounded-xl shadow-sm relative z-10">
        <Tabs value={tab} onValueChange={setTab} className="flex flex-col h-full">
          <div className="border-b px-4 py-2 flex items-center justify-between shrink-0">
            <TabsList className="bg-transparent space-x-2">
              <TabsTrigger
                value="caixa"
                className="data-[state=active]:bg-gray-100 data-[state=active]:shadow-none rounded-md"
              >
                Caixa do dia
              </TabsTrigger>
              <TabsTrigger
                value="receber"
                className="data-[state=active]:bg-gray-100 data-[state=active]:shadow-none rounded-md"
              >
                A receber
              </TabsTrigger>
              <TabsTrigger
                value="pagar"
                className="data-[state=active]:bg-gray-100 data-[state=active]:shadow-none rounded-md"
              >
                A pagar
              </TabsTrigger>
              <TabsTrigger
                value="glosas"
                className="data-[state=active]:bg-gray-100 data-[state=active]:shadow-none rounded-md"
              >
                Glosas
              </TabsTrigger>
            </TabsList>
            {tab === 'caixa' && (
              <div className="flex items-center gap-2">
                <Select value={periodo} onValueChange={setPeriodo}>
                  <SelectTrigger className="w-[120px] h-8 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="hoje">Hoje</SelectItem>
                    <SelectItem value="semana">Esta semana</SelectItem>
                    <SelectItem value="mes">Este mês</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>

          <div className="flex-1 overflow-auto p-0">
            <TabsContent value={tab} className="m-0 h-full">
              {filtered.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-gray-500 py-12">
                  <CircleDashed className="w-12 h-12 mb-4 text-gray-300" />
                  <p>
                    {tab === 'caixa'
                      ? `Nenhum recebimento ${periodoLabel}.`
                      : 'Nenhum lançamento encontrado.'}
                  </p>
                </div>
              ) : (
                <table className="w-full text-sm text-left">
                  <thead className="bg-gray-50/50 text-gray-500 sticky top-0">
                    <tr>
                      <th className="px-4 py-3 font-medium">Data</th>
                      <th className="px-4 py-3 font-medium">Tipo / Categoria</th>
                      <th className="px-4 py-3 font-medium">Paciente / Convênio</th>
                      <th className="px-4 py-3 font-medium">Forma / Parcelas</th>
                      <th className="px-4 py-3 font-medium text-right">Valor</th>
                      <th className="px-4 py-3 font-medium">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {filtered.map((l) => (
                      <tr
                        key={l.id}
                        className="hover:bg-lavender-soft/40 cursor-pointer transition-colors"
                        onClick={() => handleEdit(l)}
                      >
                        <td className="px-4 py-3 font-mono text-gray-600">
                          {format(new Date(l.data), 'dd/MM/yyyy')}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <Badge
                              variant="outline"
                              className={
                                l.tipo === 'receita'
                                  ? 'text-mint border-mint-soft bg-mint-soft'
                                  : 'text-bordeaux border-bordeaux-soft bg-bordeaux-soft'
                              }
                            >
                              {l.tipo}
                            </Badge>
                            <span className="text-gray-900">{l.categoria}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          {l.tipo === 'receita' ? (
                            <div className="flex items-center gap-2">
                              <Avatar className="w-6 h-6">
                                <AvatarFallback className="text-[10px]">
                                  {l.expand?.paciente?.name?.charAt(0) || '-'}
                                </AvatarFallback>
                              </Avatar>
                              <div>
                                <p className="text-gray-900 font-medium leading-none">
                                  {l.expand?.paciente?.name || '-'}
                                </p>
                                <p className="text-gray-500 text-xs">
                                  {l.expand?.convenio?.nome || 'Particular'}
                                </p>
                              </div>
                            </div>
                          ) : (
                            <span className="text-gray-400">-</span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <p className="text-gray-900 capitalize">
                            {l.formaPagamento.replace('_', ' ')}
                          </p>
                          {l.parcelas > 1 && <p className="text-gray-500 text-xs">{l.parcelas}x</p>}
                        </td>
                        <td
                          className={`px-4 py-3 font-mono text-right font-medium ${l.tipo === 'receita' ? 'text-mint' : 'text-gray-900'}`}
                        >
                          R$ {l.valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </td>
                        <td className="px-4 py-3">
                          <Badge variant="secondary" className="capitalize">
                            <span
                              className={`w-1.5 h-1.5 rounded-full mr-2 ${l.status === 'pago' ? 'bg-mint' : l.status === 'vencido' || l.status === 'glosado' ? 'bg-bordeaux' : 'bg-ochre'}`}
                            />
                            {l.status}
                          </Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </TabsContent>
          </div>
        </Tabs>
      </div>
      {modalOpen && (
        <TransactionModal
          open={modalOpen}
          onOpenChange={setModalOpen}
          transaction={editingTx}
          onSaved={refresh}
        />
      )}
    </div>
  )
}
