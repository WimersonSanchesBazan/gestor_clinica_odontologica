migrate(
  (app) => {
    // Seed only the default convênios (handy, non-time-sensitive defaults).
    // Example financial entries were removed so a fresh clone starts clean —
    // seeded entries would be stamped with the provisioning date and go stale.
    try {
      app.findFirstRecordByData('convenios', 'nome', 'Unimed')
      return // already seeded
    } catch (_) {}

    const convenios = app.findCollectionByNameOrId('convenios')

    const c1 = new Record(convenios)
    c1.set('nome', 'Unimed')
    app.save(c1)

    const c2 = new Record(convenios)
    c2.set('nome', 'Bradesco Saúde')
    app.save(c2)
  },
  (app) => {},
)
