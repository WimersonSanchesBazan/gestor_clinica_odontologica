import { Outlet, Link, useLocation } from 'react-router-dom'
import { Search, LogOut } from 'lucide-react'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { useAuth } from '@/hooks/use-auth'

const NAV_ITEMS = [
  { id: 'dashboard', label: 'Dashboard', numeral: 'I', path: '/', disabled: false },
  { id: 'financeiro', label: 'Financeiro', numeral: 'II', path: '/financeiro', disabled: false },
  { id: 'equipe', label: 'Equipe', numeral: 'III', path: '/equipe', disabled: false },
  { id: 'crm', label: 'CRM', numeral: 'IV', path: '/crm', disabled: false },
]

export default function Layout() {
  const { user, signOut } = useAuth()
  const location = useLocation()

  return (
    <div className="flex flex-col min-h-screen lg:h-screen lg:overflow-hidden bg-gray-50/50">
      <header className="sticky top-0 z-40 w-full border-b bg-white/80 backdrop-blur-md">
        <div className="flex h-16 items-center px-6 gap-8">
          {/* Logo */}
          <div className="flex items-center gap-2 font-display font-bold text-xl tracking-tight text-gray-900 shrink-0">
            <div className="w-8 h-8 rounded-lg bg-lavender-soft flex items-center justify-center text-lavender">
              <svg
                className="w-5 h-5"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
              </svg>
            </div>
            ClínicaPro
          </div>

          {/* Navigation */}
          <nav className="hidden md:flex flex-1 items-center justify-center gap-1">
            {NAV_ITEMS.map((item) => {
              const isActive = location.pathname === item.path && !item.disabled

              const linkContent = (
                <div
                  className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
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

          {/* Actions */}
          <div className="flex items-center gap-4 shrink-0 ml-auto">
            <Button
              variant="outline"
              className="hidden sm:flex gap-2 text-gray-500 h-9 px-3 w-48 justify-start bg-gray-50/50"
            >
              <Search className="w-4 h-4" />
              <span className="flex-1 text-left font-normal">Buscar...</span>
              <kbd className="hidden md:inline-flex h-5 items-center gap-1 rounded border bg-white px-1.5 font-mono text-[10px] font-medium text-gray-500">
                <span className="text-xs">⌘</span>K
              </kbd>
            </Button>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center gap-2 outline-none">
                  <div className="hidden sm:flex flex-col items-end text-sm">
                    <span className="font-medium text-gray-900">
                      {user?.name || 'Administrador'}
                    </span>
                    <span className="text-xs text-gray-500">Gestão</span>
                  </div>
                  <Avatar className="h-9 w-9 border border-gray-200">
                    <AvatarFallback className="bg-lavender-soft text-lavender font-medium">
                      {user?.name?.charAt(0) || 'A'}
                    </AvatarFallback>
                  </Avatar>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem
                  onClick={signOut}
                  className="text-bordeaux focus:text-bordeaux focus:bg-bordeaux-soft cursor-pointer"
                >
                  <LogOut className="w-4 h-4 mr-2" />
                  Sair
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
