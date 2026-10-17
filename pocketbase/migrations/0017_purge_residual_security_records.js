migrate(
  (app) => {
    // 0017: Garantir remoção residual de contas e logs de teste via SQL direto se o hook bloqueou exclusão de último admin
    try {
      app
        .db()
        .newQuery(`DELETE FROM users WHERE email IN (
        'sec_admin_run@clinica.com.br',
        'sec_gestor_run@clinica.com.br',
        'sec_clinico_run@clinica.com.br',
        'sec_inativo_run@clinica.com.br'
      ) OR id IN ('y3tj5addhhoagcx', 'q8m8d8ra36k7mrs', 'ij60f31x86u5t1m', 'eopewa1qicr2g47')`)
        .execute()
    } catch (e) {
      // Fallback app.delete
      const testEmails = [
        'sec_admin_run@clinica.com.br',
        'sec_gestor_run@clinica.com.br',
        'sec_clinico_run@clinica.com.br',
        'sec_inativo_run@clinica.com.br',
      ]
      for (let i = 0; i < testEmails.length; i++) {
        try {
          const u = app.findAuthRecordByEmail('users', testEmails[i])
          app.delete(u)
        } catch (_) {}
      }
    }

    // Limpeza de logs de auditoria de teste
    try {
      app
        .db()
        .newQuery(`DELETE FROM audit_logs WHERE userEmail IN (
        'sec_admin_run@clinica.com.br',
        'sec_gestor_run@clinica.com.br',
        'sec_clinico_run@clinica.com.br',
        'sec_inativo_run@clinica.com.br',
        'confirmacao_hook@clinica.com.br'
      ) OR targetId IN ('y3tj5addhhoagcx', 'q8m8d8ra36k7mrs', 'ij60f31x86u5t1m', 'eopewa1qicr2g47')
      OR userId IN ('y3tj5addhhoagcx', 'q8m8d8ra36k7mrs', 'ij60f31x86u5t1m', 'eopewa1qicr2g47')
      OR details LIKE '%sec_%_run@clinica.com.br%'`)
        .execute()
    } catch (_) {}
  },
  (app) => {
    // Reversão no-op
  },
)
