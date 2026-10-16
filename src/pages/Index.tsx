import { RefreshCw, Users, DollarSign, Activity, AlertCircle, UserPlus } from 'lucide-react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { useDashboardData } from '@/hooks/use-dashboard-data'
import { useAuth } from '@/hooks/use-auth'
import { KPICard } from '@/components/KPICard'
import { FinancialChart } from '@/components/FinancialChart'
import { OverdueList } from '@/components/OverdueList'
import { Button } from '@/components/ui/button'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

const ETAPA_CONFIG: Record<string, { label: string; bg: string; text: string }> = {
  novo: { label: 'Novo', bg: 'bg-lavender-soft', text: 'text-lavender' },
  contato: { label: 'Em contato', bg: 'bg-ochre-soft', text: 'text-ochre' },
  agendado: { label: 'Agendado', bg: 'bg-mint-soft', text: 'text-mint' },
  convertido: { label: 'Convertido', bg: 'bg-mint-soft', text: 'text-mint' },
  perdido: { label: 'Perdido', bg: 'bg-bordeaux-soft', text: 'text-bordeaux' },
}

export default function Index() {
  const { data, isRefreshing, refreshData, lastUpdated } = useDashboardData()
  const { user } = useAuth()

  const firstName = (user?.name || '').split(' ')[0]
  const currentDateFormatted = format(new Date(), "EEEE, d 'de' MMMM", { locale: ptBR })

  return (
    <div className="flex flex-col h-full gap-6 animate-fade-in relative">
      {/* Background imagery for header */}
      <div className="absolute top-0 right-0 w-[600px] h-[300px] pointer-events-none overflow-hidden rounded-bl-3xl opacity-5 mix-blend-multiply z-0">
        <img
          src="https://img.usecurling.com/p/600/300?q=medical%20stethoscope&color=black"
          alt=""
          className="w-full h-full object-cover object-right-top"
        />
      </div>

      {/* Page Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 shrink-0 relative z-10 pt-2">
        <div>
          <h1 className="font-display text-3xl md:text-4xl font-bold tracking-tight text-gray-900 mb-2">
            Bom dia{firstName ? `, ${firstName}` : ''}.
          </h1>
          <p className="text-gray-500 capitalize font-medium">
            {currentDateFormatted} <span className="opacity-50 mx-2">·</span>{' '}
            {data.kpis.leads.value} leads ativos no funil
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="icon"
            onClick={refreshData}
            disabled={isRefreshing}
            className="bg-white"
            title={`Última atualização: ${format(lastUpdated, 'HH:mm:ss')}`}
          >
            <RefreshCw className={`w-4 h-4 text-gray-500 ${isRefreshing ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 shrink-0 relative z-10">
        <div className="animate-fade-in-up" style={{ animationDelay: '0ms' }}>
          <KPICard
            title="Leads Ativos"
            value={data.kpis.leads.value}
            icon={Users}
            tone="primary"
            subtext="no funil"
          />
        </div>
        <div className="animate-fade-in-up" style={{ animationDelay: '50ms' }}>
          <KPICard
            title="Faturamento Hoje"
            value={data.kpis.revenue.value}
            delta={data.kpis.revenue.delta}
            trend={data.kpis.revenue.trend}
            icon={DollarSign}
            tone="success"
            subtext="vs. ontem"
          />
        </div>
        <div className="animate-fade-in-up" style={{ animationDelay: '100ms' }}>
          <KPICard
            title="Pacientes Convertidos"
            value={data.kpis.conversions.value}
            delta={data.kpis.conversions.delta}
            trend={data.kpis.conversions.trend}
            icon={Activity}
            tone="warning"
            subtext="total no CRM"
          />
        </div>
        <div className="animate-fade-in-up" style={{ animationDelay: '150ms' }}>
          <KPICard
            title="Alertas Críticos"
            value={data.kpis.alerts.count}
            icon={AlertCircle}
            tone="error"
            subtext="pendências financeiras"
          />
        </div>
      </div>

      {/* Main Grid: Chart + Details */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 flex-1 min-h-0 relative z-10">
        {/* Left Column: Chart & Recent Leads (Stack) */}
        <div className="lg:col-span-2 flex flex-col gap-6 h-full min-h-0">
          {/* Chart Section */}
          <div
            className="h-[280px] shrink-0 animate-fade-in-up"
            style={{ animationDelay: '200ms' }}
          >
            <FinancialChart data={data.financialChart} />
          </div>

          {/* Recent Leads Section */}
          <div
            className="flex-1 min-h-0 flex flex-col animate-fade-in-up"
            style={{ animationDelay: '250ms' }}
          >
            <Card className="flex flex-col border-gray-100 bg-white shadow-sm h-full">
              <CardHeader className="pb-4 shrink-0 border-b border-gray-50">
                <CardTitle className="text-sm font-medium text-gray-500 uppercase tracking-wider">
                  Leads Recentes
                </CardTitle>
              </CardHeader>
              <CardContent className="flex-1 overflow-auto p-0">
                <div className="divide-y divide-gray-50">
                  {data.recentLeads.map((lead: any) => {
                    const etapa = ETAPA_CONFIG[lead.etapa] || ETAPA_CONFIG.novo
                    return (
                      <div
                        key={lead.id}
                        className="flex items-center justify-between gap-4 px-6 py-4 hover:bg-gray-50/50 transition-colors"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-9 h-9 rounded-full bg-lavender-soft text-lavender flex items-center justify-center font-semibold text-sm shrink-0">
                            {lead.nome?.charAt(0)?.toUpperCase() || 'L'}
                          </div>
                          <div className="flex flex-col min-w-0">
                            <span className="text-sm font-medium text-gray-900 truncate">
                              {lead.nome}
                            </span>
                            <span className="text-xs text-gray-400 truncate">
                              {lead.procedimento}
                            </span>
                          </div>
                        </div>
                        <Badge
                          variant="outline"
                          className={`border-none ${etapa.bg} ${etapa.text} font-medium px-2 py-0.5 shrink-0`}
                        >
                          {etapa.label}
                        </Badge>
                      </div>
                    )
                  })}
                  {data.recentLeads.length === 0 && (
                    <div className="px-6 py-10 text-center text-sm text-gray-500 flex flex-col items-center gap-2">
                      <UserPlus className="w-6 h-6 text-gray-300" />
                      Nenhum lead ainda. Cadastre o primeiro no CRM.
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Right Column: Overdue List */}
        <div
          className="lg:col-span-1 flex flex-col h-full min-h-0 animate-fade-in-up"
          style={{ animationDelay: '300ms' }}
        >
          <OverdueList data={data.overdue} className="h-full" />
        </div>
      </div>
    </div>
  )
}
