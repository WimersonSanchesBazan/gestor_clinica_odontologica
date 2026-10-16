migrate(
  (app) => {
    const convenios = new Collection({
      name: 'convenios',
      type: 'base',
      listRule: "@request.auth.id != ''",
      viewRule: "@request.auth.id != ''",
      createRule: "@request.auth.id != ''",
      updateRule: "@request.auth.id != ''",
      deleteRule: "@request.auth.id != ''",
      fields: [
        { name: 'nome', type: 'text', required: true },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
    })
    app.save(convenios)

    const agendamentos = new Collection({
      name: 'agendamentos',
      type: 'base',
      listRule: "@request.auth.id != ''",
      viewRule: "@request.auth.id != ''",
      createRule: "@request.auth.id != ''",
      updateRule: "@request.auth.id != ''",
      deleteRule: "@request.auth.id != ''",
      fields: [
        { name: 'paciente', type: 'relation', collectionId: '_pb_users_auth_', maxSelect: 1 },
        { name: 'dataHora', type: 'date', required: true },
        {
          name: 'status',
          type: 'select',
          values: ['agendado', 'confirmado', 'realizado', 'cancelado'],
          maxSelect: 1,
        },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
    })
    app.save(agendamentos)

    const lancamentos = new Collection({
      name: 'lancamentos_financeiros',
      type: 'base',
      listRule: "@request.auth.id != ''",
      viewRule: "@request.auth.id != ''",
      createRule: "@request.auth.id != ''",
      updateRule: "@request.auth.id != ''",
      deleteRule: "@request.auth.id != ''",
      fields: [
        {
          name: 'tipo',
          type: 'select',
          values: ['receita', 'despesa'],
          maxSelect: 1,
          required: true,
        },
        { name: 'valor', type: 'number', required: true },
        { name: 'categoria', type: 'text', required: true },
        { name: 'data', type: 'date', required: true },
        { name: 'dataVencimento', type: 'date' },
        {
          name: 'formaPagamento',
          type: 'select',
          values: ['pix', 'dinheiro', 'cartao_credito', 'cartao_debito', 'boleto', 'transferencia'],
          maxSelect: 1,
          required: true,
        },
        { name: 'parcelas', type: 'number' },
        {
          name: 'status',
          type: 'select',
          values: ['pago', 'pendente', 'vencido', 'glosado', 'cancelado'],
          maxSelect: 1,
          required: true,
        },
        { name: 'paciente', type: 'relation', collectionId: '_pb_users_auth_', maxSelect: 1 },
        { name: 'convenio', type: 'relation', collectionId: convenios.id, maxSelect: 1 },
        { name: 'agendamento', type: 'relation', collectionId: agendamentos.id, maxSelect: 1 },
        { name: 'observacoes', type: 'text' },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
    })
    app.save(lancamentos)
  },
  (app) => {
    app.delete(app.findCollectionByNameOrId('lancamentos_financeiros'))
    app.delete(app.findCollectionByNameOrId('agendamentos'))
    app.delete(app.findCollectionByNameOrId('convenios'))
  },
)
