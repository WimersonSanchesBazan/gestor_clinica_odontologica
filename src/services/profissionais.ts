import pb from '@/lib/pocketbase/client'

export interface Profissional {
  id: string
  nome: string
  especialidade: string
  created: string
  updated: string
}

export const getProfissionais = () =>
  pb.collection('profissionais').getFullList<Profissional>({ sort: 'nome' })
