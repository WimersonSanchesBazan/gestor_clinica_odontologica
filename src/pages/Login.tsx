import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '@/hooks/use-auth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import { Stethoscope, UserCheck } from 'lucide-react'
import loginBgImage from '../assets/gestao-login-bg-v4-clean-row-b157a.png'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const { signIn } = useAuth()
  const navigate = useNavigate()

  const handleDemoLogin = async () => {
    setIsLoading(true)
    const { error } = await signIn('demo@clinicapro.com.br', 'demo@password123')
    setIsLoading(false)

    if (error) {
      toast.error('Erro ao acessar o modo demo. Tente novamente.')
    } else {
      toast.success('Bem-vindo ao modo demonstração!')
      navigate('/')
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!email || !password) {
      toast.error('Preencha todos os campos para continuar.')
      return
    }

    setIsLoading(true)
    const { error } = await signIn(email, password)
    setIsLoading(false)

    if (error) {
      toast.error('Credenciais inválidas. Verifique seu e-mail e senha e tente novamente.')
    } else {
      toast.success('Bem-vindo de volta!')
      navigate('/')
    }
  }

  return (
    <div
      className="min-h-screen w-full flex items-center justify-center lg:justify-start bg-cover bg-center bg-no-repeat font-sans px-4 sm:px-8 md:px-12 lg:px-24 xl:px-32"
      style={{ backgroundImage: `url(${loginBgImage})` }}
    >
      {/* Floating Login Container */}
      <div className="w-full max-w-[420px] bg-[#f8f9fa] rounded-[28px] p-8 sm:p-10 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.15)]">
        {/* Logo and App Name */}
        <div className="flex items-center gap-3 mb-8">
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
        <h2 className="text-[28px] font-display font-bold text-gray-900 leading-[1.2] mb-3 tracking-tight">
          Sistema pronto para Gestão da sua Clínica
        </h2>
        <p className="text-gray-500 text-sm mb-8 leading-relaxed">
          Entre com suas credenciais para acessar o painel.
        </p>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-2">
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
              className="bg-[#f0f4f8] border-transparent focus-visible:ring-[#8b7fb8] focus-visible:bg-white h-12 text-sm rounded-xl transition-all"
              required
            />
          </div>
          <div className="space-y-2">
            <Label
              htmlFor="password"
              className="text-[10px] font-bold text-gray-500 tracking-wider uppercase"
            >
              Senha
            </Label>
            <Input
              id="password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="bg-[#f0f4f8] border-transparent focus-visible:ring-[#8b7fb8] focus-visible:bg-white h-12 text-sm rounded-xl transition-all"
              required
            />
          </div>
          <Button
            type="submit"
            className="w-full bg-[#8b7fb8] hover:bg-[#7a6ea6] text-white h-12 rounded-xl transition-all text-sm font-semibold mt-2 shadow-sm"
            disabled={isLoading}
          >
            {isLoading ? 'Acessando...' : 'Acessar Painel'}
          </Button>

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-gray-200" />
            </div>
            <div className="relative flex justify-center text-[10px] uppercase font-bold tracking-wider">
              <span className="bg-[#f8f9fa] px-2 text-gray-400">Ou</span>
            </div>
          </div>

          <Button
            type="button"
            variant="outline"
            onClick={handleDemoLogin}
            className="w-full h-12 rounded-xl transition-all text-sm font-semibold border border-gray-200 text-gray-700 hover:bg-gray-50 flex items-center justify-center gap-2"
            disabled={isLoading}
          >
            <UserCheck className="w-4 h-4" />
            Entrar como Demo
          </Button>
        </form>

        {/* Navigation Link */}
        <div className="mt-8 text-center">
          <p className="text-sm text-gray-500">
            Novo por aqui?{' '}
            <Link
              to="/register"
              className="text-[#8b7fb8] font-semibold hover:text-[#7a6ea6] transition-colors"
            >
              Cadastre-se
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
