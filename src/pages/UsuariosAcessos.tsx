import { useState, useEffect } from 'react'
import pb from '@/lib/pocketbase/client'
import {
  Users,
  Search,
  UserPlus,
  ShieldAlert,
  CheckCircle,
  XCircle,
  MoreVertical,
  Filter,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { toast } from 'sonner'
import { format } from 'date-fns'
import { UserRole, ROLE_LABELS, ROLE_DESCRIPTIONS } from '@/lib/permissions'
import { useAuth, AppUser } from '@/hooks/use-auth'

export default function UsuariosAcessos() {
  const { user: currentUser } = useAuth()
  const [users, setUsers] = useState<AppUser[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState<string>('all')
  const [statusFilter, setStatusFilter] = useState<string>('all')

  // Create User Modal
  const [createModalOpen, setCreateModalOpen] = useState(false)
  const [createName, setCreateName] = useState('')
  const [createEmail, setCreateEmail] = useState('')
  const [createPassword, setCreatePassword] = useState('')
  const [createRole, setCreateRole] = useState<UserRole>('clinico')
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Edit Role Modal
  const [editUser, setEditUser] = useState<AppUser | null>(null)
  const [editRole, setEditRole] = useState<UserRole>('clinico')

  // Inactivate Confirmation
  const [confirmInactivateUser, setConfirmInactivateUser] = useState<AppUser | null>(null)

  const loadUsers = async () => {
    setLoading(true)
    try {
      const records = await pb.collection('users').getFullList<AppUser>({
        sort: '-created',
      })
      setUsers(records)
    } catch (err: any) {
      console.error('Erro ao carregar usuários:', err)
      toast.error('Não foi possível carregar a lista de usuários.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadUsers()
  }, [])

  const filteredUsers = users.filter((u) => {
    const matchesSearch =
      (u.name || '').toLowerCase().includes(search.toLowerCase()) ||
      (u.email || '').toLowerCase().includes(search.toLowerCase())

    const userRole = (u.role as string) || 'clinico'
    const matchesRole = roleFilter === 'all' || userRole === roleFilter

    const isAtivo = u.ativo !== false
    const matchesStatus =
      statusFilter === 'all' ||
      (statusFilter === 'ativo' && isAtivo) ||
      (statusFilter === 'inativo' && !isAtivo)

    return matchesSearch && matchesRole && matchesStatus
  })

  // Count active admins
  const activeAdminsCount = users.filter((u) => u.role === 'admin' && u.ativo !== false).length

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!createEmail || !createPassword || !createName) {
      toast.error('Preencha os campos obrigatórios.')
      return
    }

    if (createPassword.length < 8) {
      toast.error('A senha inicial deve conter pelo menos 8 caracteres.')
      return
    }

    setIsSubmitting(true)
    try {
      await pb.collection('users').create({
        name: createName,
        email: createEmail,
        password: createPassword,
        passwordConfirm: createPassword,
        role: createRole,
        ativo: true,
      })

      toast.success('Novo usuário cadastrado com sucesso!')
      setCreateModalOpen(false)
      setCreateName('')
      setCreateEmail('')
      setCreatePassword('')
      setCreateRole('clinico')
      loadUsers()
    } catch (err: any) {
      console.error(err)
      toast.error(err.message || 'Erro ao cadastrar usuário. Verifique se o e-mail já existe.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleToggleAtivo = async (targetUser: AppUser) => {
    const isCurrentlyAtivo = targetUser.ativo !== false

    // If inactivating an admin, verify if it's the last active admin
    if (isCurrentlyAtivo && targetUser.role === 'admin' && activeAdminsCount <= 1) {
      toast.error(
        'Operação bloqueada: Não é permitido inativar o único Administrador ativo da clínica.',
      )
      return
    }

    try {
      await pb.collection('users').update(targetUser.id, {
        ativo: !isCurrentlyAtivo,
      })
      toast.success(
        `Usuário ${targetUser.name || targetUser.email} ${isCurrentlyAtivo ? 'inativado' : 'reativado'} com sucesso!`,
      )
      loadUsers()
    } catch (err: any) {
      toast.error(err.message || 'Erro ao alterar situação do usuário.')
    } finally {
      setConfirmInactivateUser(null)
    }
  }

  const handleUpdateRole = async () => {
    if (!editUser) return

    // If demoting from admin, verify if there is another active admin
    if (
      editUser.role === 'admin' &&
      editRole !== 'admin' &&
      editUser.ativo !== false &&
      activeAdminsCount <= 1
    ) {
      toast.error('Operação bloqueada: O sistema não pode ficar sem nenhum Administrador ativo.')
      return
    }

    try {
      await pb.collection('users').update(editUser.id, {
        role: editRole,
      })
      toast.success('Perfil de acesso atualizado com sucesso!')
      setEditUser(null)
      loadUsers()
    } catch (err: any) {
      toast.error(err.message || 'Erro ao atualizar perfil do usuário.')
    }
  }

  return (
    <div className="flex flex-col gap-6 animate-fade-in pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-mono text-lavender font-semibold tracking-wider uppercase">
              Administração · Segurança
            </span>
          </div>
          <h1 className="text-3xl font-display font-bold text-gray-900 tracking-tight">
            Usuários e Controle de Acessos
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Gerencie os colaboradores autorizados, perfis de permissão e status de acesso à clínica.
          </p>
        </div>

        <Button
          onClick={() => setCreateModalOpen(true)}
          className="bg-lavender hover:bg-lavender/90 text-white shadow-sm"
        >
          <UserPlus className="w-4 h-4 mr-2" />
          Convidar / Novo Usuário
        </Button>
      </div>

      {/* Info Card on Safety */}
      <div className="bg-amber-50/60 border border-amber-200/80 rounded-xl p-4 flex items-start gap-3 text-xs text-amber-900">
        <ShieldAlert className="w-5 h-5 text-amber-600 mt-0.5 shrink-0" />
        <div className="space-y-1">
          <p className="font-semibold text-amber-950">
            Política de Segurança e Controle de Integridade
          </p>
          <p className="text-amber-800 leading-relaxed">
            Usuários inativados têm novas sessões bloqueadas imediatamente e não conseguem efetuar
            login. O sistema protege automaticamente o último Administrador ativo para evitar
            bloqueio geral. Todas as alterações são registradas na trilha de auditoria confidencial.
          </p>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="bg-white border border-gray-200 rounded-xl p-4 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 shadow-sm">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <Input
            placeholder="Buscar por nome ou e-mail..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 bg-gray-50/50 border-gray-200 h-10 text-sm"
          />
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-gray-400" />
            <Select value={roleFilter} onValueChange={setRoleFilter}>
              <SelectTrigger className="w-[160px] h-10 text-xs">
                <SelectValue placeholder="Perfil" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os Perfis</SelectItem>
                <SelectItem value="admin">Administrador</SelectItem>
                <SelectItem value="gestor">Gestor</SelectItem>
                <SelectItem value="clinico">Usuário Clínico</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[140px] h-10 text-xs">
              <SelectValue placeholder="Situação" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas as Situações</SelectItem>
              <SelectItem value="ativo">Apenas Ativos</SelectItem>
              <SelectItem value="inativo">Apenas Inativos</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
        {loading ? (
          <div className="py-16 text-center text-sm text-gray-500">Carregando usuários...</div>
        ) : filteredUsers.length === 0 ? (
          <div className="py-16 text-center flex flex-col items-center justify-center gap-2 text-gray-500">
            <Users className="w-8 h-8 text-gray-300" />
            <p className="text-sm font-medium text-gray-700">Nenhum usuário encontrado</p>
            <p className="text-xs text-gray-400">
              Ajuste os filtros de busca ou cadastre um novo membro.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50 border-b border-gray-200 text-gray-500 text-xs uppercase tracking-wider">
                <tr>
                  <th className="px-6 py-3.5 font-semibold">Usuário</th>
                  <th className="px-6 py-3.5 font-semibold">Perfil de Acesso</th>
                  <th className="px-6 py-3.5 font-semibold">Situação</th>
                  <th className="px-6 py-3.5 font-semibold">Data Cadastro</th>
                  <th className="px-6 py-3.5 font-semibold text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredUsers.map((u) => {
                  const role = (u.role as UserRole) || 'clinico'
                  const isAtivo = u.ativo !== false
                  const isCurrentUser = currentUser?.id === u.id

                  return (
                    <tr key={u.id} className="hover:bg-gray-50/70 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <Avatar className="h-9 w-9 border border-gray-200">
                            <AvatarFallback className="bg-lavender-soft text-lavender font-semibold text-xs">
                              {u.name?.charAt(0)?.toUpperCase() || 'U'}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-medium text-gray-900">
                                {u.name || 'Sem nome'}
                              </span>
                              {isCurrentUser && (
                                <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-4">
                                  Você
                                </Badge>
                              )}
                            </div>
                            <span className="text-xs text-gray-500">{u.email}</span>
                          </div>
                        </div>
                      </td>

                      <td className="px-6 py-4">
                        <Badge
                          variant="outline"
                          className={
                            role === 'admin'
                              ? 'bg-purple-50 text-purple-700 border-purple-200'
                              : role === 'gestor'
                                ? 'bg-blue-50 text-blue-700 border-blue-200'
                                : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          }
                        >
                          {ROLE_LABELS[role] || role}
                        </Badge>
                      </td>

                      <td className="px-6 py-4">
                        {isAtivo ? (
                          <div className="flex items-center gap-1.5 text-xs text-emerald-700 font-medium">
                            <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
                            Ativo
                          </div>
                        ) : (
                          <div className="flex items-center gap-1.5 text-xs text-rose-600 font-medium">
                            <XCircle className="w-3.5 h-3.5 text-rose-500" />
                            Inativo
                          </div>
                        )}
                      </td>

                      <td className="px-6 py-4 text-xs text-gray-500 font-mono">
                        {u.created ? format(new Date(u.created), 'dd/MM/yyyy HH:mm') : '-'}
                      </td>

                      <td className="px-6 py-4 text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-500">
                              <MoreVertical className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-48">
                            <DropdownMenuItem
                              onClick={() => {
                                setEditUser(u)
                                setEditRole(role)
                              }}
                            >
                              Alterar Perfil de Acesso
                            </DropdownMenuItem>

                            {isAtivo ? (
                              <DropdownMenuItem
                                onClick={() => setConfirmInactivateUser(u)}
                                className="text-rose-600 focus:text-rose-600 focus:bg-rose-50"
                              >
                                Inativar Conta
                              </DropdownMenuItem>
                            ) : (
                              <DropdownMenuItem
                                onClick={() => handleToggleAtivo(u)}
                                className="text-emerald-600 focus:text-emerald-600 focus:bg-emerald-50"
                              >
                                Reativar Conta
                              </DropdownMenuItem>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Create User Modal */}
      <Dialog open={createModalOpen} onOpenChange={setCreateModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Novo Usuário do Sistema</DialogTitle>
            <DialogDescription>
              Cadastre um membro da equipe com acesso controlado às funcionalidades da clínica.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleCreateUser} className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label htmlFor="c-name">Nome Completo</Label>
              <Input
                id="c-name"
                value={createName}
                onChange={(e) => setCreateName(e.target.value)}
                placeholder="Ex: Dra. Mariana Costa"
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="c-email">E-mail Profissional</Label>
              <Input
                id="c-email"
                type="email"
                value={createEmail}
                onChange={(e) => setCreateEmail(e.target.value)}
                placeholder="mariana@clinica.com.br"
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="c-pass">Senha Inicial</Label>
              <Input
                id="c-pass"
                type="password"
                value={createPassword}
                onChange={(e) => setCreatePassword(e.target.value)}
                placeholder="Mínimo 8 caracteres"
                required
              />
              <p className="text-[11px] text-gray-500">
                O usuário poderá redefinir sua senha com segurança após o primeiro acesso.
              </p>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="c-role">Perfil de Acesso</Label>
              <Select value={createRole} onValueChange={(val: any) => setCreateRole(val)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">Administrador (Acesso Total)</SelectItem>
                  <SelectItem value="gestor">Gestor (Clínico + Financeiro)</SelectItem>
                  <SelectItem value="clinico">Usuário Clínico (Operacional/Agenda)</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-[11px] text-gray-500 mt-1">{ROLE_DESCRIPTIONS[createRole]}</p>
            </div>

            <DialogFooter className="pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setCreateModalOpen(false)}
                disabled={isSubmitting}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                className="bg-lavender hover:bg-lavender/90 text-white"
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Salvando...' : 'Salvar Usuário'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Role Dialog */}
      <Dialog open={!!editUser} onOpenChange={(open) => !open && setEditUser(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Alterar Perfil de Acesso</DialogTitle>
            <DialogDescription>
              Modifique o nível de permissões de{' '}
              <strong>{editUser?.name || editUser?.email}</strong>.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-3">
            <div className="space-y-1.5">
              <Label>Novo Perfil</Label>
              <Select value={editRole} onValueChange={(val: any) => setEditRole(val)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">Administrador</SelectItem>
                  <SelectItem value="gestor">Gestor</SelectItem>
                  <SelectItem value="clinico">Usuário Clínico</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-gray-500 mt-2 p-3 bg-gray-50 rounded-lg border border-gray-100">
                {ROLE_DESCRIPTIONS[editRole]}
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setEditUser(null)}>
              Cancelar
            </Button>
            <Button
              onClick={handleUpdateRole}
              className="bg-lavender hover:bg-lavender/90 text-white"
            >
              Confirmar Alteração
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Inactivate Confirmation Alert */}
      <AlertDialog
        open={!!confirmInactivateUser}
        onOpenChange={(open) => !open && setConfirmInactivateUser(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Inativar este usuário?</AlertDialogTitle>
            <AlertDialogDescription>
              O usuário{' '}
              <strong>{confirmInactivateUser?.name || confirmInactivateUser?.email}</strong> perderá
              o acesso ao sistema imediatamente. O histórico e os registros gerados por ele serão
              preservados integralmente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Voltar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => confirmInactivateUser && handleToggleAtivo(confirmInactivateUser)}
              className="bg-rose-600 hover:bg-rose-700 text-white"
            >
              Inativar Conta
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
