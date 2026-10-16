import { AlertTriangle } from 'lucide-react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'

interface OverdueItem {
  id: number
  name: string
  daysOverdue: number
  value: string
}

interface OverdueListProps {
  data: OverdueItem[]
  className?: string
}

export function OverdueList({ data, className = '' }: OverdueListProps) {
  return (
    <Card
      className={`flex flex-col border-bordeaux/20 bg-white shadow-sm overflow-hidden ${className}`}
    >
      <CardHeader className="pb-4 shrink-0 bg-bordeaux-soft/30 border-b border-bordeaux/10">
        <div className="flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-bordeaux" />
          <CardTitle className="text-sm font-medium text-bordeaux uppercase tracking-wider">
            Inadimplentes
          </CardTitle>
        </div>
      </CardHeader>
      <CardContent className="flex-1 overflow-auto p-0">
        <div className="divide-y divide-gray-50">
          {data.map((item) => (
            <div
              key={item.id}
              className="flex justify-between items-center px-5 py-4 hover:bg-gray-50/50 transition-colors"
            >
              <div className="flex flex-col gap-0.5">
                <span className="text-sm font-medium text-gray-900">{item.name}</span>
                <span className="text-xs text-gray-500">{item.daysOverdue} dias em atraso</span>
              </div>
              <div className="font-mono text-sm font-semibold text-bordeaux bg-bordeaux-soft px-2 py-1 rounded">
                {item.value}
              </div>
            </div>
          ))}
          {data.length === 0 && (
            <div className="px-5 py-8 text-center text-sm text-gray-500">
              Nenhum paciente inadimplente.
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
