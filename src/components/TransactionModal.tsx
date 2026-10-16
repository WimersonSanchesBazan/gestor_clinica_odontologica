import { useState, useEffect } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import pb from '@/lib/pocketbase/client'
import { format } from 'date-fns'
import { toast } from 'sonner'

const schema = z.object({
  tipo: z.enum(['receita', 'despesa']),
  valor: z.coerce.number().positive(),
  categoria: z.string().min(1),
  data: z.string(),
  dataVencimento: z.string().optional(),
  formaPagamento: z.string(),
  parcelas: z.coerce.number().optional(),
  status: z.string(),
  paciente: z.string().optional(),
  convenio: z.string().optional(),
  observacoes: z.string().optional(),
})

type FormValues = z.infer<typeof schema>

export function TransactionModal({ open, onOpenChange, transaction, onSaved }: any) {
  const [patients, setPatients] = useState<any[]>([])
  const [convenios, setConvenios] = useState<any[]>([])
  const [saving, setSaving] = useState(false)
  const [cancelling, setCancelling] = useState(false)

  const {
    register,
    handleSubmit,
    control,
    watch,
    setValue,
    reset,
    formState: { isValid },
  } = useForm<FormValues>({
    resolver: zodResolver(schema) as any,
    defaultValues: {
      tipo: 'receita',
      valor: 0,
      categoria: '',
      data: format(new Date(), 'yyyy-MM-dd'),
      formaPagamento: 'pix',
      status: 'pago',
      parcelas: 1,
    },
  })

  const tipo = watch('tipo')
  const formaPagamento = watch('formaPagamento')
  const status = watch('status')

  useEffect(() => {
    pb.collection('users')
      .getFullList()
      .then(setPatients)
      .catch(() => {})
    pb.collection('convenios')
      .getFullList()
      .then(setConvenios)
      .catch(() => {})
  }, [])

  useEffect(() => {
    if (transaction) {
      reset({
        tipo: transaction.tipo,
        valor: transaction.valor,
        categoria: transaction.categoria,
        data: transaction.data ? transaction.data.split(' ')[0] : '',
        dataVencimento: transaction.dataVencimento ? transaction.dataVencimento.split(' ')[0] : '',
        formaPagamento: transaction.formaPagamento,
        parcelas: transaction.parcelas || 1,
        status: transaction.status,
        paciente: transaction.paciente || '',
        convenio: transaction.convenio || '',
        observacoes: transaction.observacoes || '',
      })
    } else {
      reset({
        tipo: 'receita',
        valor: 0,
        categoria: '',
        data: format(new Date(), 'yyyy-MM-dd'),
        formaPagamento: 'pix',
        status: 'pago',
        parcelas: 1,
      })
    }
  }, [transaction, reset])

  const onSubmit = async (data: FormValues) => {
    const payload = {
      ...data,
      data: `${data.data} 12:00:00.000Z`,
      dataVencimento: data.dataVencimento ? `${data.dataVencimento} 12:00:00.000Z` : null,
      paciente: data.paciente === 'none' ? null : data.paciente,
      convenio: data.convenio === 'none' ? null : data.convenio,
    }

    setSaving(true)
    try {
      if (transaction?.id) {
        await pb.collection('lancamentos_financeiros').update(transaction.id, payload)
        toast.success('Lançamento atualizado.')
      } else {
        await pb.collection('lancamentos_financeiros').create(payload)
        toast.success('Lançamento registrado.')
      }
      onSaved()
      onOpenChange(false)
    } catch (e) {
      toast.error('Não foi possível salvar o lançamento. Tente novamente.')
    } finally {
      setSaving(false)
    }
  }

  const handleCancel = async () => {
    if (!transaction?.id) return
    setCancelling(true)
    try {
      await pb.collection('lancamentos_financeiros').update(transaction.id, { status: 'cancelado' })
      toast.success('Lançamento cancelado.')
      onSaved()
      onOpenChange(false)
    } catch (e) {
      toast.error('Não foi possível cancelar o lançamento.')
    } finally {
      setCancelling(false)
    }
  }

  const catOptions =
    tipo === 'receita'
      ? ['Consulta', 'Procedimento', 'Exame', 'Retorno']
      : ['Aluguel', 'Salário', 'Impostos', 'Insumos', 'Outros']

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{transaction ? 'Editar Lançamento' : 'Novo Lançamento'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 py-4">
          <div className="flex gap-2 p-1 bg-gray-100 rounded-lg">
            <button
              type="button"
              onClick={() => {
                setValue('tipo', 'receita')
                setValue('categoria', '')
              }}
              className={`flex-1 py-1.5 text-sm font-medium rounded-md transition-colors ${tipo === 'receita' ? 'bg-mint text-white shadow' : 'text-gray-500'}`}
            >
              Receita
            </button>
            <button
              type="button"
              onClick={() => {
                setValue('tipo', 'despesa')
                setValue('categoria', '')
              }}
              className={`flex-1 py-1.5 text-sm font-medium rounded-md transition-colors ${tipo === 'despesa' ? 'bg-bordeaux text-white shadow' : 'text-gray-500'}`}
            >
              Despesa
            </button>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Valor (R$)</Label>
              <Input type="number" step="0.01" {...register('valor')} />
            </div>
            <div className="space-y-2">
              <Label>Data</Label>
              <Input type="date" {...register('data')} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Categoria</Label>
              <Controller
                name="categoria"
                control={control}
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione..." />
                    </SelectTrigger>
                    <SelectContent>
                      {catOptions.map((c) => (
                        <SelectItem key={c} value={c}>
                          {c}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </div>
            <div className="space-y-2">
              <Label>Status</Label>
              <Controller
                name="status"
                control={control}
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pago">Pago</SelectItem>
                      <SelectItem value="pendente">Pendente</SelectItem>
                      <SelectItem value="vencido">Vencido</SelectItem>
                      <SelectItem value="glosado">Glosado</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Forma de Pagamento</Label>
              <Controller
                name="formaPagamento"
                control={control}
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pix">PIX</SelectItem>
                      <SelectItem value="dinheiro">Dinheiro</SelectItem>
                      <SelectItem value="cartao_credito">Cartão de Crédito</SelectItem>
                      <SelectItem value="cartao_debito">Cartão de Débito</SelectItem>
                      <SelectItem value="boleto">Boleto</SelectItem>
                      <SelectItem value="transferencia">Transferência</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              />
            </div>
            {formaPagamento === 'cartao_credito' && (
              <div className="space-y-2">
                <Label>Parcelas</Label>
                <Input type="number" min="1" {...register('parcelas')} />
              </div>
            )}
            {['pendente', 'vencido'].includes(status) && (
              <div className="space-y-2">
                <Label>Vencimento</Label>
                <Input type="date" {...register('dataVencimento')} />
              </div>
            )}
          </div>

          {tipo === 'receita' && (
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Paciente</Label>
                <Controller
                  name="paciente"
                  control={control}
                  render={({ field }) => (
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger>
                        <SelectValue placeholder="Nenhum" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">Nenhum</SelectItem>
                        {patients.map((p) => (
                          <SelectItem key={p.id} value={p.id}>
                            {p.name || p.email}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>
              <div className="space-y-2">
                <Label>Convênio</Label>
                <Controller
                  name="convenio"
                  control={control}
                  render={({ field }) => (
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger>
                        <SelectValue placeholder="Particular" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">Particular</SelectItem>
                        {convenios.map((c) => (
                          <SelectItem key={c.id} value={c.id}>
                            {c.nome}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>
            </div>
          )}

          <div className="flex justify-between mt-6 pt-4 border-t">
            {transaction && transaction.status !== 'cancelado' ? (
              <Button
                type="button"
                variant="destructive"
                onClick={handleCancel}
                disabled={cancelling || saving}
              >
                {cancelling ? 'Cancelando...' : 'Cancelar Lançamento'}
              </Button>
            ) : (
              <div />
            )}
            <div className="flex gap-2">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Fechar
              </Button>
              <Button
                type="submit"
                disabled={!isValid || saving}
                className="bg-lavender hover:bg-lavender/90 text-white"
              >
                {saving ? 'Salvando...' : 'Salvar'}
              </Button>
            </div>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
