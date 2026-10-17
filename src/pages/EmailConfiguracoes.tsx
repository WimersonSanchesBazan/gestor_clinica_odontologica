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
        toast.success(res.message || 'Envio aceito pelo serviço gerenciado da instância.')
        if (settings.id) {
          await pb.collection('email_settings').update(settings.id, {
            lastTestedAt: new Date().toISOString(),
            lastTestStatus:
              'Envio aceito pelo serviço (teste de entrega real depende do mailer configurado na instância)',
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
            Painel informativo de parâmetros de remetente e testes de entrega de e-mails
            transacionais.
          </p>
        </div>

        <Button
          onClick={handleOpenModal}
          className="bg-lavender hover:bg-lavender/90 text-white shadow-sm"
        >
          <Server className="w-4 h-4 mr-2" />
          Editar Parâmetros Informativos
        </Button>
      </div>

      {/* Notice on Real Mailer vs Informative Settings */}
      <div className="bg-amber-50/80 border border-amber-200 rounded-xl p-4 flex items-start gap-3.5 text-xs text-amber-950">
        <AlertTriangle className="w-5 h-5 text-amber-600 mt-0.5 shrink-0" />
        <div className="space-y-1">
          <p className="font-semibold text-amber-950">
            Aviso de Operação da Mensageria (Mailer Gerenciado Skip Cloud)
          </p>
          <p className="text-amber-900 leading-relaxed">
            O envio real de mensagens da plataforma é processado diretamente pelo serviço gerenciado
            do backend (Skip Cloud / PocketBase). Configurações de SMTP externo (como Gmail com
            senha de aplicativo) requerem parametrização direta nas configurações da instância no
            painel administrativo do PocketBase. Os campos abaixo definem os dados de remetente e a
            URL base dos links de redefinição de senha.
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
                Remetente e Parâmetros Informativos
              </CardTitle>
              <Badge
                variant="outline"
                className="bg-lavender-soft text-lavender border-lavender/20 uppercase font-mono text-[10px]"
              >
                Mailer: Skip Cloud Ativo
              </Badge>
            </div>
            <CardDescription className="text-xs">
              Identificação do remetente e endereço público dos links
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
                <span className="text-gray-500 text-xs">Modo de Envio Real</span>
                <span className="text-xs font-medium text-purple-700">
                  Skip Cloud Transacional (Serviço de Mailer Gerenciado)
                </span>
              </div>
              <div className="py-2.5 flex justify-between items-center">
                <span className="text-gray-500 text-xs">SMTP Próprio Externo</span>
                <span className="text-xs text-gray-500">
                  Requer parametrização no Painel do Servidor
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
            <div className="bg-blue-50/70 border border-blue-200/80 rounded-lg p-3 text-xs text-blue-900 space-y-1">
              <p className="font-semibold text-blue-950">Aviso sobre o Envio e Mailer</p>
              <p className="text-blue-800 leading-relaxed">
                Selecionar Gmail/SMTP neste formulário define apenas os parâmetros informativos da
                aplicação; o envio real do teste continua utilizando o serviço gerenciado{' '}
                <code className="bg-blue-100 px-1 py-0.5 rounded font-mono text-[11px]">
                  e.app.newMailClient()
                </code>
                . O teste bem-sucedido indica que o envio foi aceito pelo serviço de mensageria da
                instância, não constituindo garantia de entrega na caixa postal final (sujeita a
                políticas antispam, DNS/SPF/DKIM e configuração do servidor).
              </p>
            </div>
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
            <DialogTitle>Parâmetros de Mensageria e Remetente</DialogTitle>
            <DialogDescription>
              Ajuste o nome de exibição do remetente, e-mail institucional e a URL pública da
              aplicação.
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
