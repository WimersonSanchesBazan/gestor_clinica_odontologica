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

/**
 * PERMISSÕES DO SISTEMA (Role-Based Access Control - RBAC)
 *
 * Esclarecimento arquitetural (Sprint de Correções de Segurança):
 * Nesta fase da aplicação, o sistema adota permissões estritamente fixas por perfil (RBAC por role),
 * sem declaração de granularidade customizada por usuário.
 *
 * Regra fundamental:
 * - O frontend reflete estas permissões para renderização de menu e navegação protegida.
 * - A autorização real e compulsória é executada no servidor (PocketBase API Rules e hooks pb_hooks)
 *   com base no campo `role` autenticado em `@request.auth.role`.
 * - Não declare uma permissão como protegida se ela estiver apenas no frontend.
 *   Coleções protegidas no backend:
 *   - users: create/delete/list admin-only; update bloqueia role/ativo/permissions/email; gestor/clinico apenas id próprio.
 *   - lancamentos_financeiros: admin e gestor apenas.
 *   - audit_logs: createRule null (exclusivo do servidor/hooks), view/list admin e gestor.
 *   - email_settings: admin apenas.
 */
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
