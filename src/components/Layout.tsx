import { Outlet, Link, useLocation } from 'react-router-dom'
import { LogOut, Users, Shield, Mail, Lock } from 'lucide-react'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { Badge } from '@/components/ui/badge'
import { useAuth } from '@/hooks/use-auth'
import { ROLE_LABELS } from '@/lib/permissions'

export default function Layout() {
  const { user, role, permissions, signOut } = useAuth()
  const location = useLocation()

  const navItems = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      numeral: 'I',
      path: '/',
      visible: permissions.canViewDashboard !== false,
      disabled: false,
    },
    {
      id: 'financeiro',
      label: 'Financeiro',
      numeral: 'II',
      path: '/financeiro',
      visible: permissions.canViewFinanceiro,
      disabled: false,
    },
    {
      id: 'equipe',
      label: 'Equipe',
      numeral: 'III',
      path: '/equipe',
      visible: permissions.canViewEquipe,
      disabled: false,
    },
    {
      id: 'crm',
      label: 'CRM',
      numeral: 'IV',
      path: '/crm',
      visible: permissions.canViewCRM,
      disabled: false,
    },
    {
      id: 'usuarios',
      label: 'Usuários & Acessos',
      numeral: 'V',
      path: '/usuarios',
      visible: permissions.canManageUsers,
      disabled: false,
    },
  ].filter((item) => item.visible)

  return (
    <div className="flex flex-col min-h-screen lg:h-screen lg:overflow-hidden bg-gray-50/50">
      <header className="sticky top-0 z-40 w-full border-b bg-white/90 backdrop-blur-md">
        <div className="flex h-16 items-center px-6 gap-6">
          {/* Logo & Brand */}
          <Link
            to="/"
            className="flex items-center gap-2.5 font-display font-bold text-xl tracking-tight text-gray-900 shrink-0"
          >
            <div className="w-8 h-8 rounded-lg bg-lavender-soft flex items-center justify-center text-lavender shadow-sm">
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
            <span>OdontoGestão</span>
          </Link>

          {/* Navigation */}
          <nav className="hidden md:flex flex-1 items-center justify-center gap-1">
            {navItems.map((item) => {
              const isActive = location.pathname === item.path && !item.disabled

              const linkContent = (
                <div
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-md text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-lavender-soft text-lavender'
                      : item.disabled
                        ? 'text-gray-400 cursor-not-allowed opacity-60'
                        : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  <span className="font-mono text-xs opacity-70">{item.numeral} ·</span>
                  {item.label}
                </div>
              )

              if (item.disabled) {
                return (
                  <Tooltip key={item.id} delayDuration={0}>
                    <TooltipTrigger asChild>
                      <div>{linkContent}</div>
                    </TooltipTrigger>
                    <TooltipContent>Em breve</TooltipContent>
                  </Tooltip>
                )
              }

              return (
                <Link key={item.id} to={item.path}>
                  {linkContent}
                </Link>
              )
            })}
          </nav>

          {/* Profile & Settings Menu */}
          <div className="flex items-center gap-3 shrink-0 ml-auto">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center gap-2 outline-none p-1 rounded-lg hover:bg-gray-100 transition-colors">
                  <div className="hidden sm:flex flex-col items-end text-sm">
                    <span className="font-medium text-gray-900 leading-tight">
                      {user?.name || 'Administrador'}
                    </span>
                    <span className="text-[11px] text-gray-500 font-medium">
                      {ROLE_LABELS[role] || 'Usuário'}
                    </span>
                  </div>
                  <Avatar className="h-9 w-9 border border-gray-200">
                    <AvatarFallback className="bg-lavender-soft text-lavender font-semibold text-xs">
                      {user?.name?.charAt(0)?.toUpperCase() || 'A'}
                    </AvatarFallback>
                  </Avatar>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none text-gray-900">{user?.name}</p>
                    <p className="text-xs leading-none text-gray-500">{user?.email}</p>
                    <div className="pt-1">
                      <Badge variant="outline" className="text-[10px] uppercase font-mono py-0">
                        {ROLE_LABELS[role]}
                      </Badge>
                    </div>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />

                {permissions.canManageUsers && (
                  <DropdownMenuItem asChild>
                    <Link to="/usuarios" className="cursor-pointer flex items-center">
                      <Users className="w-4 h-4 mr-2 text-gray-500" />
                      Usuários e Acessos
                    </Link>
                  </DropdownMenuItem>
                )}

                {permissions.canManageEmailSettings && (
                  <DropdownMenuItem asChild>
                    <Link to="/configuracoes/email" className="cursor-pointer flex items-center">
                      <Mail className="w-4 h-4 mr-2 text-gray-500" />
                      Configuração de E-mail
                    </Link>
                  </DropdownMenuItem>
                )}

                {permissions.canViewAuditLogs && (
                  <DropdownMenuItem asChild>
                    <Link to="/auditoria" className="cursor-pointer flex items-center">
                      <Shield className="w-4 h-4 mr-2 text-gray-500" />
                      Trilha de Auditoria
                    </Link>
                  </DropdownMenuItem>
                )}

                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={signOut}
                  className="text-bordeaux focus:text-bordeaux focus:bg-bordeaux-soft cursor-pointer"
                >
                  <LogOut className="w-4 h-4 mr-2" />
                  Encerrar Sessão
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>

      <main className="flex-1 overflow-auto lg:overflow-hidden w-full mx-auto flex flex-col p-4 md:p-6 max-w-[1400px]">
        <Outlet />
      </main>
    </div>
  )
}
