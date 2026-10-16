export const KPIS_MOCK = {
  appointments: { value: 42, delta: '+12%', trend: 'up' as const },
  revenue: { value: 'R$ 4.250,00', delta: '+5.4%', trend: 'up' as const },
  occupancy: { value: '85%', delta: '-2%', trend: 'down' as const },
  alerts: { value: '2 glosas · 1 atraso', count: 3, type: 'critical' as const },
}

export const PROXIMOS_ATENDIMENTOS_MOCK = [
  {
    id: 1,
    time: '10:00',
    patient: 'Ana Silva',
    professional: 'Dra. Carla',
    type: 'Primeira consulta',
    status: 'REALIZADO' as const,
  },
  {
    id: 2,
    time: '10:30',
    patient: 'João Roberto',
    professional: 'Dr. Marcos',
    type: 'Retorno',
    status: 'CONFIRMADO' as const,
  },
  {
    id: 3,
    time: '11:00',
    patient: 'Carla Dias',
    professional: 'Dra. Carla',
    type: 'Exame',
    status: 'CONFIRMADO' as const,
  },
  {
    id: 4,
    time: '11:15',
    patient: 'Marcos Paulo',
    professional: 'Dr. Silva',
    type: 'Primeira consulta',
    status: 'AGUARDANDO' as const,
  },
  {
    id: 5,
    time: '11:45',
    patient: 'Luiza Mendes',
    professional: 'Dra. Ana',
    type: 'Retorno',
    status: 'AGUARDANDO' as const,
  },
  {
    id: 6,
    time: '13:00',
    patient: 'Roberto Costa',
    professional: 'Dr. Marcos',
    type: 'Exame',
    status: 'AGUARDANDO' as const,
  },
  {
    id: 7,
    time: '13:30',
    patient: 'Fernanda Lima',
    professional: 'Dra. Carla',
    type: 'Primeira consulta',
    status: 'AGUARDANDO' as const,
  },
]

export const INADIMPLENTES_MOCK = [
  { id: 1, name: 'Roberto Lima', daysOverdue: 15, value: 'R$ 850,00' },
  { id: 2, name: 'Patricia Souza', daysOverdue: 8, value: 'R$ 480,00' },
  { id: 3, name: 'Eduardo Faria', daysOverdue: 22, value: 'R$ 320,00' },
  { id: 4, name: 'Camila Reis', daysOverdue: 5, value: 'R$ 690,00' },
  { id: 5, name: 'Anderson Silva', daysOverdue: 45, value: 'R$ 1.200,00' },
]

export const FINANCIAL_CHART_MOCK = [
  { day: '01', recebido: 1200, areceber: 800 },
  { day: '02', recebido: 1800, areceber: 1000 },
  { day: '03', recebido: 1500, areceber: 2000 },
  { day: '04', recebido: 2200, areceber: 1500 },
  { day: '05', recebido: 2800, areceber: 1200 },
  { day: '06', recebido: 2500, areceber: 1800 },
  { day: '07', recebido: 3200, areceber: 2100 },
  { day: '08', recebido: 4250, areceber: 3000 },
]
