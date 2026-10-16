import { useState } from 'react'
import { useNavigate, useSearchParams, Link } from 'react-router-dom'
import { useAuth } from '@/hooks/use-auth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import { KeyRound, Eye, EyeOff, CheckCircle2, AlertTriangle } from 'lucide-react'
import loginBgImage from '../assets/gestao-login-bg-v4-clean-row-b157a.png'

export default function ResetPassword() {
  const [searchParams] = useSearchParams()
  const token = searchParams.get('token') || ''

  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)

  const { confirmPasswordReset } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!token) {
      toast.error('Token de recuperação não encontrado ou link inválido.')
      return
    }

    if (password.length < 8) {
      toast.error('A nova senha deve ter no mínimo 8 caracteres.')
      return
    }

    if (password !== confirmPassword) {
      toast.error('A confirmação de senha não coincide com a nova senha.')
      return
    }

    setIsLoading(true)
    const { error } = await confirmPasswordReset(token, password)
    setIsLoading(false)

    if (error) {
      toast.error(
        'Não foi possível redefinir sua senha. O link pode ter expirado ou já ter sido utilizado.',
      )
    } else {
      setIsSuccess(true)
      toast.success('Senha atualizada com sucesso! Redirecionando para login...')
      setTimeout(() => {
        navigate('/login', { replace: true })
      }, 2500)
    }
  }

  return (
    <div
      className="min-h-screen w-full flex items-center justify-center lg:justify-start bg-cover bg-center bg-no-repeat font-sans px-4 sm:px-8 md:px-12 lg:px-24 xl:px-32"
      style={{ backgroundImage: `url(${loginBgImage})` }}
    >
      <div className="w-full max-w-[420px] bg-[#f8f9fa] rounded-[28px] p-8 sm:p-10 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.15)]">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-[12px] bg-white border border-gray-100 flex items-center justify-center text-[#8b7fb8] shadow-sm">
            <KeyRound className="w-5 h-5" />
          </div>
          <div>
            <h1 className="font-display font-bold text-gray-900 text-lg leading-tight tracking-tight">
              Nova Senha
            </h1>
            <p className="text-[9px] font-bold text-gray-500 tracking-widest mt-0.5 uppercase">
              Redefinição Segura
            </p>
          </div>
        </div>

        {!token ? (
          <div className="space-y-4">
            <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-amber-600 mt-0.5 shrink-0" />
              <div className="text-sm text-amber-900 space-y-1">
                <p className="font-semibold">Link de recuperação inválido</p>
                <p className="text-xs text-amber-800 leading-relaxed">
                  Não localizamos o token de recuperação nesta URL. Certifique-se de ter clicado no
                  link completo recebido por e-mail.
                </p>
              </div>
            </div>
            <Link to="/esqueci-senha" className="block">
              <Button className="w-full bg-[#8b7fb8] hover:bg-[#7a6ea6] text-white rounded-xl h-11">
                Solicitar novo link
              </Button>
            </Link>
          </div>
        ) : isSuccess ? (
          <div className="space-y-4 animate-fade-in text-center">
            <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-2">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <h2 className="text-xl font-bold text-gray-900">Senha Alterada!</h2>
            <p className="text-sm text-gray-500">
              Sua senha foi redefinida com sucesso. Por segurança, você será direcionado para a tela
              de login para autenticar com suas novas credenciais.
            </p>
            <Link to="/login" className="block pt-2">
              <Button className="w-full bg-[#8b7fb8] hover:bg-[#7a6ea6] text-white rounded-xl h-11">
                Ir para o Login agora
              </Button>
            </Link>
          </div>
        ) : (
          <div>
            <h2 className="text-2xl font-display font-bold text-gray-900 leading-[1.2] mb-2 tracking-tight">
              Crie sua nova senha
            </h2>
            <p className="text-gray-500 text-sm mb-6 leading-relaxed">
              Defina uma senha forte de pelo menos 8 caracteres para garantir a segurança da
              clínica.
            </p>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <Label
                  htmlFor="password"
                  className="text-[10px] font-bold text-gray-500 tracking-wider uppercase"
                >
                  Nova Senha
                </Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Mínimo 8 caracteres"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="bg-[#f0f4f8] border-transparent focus-visible:ring-[#8b7fb8] focus-visible:bg-white h-11 text-sm rounded-xl transition-all pr-10"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 focus:outline-none"
                    tabIndex={-1}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="space-y-1.5">
                <Label
                  htmlFor="confirmPassword"
                  className="text-[10px] font-bold text-gray-500 tracking-wider uppercase"
                >
                  Confirme a Nova Senha
                </Label>
                <Input
                  id="confirmPassword"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Repita a nova senha"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="bg-[#f0f4f8] border-transparent focus-visible:ring-[#8b7fb8] focus-visible:bg-white h-11 text-sm rounded-xl transition-all"
                  required
                />
              </div>

              <Button
                type="submit"
                className="w-full bg-[#8b7fb8] hover:bg-[#7a6ea6] text-white h-12 rounded-xl transition-all text-sm font-semibold shadow-sm mt-2"
                disabled={isLoading}
              >
                {isLoading ? 'Redefinindo...' : 'Salvar Nova Senha'}
              </Button>
            </form>
          </div>
        )}
      </div>
    </div>
  )
}
