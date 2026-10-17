// pocketbase/hooks/auth_and_audit.pb.js

// 1. Guard against inactive users & Log Successful Login
// NOTE: Automatic promotion of users without role to 'admin' HAS BEEN COMPLETELY REMOVED.
// Every user must have an explicit role assigned by an administrator.
onRecordAuthRequest((e) => {
  const record = e.record
  if (record && record.collection().name === 'users') {
    // If user is marked inactive (ativo === false), reject authentication immediately BEFORE next!
    // This applies to both password auth and auth-refresh!
    const isAtivo = record.getBool('ativo')
    if (record.get('ativo') !== null && isAtivo === false) {
      // Audit blocked login/refresh attempt for inactive user
      try {
        const auditCol = e.app.findCollectionByNameOrId('audit_logs')
        const log = new Record(auditCol)
        log.set('action', 'login_inactive_blocked')
        log.set('userId', record.id)
        log.set('userEmail', record.getString('email'))
        log.set('targetEntity', 'users')
        log.set('targetId', record.id)
        log.set('ipAddress', e.requestInfo?.ip || '')
        log.set(
          'details',
          JSON.stringify({
            reason:
              'Tentativa de autenticação ou renovação de token por usuário inativo bloqueada.',
          }),
        )
        e.app.save(log)
      } catch (logErr) {
        console.error('Falha ao auditar bloqueio de usuário inativo:', logErr)
      }

      throw new ForbiddenError(
        'Esta conta de usuário está inativa. Entre em contato com o administrador da clínica.',
      )
    }
  }

  e.next()

  if (record && record.collection().name === 'users') {
    // Fail-closed role verification (never promote automatically, invalid role defaults to clinico)
    const rawRole = record.getString('role')
    const isValidRole = rawRole === 'admin' || rawRole === 'gestor' || rawRole === 'clinico'
    const role = isValidRole ? rawRole : 'clinico'

    // Log successful login on the server (skip for auth refresh if desired or log as login_success)
    try {
      const auditCol = e.app.findCollectionByNameOrId('audit_logs')
      const log = new Record(auditCol)
      log.set('action', 'login_success')
      log.set('userId', record.id)
      log.set('userEmail', record.getString('email'))
      log.set('targetEntity', 'users')
      log.set('targetId', record.id)
      log.set('ipAddress', e.requestInfo?.ip || '')
      log.set('details', JSON.stringify({ role: role }))
      e.app.save(log)
    } catch (err) {
      console.error('Falha ao registrar login com sucesso:', err)
    }
  }
})

// 2. Audit failed login attempts on the server
// Uses onRecordAuthWithPasswordRequest to catch failed password attempts
onRecordAuthWithPasswordRequest((e) => {
  try {
    e.next()
  } catch (err) {
    // Authentication failed (wrong password or user not found/invalid)
    try {
      const attemptedIdentity = e.identity || e.requestInfo?.body?.identity || ''
      const auditCol = e.app.findCollectionByNameOrId('audit_logs')
      const log = new Record(auditCol)
      log.set('action', 'login_failed')
      log.set('userEmail', attemptedIdentity)
      log.set('targetEntity', 'users')
      log.set('ipAddress', e.requestInfo?.ip || '')
      log.set(
        'details',
        JSON.stringify({ reason: 'Credenciais inválidas ou erro de autenticação' }),
      )
      e.app.save(log)
    } catch (logErr) {
      console.error('Falha ao registrar tentativa de login malsucedida:', logErr)
    }

    throw err
  }
})

