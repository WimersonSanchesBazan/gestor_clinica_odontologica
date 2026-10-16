migrate(
  (app) => {
    // 1. Hardening API Rules for users collection
    const users = app.findCollectionByNameOrId('_pb_users_auth_')

    // List: Only authenticated Admin or Gestor can list user directory.
    // Regular clinico users can only read their own user record or specific patient records they treat,
    // not enumerate all accounts, emails, roles or permissions.
    users.listRule =
      "@request.auth.id != '' && (@request.auth.role = 'admin' || @request.auth.role = 'gestor' || id = @request.auth.id)"

    // View: User can view their own record; admin and gestor can view any record.
    users.viewRule =
      "@request.auth.id != '' && (@request.auth.role = 'admin' || @request.auth.role = 'gestor' || id = @request.auth.id)"

    // Create: Strictly forbidden to anonymous users. Only authenticated admin can provision new accounts.
    users.createRule = "@request.auth.id != '' && @request.auth.role = 'admin'"

    // Update: Admin can update any user; non-admin users can update ONLY their own record
    // and CANNOT modify role, ativo, permissions or email directly.
    users.updateRule =
      "@request.auth.id != '' && (@request.auth.role = 'admin' || (id = @request.auth.id && @request.body.role:changed = false && @request.body.ativo:changed = false && @request.body.permissions:changed = false && @request.body.email:changed = false))"

    // Delete: Only admin can delete accounts
    users.deleteRule = "@request.auth.id != '' && @request.auth.role = 'admin'"

    app.save(users)

    // 2. Hardening lancamentos_financeiros:
    // Remove accidental fallback '@request.auth.role = ''' so that clinico/unassigned users cannot view/list
    try {
      const fin = app.findCollectionByNameOrId('lancamentos_financeiros')
      fin.listRule =
        "@request.auth.id != '' && (@request.auth.role = 'admin' || @request.auth.role = 'gestor')"
      fin.viewRule =
        "@request.auth.id != '' && (@request.auth.role = 'admin' || @request.auth.role = 'gestor')"
      fin.createRule =
        "@request.auth.id != '' && (@request.auth.role = 'admin' || @request.auth.role = 'gestor')"
      fin.updateRule =
        "@request.auth.id != '' && (@request.auth.role = 'admin' || @request.auth.role = 'gestor')"
      fin.deleteRule = "@request.auth.id != '' && @request.auth.role = 'admin'"
      app.save(fin)
    } catch (_) {}

    // 3. Hardening audit_logs:
    // Disallow arbitrary client creation if possible or keep createRule locked to authenticated users.
    // Note: server hooks bypass API rules when using e.app.save(log). Client directly creating audit logs
    // is restricted to admin/gestor only.
    try {
      const audit = app.findCollectionByNameOrId('audit_logs')
      audit.listRule =
        "@request.auth.id != '' && (@request.auth.role = 'admin' || @request.auth.role = 'gestor')"
      audit.viewRule =
        "@request.auth.id != '' && (@request.auth.role = 'admin' || @request.auth.role = 'gestor')"
      audit.createRule =
        "@request.auth.id != '' && (@request.auth.role = 'admin' || @request.auth.role = 'gestor')"
      audit.updateRule = null
      audit.deleteRule = null
      app.save(audit)
    } catch (_) {}

    // 4. Hardening email_settings:
    try {
      const emailCol = app.findCollectionByNameOrId('email_settings')
      emailCol.listRule = "@request.auth.id != '' && @request.auth.role = 'admin'"
      emailCol.viewRule = "@request.auth.id != '' && @request.auth.role = 'admin'"
      emailCol.createRule = "@request.auth.id != '' && @request.auth.role = 'admin'"
      emailCol.updateRule = "@request.auth.id != '' && @request.auth.role = 'admin'"
      emailCol.deleteRule = null
      app.save(emailCol)
    } catch (_) {}
  },
  (app) => {
    // Revert logic if ever rolled back
    try {
      const users = app.findCollectionByNameOrId('_pb_users_auth_')
      users.createRule = ''
      users.listRule = "@request.auth.id != ''"
      users.viewRule = "@request.auth.id != ''"
      app.save(users)
    } catch (_) {}
  },
)
