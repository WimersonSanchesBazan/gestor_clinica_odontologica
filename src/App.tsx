import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from '@/components/ui/toaster'
import { Toaster as Sonner } from '@/components/ui/sonner'
import { TooltipProvider } from '@/components/ui/tooltip'
import { AuthProvider, useAuth } from '@/hooks/use-auth'

import Layout from '@/components/Layout'
import Index from '@/pages/Index'
import Financeiro from '@/pages/Financeiro'
import Equipe from '@/pages/Equipe'
import CRM from '@/pages/CRM'
import PatientHistory from '@/pages/PatientHistory'
import Login from '@/pages/Login'
import Register from '@/pages/Register'
import NotFound from '@/pages/NotFound'

// Protected Route Wrapper
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#fbfbfa]">
        Carregando...
      </div>
    )
  }

  if (!user) {
    return <Navigate to="/login" replace />
  }

  return <>{children}</>
}

const AppRoutes = () => (
  <Routes>
    <Route path="/login" element={<Login />} />
    <Route path="/register" element={<Register />} />
    <Route
      element={
        <ProtectedRoute>
          <Layout />
        </ProtectedRoute>
      }
    >
      <Route path="/" element={<Index />} />
      <Route path="/financeiro" element={<Financeiro />} />
      <Route path="/equipe" element={<Equipe />} />
      <Route path="/crm" element={<CRM />} />
      <Route path="/pacientes/:id/historico" element={<PatientHistory />} />
    </Route>
    <Route path="*" element={<NotFound />} />
  </Routes>
)

const App = () => (
  <BrowserRouter future={{ v7_startTransition: false, v7_relativeSplatPath: false }}>
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
