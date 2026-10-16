// pocketbase/hooks/auth_and_audit.pb.js

// 1. Guard against inactive users logging in
onRecordAuthRequest((e) => {
  e.next()

  const record = e.record
  if (record && record.collection().name === 'users') {
    // If user is marked inactive (ativo === false), reject authentication!
    const isAtivo = record.getBool('ativo')
    // If record has 'ativo' set to false specifically
    if (record.get('ativo') !== null && isAtivo === false) {
      throw new ForbiddenError(
        'Esta conta de usuário está inativa. Entre em contato com o administrador da clínica.',
      )
    }

    // Default first user without role to admin if there is no role
    const role = record.getString('role')
    if (!role) {
      record.set('role', 'admin')
      record.set('ativo', true)
      e.app.save(record)
    }

    // Log successful login in audit_logs (never recording passwords or tokens!)
    try {
      const auditCol = e.app.findCollectionByNameOrId('audit_logs')
      const log = new Record(auditCol)
      log.set('action', 'login_success')
      log.set('userId', record.id)
      log.set('userEmail', record.getString('email'))
      log.set('targetEntity', 'users')
      log.set('targetId', record.id)
      log.set('details', JSON.stringify({ role: record.getString('role') || 'admin' }))
      e.app.save(log)
    } catch (err) {
      // Best-effort audit logging
      console.error('Failed to log login audit:', err)
    }
  }
})

// 2. Prevent removing or demoting the last active administrator
onRecordUpdate((e) => {
  if (e.record.collection().name === 'users') {
    const originalRole = e.record.original().getString('role')
    const newRole = e.record.getString('role')
    const originalAtivo = e.record.original().getBool('ativo')
    const newAtivo = e.record.getBool('ativo')

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

    // Log profile/status updates to audit_logs
    try {
      const auditCol = e.app.findCollectionByNameOrId('audit_logs')
      const log = new Record(auditCol)
      log.set('action', 'user_updated')
      log.set('userId', e.requestInfo?.auth?.id || '')
      log.set('userEmail', e.requestInfo?.auth?.getString('email') || '')
      log.set('targetEntity', 'users')
      log.set('targetId', e.record.id)
      log.set(
        'details',
        JSON.stringify({
          changedRole: originalRole !== newRole ? { from: originalRole, to: newRole } : null,
          changedAtivo: originalAtivo !== newAtivo ? { from: originalAtivo, to: newAtivo } : null,
          name: e.record.getString('name'),
        }),
      )
      e.app.save(log)
    } catch (err) {
      console.error('Failed to write audit log for user update:', err)
    }
  }
  e.next()
})

// 3. Prevent deleting the last active admin
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

    // Audit log
    try {
      const auditCol = e.app.findCollectionByNameOrId('audit_logs')
      const log = new Record(auditCol)
      log.set('action', 'user_deleted')
      log.set('userId', e.requestInfo?.auth?.id || '')
      log.set('userEmail', e.requestInfo?.auth?.getString('email') || '')
      log.set('targetEntity', 'users')
      log.set('targetId', e.record.id)
      log.set('details', JSON.stringify({ email: e.record.getString('email') }))
      e.app.save(log)
    } catch (_) {}
  }
  e.next()
})

// 4. Audit user creation
onRecordCreate((e) => {
  e.next()
  if (e.record && e.record.collection().name === 'users') {
    try {
      const auditCol = e.app.findCollectionByNameOrId('audit_logs')
      const log = new Record(auditCol)
      log.set('action', 'user_created')
      log.set('userId', e.requestInfo?.auth?.id || '')
      log.set('userEmail', e.requestInfo?.auth?.getString('email') || '')
      log.set('targetEntity', 'users')
      log.set('targetId', e.record.id)
      log.set(
        'details',
        JSON.stringify({
          email: e.record.getString('email'),
          role: e.record.getString('role') || 'clinico',
        }),
      )
      e.app.save(log)
    } catch (err) {
      console.error('Failed to write audit log for user creation:', err)
    }
  }
})
