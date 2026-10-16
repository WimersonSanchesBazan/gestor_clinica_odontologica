import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '@/hooks/use-auth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import { Stethoscope } from 'lucide-react'
import { extractFieldErrors } from '@/lib/pocketbase/errors'
import loginBgImage from '../assets/gestao-login-bg-v4-clean-row-b157a.png'

export default function Register() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})

  const { signUp } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setFieldErrors({})

    if (!name || !email || !password || !confirmPassword) {
      toast.error('Preencha todos os campos obrigatórios.')
      return
    }

    if (password !== confirmPassword) {
      setFieldErrors({ confirmPassword: 'As senhas não coincidem.' })
      return
    }

    if (password.length < 8) {
      setFieldErrors({ password: 'A senha deve ter pelo menos 8 caracteres.' })
      return
    }

    setIsLoading(true)
    const { error } = await signUp(email, password, name)
    setIsLoading(false)

    if (error) {
      const extractedErrors = extractFieldErrors(error)
      if (Object.keys(extractedErrors).length > 0) {
        setFieldErrors(extractedErrors)
        toast.error('Verifique os erros nos campos informados.')
      } else {
        toast.error('Ocorreu um erro inesperado ao criar a conta. Tente novamente.')
      }
    } else {
      toast.success('Conta criada com sucesso! Bem-vindo(a) à plataforma.')
      navigate('/')
    }
  }

  return (
    <div
      className="min-h-screen w-full flex items-center justify-center lg:justify-start bg-cover bg-center bg-no-repeat font-sans px-4 sm:px-8 md:px-12 lg:px-24 xl:px-32 py-8"
      style={{ backgroundImage: `url(${loginBgImage})` }}
    >
      {/* Floating Login Container */}
      <div className="w-full max-w-[420px] bg-[#f8f9fa] rounded-[28px] p-8 sm:p-10 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.15)] max-h-full overflow-y-auto">
        {/* Logo and App Name */}
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-[12px] bg-white border border-gray-100 flex items-center justify-center text-[#8b7fb8] shadow-sm">
            <Stethoscope className="w-5 h-5" strokeWidth={2} />
          </div>
          <div>
            <h1 className="font-display font-bold text-gray-900 text-lg leading-tight tracking-tight">
              ClínicaPro
            </h1>
            <p className="text-[9px] font-bold text-gray-500 tracking-widest mt-0.5 uppercase">
              Sistema de Gestão
            </p>
          </div>
        </div>

        {/* Headings */}
        <h2 className="text-[26px] font-display font-bold text-gray-900 leading-[1.2] mb-2 tracking-tight">
          Crie sua conta na ClínicaPro
        </h2>
        <p className="text-gray-500 text-sm mb-6 leading-relaxed">
          Preencha os dados abaixo para iniciar sua jornada.
        </p>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label
              htmlFor="name"
              className="text-[10px] font-bold text-gray-500 tracking-wider uppercase"
            >
              Nome Completo
            </Label>
            <Input
              id="name"
              type="text"
              placeholder="Ex: João da Silva"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className={`bg-[#f0f4f8] border-transparent focus-visible:ring-[#8b7fb8] focus-visible:bg-white h-11 text-sm rounded-xl transition-all ${fieldErrors.name ? 'border-red-300 focus-visible:ring-red-500 bg-red-50' : ''}`}
              required
            />
            {fieldErrors.name && (
              <p className="text-xs text-red-500 font-medium mt-1">{fieldErrors.name}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label
              htmlFor="email"
              className="text-[10px] font-bold text-gray-500 tracking-wider uppercase"
            >
              E-mail
            </Label>
            <Input
              id="email"
              type="email"
              placeholder="seu@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={`bg-[#f0f4f8] border-transparent focus-visible:ring-[#8b7fb8] focus-visible:bg-white h-11 text-sm rounded-xl transition-all ${fieldErrors.email ? 'border-red-300 focus-visible:ring-red-500 bg-red-50' : ''}`}
              required
            />
            {fieldErrors.email && (
              <p className="text-xs text-red-500 font-medium mt-1">{fieldErrors.email}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label
              htmlFor="password"
              className="text-[10px] font-bold text-gray-500 tracking-wider uppercase"
            >
              Senha
            </Label>
            <Input
              id="password"
              type="password"
              placeholder="Mínimo 8 caracteres"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={`bg-[#f0f4f8] border-transparent focus-visible:ring-[#8b7fb8] focus-visible:bg-white h-11 text-sm rounded-xl transition-all ${fieldErrors.password ? 'border-red-300 focus-visible:ring-red-500 bg-red-50' : ''}`}
              required
            />
            {fieldErrors.password && (
              <p className="text-xs text-red-500 font-medium mt-1">{fieldErrors.password}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label
              htmlFor="confirmPassword"
              className="text-[10px] font-bold text-gray-500 tracking-wider uppercase"
            >
              Confirmar Senha
            </Label>
            <Input
              id="confirmPassword"
              type="password"
              placeholder="Repita sua senha"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className={`bg-[#f0f4f8] border-transparent focus-visible:ring-[#8b7fb8] focus-visible:bg-white h-11 text-sm rounded-xl transition-all ${fieldErrors.confirmPassword ? 'border-red-300 focus-visible:ring-red-500 bg-red-50' : ''}`}
              required
            />
            {fieldErrors.confirmPassword && (
              <p className="text-xs text-red-500 font-medium mt-1">{fieldErrors.confirmPassword}</p>
            )}
          </div>

          <Button
            type="submit"
            className="w-full bg-[#8b7fb8] hover:bg-[#7a6ea6] text-white h-12 rounded-xl transition-all text-sm font-semibold mt-4 shadow-sm"
            disabled={isLoading}
          >
            {isLoading ? 'Criando conta...' : 'Cadastrar'}
          </Button>
        </form>

        {/* Navigation Link */}
        <div className="mt-6 text-center">
          <p className="text-sm text-gray-500">
            Já possui uma conta?{' '}
            <Link
              to="/login"
              className="text-[#8b7fb8] font-semibold hover:text-[#7a6ea6] transition-colors"
            >
              Faça login
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
