import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '@/hooks/use-auth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import { Eye, EyeOff, ShieldCheck } from 'lucide-react'
import loginBgImage from '../assets/gestao-login-bg-v4-clean-row-b157a.png'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const { signIn } = useAuth()
  const navigate = useNavigate()

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
      const msg = error.message || ''
      if (msg.includes('inativa')) {
        toast.error('Esta conta de usuário está inativa. Entre em contato com a administração.')
      } else {
        toast.error('Credenciais inválidas. Verifique seu e-mail e senha e tente novamente.')
      }
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
            {/* Tooth / Dental Icon SVG */}
            <svg
              className="w-5 h-5"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M12 2C7.5 2 4 4.5 4 8c0 2.5 1 4.5 2 7l1 5c.5 1.5 2 2 3 2s2-.5 2-2l.5-4h-.5c.8 0 1.2-.5 1.2-1 0 .5.4 1 1.2 1h-.5l.5 4c0 1.5 1 2 2 2s2.5-.5 3-2l1-5c1-2.5 2-4.5 2-7 0-3.5-3.5-6-8-6z" />
            </svg>
          </div>
          <div>
            <h1 className="font-display font-bold text-gray-900 text-lg leading-tight tracking-tight">
              OdontoGestão
            </h1>
            <p className="text-[9px] font-bold text-gray-500 tracking-widest mt-0.5 uppercase">
              Clínica Odontológica
            </p>
          </div>
        </div>

        {/* Headings */}
        <h2 className="text-[26px] font-display font-bold text-gray-900 leading-[1.2] mb-3 tracking-tight">
          Gestão Odontológica Profissional
        </h2>
        <p className="text-gray-500 text-sm mb-8 leading-relaxed">
          Entre com suas credenciais para acessar o painel clínico e administrativo.
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
              placeholder="seu.email@clinica.com.br"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="bg-[#f0f4f8] border-transparent focus-visible:ring-[#8b7fb8] focus-visible:bg-white h-12 text-sm rounded-xl transition-all"
              required
            />
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label
                htmlFor="password"
                className="text-[10px] font-bold text-gray-500 tracking-wider uppercase"
              >
                Senha
              </Label>
              <Link
                to="/esqueci-senha"
                className="text-xs text-[#8b7fb8] hover:text-[#7a6ea6] font-medium transition-colors"
              >
                Esqueci minha senha
              </Link>
            </div>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? 'text' : 'password'}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="bg-[#f0f4f8] border-transparent focus-visible:ring-[#8b7fb8] focus-visible:bg-white h-12 text-sm rounded-xl transition-all pr-10"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 focus:outline-none"
                tabIndex={-1}
                aria-label={showPassword ? 'Ocultar senha' : 'Exibir senha'}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <Button
            type="submit"
            className="w-full bg-[#8b7fb8] hover:bg-[#7a6ea6] text-white h-12 rounded-xl transition-all text-sm font-semibold mt-2 shadow-sm"
            disabled={isLoading}
          >
            {isLoading ? 'Autenticando...' : 'Acessar Painel'}
          </Button>

          <div className="pt-2 text-center flex items-center justify-center gap-1.5 text-xs text-gray-400">
            <ShieldCheck className="w-3.5 h-3.5 text-[#8b7fb8]" />
            <span>Ambiente com controle de acesso e auditoria</span>
          </div>
        </form>

        {/* Navigation Link */}
        <div className="mt-8 text-center pt-4 border-t border-gray-100">
          <p className="text-sm text-gray-500">
            Primeiro acesso na clínica?{' '}
            <Link
              to="/register"
              className="text-[#8b7fb8] font-semibold hover:text-[#7a6ea6] transition-colors"
            >
              Criar conta
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
