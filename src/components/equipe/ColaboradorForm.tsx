import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner'
import { SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { ScrollArea } from '@/components/ui/scroll-area'
import { colaboradorSchema, type ColaboradorFormData } from '@/lib/schemas'
import { maskCPF, maskPhone, formatCurrency, parseCurrency } from '@/lib/masks'
import { createColaborador, updateColaborador, type Colaborador } from '@/services/colaboradores'
import { getProfissionais, type Profissional } from '@/services/profissionais'
import { extractFieldErrors } from '@/lib/pocketbase/errors'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'

interface Props {
  colaborador?: Colaborador
  onSuccess: () => void
}

const cargos = [
  'Médico',
  'Dentista',
  'Fisioterapeuta',
  'Secretária',
  'Enfermeiro',
  'Psicólogo',
  'Recepcionista',
  'Gerente',
  'Outros',
] as const

export function ColaboradorForm({ colaborador, onSuccess }: Props) {
  const [profissionais, setProfissionais] = useState<Profissional[]>([])

  const form = useForm<ColaboradorFormData>({
    resolver: zodResolver(colaboradorSchema),
    defaultValues: {
      nome: colaborador?.nome || '',
      cpf: colaborador?.cpf || '',
      cargo: (colaborador?.cargo as any) || 'Secretária',
      tipoContrato: colaborador?.tipoContrato || 'clt',
      dataAdmissao:
        colaborador?.dataAdmissao?.substring(0, 10) || new Date().toISOString().substring(0, 10),
      salario: colaborador ? formatCurrency(colaborador.salario) : '',
      perfilAcesso: colaborador?.perfilAcesso || 'secretaria',
      email: colaborador?.email || '',
      telefone: colaborador?.telefone || '',
      ativo: colaborador?.ativo ?? true,
      profissionalVinculado: colaborador?.profissionalVinculado || '',
    },
  })

  useEffect(() => {
    getProfissionais().then(setProfissionais).catch(console.error)
  }, [])

  const onSubmit = async (data: ColaboradorFormData) => {
    try {
      const payload = { ...data, salario: parseCurrency(data.salario) }
      if (colaborador) await updateColaborador(colaborador.id, payload)
      else await createColaborador(payload)
      toast.success('Colaborador salvo com sucesso!')
      onSuccess()
    } catch (err) {
      const errs = extractFieldErrors(err)
      if (errs.cpf) form.setError('cpf', { message: 'CPF já cadastrado.' })
      else toast.error('Erro ao salvar.')
    }
  }

  const cargo = form.watch('cargo')
  const showVinculo = ['Médico', 'Dentista', 'Fisioterapeuta', 'Psicólogo', 'Enfermeiro'].includes(
    cargo,
  )
  const nome = form.watch('nome')

  return (
    <SheetContent className="w-full sm:max-w-md p-0 flex flex-col bg-white">
      <SheetHeader className="p-6 bg-lavender-soft border-b border-lavender/10">
        <div className="flex items-center gap-4">
          <Avatar className="h-14 w-14 border-2 border-white shadow-sm">
            <AvatarFallback className="bg-lavender text-white font-medium text-lg">
              {nome.substring(0, 2).toUpperCase() || 'CP'}
            </AvatarFallback>
          </Avatar>
          <div className="text-left">
            <SheetTitle className="font-display text-gray-900">
              {colaborador ? 'Editar Colaborador' : 'Novo Colaborador'}
            </SheetTitle>
            <p className="text-sm text-gray-500 mt-1">Preencha os dados do membro da equipe.</p>
          </div>
        </div>
      </SheetHeader>

      <ScrollArea className="flex-1 p-6">
        <Form {...form}>
          <form id="colab-form" onSubmit={form.handleSubmit(onSubmit)} className="space-y-5 pb-6">
            <FormField
              control={form.control}
              name="nome"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome Completo</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="cpf"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>CPF</FormLabel>
                    <FormControl>
                      <Input {...field} onChange={(e) => field.onChange(maskCPF(e.target.value))} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="dataAdmissao"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Admissão</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="cargo"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Cargo</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {cargos.map((c) => (
                        <SelectItem key={c} value={c}>
                          {c}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {showVinculo && (
              <FormField
                control={form.control}
                name="profissionalVinculado"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Vincular a Profissional</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione..." />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {profissionais.map((p) => (
                          <SelectItem key={p.id} value={p.id}>
                            {p.nome}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="salario"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Salário Bruto</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        onChange={(e) =>
                          field.onChange(formatCurrency(parseCurrency(e.target.value)))
                        }
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="telefone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Telefone</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        onChange={(e) => field.onChange(maskPhone(e.target.value))}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>E-mail</FormLabel>
                  <FormControl>
                    <Input type="email" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="tipoContrato"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tipo de Contrato</FormLabel>
                  <FormControl>
                    <ToggleGroup
                      type="single"
                      value={field.value}
                      onValueChange={field.onChange}
                      className="justify-start"
                    >
                      <ToggleGroupItem value="clt" className="text-xs border">
                        CLT
                      </ToggleGroupItem>
                      <ToggleGroupItem value="pj" className="text-xs border">
                        PJ
                      </ToggleGroupItem>
                      <ToggleGroupItem value="estagio" className="text-xs border">
                        Estágio
                      </ToggleGroupItem>
                    </ToggleGroup>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="perfilAcesso"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Perfil de Acesso</FormLabel>
                  <FormControl>
                    <ToggleGroup
                      type="single"
                      value={field.value}
                      onValueChange={field.onChange}
                      className="justify-start flex-wrap"
                    >
                      <ToggleGroupItem
                        value="admin"
                        className="text-xs border data-[state=on]:bg-lavender-soft data-[state=on]:text-lavender"
                      >
                        Admin
                      </ToggleGroupItem>
                      <ToggleGroupItem
                        value="medico"
                        className="text-xs border data-[state=on]:bg-mint-soft data-[state=on]:text-mint"
                      >
                        Médico
                      </ToggleGroupItem>
                      <ToggleGroupItem
                        value="secretaria"
                        className="text-xs border data-[state=on]:bg-orange-50 data-[state=on]:text-orange-600"
                      >
                        Secretária
                      </ToggleGroupItem>
                      <ToggleGroupItem
                        value="financeiro"
                        className="text-xs border data-[state=on]:bg-blue-50 data-[state=on]:text-blue-600"
                      >
                        Financeiro
                      </ToggleGroupItem>
                    </ToggleGroup>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </form>
        </Form>
      </ScrollArea>

      <div className="p-6 border-t bg-gray-50/50">
        <Button type="submit" form="colab-form" className="w-full bg-lavender hover:bg-lavender/90">
          Salvar Colaborador
        </Button>
      </div>
    </SheetContent>
  )
}
