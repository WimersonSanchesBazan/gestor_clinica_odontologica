import { z } from 'zod'

export const colaboradorSchema = z.object({
  nome: z.string().min(3, 'Mínimo de 3 caracteres'),
  cpf: z.string().regex(/^\d{3}\.\d{3}\.\d{3}-\d{2}$/, 'CPF inválido'),
  cargo: z.enum([
    'Médico',
    'Dentista',
    'Fisioterapeuta',
    'Secretária',
    'Enfermeiro',
    'Psicólogo',
    'Recepcionista',
    'Gerente',
    'Outros',
  ]),
  tipoContrato: z.enum(['clt', 'pj', 'estagio']),
  dataAdmissao: z.string().min(1, 'Obrigatório'),
  salario: z.string().min(1, 'Obrigatório'), // Handled as string in form for masking
  perfilAcesso: z.enum(['admin', 'medico', 'secretaria', 'financeiro']),
  email: z.string().email('E-mail inválido').optional().or(z.literal('')),
  telefone: z.string().optional().or(z.literal('')),
  ativo: z.boolean().optional(),
  profissionalVinculado: z.string().optional(),
})

export type ColaboradorFormData = z.infer<typeof colaboradorSchema>
