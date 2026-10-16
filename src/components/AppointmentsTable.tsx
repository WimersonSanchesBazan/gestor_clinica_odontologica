import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

interface Appointment {
  id: number
  time: string
  patient: string
  professional: string
  type: string
  status: 'REALIZADO' | 'CONFIRMADO' | 'AGUARDANDO'
}

interface AppointmentsTableProps {
  data: Appointment[]
  className?: string
}

const statusConfig = {
  REALIZADO: { bg: 'bg-lavender-soft', text: 'text-lavender', dot: 'bg-lavender' },
  CONFIRMADO: { bg: 'bg-mint-soft', text: 'text-mint', dot: 'bg-mint' },
  AGUARDANDO: { bg: 'bg-ochre-soft', text: 'text-ochre', dot: 'bg-ochre' },
}

export function AppointmentsTable({ data, className = '' }: AppointmentsTableProps) {
  return (
    <Card className={`flex flex-col border-gray-100 bg-white shadow-sm ${className}`}>
      <CardHeader className="pb-4 shrink-0 border-b border-gray-50">
        <CardTitle className="text-sm font-medium text-gray-500 uppercase tracking-wider">
          Próximos Atendimentos
        </CardTitle>
      </CardHeader>
      <CardContent className="flex-1 overflow-auto p-0">
        <div className="w-full min-w-[600px]">
          {/* Table Header */}
          <div className="grid grid-cols-5 gap-4 px-6 py-3 bg-gray-50/50 border-b border-gray-50 text-xs font-semibold text-gray-500 sticky top-0 z-10">
            <div>HORÁRIO</div>
            <div className="col-span-2">PACIENTE</div>
            <div>PROFISSIONAL</div>
            <div>STATUS</div>
          </div>
          {/* Table Body */}
          <div className="divide-y divide-gray-50">
            {data.map((apt) => {
              const statusStyle = statusConfig[apt.status]
              return (
                <div
                  key={apt.id}
                  className="grid grid-cols-5 gap-4 px-6 py-4 items-center hover:bg-gray-50/50 transition-colors group"
                >
                  <div className="font-mono text-sm font-medium text-gray-900">{apt.time}</div>
                  <div className="col-span-2 flex flex-col">
                    <span className="text-sm font-medium text-gray-900">{apt.patient}</span>
                    <span className="text-xs text-gray-400 capitalize">{apt.type}</span>
                  </div>
                  <div className="text-sm text-gray-600">{apt.professional}</div>
                  <div>
                    <Badge
                      variant="outline"
                      className={`border-none ${statusStyle.bg} ${statusStyle.text} font-medium px-2 py-0.5 flex w-max items-center gap-1.5`}
                    >
                      <span className={`w-1.5 h-1.5 rounded-full ${statusStyle.dot}`} />
                      {apt.status}
                    </Badge>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
