import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import pb from '@/lib/pocketbase/client'
import { RecordModel } from 'pocketbase'
import { UserRole, UserPermissions, ROLE_DEFAULT_PERMISSIONS } from '@/lib/permissions'

export interface AppUser extends RecordModel {
  role?: UserRole
  ativo?: boolean
  permissions?: UserPermissions | null
  telefone?: string
  cpf?: string
  dataNascimento?: string
}

interface AuthContextType {
  user: AppUser | null
  role: UserRole
  ativo: boolean
  permissions: UserPermissions
  signIn: (email: string, password: string) => Promise<{ error: any }>
  signOut: () => void
  requestPasswordReset: (email: string) => Promise<{ error: any }>
  confirmPasswordReset: (token: string, password: string) => Promise<{ error: any }>
  requestEmailChange: (newEmail: string) => Promise<{ error: any }>
  confirmEmailChange: (token: string, password: string) => Promise<{ error: any }>
  loading: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth must be used within an AuthProvider')
  return context
}

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<AppUser | null>(pb.authStore.record as AppUser | null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const unsubscribe = pb.authStore.onChange((_token, record) => {
      setUser(record as AppUser | null)
    })
    setLoading(false)
    return () => {
      unsubscribe()
    }
  }, [])

  const currentRole: UserRole = (user?.role as UserRole) || 'admin'
  const isAtivo: boolean = user?.ativo !== false

  const computedPermissions: UserPermissions = {
    ...ROLE_DEFAULT_PERMISSIONS[currentRole],
    ...(user?.permissions || {}),
  }

  const signIn = async (email: string, password: string) => {
    try {
      const authData = await pb.collection('users').authWithPassword(email, password)
      const record = authData.record as AppUser
      if (record.ativo === false) {
        pb.authStore.clear()
        return {
          error: new Error(
            'Esta conta está inativa. Entre em contato com o administrador da clínica.',
          ),
        }
      }
      return { error: null }
    } catch (error) {
      return { error }
    }
  }

  const signOut = () => {
    // Notify server-side logout endpoint to audit event on server
    try {
      pb.send('/backend/v1/custom/auth/logout', { method: 'POST' }).catch(() => {})
    } catch {
      /* intentionally ignored */
    }
    pb.authStore.clear()
  }

  const requestPasswordReset = async (email: string) => {
    try {
      await pb.collection('users').requestPasswordReset(email)
      return { error: null }
    } catch (error) {
      // In accordance with security best practices, return success state to UI
      // but return raw error internally if needed
      return { error }
    }
  }

  const confirmPasswordReset = async (token: string, password: string) => {
    try {
      await pb.collection('users').confirmPasswordReset(token, password, password)
      return { error: null }
    } catch (error) {
      return { error }
    }
  }

  const requestEmailChange = async (newEmail: string) => {
    try {
      await pb.collection('users').requestEmailChange(newEmail)
      return { error: null }
    } catch (error) {
      return { error }
    }
  }

  const confirmEmailChange = async (token: string, password: string) => {
    try {
      await pb.collection('users').confirmEmailChange(token, password)
      pb.authStore.clear()
      return { error: null }
    } catch (error) {
      return { error }
    }
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        role: currentRole,
        ativo: isAtivo,
        permissions: computedPermissions,
        signIn,
        signOut,
        requestPasswordReset,
        confirmPasswordReset,
        requestEmailChange,
        confirmEmailChange,
        loading,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}
