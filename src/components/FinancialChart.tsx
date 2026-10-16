import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ChartContainer, ChartTooltipContent } from '@/components/ui/chart'

interface FinancialChartProps {
  data: any[]
}

const chartConfig = {
  recebido: {
    label: 'Recebido (R$)',
    theme: { light: '#8b7fb8', dark: '#8b7fb8' },
  },
  areceber: {
    label: 'A receber (R$)',
    theme: { light: '#87a596', dark: '#87a596' },
  },
}

export function FinancialChart({ data }: FinancialChartProps) {
  // Calculate totals
  const totalRecebido = data.reduce((acc, curr) => acc + curr.recebido, 0)
  const totalAReceber = data.reduce((acc, curr) => acc + curr.areceber, 0)

  const formatCurrency = (val: number) => {
    return val.toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 0,
    })
  }

  return (
    <Card className="h-full flex flex-col border-gray-100 bg-white shadow-sm">
      <CardHeader className="pb-2 flex flex-row items-center justify-between">
        <div>
          <CardTitle className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-1">
            Visão Financeira
          </CardTitle>
          <div className="flex gap-6 mt-2">
            <div>
              <p className="text-xs text-gray-400 mb-1">Recebido</p>
              <p className="font-mono text-lg font-semibold text-lavender">
                {formatCurrency(totalRecebido)}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-400 mb-1">A receber</p>
              <p className="font-mono text-lg font-semibold text-mint">
                {formatCurrency(totalAReceber)}
              </p>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="flex-1 min-h-[200px] pt-4">
        <ChartContainer config={chartConfig} className="w-full h-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="fillRecebido" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="var(--color-recebido)" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="var(--color-recebido)" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="fillAReceber" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="var(--color-areceber)" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="var(--color-areceber)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
              <XAxis
                dataKey="day"
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 12, fill: '#9ca3af' }}
                dy={10}
              />
              <YAxis
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 12, fill: '#9ca3af' }}
                tickFormatter={(value) => `R$${value}`}
                width={80}
              />
              <Tooltip
                content={<ChartTooltipContent indicator="dot" />}
                cursor={{ stroke: '#e5e7eb', strokeWidth: 1, strokeDasharray: '4 4' }}
              />
              <Area
                type="monotone"
                dataKey="areceber"
                stroke="var(--color-areceber)"
                fill="url(#fillAReceber)"
                strokeWidth={2}
                strokeDasharray="4 4"
                activeDot={{ r: 4, strokeWidth: 0, fill: 'var(--color-areceber)' }}
              />
              <Area
                type="monotone"
                dataKey="recebido"
                stroke="var(--color-recebido)"
                fill="url(#fillRecebido)"
                strokeWidth={2}
                activeDot={{ r: 4, strokeWidth: 0, fill: 'var(--color-recebido)' }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}
