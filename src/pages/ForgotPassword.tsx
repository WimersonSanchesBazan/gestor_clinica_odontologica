import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '@/hooks/use-auth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ArrowLeft, CheckCircle2, Mail } from 'lucide-react'
import loginBgImage from '../assets/gestao-login-bg-v4-clean-row-b157a.png'

export default function ForgotPassword() {
  const [email, setEmail] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const { requestPasswordReset } = useAuth()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email) return

    setIsLoading(true)
    // Always call requestPasswordReset
    await requestPasswordReset(email)
    setIsLoading(false)

    // Security requirement: Always show the same generic response to prevent account enumeration
    setSubmitted(true)
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
            <Mail className="w-5 h-5" />
          </div>
          <div>
            <h1 className="font-display font-bold text-gray-900 text-lg leading-tight tracking-tight">
              Recuperação de Senha
            </h1>
            <p className="text-[9px] font-bold text-gray-500 tracking-widest mt-0.5 uppercase">
              Clínica Odontológica
            </p>
          </div>
        </div>

        {submitted ? (
          <div className="space-y-6 animate-fade-in">
            <div className="p-4 bg-emerald-50 border border-emerald-100 rounded-2xl flex items-start gap-3">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 mt-0.5 shrink-0" />
              <div className="text-sm text-emerald-900 space-y-1">
                <p className="font-semibold">Solicitação enviada com sucesso</p>
                <p className="text-xs text-emerald-800 leading-relaxed">
                  Se houver uma conta cadastrada com o e-mail informado, você receberá um link
                  seguro para redefinir sua senha. Verifique sua caixa de entrada e pasta de spam.
                </p>
              </div>
            </div>

            <p className="text-xs text-gray-500 text-center">
              O link gerado é de uso único e expira automaticamente em 60 minutos por segurança.
            </p>

            <Link to="/login" className="block">
              <Button
                variant="outline"
                className="w-full h-12 rounded-xl border-gray-200 text-gray-700 hover:bg-gray-100 flex items-center justify-center gap-2"
              >
                <ArrowLeft className="w-4 h-4" />
                Voltar para o Login
              </Button>
            </Link>
          </div>
        ) : (
          <div>
            <h2 className="text-2xl font-display font-bold text-gray-900 leading-[1.2] mb-2 tracking-tight">
              Esqueceu sua senha?
            </h2>
            <p className="text-gray-500 text-sm mb-6 leading-relaxed">
              Informe seu e-mail cadastrado. Enviaremos as instruções de recuperação com token de
              uso único.
            </p>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-2">
                <Label
                  htmlFor="email"
                  className="text-[10px] font-bold text-gray-500 tracking-wider uppercase"
                >
                  E-mail cadastrado
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

              <Button
                type="submit"
                className="w-full bg-[#8b7fb8] hover:bg-[#7a6ea6] text-white h-12 rounded-xl transition-all text-sm font-semibold shadow-sm"
                disabled={isLoading}
              >
                {isLoading ? 'Enviando...' : 'Enviar Link de Redefinição'}
              </Button>

              <div className="pt-2 text-center">
                <Link
                  to="/login"
                  className="inline-flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-800 transition-colors font-medium"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  Voltar ao Login
                </Link>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  )
}
