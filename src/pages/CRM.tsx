import { useState, useEffect, useCallback } from 'react'
import { Plus, ChevronRight, Phone } from 'lucide-react'
import { Button } from '@/components/ui/button'
import pb from '@/lib/pocketbase/client'
import { useRealtime } from '@/hooks/use-realtime'
import { LeadDrawer } from '@/components/LeadDrawer'
import { cn } from '@/lib/utils'

const STAGES = [
  { id: 'novo', label: 'Novo', dot: 'bg-lavender', bg: 'bg-lavender-soft/30' },
  { id: 'contato', label: 'Contato', dot: 'bg-blue-500', bg: 'bg-blue-50' },
  { id: 'agendado', label: 'Agendado', dot: 'bg-yellow-500', bg: 'bg-yellow-50' },
  { id: 'convertido', label: 'Convertido', dot: 'bg-green-500', bg: 'bg-green-50' },
  { id: 'perdido', label: 'Perdido', dot: 'bg-red-500', bg: 'bg-red-50' },
]

export default function CRM() {
  const [leads, setLeads] = useState<any[]>([])
  const [isDrawerOpen, setIsDrawerOpen] = useState(false)
  const [selectedLead, setSelectedLead] = useState<any>(null)
  const [draggingId, setDraggingId] = useState<string | null>(null)

  const fetchLeads = useCallback(async () => {
    try {
      const records = await pb.collection('crm_leads').getFullList({ sort: '-created' })
      setLeads(records)
    } catch (err) {
      console.error(err)
    }
  }, [])

  useEffect(() => {
    fetchLeads()
  }, [fetchLeads])
  useRealtime('crm_leads', fetchLeads)

  const handleDragStart = (e: React.DragEvent, id: string) => {
    e.dataTransfer.setData('text/plain', id)
    setDraggingId(id)
  }

  const handleDrop = async (e: React.DragEvent, stageId: string) => {
    e.preventDefault()
    const id = e.dataTransfer.getData('text/plain')
    if (id) {
      setDraggingId(null)
      try {
        await pb.collection('crm_leads').update(id, { etapaFunil: stageId })
        fetchLeads()
      } catch (error) {
        console.error('Falha ao mover lead', error)
      }
    }
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
  }

  const moveNext = async (lead: any) => {
    const currentIndex = STAGES.findIndex((s) => s.id === lead.etapaFunil)
    if (currentIndex < STAGES.length - 1) {
      const nextStage = STAGES[currentIndex + 1].id
      try {
        await pb.collection('crm_leads').update(lead.id, { etapaFunil: nextStage })
        fetchLeads()
      } catch (err) {
        console.error(err)
      }
    }
  }

  const activeLeads = leads.filter(
    (l) => l.etapaFunil !== 'convertido' && l.etapaFunil !== 'perdido',
  ).length
  const currentMonth = new Date().getMonth()
  const currentYear = new Date().getFullYear()

  const convertedThisMonth = leads.filter((l) => {
    if (l.etapaFunil !== 'convertido') return false
    const d = new Date(l.dataConversao || l.updated)
    return d.getMonth() === currentMonth && d.getFullYear() === currentYear
  }).length

  const lostThisMonth = leads.filter((l) => {
    if (l.etapaFunil !== 'perdido') return false
    const d = new Date(l.updated)
    return d.getMonth() === currentMonth && d.getFullYear() === currentYear
  }).length

  const totalFinalized = convertedThisMonth + lostThisMonth
  const conversionRate =
    totalFinalized > 0 ? Math.round((convertedThisMonth / totalFinalized) * 100) : 0

  return (
    <div className="flex flex-col h-full gap-6 animate-fade-in">
      <div className="flex flex-col md:flex-row justify-between gap-4 items-start md:items-center">
        <div>
          <h1 className="font-display text-2xl font-bold text-gray-900">Pipeline de Vendas</h1>
          <div className="flex flex-wrap gap-3 mt-2 text-sm">
            <div className="flex items-center gap-1.5 bg-white px-3 py-1.5 rounded-md border shadow-sm">
              <span className="text-gray-500">Leads Ativos:</span>
              <span className="font-medium text-gray-900">{activeLeads}</span>
            </div>
            <div className="flex items-center gap-1.5 bg-white px-3 py-1.5 rounded-md border shadow-sm">
              <span className="text-gray-500">Conversões Mês:</span>
              <span className="font-medium text-green-600">{convertedThisMonth}</span>
            </div>
            <div className="flex items-center gap-1.5 bg-white px-3 py-1.5 rounded-md border shadow-sm">
              <span className="text-gray-500">Taxa de Conversão:</span>
              <span className="font-medium text-lavender">{conversionRate}%</span>
            </div>
          </div>
        </div>
        <Button
          onClick={() => {
            setSelectedLead(null)
            setIsDrawerOpen(true)
          }}
          className="shrink-0"
        >
          <Plus className="w-4 h-4 mr-2" />
          Novo Lead
        </Button>
      </div>

      <div className="flex flex-col lg:flex-row gap-4 overflow-x-auto overflow-y-auto pb-4 flex-1 items-start min-h-0">
        {STAGES.map((stage) => {
          const stageLeads = leads.filter((l) => l.etapaFunil === stage.id)

          return (
            <div
              key={stage.id}
              className={cn(
                'flex flex-col min-w-[300px] w-full lg:w-[320px] shrink-0 rounded-xl border p-3 min-h-[200px] lg:h-full',
                stage.bg,
              )}
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, stage.id)}
            >
              <div className="flex items-center justify-between mb-4 px-1">
                <div className="flex items-center gap-2">
                  <div className={cn('w-2.5 h-2.5 rounded-full', stage.dot)} />
                  <h3 className="font-semibold text-gray-800">{stage.label}</h3>
                </div>
                <span className="bg-white/60 text-gray-600 text-xs px-2 py-0.5 rounded-full font-medium border border-black/5">
                  {stageLeads.length}
                </span>
              </div>

              <div className="flex flex-col gap-3 flex-1 overflow-y-auto pb-2 px-1">
                {stageLeads.map((lead) => (
                  <div
                    key={lead.id}
                    draggable
                    onDragStart={(e) => handleDragStart(e, lead.id)}
                    onClick={() => {
                      setSelectedLead(lead)
                      setIsDrawerOpen(true)
                    }}
                    className={cn(
                      'bg-white p-3.5 rounded-lg border border-gray-200 shadow-sm cursor-grab hover:border-lavender hover:shadow-md transition-all group',
                      draggingId === lead.id && 'opacity-50 border-dashed',
                    )}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <p className="font-medium text-gray-900 leading-tight">{lead.nome}</p>
                      <span className="text-[10px] uppercase font-bold text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded shrink-0">
                        {lead.origem}
                      </span>
                    </div>

                    <p className="text-sm text-gray-600 mb-3 line-clamp-1">
                      {lead.procedimentoInteresse}
                    </p>

                    <div className="flex items-center justify-between mt-auto">
                      <div className="flex items-center gap-1.5 text-xs text-gray-500 font-medium">
                        <Phone className="w-3.5 h-3.5" />
                        {lead.telefone}
                      </div>

                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          moveNext(lead)
                        }}
                        className="lg:hidden p-1.5 text-gray-400 hover:text-lavender bg-gray-50 hover:bg-lavender-soft rounded-full"
                        title="Avançar etapa"
                      >
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}

                {stageLeads.length === 0 && (
                  <div className="text-center py-6 border-2 border-dashed border-gray-200 rounded-lg text-sm text-gray-400">
                    Nenhum lead
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>

      <LeadDrawer
        open={isDrawerOpen}
        onOpenChange={setIsDrawerOpen}
        lead={selectedLead}
        onSuccess={fetchLeads}
      />
    </div>
  )
}
