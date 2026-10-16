export type UserRole = 'admin' | 'gestor' | 'clinico'

export interface UserPermissions {
  canViewDashboard?: boolean
  canViewFinanceiro?: boolean
  canEditFinanceiro?: boolean
  canViewEquipe?: boolean
  canManageUsers?: boolean
  canManageEmailSettings?: boolean
  canViewAuditLogs?: boolean
  canViewCRM?: boolean
  canEditCRM?: boolean
}

export const ROLE_DEFAULT_PERMISSIONS: Record<UserRole, UserPermissions> = {
  admin: {
    canViewDashboard: true,
    canViewFinanceiro: true,
    canEditFinanceiro: true,
    canViewEquipe: true,
    canManageUsers: true,
    canManageEmailSettings: true,
    canViewAuditLogs: true,
    canViewCRM: true,
    canEditCRM: true,
  },
  gestor: {
    canViewDashboard: true,
    canViewFinanceiro: true,
    canEditFinanceiro: true,
    canViewEquipe: true,
    canManageUsers: false,
    canManageEmailSettings: false,
    canViewAuditLogs: true,
    canViewCRM: true,
    canEditCRM: true,
  },
  clinico: {
    canViewDashboard: true,
    canViewFinanceiro: false,
    canEditFinanceiro: false,
    canViewEquipe: true,
    canManageUsers: false,
    canManageEmailSettings: false,
    canViewAuditLogs: false,
    canViewCRM: true,
    canEditCRM: true,
  },
}

export const ROLE_LABELS: Record<UserRole, string> = {
  admin: 'Administrador',
  gestor: 'Gestor',
  clinico: 'Usuário Clínico',
}

export const ROLE_DESCRIPTIONS: Record<UserRole, string> = {
  admin:
    'Acesso total a todas as áreas, gestão de usuários, financeiro, auditoria e configurações.',
  gestor:
    'Acesso a relatórios clínicos, equipe, CRM e financeiro autorizado. Sem permissão técnica de usuários/e-mail.',
  clinico:
    'Acesso operacional a agenda, prontuários, CRM e dados clínicos. Sem acesso financeiro ou de configuração.',
}
