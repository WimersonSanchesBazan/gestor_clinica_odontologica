migrate(
  (app) => {
    // 1. Audit Logs: Disallow client-side creation completely.
    // Client creation must be strictly null so neither authenticated users, gestor, nor admin
    // can forge audit events directly through the REST API.
    // Server hooks bypass createRule using e.app.save(log) internally.
    try {
      const audit = app.findCollectionByNameOrId('audit_logs')
      audit.listRule =
        "@request.auth.id != '' && (@request.auth.role = 'admin' || @request.auth.role = 'gestor')"
      audit.viewRule =
        "@request.auth.id != '' && (@request.auth.role = 'admin' || @request.auth.role = 'gestor')"
      audit.createRule = null
      audit.updateRule = null
      audit.deleteRule = null
      app.save(audit)
    } catch (err) {
      console.error('Erro ao atualizar regras de audit_logs:', err)
    }

    // 2. Users Collection: Principle of Least Privilege
    // Requirement:
    // - Admin can list and view all users;
    // - Clinico and Gestor can only view/list their own record (id = @request.auth.id);
    //   Gestor does not have technical administration or visibility over admins/all accounts.
    // If gestor needs team information, it is provided via the 'colaboradores' collection
    // (minimal professional data), not via the sensitive 'users' collection.
    try {
      const users = app.findCollectionByNameOrId('_pb_users_auth_')
      users.listRule =
        "@request.auth.id != '' && (@request.auth.role = 'admin' || id = @request.auth.id)"
      users.viewRule =
        "@request.auth.id != '' && (@request.auth.role = 'admin' || id = @request.auth.id)"
      users.createRule = "@request.auth.id != '' && @request.auth.role = 'admin'"
      users.updateRule =
        "@request.auth.id != '' && (@request.auth.role = 'admin' || (id = @request.auth.id && @request.body.role:changed = false && @request.body.ativo:changed = false && @request.body.permissions:changed = false && @request.body.email:changed = false))"
      users.deleteRule = "@request.auth.id != '' && @request.auth.role = 'admin'"
      app.save(users)
    } catch (err) {
      console.error('Erro ao atualizar regras de users:', err)
    }
  },
  (app) => {
    // Revert logic
    try {
      const audit = app.findCollectionByNameOrId('audit_logs')
      audit.createRule =
        "@request.auth.id != '' && (@request.auth.role = 'admin' || @request.auth.role = 'gestor')"
      app.save(audit)
    } catch (_) {}

    try {
      const users = app.findCollectionByNameOrId('_pb_users_auth_')
      users.listRule =
        "@request.auth.id != '' && (@request.auth.role = 'admin' || @request.auth.role = 'gestor' || id = @request.auth.id)"
      users.viewRule =
        "@request.auth.id != '' && (@request.auth.role = 'admin' || @request.auth.role = 'gestor' || id = @request.auth.id)"
      app.save(users)
    } catch (_) {}
  },
)
