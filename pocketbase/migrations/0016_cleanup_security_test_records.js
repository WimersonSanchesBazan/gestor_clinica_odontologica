migrate(
  (app) => {
    // Limpeza das 4 contas de teste criadas durante a bateria de testes de segurança
    const testEmails = [
      'sec_admin_run@clinica.com.br',
      'sec_gestor_run@clinica.com.br',
      'sec_clinico_run@clinica.com.br',
      'sec_inativo_run@clinica.com.br',
    ]

    // Deletar usuários de teste por email e por ID para garantir exclusão completa
    for (let i = 0; i < testEmails.length; i++) {
      const email = testEmails[i]
      try {
        const user = app.findAuthRecordByEmail('_pb_users_auth_', email)
        app.delete(user)
      } catch (_) {
        // Usuário não existe ou já foi excluído
      }
      try {
        const userRec = app.findAuthRecordByEmail('users', email)
        app.delete(userRec)
      } catch (_) {}
    }

    const testUserIds = ['y3tj5addhhoagcx', 'q8m8d8ra36k7mrs', 'ij60f31x86u5t1m', 'eopewa1qicr2g47']
    for (let i = 0; i < testUserIds.length; i++) {
      try {
        const u = app.findRecordById('_pb_users_auth_', testUserIds[i])
        app.delete(u)
      } catch (_) {}
      try {
        const u = app.findRecordById('users', testUserIds[i])
        app.delete(u)
      } catch (_) {}
    }

    // Limpeza de logs de auditoria gerados exclusivamente pelas contas de teste ou seus IDs
    const testIds = ['y3tj5addhhoagcx', 'q8m8d8ra36k7mrs', 'ij60f31x86u5t1m', 'eopewa1qicr2g47']

    try {
      const confirmLog = app.findRecordsByFilter(
        'audit_logs',
        "userEmail = 'confirmacao_hook@clinica.com.br'",
        '',
        50,
        0,
      )
      for (let k = 0; k < confirmLog.length; k++) {
        try {
          app.delete(confirmLog[k])
        } catch (_) {}
      }
    } catch (_) {}

    for (let i = 0; i < testEmails.length; i++) {
      const email = testEmails[i]
      try {
        const logs = app.findRecordsByFilter(
          'audit_logs',
          "userEmail = '" + email + "' || details ~ '" + email + "'",
          '',
          200,
          0,
        )
        for (let j = 0; j < logs.length; j++) {
          try {
            app.delete(logs[j])
          } catch (_) {}
        }
      } catch (_) {}
    }

    for (let i = 0; i < testIds.length; i++) {
      const targetId = testIds[i]
      try {
        const logs = app.findRecordsByFilter(
          'audit_logs',
          "targetId = '" + targetId + "' || userId = '" + targetId + "'",
          '',
          200,
          0,
        )
        for (let j = 0; j < logs.length; j++) {
          try {
            app.delete(logs[j])
          } catch (_) {}
        }
      } catch (_) {}
    }
  },
  (app) => {
    // Reversão no-op
  },
)
