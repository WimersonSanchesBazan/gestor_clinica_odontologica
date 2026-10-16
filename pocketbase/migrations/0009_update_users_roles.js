migrate(
  (app) => {
    const users = app.findCollectionByNameOrId('_pb_users_auth_')

    // role: admin | gestor | clinico
    if (!users.fields.getByName('role')) {
      users.fields.add(
        new SelectField({
          name: 'role',
          required: false,
          values: ['admin', 'gestor', 'clinico'],
          maxSelect: 1,
        }),
      )
    }

    // ativo: bool (optional to avoid pocketbase required bool issue)
    if (!users.fields.getByName('ativo')) {
      users.fields.add(
        new BoolField({
          name: 'ativo',
          required: false,
        }),
      )
    }

    // customPermissions: json field for fine-grained permissions if needed
    if (!users.fields.getByName('permissions')) {
      users.fields.add(
        new JSONField({
          name: 'permissions',
          required: false,
          maxSize: 524288,
        }),
      )
    }

    // Update users API rules:
    // List/View: Authenticated users can list and view users (needed for team/user admin)
    // Create: Any authenticated admin or public registration (initial registration)
    // Update: Admin can update any user; users can update themselves except role/ativo
    // Delete: Only admin can delete (and cannot delete self if sole admin)
    users.listRule = "@request.auth.id != ''"
    users.viewRule = "@request.auth.id != ''"
    users.createRule = ''
    users.updateRule =
      "@request.auth.id != '' && (@request.auth.role = 'admin' || (id = @request.auth.id && @request.body.role:changed = false && @request.body.ativo:changed = false))"
    users.deleteRule = "@request.auth.id != '' && @request.auth.role = 'admin'"

    app.save(users)
  },
  (app) => {
    const users = app.findCollectionByNameOrId('_pb_users_auth_')
    const roleField = users.fields.getByName('role')
    if (roleField) users.fields.remove(roleField)
    const ativoField = users.fields.getByName('ativo')
    if (ativoField) users.fields.remove(ativoField)
    const permField = users.fields.getByName('permissions')
    if (permField) users.fields.remove(permField)
    app.save(users)
  },
)
