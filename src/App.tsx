import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from '@/components/ui/toaster'
import { Toaster as Sonner } from '@/components/ui/sonner'
import { TooltipProvider } from '@/components/ui/tooltip'
import { AuthProvider, useAuth } from '@/hooks/use-auth'
import { UserPermissions } from '@/lib/permissions'

import Layout from '@/components/Layout'
import Index from '@/pages/Index'
import Financeiro from '@/pages/Financeiro'
import Equipe from '@/pages/Equipe'
import CRM from '@/pages/CRM'
import PatientHistory from '@/pages/PatientHistory'
import Login from '@/pages/Login'
import Register from '@/pages/Register'
import ForgotPassword from '@/pages/ForgotPassword'
import ResetPassword from '@/pages/ResetPassword'
import UsuariosAcessos from '@/pages/UsuariosAcessos'
import EmailConfiguracoes from '@/pages/EmailConfiguracoes'
import Auditoria from '@/pages/Auditoria'
import NotFound from '@/pages/NotFound'

// Protected Route Wrapper with Permission Validation
function ProtectedRoute({
  children,
  requiredPermission,
}: {
  children: React.ReactNode
  requiredPermission?: keyof UserPermissions
}) {
  const { user, permissions, ativo, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#fbfbfa] text-sm text-gray-500">
        Carregando ambiente seguro...
      </div>
    )
  }

  // Not logged in or account inactive -> redirect to login
  if (!user || !ativo) {
    return <Navigate to="/login" replace />
  }

  // Permission check
  if (requiredPermission && !permissions[requiredPermission]) {
    return <Navigate to="/" replace />
  }

  return <>{children}</>
}

const AppRoutes = () => (
  <Routes>
    {/* Public Auth Routes */}
    <Route path="/login" element={<Login />} />
    <Route path="/register" element={<Register />} />
    <Route path="/esqueci-senha" element={<ForgotPassword />} />
    <Route path="/reset-password" element={<ResetPassword />} />
    <Route path="/redefinir-senha" element={<ResetPassword />} />

    {/* Protected App Routes */}
    <Route
      element={
        <ProtectedRoute>
          <Layout />
        </ProtectedRoute>
      }
    >
      <Route path="/" element={<Index />} />

      {/* Financeiro: protected by canViewFinanceiro */}
      <Route
        path="/financeiro"
        element={
          <ProtectedRoute requiredPermission="canViewFinanceiro">
            <Financeiro />
          </ProtectedRoute>
        }
      />

      <Route path="/equipe" element={<Equipe />} />
      <Route path="/crm" element={<CRM />} />
      <Route path="/pacientes/:id/historico" element={<PatientHistory />} />

      {/* Admin Modules */}
      <Route
        path="/usuarios"
        element={
          <ProtectedRoute requiredPermission="canManageUsers">
            <UsuariosAcessos />
          </ProtectedRoute>
        }
      />
      <Route
        path="/configuracoes/email"
        element={
          <ProtectedRoute requiredPermission="canManageEmailSettings">
            <EmailConfiguracoes />
          </ProtectedRoute>
        }
      />
      <Route
        path="/auditoria"
        element={
          <ProtectedRoute requiredPermission="canViewAuditLogs">
            <Auditoria />
          </ProtectedRoute>
        }
      />
    </Route>

    <Route path="*" element={<NotFound />} />
  </Routes>
)

const App = () => (
  <BrowserRouter>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <AppRoutes />
      </TooltipProvider>
    </AuthProvider>
  </BrowserRouter>
)

export default App
