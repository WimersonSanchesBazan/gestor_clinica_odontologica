migrate(
  (app) => {
    // Update permissions on existing collections according to roles
    // lancamentos_financeiros: admin and gestor only, or authorized
    try {
      const fin = app.findCollectionByNameOrId('lancamentos_financeiros')
      fin.listRule =
        "@request.auth.id != '' && (@request.auth.role = 'admin' || @request.auth.role = 'gestor' || @request.auth.role = '')"
      fin.viewRule =
        "@request.auth.id != '' && (@request.auth.role = 'admin' || @request.auth.role = 'gestor' || @request.auth.role = '')"
      fin.createRule =
        "@request.auth.id != '' && (@request.auth.role = 'admin' || @request.auth.role = 'gestor')"
      fin.updateRule =
        "@request.auth.id != '' && (@request.auth.role = 'admin' || @request.auth.role = 'gestor')"
      fin.deleteRule = "@request.auth.id != '' && @request.auth.role = 'admin'"
      app.save(fin)
    } catch (_) {}

    // colaboradores: admin and gestor can view/edit; only admin can delete
    try {
      const colab = app.findCollectionByNameOrId('colaboradores')
      colab.listRule = "@request.auth.id != ''"
      colab.viewRule = "@request.auth.id != ''"
      colab.createRule =
        "@request.auth.id != '' && (@request.auth.role = 'admin' || @request.auth.role = 'gestor')"
      colab.updateRule =
        "@request.auth.id != '' && (@request.auth.role = 'admin' || @request.auth.role = 'gestor')"
      colab.deleteRule = "@request.auth.id != '' && @request.auth.role = 'admin'"
      app.save(colab)
    } catch (_) {}
  },
  (app) => {
    // revert
  },
)