// 3. User update hook: Protect sole active admin & Audit modifications
onRecordUpdate((e) => {
  if (e.record.collection().name === 'users') {
    const originalRole = e.record.original().getString('role')
    const newRole = e.record.getString('role')
    const originalAtivo = e.record.original().getBool('ativo')
    const newAtivo = e.record.getBool('ativo')
    const originalPerms = e.record.original().getString('permissions')
    const newPerms = e.record.getString('permissions')

    const wasActiveAdmin = originalRole === 'admin' && originalAtivo !== false
    const isNowInactiveOrDemoted =
      newRole !== 'admin' || (e.record.get('ativo') !== null && newAtivo === false)

    if (wasActiveAdmin && isNowInactiveOrDemoted) {
      // Check if there is at least one OTHER active admin
      const activeAdmins = e.app.findRecordsByFilter(
        'users',
        "role = 'admin' && ativo != false && id != '" + e.record.id + "'",
        '',
        1,
        0,
      )
      if (!activeAdmins || activeAdmins.length === 0) {
        throw new BadRequestError(
          'Operação bloqueada: O sistema não pode ficar sem nenhum Administrador ativo.',
        )
      }
    }

    // Proceed with update
    e.next()

    // Audit changes to role, ativo, or permissions
    try {
      const actorId = e.requestInfo?.auth?.id || ''
      const actorEmail = e.requestInfo?.auth?.getString('email') || ''
      const clientIp = e.requestInfo?.ip || ''

      const details = {
        changedRole: originalRole !== newRole ? { from: originalRole, to: newRole } : null,
        changedAtivo: originalAtivo !== newAtivo ? { from: originalAtivo, to: newAtivo } : null,
        changedPermissions: originalPerms !== newPerms ? 'Permissões customizadas alteradas' : null,
        targetUserEmail: e.record.getString('email'),
        targetUserName: e.record.getString('name'),
      }

      const action =
        originalAtivo !== newAtivo && newAtivo === false ? 'user_inactivated' : 'user_updated'

      const auditCol = e.app.findCollectionByNameOrId('audit_logs')
      const log = new Record(auditCol)
      log.set('action', action)
      if (actorId) log.set('userId', actorId)
      if (actorEmail) log.set('userEmail', actorEmail)
      log.set('targetEntity', 'users')
      log.set('targetId', e.record.id)
      log.set('ipAddress', clientIp)
      log.set('details', JSON.stringify(details))
      e.app.save(log)
    } catch (err) {
      console.error('Falha ao auditar alteração de usuário:', err)
    }
    return
  }

  e.next()
})

// 4. User delete hook: Prevent deleting the last active admin & Audit deletion
onRecordDelete((e) => {
  if (e.record.collection().name === 'users') {
    const role = e.record.getString('role')
    const isAtivo = e.record.getBool('ativo')
    if (role === 'admin' && isAtivo !== false) {
      const otherAdmins = e.app.findRecordsByFilter(
        'users',
        "role = 'admin' && ativo != false && id != '" + e.record.id + "'",
        '',
        1,
        0,
      )
      if (!otherAdmins || otherAdmins.length === 0) {
        throw new BadRequestError(
          'Operação bloqueada: Não é permitido excluir o único Administrador ativo do sistema.',
        )
      }
    }

    const actorId = e.requestInfo?.auth?.id || ''
    const actorEmail = e.requestInfo?.auth?.getString('email') || ''
    const clientIp = e.requestInfo?.ip || ''
    const targetEmail = e.record.getString('email')
    const targetId = e.record.id

    e.next()

    try {
      const auditCol = e.app.findCollectionByNameOrId('audit_logs')
      const log = new Record(auditCol)
      log.set('action', 'user_deleted')
      if (actorId) log.set('userId', actorId)
      if (actorEmail) log.set('userEmail', actorEmail)
      log.set('targetEntity', 'users')
      log.set('targetId', targetId)
      log.set('ipAddress', clientIp)
      log.set('details', JSON.stringify({ email: targetEmail }))
      e.app.save(log)
    } catch (err) {
      console.error('Falha ao auditar exclusão de usuário:', err)
    }
    return
  }

  e.next()
})

// 5. User creation hook: Audit user creation
onRecordCreate((e) => {
  e.next()
  if (e.record && e.record.collection().name === 'users') {
    try {
      const actorId = e.requestInfo?.auth?.id || ''
      const actorEmail = e.requestInfo?.auth?.getString('email') || ''
      const clientIp = e.requestInfo?.ip || ''

      const auditCol = e.app.findCollectionByNameOrId('audit_logs')
      const log = new Record(auditCol)
      log.set('action', 'user_created')
      if (actorId) log.set('userId', actorId)
      if (actorEmail) log.set('userEmail', actorEmail)
      log.set('targetEntity', 'users')
      log.set('targetId', e.record.id)
      log.set('ipAddress', clientIp)
      log.set(
        'details',
        JSON.stringify({
          email: e.record.getString('email'),
          role: e.record.getString('role') || 'clinico',
          ativo: e.record.getBool('ativo') !== false,
        }),
      )
      e.app.save(log)
    } catch (err) {
      console.error('Falha ao auditar criação de usuário:', err)
    }
  }
})

// 6. Audit password reset request & password reset completion
onRecordRequestPasswordResetRequest((e) => {
  e.next()
  try {
    const clientIp = e.requestInfo?.ip || ''
    const requestedEmail = e.requestInfo?.body?.email || ''
    const auditCol = e.app.findCollectionByNameOrId('audit_logs')
    const log = new Record(auditCol)
    log.set('action', 'password_reset_request')
    log.set('userEmail', requestedEmail)
    log.set('targetEntity', 'users')
    log.set('ipAddress', clientIp)
    log.set('details', JSON.stringify({ requestedEmail: requestedEmail }))
    e.app.save(log)
  } catch (err) {
    console.error('Falha ao auditar solicitação de redefinição de senha:', err)
  }
})

