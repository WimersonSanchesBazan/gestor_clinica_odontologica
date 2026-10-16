migrate(
  (app) => {
    const users = app.findCollectionByNameOrId('users')
    if (!users.fields.getByName('telefone')) {
      users.fields.add(new TextField({ name: 'telefone' }))
    }
    if (!users.fields.getByName('cpf')) {
      users.fields.add(new TextField({ name: 'cpf' }))
    }
    if (!users.fields.getByName('dataNascimento')) {
      users.fields.add(new DateField({ name: 'dataNascimento' }))
    }
    app.save(users)

    const leads = new Collection({
      name: 'crm_leads',
      type: 'base',
      listRule: "@request.auth.id != ''",
      viewRule: "@request.auth.id != ''",
      createRule: "@request.auth.id != ''",
      updateRule: "@request.auth.id != ''",
      deleteRule: null,
      fields: [
        { name: 'nome', type: 'text', required: true },
        { name: 'telefone', type: 'text', required: true },
        { name: 'email', type: 'email' },
        { name: 'procedimentoInteresse', type: 'text', required: true },
        {
          name: 'origem',
          type: 'select',
          required: true,
          values: ['indicacao', 'instagram', 'google', 'site', 'whatsapp', 'outros'],
          maxSelect: 1,
        },
        {
          name: 'etapaFunil',
          type: 'select',
          required: true,
          values: ['novo', 'contato', 'agendado', 'convertido', 'perdido'],
          maxSelect: 1,
        },
        { name: 'tentativasContato', type: 'number' },
        { name: 'ultimaTentativa', type: 'date' },
        { name: 'observacoes', type: 'text' },
        { name: 'motivoPerda', type: 'text' },
        { name: 'pacienteConvertido', type: 'relation', collectionId: users.id, maxSelect: 1 },
        { name: 'dataConversao', type: 'date' },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
    })
    app.save(leads)

    const colabs = app.findCollectionByNameOrId('colaboradores')
    const docs = new Collection({
      name: 'documentos_paciente',
      type: 'base',
      listRule: "@request.auth.id != ''",
      viewRule: "@request.auth.id != ''",
      createRule: "@request.auth.id != ''",
      updateRule: "@request.auth.id != ''",
      deleteRule: "@request.auth.id != ''",
      fields: [
        {
          name: 'paciente',
          type: 'relation',
          required: true,
          collectionId: users.id,
          maxSelect: 1,
          cascadeDelete: true,
        },
        {
          name: 'arquivo',
          type: 'file',
          required: true,
          maxSelect: 1,
          maxSize: 10485760,
          mimeTypes: ['application/pdf', 'image/jpeg', 'image/png', 'image/webp'],
        },
        {
          name: 'tipo',
          type: 'select',
          required: true,
          values: [
            'receita',
            'atestado',
            'pedido_exame',
            'resultado',
            'documento_pessoal',
            'outros',
          ],
          maxSelect: 1,
        },
        { name: 'descricao', type: 'text' },
        { name: 'data', type: 'date', required: true },
        { name: 'criadoPor', type: 'relation', collectionId: colabs.id, maxSelect: 1 },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
    })
    app.save(docs)
  },
  (app) => {
    try {
      app.delete(app.findCollectionByNameOrId('documentos_paciente'))
    } catch (e) {}
    try {
      app.delete(app.findCollectionByNameOrId('crm_leads'))
    } catch (e) {}
  },
)
