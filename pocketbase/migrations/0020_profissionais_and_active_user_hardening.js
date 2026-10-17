migrate(
  (app) => {
    // 1. Atualizar coleção profissionais para atender ao Item 6
    // nome, especialidade (opcional), cor (para a Agenda), ativo, e relação opcional com users.
    // NÃO incluir e-mail, role, permissions ou qualquer dado de autenticação.
    // Regras: list/view para usuário autenticado ativo; create/update/delete apenas admin.
    const profCol = app.findCollectionByNameOrId('profissionais')

    if (!profCol.fields.getByName('cor')) {
      profCol.fields.add(new TextField({ name: 'cor' }))
    }
    if (!profCol.fields.getByName('ativo')) {
      profCol.fields.add(new BoolField({ name: 'ativo' }))
    }
    if (!profCol.fields.getByName('user_id')) {
      profCol.fields.add(
        new RelationField({
          name: 'user_id',
          collectionId: '_pb_users_auth_',
          maxSelect: 1,
        }),
      )
    }

    profCol.listRule = "@request.auth.id != '' && @request.auth.ativo = true"
    profCol.viewRule = "@request.auth.id != '' && @request.auth.ativo = true"
    profCol.createRule =
      "@request.auth.id != '' && @request.auth.ativo = true && @request.auth.role = 'admin'"
    profCol.updateRule =
      "@request.auth.id != '' && @request.auth.ativo = true && @request.auth.role = 'admin'"
    profCol.deleteRule =
      "@request.auth.id != '' && @request.auth.ativo = true && @request.auth.role = 'admin'"

    app.save(profCol)

    // 2. Endurecer todas as coleções de dados com @request.auth.ativo = true (Item 2)
    // users
    const users = app.findCollectionByNameOrId('_pb_users_auth_')
    users.listRule =
      "@request.auth.id != '' && @request.auth.ativo = true && (@request.auth.role = 'admin' || id = @request.auth.id)"
    users.viewRule =
      "@request.auth.id != '' && @request.auth.ativo = true && (@request.auth.role = 'admin' || id = @request.auth.id)"
    users.createRule =
      "@request.auth.id != '' && @request.auth.ativo = true && @request.auth.role = 'admin'"
    users.updateRule =
      "@request.auth.id != '' && @request.auth.ativo = true && (@request.auth.role = 'admin' || (id = @request.auth.id && @request.body.role:changed = false && @request.body.ativo:changed = false && @request.body.permissions:changed = false && @request.body.email:changed = false))"
    users.deleteRule =
      "@request.auth.id != '' && @request.auth.ativo = true && @request.auth.role = 'admin'"
    app.save(users)

    // convenios
    try {
      const conv = app.findCollectionByNameOrId('convenios')
      conv.listRule = "@request.auth.id != '' && @request.auth.ativo = true"
      conv.viewRule = "@request.auth.id != '' && @request.auth.ativo = true"
      conv.createRule =
        "@request.auth.id != '' && @request.auth.ativo = true && (@request.auth.role = 'admin' || @request.auth.role = 'gestor')"
      conv.updateRule =
        "@request.auth.id != '' && @request.auth.ativo = true && (@request.auth.role = 'admin' || @request.auth.role = 'gestor')"
      conv.deleteRule =
        "@request.auth.id != '' && @request.auth.ativo = true && @request.auth.role = 'admin'"
      app.save(conv)
    } catch (_) {}

    // agendamentos
    try {
      const agend = app.findCollectionByNameOrId('agendamentos')
      agend.listRule = "@request.auth.id != '' && @request.auth.ativo = true"
      agend.viewRule = "@request.auth.id != '' && @request.auth.ativo = true"
      agend.createRule = "@request.auth.id != '' && @request.auth.ativo = true"
      agend.updateRule = "@request.auth.id != '' && @request.auth.ativo = true"
      agend.deleteRule =
        "@request.auth.id != '' && @request.auth.ativo = true && (@request.auth.role = 'admin' || @request.auth.role = 'gestor')"
      app.save(agend)
    } catch (_) {}

    // lancamentos_financeiros
    try {
      const fin = app.findCollectionByNameOrId('lancamentos_financeiros')
      fin.listRule =
        "@request.auth.id != '' && @request.auth.ativo = true && (@request.auth.role = 'admin' || @request.auth.role = 'gestor')"
      fin.viewRule =
        "@request.auth.id != '' && @request.auth.ativo = true && (@request.auth.role = 'admin' || @request.auth.role = 'gestor')"
      fin.createRule =
        "@request.auth.id != '' && @request.auth.ativo = true && (@request.auth.role = 'admin' || @request.auth.role = 'gestor')"
      fin.updateRule =
        "@request.auth.id != '' && @request.auth.ativo = true && (@request.auth.role = 'admin' || @request.auth.role = 'gestor')"
      fin.deleteRule =
        "@request.auth.id != '' && @request.auth.ativo = true && @request.auth.role = 'admin'"
      app.save(fin)
    } catch (_) {}

    // colaboradores
    try {
      const colab = app.findCollectionByNameOrId('colaboradores')
      colab.listRule = "@request.auth.id != '' && @request.auth.ativo = true"
      colab.viewRule = "@request.auth.id != '' && @request.auth.ativo = true"
      colab.createRule =
        "@request.auth.id != '' && @request.auth.ativo = true && (@request.auth.role = 'admin' || @request.auth.role = 'gestor')"
      colab.updateRule =
        "@request.auth.id != '' && @request.auth.ativo = true && (@request.auth.role = 'admin' || @request.auth.role = 'gestor')"
      colab.deleteRule =
        "@request.auth.id != '' && @request.auth.ativo = true && @request.auth.role = 'admin'"
      app.save(colab)
    } catch (_) {}

    // crm_leads
    try {
      const crm = app.findCollectionByNameOrId('crm_leads')
      crm.listRule = "@request.auth.id != '' && @request.auth.ativo = true"
      crm.viewRule = "@request.auth.id != '' && @request.auth.ativo = true"
      crm.createRule = "@request.auth.id != '' && @request.auth.ativo = true"
      crm.updateRule = "@request.auth.id != '' && @request.auth.ativo = true"
      app.save(crm)
    } catch (_) {}

    // documentos_paciente
    try {
      const doc = app.findCollectionByNameOrId('documentos_paciente')
      doc.listRule = "@request.auth.id != '' && @request.auth.ativo = true"
      doc.viewRule = "@request.auth.id != '' && @request.auth.ativo = true"
      doc.createRule = "@request.auth.id != '' && @request.auth.ativo = true"
      doc.updateRule = "@request.auth.id != '' && @request.auth.ativo = true"
      doc.deleteRule =
        "@request.auth.id != '' && @request.auth.ativo = true && (@request.auth.role = 'admin' || @request.auth.role = 'gestor')"
      app.save(doc)
    } catch (_) {}

    // audit_logs
    try {
      const audit = app.findCollectionByNameOrId('audit_logs')
      audit.listRule =
        "@request.auth.id != '' && @request.auth.ativo = true && (@request.auth.role = 'admin' || @request.auth.role = 'gestor')"
      audit.viewRule =
        "@request.auth.id != '' && @request.auth.ativo = true && (@request.auth.role = 'admin' || @request.auth.role = 'gestor')"
      audit.createRule = null
      audit.updateRule = null
      audit.deleteRule = null
      app.save(audit)
    } catch (_) {}

    // email_settings
    try {
      const em = app.findCollectionByNameOrId('email_settings')
      em.listRule =
        "@request.auth.id != '' && @request.auth.ativo = true && @request.auth.role = 'admin'"
      em.viewRule =
        "@request.auth.id != '' && @request.auth.ativo = true && @request.auth.role = 'admin'"
      em.createRule =
        "@request.auth.id != '' && @request.auth.ativo = true && @request.auth.role = 'admin'"
      em.updateRule =
        "@request.auth.id != '' && @request.auth.ativo = true && @request.auth.role = 'admin'"
      em.deleteRule = null
      app.save(em)
    } catch (_) {}
  },
  (app) => {
    // Revert logic
  },
)