onRecordConfirmPasswordResetRequest((e) => {
  e.next()
  try {
    const clientIp = e.requestInfo?.ip || ''
    const record = e.record
    const auditCol = e.app.findCollectionByNameOrId('audit_logs')
    const log = new Record(auditCol)
    log.set('action', 'password_reset_completed')
    if (record?.id) log.set('userId', record.id)
    if (record?.getString('email')) log.set('userEmail', record.getString('email'))
    log.set('targetEntity', 'users')
    if (record?.id) log.set('targetId', record.id)
    log.set('ipAddress', clientIp)
    log.set('details', JSON.stringify({ status: 'Senha redefinida com sucesso' }))
    e.app.save(log)
  } catch (err) {
    console.error('Falha ao auditar conclusão de redefinição de senha:', err)
  }
})

// 7. Audit email settings creation and updates
onRecordCreate((e) => {
  e.next()
  if (e.record && e.record.collection().name === 'email_settings') {
    try {
      const actorId = e.requestInfo?.auth?.id || ''
      const actorEmail = e.requestInfo?.auth?.getString('email') || ''
      const clientIp = e.requestInfo?.ip || ''
      const auditCol = e.app.findCollectionByNameOrId('audit_logs')
      const log = new Record(auditCol)
      log.set('action', 'email_settings_updated')
      if (actorId) log.set('userId', actorId)
      if (actorEmail) log.set('userEmail', actorEmail)
      log.set('targetEntity', 'email_settings')
      log.set('targetId', e.record.id)
      log.set('ipAddress', clientIp)
      log.set(
        'details',
        JSON.stringify({
          provider: e.record.getString('provider'),
          senderEmail: e.record.getString('senderEmail'),
          senderName: e.record.getString('senderName'),
          actionType: 'created',
        }),
      )
      e.app.save(log)
    } catch (err) {
      console.error('Falha ao auditar criação de email_settings:', err)
    }
  }
})

onRecordUpdate((e) => {
  e.next()
  if (e.record && e.record.collection().name === 'email_settings') {
    try {
      const actorId = e.requestInfo?.auth?.id || ''
      const actorEmail = e.requestInfo?.auth?.getString('email') || ''
      const clientIp = e.requestInfo?.ip || ''
      const auditCol = e.app.findCollectionByNameOrId('audit_logs')
      const log = new Record(auditCol)
      log.set('action', 'email_settings_updated')
      if (actorId) log.set('userId', actorId)
      if (actorEmail) log.set('userEmail', actorEmail)
      log.set('targetEntity', 'email_settings')
      log.set('targetId', e.record.id)
      log.set('ipAddress', clientIp)
      log.set(
        'details',
        JSON.stringify({
          provider: e.record.getString('provider'),
          senderEmail: e.record.getString('senderEmail'),
          senderName: e.record.getString('senderName'),
          actionType: 'updated',
        }),
      )
      e.app.save(log)
    } catch (err) {
      console.error('Falha ao auditar alteração de email_settings:', err)
    }
  }
})

// 8. Server-side logout endpoint to guarantee server-audited logout
routerAdd('POST', '/backend/v1/custom/auth/logout', function (e) {
  const reqAuth = e.requestInfo ? e.requestInfo.auth : null
  const reqIp = e.requestInfo && e.requestInfo.ip ? e.requestInfo.ip : ''

  if (reqAuth) {
    try {
      const auditCol = e.app.findCollectionByNameOrId('audit_logs')
      const log = new Record(auditCol)
      log.set('action', 'logout')
      log.set('userId', reqAuth.id)
      log.set('userEmail', reqAuth.getString('email'))
      log.set('targetEntity', 'users')
      log.set('targetId', reqAuth.id)
      log.set('ipAddress', reqIp)
      log.set(
        'details',
        JSON.stringify({
          role: reqAuth.getString('role') || 'clinico',
          note: 'Sessão encerrada pelo cliente. O registro em auditoria confirma a notificação ao servidor, mas não implica revogação de token stateless sem lista de bloqueio.',
        }),
      )
      e.app.save(log)
    } catch (err) {
      console.error('Falha ao auditar logout:', err)
    }
  }

  return e.json(200, { success: true })
})
