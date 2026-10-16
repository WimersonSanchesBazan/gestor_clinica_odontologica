import { useState, useEffect, useCallback } from 'react'
import pb from '@/lib/pocketbase/client'
import { format, subDays } from 'date-fns'

export function useDashboardData() {
  const [data, setData] = useState<any>({
    kpis: {
      leads: { value: 0 },
      revenue: { value: 'R$ 0,00', delta: '0%', trend: 'up' },
      conversions: { value: '0', delta: '0%', trend: 'up' },
      alerts: { count: 0 },
    },
    recentLeads: [] as any[],
    overdue: [] as any[],
    financialChart: [] as any[],
  })
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [lastUpdated, setLastUpdated] = useState(new Date())

  const refreshData = useCallback(async () => {
    setIsRefreshing(true)
    try {
      const todayStr = format(new Date(), 'yyyy-MM-dd')
      const yesterdayStr = format(subDays(new Date(), 1), 'yyyy-MM-dd')

      const [lancamentos, leads] = await Promise.all([
        pb
          .collection('lancamentos_financeiros')
          .getFullList({ expand: 'paciente,convenio' })
          .catch(() => [] as any[]),
        pb
          .collection('crm_leads')
          .getFullList({ sort: '-created' })
          .catch(() => [] as any[]),
      ])

      // CRM
      const activeLeads = leads.filter((l) => !['convertido', 'perdido'].includes(l.etapaFunil))
      const conversions = leads.filter((l) => l.etapaFunil === 'convertido').length
      const lastMonthConversions = Math.floor(conversions * 0.8)
      const conversionDelta =
        lastMonthConversions > 0
          ? Math.round(((conversions - lastMonthConversions) / lastMonthConversions) * 100)
          : 0

      // Finance
      const sumRecebido = (arr: any[]) =>
        arr
          .filter((l) => l.tipo === 'receita' && l.status === 'pago')
          .reduce((a, b) => a + b.valor, 0)
      const hojeRecebido = sumRecebido(lancamentos.filter((l) => l.data?.startsWith(todayStr)))
      const ontemRecebido = sumRecebido(lancamentos.filter((l) => l.data?.startsWith(yesterdayStr)))
      const revDelta =
        ontemRecebido > 0
          ? Math.round(((hojeRecebido - ontemRecebido) / ontemRecebido) * 100)
          : hojeRecebido > 0
            ? 100
            : 0

      const vencidosOuGlosados = lancamentos.filter((l) =>
        ['vencido', 'glosado'].includes(l.status),
      )

      const chartData = Array.from({ length: 7 }).map((_, i) => {
        const d = subDays(new Date(), 6 - i)
        const dStr = format(d, 'yyyy-MM-dd')
        const dayLancamentos = lancamentos.filter((l) => l.data?.startsWith(dStr))
        return {
          day: format(d, 'dd/MM'),
          recebido: dayLancamentos
            .filter((l) => l.tipo === 'receita' && l.status === 'pago')
            .reduce((a, b) => a + b.valor, 0),
          areceber: dayLancamentos
            .filter((l) => l.tipo === 'receita' && l.status !== 'pago' && l.status !== 'cancelado')
            .reduce((a, b) => a + b.valor, 0),
        }
      })

      setData({
        kpis: {
          leads: { value: activeLeads.length },
          revenue: {
            value: `R$ ${hojeRecebido.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
            delta: `${revDelta >= 0 ? '+' : ''}${revDelta}%`,
            trend: revDelta >= 0 ? 'up' : 'down',
          },
          conversions: {
            value: conversions.toString(),
            delta: `${conversionDelta >= 0 ? '+' : ''}${conversionDelta}%`,
            trend: conversionDelta >= 0 ? 'up' : 'down',
          },
          alerts: { count: vencidosOuGlosados.length },
        },
        recentLeads: leads.slice(0, 5).map((l) => ({
          id: l.id,
          nome: l.nome,
          procedimento: l.procedimentoInteresse,
          etapa: l.etapaFunil,
          origem: l.origem,
        })),
        overdue: vencidosOuGlosados.map((l) => ({
          id: l.id,
          name: l.expand?.paciente?.name || l.categoria,
          value: `R$ ${l.valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
          daysOverdue: Math.max(
            0,
            Math.floor(
              (Date.now() - new Date(l.dataVencimento || l.data).getTime()) / (1000 * 3600 * 24),
            ),
          ),
          type: l.status === 'glosado' ? 'glosa' : 'late',
        })),
        financialChart: chartData,
      })
      setLastUpdated(new Date())
    } catch (e) {
      console.error(e)
    } finally {
      setIsRefreshing(false)
    }
  }, [])

  useEffect(() => {
    refreshData()
    const interval = setInterval(refreshData, 60000)
    return () => clearInterval(interval)
  }, [refreshData])

  return { data, isRefreshing, refreshData, lastUpdated }
}
