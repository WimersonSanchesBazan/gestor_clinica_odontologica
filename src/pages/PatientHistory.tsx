import { useState, useEffect, useCallback } from 'react'
import { useParams, Link } from 'react-router-dom'
import { ChevronLeft, Sparkles, FileText, Calendar as CalendarIcon, Clock } from 'lucide-react'
import pb from '@/lib/pocketbase/client'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { format, differenceInYears, isFuture } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { DocumentUploadModal } from '@/components/DocumentUploadModal'
import { DocumentViewer } from '@/components/DocumentViewer'
import { useRealtime } from '@/hooks/use-realtime'
import { toast } from 'sonner'

export default function PatientHistory() {
  const { id } = useParams()
  const [patient, setPatient] = useState<any>(null)
  const [agendamentos, setAgendamentos] = useState<any[]>([])
  const [documentos, setDocumentos] = useState<any[]>([])
  const [leadInfo, setLeadInfo] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)

  const [isUploadOpen, setIsUploadOpen] = useState(false)
  const [selectedDoc, setSelectedDoc] = useState<any>(null)

  const loadData = useCallback(async () => {
    if (!id) return
    try {
      const [pat, agends, docs, leads] = await Promise.all([
        pb
          .collection('users')
          .getOne(id)
          .catch(() => null),
        pb
          .collection('agendamentos')
          .getFullList({ filter: `paciente = "${id}"`, sort: '-dataHora' })
          .catch(() => []),
        pb
          .collection('documentos_paciente')
          .getFullList({ filter: `paciente = "${id}"`, sort: '-data' })
          .catch(() => []),
        pb
          .collection('crm_leads')
          .getFullList({ filter: `pacienteConvertido = "${id}"` })
          .catch(() => []),
      ])

      if (pat) setPatient(pat)
      setAgendamentos(agends)
      setDocumentos(docs)
      if (leads.length > 0) setLeadInfo(leads[0])
    } catch (err) {
      toast.error('Erro ao carregar dados do paciente')
    } finally {
      setIsLoading(false)
    }
  }, [id])

  useEffect(() => {
    loadData()
  }, [loadData])

  useRealtime('agendamentos', loadData)
  useRealtime('documentos_paciente', loadData)

  if (isLoading) {
    return <div className="p-8 text-center text-gray-500">Carregando paciente...</div>
  }

  if (!patient) {
    return (
      <div className="p-8 text-center">
        <h2 className="text-xl font-medium text-gray-900">Paciente não encontrado</h2>
        <Button variant="link" asChild className="mt-4">
          <Link to="/">Voltar ao início</Link>
        </Button>
      </div>
    )
  }

  const age = patient.dataNascimento
    ? differenceInYears(new Date(), new Date(patient.dataNascimento))
    : null

  return (
    <div className="flex flex-col h-full gap-6 animate-fade-in pb-8">
      <div className="flex flex-col gap-4">
        <Link
          to="/crm"
          className="inline-flex items-center text-sm font-medium text-gray-500 hover:text-gray-900 transition-colors w-fit"
        >
          <ChevronLeft className="w-4 h-4 mr-1" />
          Voltar para CRM
        </Link>

        <div className="bg-white border rounded-xl p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-5">
            <Avatar className="w-20 h-20 border-2 border-gray-100">
              <AvatarImage
                src={patient.avatar ? pb.files.getURL(patient, patient.avatar) : undefined}
              />
              <AvatarFallback className="text-2xl bg-lavender-soft text-lavender font-medium">
                {patient.name?.charAt(0) || 'P'}
              </AvatarFallback>
            </Avatar>
            <div>
              <h1 className="text-2xl font-display font-bold text-gray-900">{patient.name}</h1>
              <div className="flex items-center flex-wrap gap-x-4 gap-y-2 mt-2 text-sm text-gray-600">
                {age !== null && <span className="font-medium">{age} anos</span>}
                {patient.cpf && <span>CPF: {patient.cpf}</span>}
                {patient.telefone && <span>{patient.telefone}</span>}
                <span className="px-2 py-0.5 rounded-full bg-gray-100 text-gray-700 text-xs font-medium">
                  Particular
                </span>
              </div>
            </div>
          </div>

          {leadInfo && (
            <div className="bg-gradient-to-br from-lavender-soft/50 to-white border border-lavender/20 rounded-lg p-4 flex items-start gap-3 w-full md:w-auto shrink-0">
              <div className="bg-lavender/10 p-2 rounded-full text-lavender mt-0.5">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900">Veio do CRM</p>
                <p className="text-xs text-gray-500 capitalize">Origem: {leadInfo.origem}</p>
                <p className="text-xs text-gray-500 mt-1">
                  Convertido em{' '}
                  {format(new Date(leadInfo.dataConversao || leadInfo.created), 'dd/MM/yyyy')}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 flex flex-col gap-4">
          <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <CalendarIcon className="w-5 h-5 text-lavender" />
            Histórico de Agendamentos
          </h2>

          <div className="bg-white border rounded-xl p-1 shadow-sm">
            {agendamentos.length === 0 ? (
              <div className="p-8 text-center text-gray-500 text-sm">
                Nenhum agendamento encontrado.
              </div>
            ) : (
              <div className="flex flex-col">
                {agendamentos.map((ag) => {
                  const date = new Date(ag.dataHora)
                  const isFutureAppt = isFuture(date)

                  return (
                    <div
                      key={ag.id}
                      className={cn(
                        'group relative flex gap-4 p-4 border-b last:border-b-0 hover:bg-gray-50 transition-colors',
                        isFutureAppt ? 'bg-lavender-soft/10' : 'opacity-80',
                      )}
                    >
                      <div className="absolute left-[3.25rem] top-12 bottom-[-1rem] w-px bg-gray-200 group-last:hidden" />

                      <div className="shrink-0 w-14 flex flex-col items-center">
                        <div
                          className={cn(
                            'w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium z-10',
                            isFutureAppt
                              ? 'bg-lavender text-white shadow-md ring-4 ring-white'
                              : 'bg-gray-100 text-gray-600 ring-4 ring-white',
                          )}
                        >
                          {format(date, 'dd')}
                        </div>
                        <span className="text-xs text-gray-500 font-medium mt-1 uppercase">
                          {format(date, 'MMM', { locale: ptBR })}
                        </span>
                      </div>

                      <div className="flex-1 pt-1 pb-2">
                        <div className="flex flex-wrap items-start justify-between gap-2">
                          <div>
                            <p className="font-medium text-gray-900 capitalize">{ag.status}</p>
                            <div className="flex items-center gap-2 text-sm text-gray-500 mt-1">
                              <Clock className="w-3.5 h-3.5" />
                              {format(date, 'HH:mm')}
                            </div>
                          </div>

                          {isFutureAppt && (
                            <span className="px-2.5 py-1 text-xs font-medium rounded-full bg-lavender-soft text-lavender border border-lavender/20">
                              Próximo
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>

        <div className="lg:col-span-1 flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <FileText className="w-5 h-5 text-lavender" />
              Documentos
            </h2>
            <Button size="sm" onClick={() => setIsUploadOpen(true)} className="h-8">
              Novo
            </Button>
          </div>

          <div className="bg-white border rounded-xl p-4 shadow-sm flex flex-col gap-3">
            {documentos.length === 0 ? (
              <div className="py-6 text-center text-sm text-gray-500">
                Nenhum documento anexado.
              </div>
            ) : (
              documentos.map((doc) => (
                <button
                  key={doc.id}
                  onClick={() => setSelectedDoc(doc)}
                  className="flex items-start gap-3 p-3 rounded-lg border border-transparent hover:border-gray-200 hover:bg-gray-50 text-left transition-all group"
                >
                  <div className="w-10 h-10 rounded bg-lavender-soft flex items-center justify-center shrink-0 text-lavender">
                    <FileText className="w-5 h-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 capitalize truncate">
                      {doc.tipo.replace('_', ' ')}
                    </p>
                    <p className="text-xs text-gray-500 truncate">
                      {doc.descricao || 'Sem descrição'}
                    </p>
                    <p className="text-xs text-gray-400 mt-1">
                      {format(new Date(doc.data), 'dd/MM/yyyy')}
                    </p>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>
      </div>

      <DocumentUploadModal
        open={isUploadOpen}
        onOpenChange={setIsUploadOpen}
        pacienteId={id!}
        onSuccess={loadData}
      />

      <DocumentViewer document={selectedDoc} onClose={() => setSelectedDoc(null)} />
    </div>
  )
}
