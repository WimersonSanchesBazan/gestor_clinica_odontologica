migrate(
  (app) => {
    const profissionais = new Collection({
      name: 'profissionais',
      type: 'base',
      listRule: "@request.auth.id != ''",
      viewRule: "@request.auth.id != ''",
      createRule: "@request.auth.id != ''",
      updateRule: "@request.auth.id != ''",
      deleteRule: "@request.auth.id != ''",
      fields: [
        { name: 'nome', type: 'text', required: true },
        { name: 'especialidade', type: 'text' },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
    })
    app.save(profissionais)

    const colaboradores = new Collection({
      name: 'colaboradores',
      type: 'base',
      listRule: "@request.auth.id != ''",
      viewRule: "@request.auth.id != ''",
      createRule: "@request.auth.id != ''",
      updateRule: "@request.auth.id != ''",
      deleteRule: "@request.auth.id != ''",
      fields: [
        { name: 'nome', type: 'text', required: true, min: 3 },
        { name: 'cpf', type: 'text', required: true },
        {
          name: 'cargo',
          type: 'select',
          required: true,
          maxSelect: 1,
          values: [
            'Médico',
            'Dentista',
            'Fisioterapeuta',
            'Secretária',
            'Enfermeiro',
            'Psicólogo',
            'Recepcionista',
            'Gerente',
            'Outros',
          ],
        },
        {
          name: 'tipoContrato',
          type: 'select',
          required: true,
          maxSelect: 1,
          values: ['clt', 'pj', 'estagio'],
        },
        { name: 'dataAdmissao', type: 'date', required: true },
        { name: 'salario', type: 'number', required: true },
        {
          name: 'perfilAcesso',
          type: 'select',
          required: true,
          maxSelect: 1,
          values: ['admin', 'medico', 'secretaria', 'financeiro'],
        },
        { name: 'email', type: 'email' },
        { name: 'telefone', type: 'text' },
        { name: 'ativo', type: 'bool' },
        {
          name: 'profissionalVinculado',
          type: 'relation',
          maxSelect: 1,
          collectionId: profissionais.id,
        },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
    })
    app.save(colaboradores)

    const colColab = app.findCollectionByNameOrId('colaboradores')
    colColab.addIndex('idx_colaboradores_cpf', true, 'cpf', '')
    app.save(colColab)
  },
  (app) => {
    try {
      app.delete(app.findCollectionByNameOrId('colaboradores'))
    } catch (_) {}
    try {
      app.delete(app.findCollectionByNameOrId('profissionais'))
    } catch (_) {}
  },
)
