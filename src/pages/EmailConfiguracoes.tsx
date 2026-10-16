import { useState, useEffect } from 'react'
import pb from '@/lib/pocketbase/client'
import {
  Mail,
  ShieldCheck,
  Send,
  CheckCircle2,
  AlertTriangle,
  Server,
  Lock,
  Globe,
  RefreshCw,
} from 'lucide-react'
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import { format } from 'date-fns'

interface EmailSettingsRecord {
  id?: string
  provider: 'gmail' | 'smtp' | 'skip_cloud'
  senderName: string
  senderEmail: string
  smtpHost?: string
  smtpPort?: number
  security?: 'starttls' | 'ssl' | 'none'
  smtpUser?: string
  hasAppPassword?: boolean
  publicAppUrl?: string
  lastTestedAt?: string
  lastTestStatus?: string
}

export default function EmailConfiguracoes() {
  const [settings, setSettings] = useState<EmailSettingsRecord>({
    provider: 'skip_cloud',
    senderName: 'Clínica Odontológica',
    senderEmail: 'contato@clinicaodontologica.com.br',
    smtpHost: 'smtp.gmail.com',
    smtpPort: 587,
    security: 'starttls',
    smtpUser: '',
    hasAppPassword: true,
    publicAppUrl: window.location.origin,
  })
  const [loading, setLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isTesting, setIsTesting] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [testEmailRecipient, setTestEmailRecipient] = useState('')

  // Form State inside Modal
  const [formProvider, setFormProvider] = useState<'gmail' | 'smtp' | 'skip_cloud'>('gmail')
  const [formSenderName, setFormSenderName] = useState('Clínica Odontológica')
  const [formSenderEmail, setFormSenderEmail] = useState('')
  const [formSmtpHost, setFormSmtpHost] = useState('smtp.gmail.com')
  const [formSmtpPort, setFormSmtpPort] = useState('587')
  const [formSecurity, setFormSecurity] = useState<'starttls' | 'ssl' | 'none'>('starttls')
  const [formSmtpUser, setFormSmtpUser] = useState('')
  const [formAppPassword, setFormAppPassword] = useState('')
  const [formPublicAppUrl, setFormPublicAppUrl] = useState(window.location.origin)

  const loadSettings = async () => {
    setLoading(true)
    try {
      const records = await pb.collection('email_settings').getFullList<EmailSettingsRecord>({
        sort: '-created',
        limit: 1,
      })
      if (records.length > 0) {
        setSettings(records[0])
      }
    } catch (err) {
      console.error('Configuração de e-mail não encontrada ou ainda não criada:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadSettings()
  }, [])

  const handleOpenModal = () => {
    setFormProvider(settings.provider || 'gmail')
    setFormSenderName(settings.senderName || 'Clínica Odontológica')
    setFormSenderEmail(settings.senderEmail || '')
    setFormSmtpHost(settings.smtpHost || 'smtp.gmail.com')
    setFormSmtpPort(String(settings.smtpPort || 587))
    setFormSecurity(settings.security || 'starttls')
    setFormSmtpUser(settings.smtpUser || '')
    setFormAppPassword('') // Never reveal stored password!
    setFormPublicAppUrl(settings.publicAppUrl || window.location.origin)
    setIsModalOpen(true)
  }

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSaving(true)

    try {
      const payload: Partial<EmailSettingsRecord> = {
        provider: formProvider,
        senderName: formSenderName,
        senderEmail: formSenderEmail,
        smtpHost: formSmtpHost,
        smtpPort: Number(formSmtpPort) || 587,
        security: formSecurity,
        smtpUser: formSmtpUser,
        hasAppPassword: formAppPassword ? true : settings.hasAppPassword,
        publicAppUrl: formPublicAppUrl,
      }

      if (settings.id) {
        const updated = await pb
          .collection('email_settings')
          .update<EmailSettingsRecord>(settings.id, payload)
        setSettings(updated)
      } else {
        const created = await pb.collection('email_settings').create<EmailSettingsRecord>(payload)
        setSettings(created)
      }

      toast.success('Configurações de e-mail salvas com sucesso!')
      setIsModalOpen(false)
    } catch (err: any) {
      console.error(err)
      toast.error('Erro ao salvar configurações de e-mail.')
    } finally {
      setIsSaving(false)
    }
  }

  const handleSendTestEmail = async () => {
    if (!testEmailRecipient) {
      toast.error('Informe o e-mail de destino para o teste.')
      return
    }

    setIsTesting(true)
    try {
      const res = await pb.send<{ success: boolean; message: string }>(
        '/backend/v1/custom/test-email',
        {
          method: 'POST',
          body: {
            targetEmail: testEmailRecipient,
            provider: settings.provider,
            senderName: settings.senderName,
            senderEmail: settings.senderEmail,
          },
        },
      )

      if (res.success) {
        toast.success(res.message || 'E-mail de teste disparado com sucesso!')
        if (settings.id) {
          await pb.collection('email_settings').update(settings.id, {
            lastTestedAt: new Date().toISOString(),
            lastTestStatus: 'Sucesso: e-mail entregue ao servidor de envio',
          })
          loadSettings()
        }
      } else {
        toast.error(res.message || 'Falha ao enviar e-mail de teste.')
      }
    } catch (err: any) {
      console.error(err)
      toast.error(
        err.message || 'Falha de comunicação ou autenticação ao enviar o e-mail de teste.',
      )
    } finally {
      setIsTesting(false)
    }
  }

  return (
    <div className="flex flex-col gap-6 animate-fade-in pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-mono text-lavender font-semibold tracking-wider uppercase">
              Configurações do Sistema · Mensageria
            </span>
          </div>
          <h1 className="text-3xl font-display font-bold text-gray-900 tracking-tight">
            E-mail e Recuperação de Senha
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Configure o canal de envio de e-mails transacionais para recuperação de senhas e avisos.
          </p>
        </div>

        <Button
          onClick={handleOpenModal}
          className="bg-lavender hover:bg-lavender/90 text-white shadow-sm"
        >
          <Server className="w-4 h-4 mr-2" />
          Configurar E-mail
        </Button>
      </div>

      {/* Security Banner regarding Gmail App Passwords & Secrets */}
      <div className="bg-blue-50/70 border border-blue-200 rounded-xl p-4 flex items-start gap-3.5 text-xs text-blue-900">
        <ShieldCheck className="w-5 h-5 text-blue-600 mt-0.5 shrink-0" />
        <div className="space-y-1">
          <p className="font-semibold text-blue-950">
            Boas Práticas de Segurança e Envio Confiável
          </p>
          <p className="text-blue-800 leading-relaxed">
            Nunca utilize a senha comum da sua conta Google ou pessoal. Para o Gmail, gere uma{' '}
            <strong>Senha de Aplicativo (16 dígitos)</strong> no painel de segurança do Google. O
            sistema armazena as credenciais de forma segura e nunca exibe o segredo no frontend após
            salvo. Os links de recuperação utilizam o endereço público da clínica com expiração de
            60 minutos e uso único.
          </p>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Current Active Configuration Card */}
        <Card className="border-gray-200 shadow-sm bg-white">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-base font-semibold text-gray-900 flex items-center gap-2">
                <Mail className="w-4 h-4 text-lavender" />
                Provedor de E-mail Atual
              </CardTitle>
              <Badge
                variant="outline"
                className="bg-lavender-soft text-lavender border-lavender/20 uppercase font-mono text-[10px]"
              >
                {settings.provider === 'gmail'
                  ? 'Gmail SMTP'
                  : settings.provider === 'smtp'
                    ? 'SMTP Personalizado'
                    : 'Skip Cloud Transacional'}
              </Badge>
            </div>
            <CardDescription className="text-xs">
              Status das configurações de envio da clínica
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-4 text-sm">
            <div className="divide-y divide-gray-100">
              <div className="py-2.5 flex justify-between items-center">
                <span className="text-gray-500 text-xs">Nome do Remetente</span>
                <span className="font-medium text-gray-900">{settings.senderName}</span>
              </div>
              <div className="py-2.5 flex justify-between items-center">
                <span className="text-gray-500 text-xs">E-mail Remetente</span>
                <span className="font-medium text-gray-900">
                  {settings.senderEmail || 'Não definido'}
                </span>
              </div>
              <div className="py-2.5 flex justify-between items-center">
                <span className="text-gray-500 text-xs">Servidor SMTP</span>
                <span className="font-mono text-xs text-gray-900">
                  {settings.smtpHost}:{settings.smtpPort} ({settings.security?.toUpperCase()})
                </span>
              </div>
              <div className="py-2.5 flex justify-between items-center">
                <span className="text-gray-500 text-xs">Credencial de Aplicativo</span>
                <span className="text-xs flex items-center gap-1 font-medium text-emerald-700">
                  <Lock className="w-3.5 h-3.5 text-emerald-600" />
                  {settings.hasAppPassword ? 'Configurada com segurança' : 'Pendente'}
                </span>
              </div>
              <div className="py-2.5 flex justify-between items-center">
                <span className="text-gray-500 text-xs">URL Pública (Links de Redefinição)</span>
                <span className="font-mono text-xs text-gray-600 max-w-[220px] truncate">
                  {settings.publicAppUrl || window.location.origin}
                </span>
              </div>
            </div>

            <div className="pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleOpenModal}
                className="w-full text-xs"
              >
                Editar Parâmetros de E-mail
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Test Email Card */}
        <Card className="border-gray-200 shadow-sm bg-white">
          <CardHeader>
            <CardTitle className="text-base font-semibold text-gray-900 flex items-center gap-2">
              <Send className="w-4 h-4 text-lavender" />
              Testar Conexão e Envio Real
            </CardTitle>
            <CardDescription className="text-xs">
              Valide se o servidor consegue entregar mensagens reais sem simulações
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-4 text-sm">
            <p className="text-xs text-gray-600">
              Envie uma mensagem de teste para verificar a integridade da conexão, resolução DNS e
              autorização do remetente. O resultado será registrado no log de auditoria.
            </p>

            <div className="space-y-1.5">
              <Label htmlFor="test-dest" className="text-xs font-semibold text-gray-700">
                E-mail Destinatário de Teste
              </Label>
              <Input
                id="test-dest"
                type="email"
                placeholder="seu.email@exemplo.com"
                value={testEmailRecipient}
                onChange={(e) => setTestEmailRecipient(e.target.value)}
                className="h-10 text-sm"
              />
            </div>

            <Button
              onClick={handleSendTestEmail}
              disabled={isTesting || !testEmailRecipient}
              className="w-full bg-[#8b7fb8] hover:bg-[#7a6ea6] text-white h-10 text-xs font-semibold"
            >
              {isTesting ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 mr-2 animate-spin" />
                  Conectando e Enviando...
                </>
              ) : (
                <>
                  <Send className="w-3.5 h-3.5 mr-2" />
                  Enviar E-mail de Teste
                </>
              )}
            </Button>

            {settings.lastTestedAt && (
              <div className="p-3 bg-gray-50 border border-gray-100 rounded-lg text-xs space-y-1">
                <div className="flex items-center justify-between font-medium text-gray-700">
                  <span>Último Teste:</span>
                  <span>{format(new Date(settings.lastTestedAt), 'dd/MM/yyyy HH:mm')}</span>
                </div>
                <p className="text-gray-500 text-[11px] truncate">{settings.lastTestStatus}</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Configuration Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Configurar Mensageria e Servidor de E-mail</DialogTitle>
            <DialogDescription>
              Defina as credenciais para envio de e-mails transacionais e recuperação de senhas.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSaveSettings} className="space-y-4 py-2">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5 sm:col-span-2">
                <Label>Provedor de E-mail</Label>
                <Select
                  value={formProvider}
                  onValueChange={(val: any) => {
                    setFormProvider(val)
                    if (val === 'gmail') {
                      setFormSmtpHost('smtp.gmail.com')
                      setFormSmtpPort('587')
                      setFormSecurity('starttls')
                    }
                  }}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="gmail">Google Gmail (Senha de Aplicativo)</SelectItem>
                    <SelectItem value="smtp">Servidor SMTP Personalizado</SelectItem>
                    <SelectItem value="skip_cloud">Skip Cloud Transacional Nativo</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="f-name">Nome do Remetente</Label>
                <Input
                  id="f-name"
                  value={formSenderName}
                  onChange={(e) => setFormSenderName(e.target.value)}
                  placeholder="Ex: Clínica OdontoPro"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="f-sender">E-mail Remetente</Label>
                <Input
                  id="f-sender"
                  type="email"
                  value={formSenderEmail}
                  onChange={(e) => setFormSenderEmail(e.target.value)}
                  placeholder="contato@clinica.com.br"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="f-host">Servidor SMTP</Label>
                <Input
                  id="f-host"
                  value={formSmtpHost}
                  onChange={(e) => setFormSmtpHost(e.target.value)}
                  placeholder="smtp.gmail.com"
                  disabled={formProvider === 'skip_cloud'}
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1.5">
                  <Label htmlFor="f-port">Porta</Label>
                  <Input
                    id="f-port"
                    value={formSmtpPort}
                    onChange={(e) => setFormSmtpPort(e.target.value)}
                    placeholder="587"
                    disabled={formProvider === 'skip_cloud'}
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <Label>Segurança</Label>
                  <Select
                    value={formSecurity}
                    onValueChange={(val: any) => setFormSecurity(val)}
                    disabled={formProvider === 'skip_cloud'}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="starttls">STARTTLS</SelectItem>
                      <SelectItem value="ssl">SSL / TLS</SelectItem>
                      <SelectItem value="none">Nenhuma</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-1.5 sm:col-span-2">
                <Label htmlFor="f-user">Usuário SMTP / Conta Google</Label>
                <Input
                  id="f-user"
                  value={formSmtpUser}
                  onChange={(e) => setFormSmtpUser(e.target.value)}
                  placeholder="exemplo@gmail.com"
                  disabled={formProvider === 'skip_cloud'}
                />
              </div>

              <div className="space-y-1.5 sm:col-span-2">
                <Label htmlFor="f-pass">
                  {formProvider === 'gmail'
                    ? 'Senha de Aplicativo do Google (16 caracteres)'
                    : 'Senha do Servidor SMTP'}
                </Label>
                <Input
                  id="f-pass"
                  type="password"
                  value={formAppPassword}
                  onChange={(e) => setFormAppPassword(e.target.value)}
                  placeholder={
                    settings.hasAppPassword
                      ? '•••••••••••••••• (deixe em branco para manter a senha atual)'
                      : 'Digite a senha de aplicativo'
                  }
                  disabled={formProvider === 'skip_cloud'}
                />
                <p className="text-[11px] text-gray-500">
                  Por razões de segurança, a senha salva nunca é reexibida. Preencha apenas se
                  desejar substituir.
                </p>
              </div>

              <div className="space-y-1.5 sm:col-span-2">
                <Label htmlFor="f-url">URL Pública da Aplicação (Links de Redefinição)</Label>
                <Input
                  id="f-url"
                  value={formPublicAppUrl}
                  onChange={(e) => setFormPublicAppUrl(e.target.value)}
                  placeholder="https://suaclinica.goskip.app"
                  required
                />
                <p className="text-[11px] text-gray-500">
                  Os links enviados por e-mail utilizarão este endereço base para abrir a tela de
                  nova senha com o token seguro.
                </p>
              </div>
            </div>

            <DialogFooter className="pt-4 border-t border-gray-100">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsModalOpen(false)}
                disabled={isSaving}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                className="bg-lavender hover:bg-lavender/90 text-white"
                disabled={isSaving}
              >
                {isSaving ? 'Salvando...' : 'Salvar Configuração'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
