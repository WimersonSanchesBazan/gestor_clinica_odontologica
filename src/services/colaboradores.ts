import pb from '@/lib/pocketbase/client'

export interface Colaborador {
  id: string
  nome: string
  cpf: string
  cargo: string
  tipoContrato: 'clt' | 'pj' | 'estagio'
  dataAdmissao: string
  salario: number
  perfilAcesso: 'admin' | 'medico' | 'secretaria' | 'financeiro'
  email?: string
  telefone?: string
  ativo: boolean
  profissionalVinculado?: string
  created: string
  updated: string
}

export const getColaboradores = () =>
  pb.collection('colaboradores').getFullList<Colaborador>({ sort: '-created' })

export const createColaborador = (data: Partial<Colaborador>) =>
  pb.collection('colaboradores').create<Colaborador>(data)

export const updateColaborador = (id: string, data: Partial<Colaborador>) =>
  pb.collection('colaboradores').update<Colaborador>(id, data)

export const deleteColaborador = (id: string) => pb.collection('colaboradores').delete(id)
