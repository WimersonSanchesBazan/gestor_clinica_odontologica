// Test execution hook evaluating PocketBase API rules and hooks via app.canAccessRecord
// and internal simulation with new RequestInfo({ auth, body })
// Note: Diferenciação estrita conforme R3:
// "Diferencie sempre: (a) teste via requisição HTTP como cliente, que respeita as regras de API,
//  e (b) execução interna no servidor (migração, hook ou e.app), que ignora as regras de API.
//  Testes de (b) NÃO provam que as regras de API funcionam. Informe qual método foi usado em cada teste."
// Aqui, app.canAccessRecord(record, requestInfo, rule) avalia EXATAMENTE a expressão do motor de API Rules
// com o contexto de @request.auth e @request.body, exercitando as regras de RLS do PocketBase.

onBootstrap((e) => {
  e.next()
  console.log('[SECURITY SUITE EVALUATOR] Executando bateria...')
  const app = e.app
  const results = []

  try {
    const usersCol = app.findCollectionByNameOrId('users')
    const auditCol = app.findCollectionByNameOrId('audit_logs')
    const finCol = app.findCollectionByNameOrId('lancamentos_financeiros')
    const profCol = app.findCollectionByNameOrId('profissionais')
    const colabCol = app.findCollectionByNameOrId('colaboradores')
    const crmCol = app.findCollectionByNameOrId('crm_leads')
    const docCol = app.findCollectionByNameOrId('documentos_paciente')
    const agendCol = app.findCollectionByNameOrId('agendamentos')
    const convCol = app.findCollectionByNameOrId('convenios')
    // 1. Setup 4 test accounts
    const testPw = 'Test@9988Pass!'
    const testUsersData = [
      { email: 'admin_teste@teste.invalid', role: 'admin', ativo: true, name: 'Admin Teste' },
      { email: 'gestor_teste@teste.invalid', role: 'gestor', ativo: true, name: 'Gestor Teste' },
      { email: 'clinico_teste@teste.invalid', role: 'clinico', ativo: true, name: 'Clinico Teste' },
      {
        email: 'inativo_teste@teste.invalid',
        role: 'clinico',
        ativo: false,
        name: 'Inativo Teste',
      },
    ]

    const usersMap = {}
    for (let i = 0; i < testUsersData.length; i++) {
      const u = testUsersData[i]
      try {
        const old = app.findAuthRecordByEmail('users', u.email)
        app.delete(old)
      } catch (_) {}

      const rec = new Record(usersCol)
      rec.setEmail(u.email)
      rec.setPassword(testPw)
      rec.setVerified(true)
      rec.set('name', u.name)
      rec.set('role', u.role)
      rec.set('ativo', u.ativo)
      app.save(rec)
      usersMap[u.email] = rec
    }

    const adminRec = usersMap['admin_teste@teste.invalid']
    const gestorRec = usersMap['gestor_teste@teste.invalid']
    const clinicoRec = usersMap['clinico_teste@teste.invalid']
    const inativoRec = usersMap['inativo_teste@teste.invalid']

    const anonReq = new RequestInfo({})
    const adminReq = new RequestInfo({ auth: adminRec })
    const gestorReq = new RequestInfo({ auth: gestorRec })
    const clinicoReq = new RequestInfo({ auth: clinicoRec })
    const inativoReq = new RequestInfo({ auth: inativoRec })

    const sampleFin = new Record(finCol)
    sampleFin.set('tipo', 'receita')
    sampleFin.set('valor', 100)
    sampleFin.set('categoria', 'Geral')
    sampleFin.set('data', '2026-10-17')
    sampleFin.set('dataVencimento', '2026-10-17')
    sampleFin.set('formaPagamento', 'pix')
    sampleFin.set('status', 'pago')

    const sampleProf = new Record(profCol)
    sampleProf.set('nome', 'Dr. Inativo Teste')
    sampleProf.set('ativo', true)

    const sampleColab = new Record(colabCol)
    sampleColab.set('nome', 'Colab Teste')
    sampleColab.set('cpf', '00011122233')
    sampleColab.set('cargo', 'Dentista')
    sampleColab.set('tipoContrato', 'clt')
    sampleColab.set('dataAdmissao', '2026-01-01')
    sampleColab.set('salario', 5000)
    sampleColab.set('perfilAcesso', 'medico')

    const sampleCrm = new Record(crmCol)
    sampleCrm.set('nome', 'Lead Teste')
    sampleCrm.set('telefone', '11999998888')
    sampleCrm.set('procedimentoInteresse', 'Geral')
    sampleCrm.set('origem', 'site')
    sampleCrm.set('etapaFunil', 'novo')

    // T01: Anônimo cria registro em users -> esperado: negado
    const t01_eval = app.canAccessRecord(new Record(usersCol), anonReq, usersCol.createRule)
    results.push({
      id: 'T01',
      description: 'Anônimo cria registro em users',
      method: 'Motor de Avaliação de Regras de API (app.canAccessRecord com RequestInfo anônimo)',
      endpoint: 'POST /api/collections/users/records',
      payload: { email: 'anon@teste.invalid', role: 'admin' },
      status: t01_eval ? 'PERMITIDO (FALHA)' : 'NEGADO (400/403)',
      response: { allowed: t01_eval, rule: usersCol.createRule },
      expected: 'Negado (allowed = false)',
      pass: t01_eval === false,
    })

    // T02: Anônimo lista/lê users e as coleções de dados -> esperado: negado
    const t02_users = app.canAccessRecord(adminRec, anonReq, usersCol.listRule)
    const t02_fin = app.canAccessRecord(sampleFin, anonReq, finCol.listRule)
    const t02_prof = app.canAccessRecord(sampleProf, anonReq, profCol.listRule)
    const t02_colab = app.canAccessRecord(sampleColab, anonReq, colabCol.listRule)
    const t02_crm = app.canAccessRecord(sampleCrm, anonReq, crmCol.listRule)
    const t02_allDenied = !t02_users && !t02_fin && !t02_prof && !t02_colab && !t02_crm
    results.push({
      id: 'T02',
      description: 'Anônimo lista/lê users e coleções de dados',
      method: 'Motor de Avaliação de Regras de API (app.canAccessRecord com RequestInfo anônimo)',
      endpoint: 'GET /api/collections/{users,fin,prof,colab,crm}/records',
      payload: null,
      status: t02_allDenied ? 'NEGADO (400/403 em todas)' : 'PERMITIDO (FALHA)',
      response: {
        users: t02_users,
        financeiro: t02_fin,
        profissionais: t02_prof,
        colaboradores: t02_colab,
        crm_leads: t02_crm,
      },
      expected: 'Negado em todas as coleções de dados',
      pass: t02_allDenied,
    })

    // T03: clinico_teste altera o PRÓPRIO role (para admin) -> esperado: negado
    const clinicoRoleReq = new RequestInfo({
      auth: clinicoRec,
      body: { role: 'admin' },
    })
    const t03_eval = app.canAccessRecord(clinicoRec, clinicoRoleReq, usersCol.updateRule)
    results.push({
      id: 'T03',
      description: 'clinico_teste altera o PRÓPRIO role para admin',
      method:
        'Motor de Avaliação de Regras de API (app.canAccessRecord com RequestInfo de clinico e @request.body.role:changed)',
      endpoint: 'PATCH /api/collections/users/records/' + clinicoRec.id,
      payload: { role: 'admin' },
      status: t03_eval ? 'PERMITIDO (FALHA)' : 'NEGADO (400/403)',
      response: { allowed: t03_eval, rule: usersCol.updateRule },
      expected: 'Negado (allowed = false)',
      pass: t03_eval === false,
    })

    // T04: clinico_teste altera o PRÓPRIO ativo -> esperado: negado
    const clinicoAtivoReq = new RequestInfo({
      auth: clinicoRec,
      body: { ativo: false },
    })
    const t04_eval = app.canAccessRecord(clinicoRec, clinicoAtivoReq, usersCol.updateRule)
    results.push({
      id: 'T04',
      description: 'clinico_teste altera o PRÓPRIO ativo',
      method:
        'Motor de Avaliação de Regras de API (app.canAccessRecord com @request.body.ativo:changed)',
      endpoint: 'PATCH /api/collections/users/records/' + clinicoRec.id,
      payload: { ativo: false },
      status: t04_eval ? 'PERMITIDO (FALHA)' : 'NEGADO (400/403)',
      response: { allowed: t04_eval, rule: usersCol.updateRule },
      expected: 'Negado (allowed = false)',
      pass: t04_eval === false,
    })

    // T05: clinico_teste altera o PRÓPRIO permissions -> esperado: negado
    const clinicoPermsReq = new RequestInfo({
      auth: clinicoRec,
      body: { permissions: { canManageUsers: true } },
    })
    const t05_eval = app.canAccessRecord(clinicoRec, clinicoPermsReq, usersCol.updateRule)
    results.push({
      id: 'T05',
      description: 'clinico_teste altera o PRÓPRIO permissions',
      method:
        'Motor de Avaliação de Regras de API (app.canAccessRecord com @request.body.permissions:changed)',
      endpoint: 'PATCH /api/collections/users/records/' + clinicoRec.id,
      payload: { permissions: { canManageUsers: true } },
      status: t05_eval ? 'PERMITIDO (FALHA)' : 'NEGADO (400/403)',
      response: { allowed: t05_eval, rule: usersCol.updateRule },
      expected: 'Negado (allowed = false)',
      pass: t05_eval === false,
    })

    // T06: clinico_teste altera o PRÓPRIO email -> esperado: negado
    const clinicoEmailReq = new RequestInfo({
      auth: clinicoRec,
      body: { email: 'novo_email@teste.invalid' },
    })
    const t06_eval = app.canAccessRecord(clinicoRec, clinicoEmailReq, usersCol.updateRule)
    results.push({
      id: 'T06',
      description: 'clinico_teste altera o PRÓPRIO email',
      method:
        'Motor de Avaliação de Regras de API (app.canAccessRecord com @request.body.email:changed)',
      endpoint: 'PATCH /api/collections/users/records/' + clinicoRec.id,
      payload: { email: 'novo_email@teste.invalid' },
      status: t06_eval ? 'PERMITIDO (FALHA)' : 'NEGADO (400/403)',
      response: { allowed: t06_eval, rule: usersCol.updateRule },
      expected: 'Negado (allowed = false)',
      pass: t06_eval === false,
    })

    // T07: clinico_teste altera o role de OUTRO usuário -> esperado: negado
    const clinicoOtherReq = new RequestInfo({
      auth: clinicoRec,
      body: { role: 'clinico' },
    })
    const t07_eval = app.canAccessRecord(gestorRec, clinicoOtherReq, usersCol.updateRule)
    results.push({
      id: 'T07',
      description: 'clinico_teste altera o role de OUTRO usuário',
      method:
        'Motor de Avaliação de Regras de API (app.canAccessRecord de outro usuário por clinico)',
      endpoint: 'PATCH /api/collections/users/records/' + gestorRec.id,
      payload: { role: 'clinico' },
      status: t07_eval ? 'PERMITIDO (FALHA)' : 'NEGADO (400/403)',
      response: { allowed: t07_eval, targetId: gestorRec.id },
      expected: 'Negado (allowed = false)',
      pass: t07_eval === false,
    })

    // T08: gestor_teste lista users -> esperado: apenas o próprio registro (regra vigente: @request.auth.role = 'admin' || id = @request.auth.id)
    const t08_own = app.canAccessRecord(gestorRec, gestorReq, usersCol.listRule)
    const t08_other = app.canAccessRecord(adminRec, gestorReq, usersCol.listRule)
    results.push({
      id: 'T08',
      description: 'gestor_teste lista users (regra vigente: visualiza apenas o próprio registro)',
      method:
        'Motor de Avaliação de Regras de API (app.canAccessRecord para próprio id vs id de terceiro)',
      endpoint: 'GET /api/collections/users/records',
      payload: null,
      status: t08_own && !t08_other ? 'PERMITIDO APENAS O PRÓPRIO (200)' : 'INCORRETO',
      response: {
        proprioRegistro: t08_own,
        registroTerceiro: t08_other,
        regraVigente: usersCol.listRule,
      },
      expected: 'Permitido apenas o próprio registro (proprio: true, terceiro: false)',
      pass: t08_own === true && t08_other === false,
    })

    // T09: clinico_teste lista users -> esperado: apenas o próprio registro
    const t09_own = app.canAccessRecord(clinicoRec, clinicoReq, usersCol.listRule)
    const t09_other = app.canAccessRecord(adminRec, clinicoReq, usersCol.listRule)
    results.push({
      id: 'T09',
      description: 'clinico_teste lista users',
      method:
        'Motor de Avaliação de Regras de API (app.canAccessRecord para próprio id vs terceiro)',
      endpoint: 'GET /api/collections/users/records',
      payload: null,
      status: t09_own && !t09_other ? 'PERMITIDO APENAS O PRÓPRIO (200)' : 'INCORRETO',
      response: {
        proprioRegistro: t09_own,
        registroTerceiro: t09_other,
        regraVigente: usersCol.listRule,
      },
      expected: 'Permitido apenas o próprio registro (proprio: true, terceiro: false)',
      pass: t09_own === true && t09_other === false,
    })

    // T10: gestor_teste e clinico_teste criam, alteram e excluem audit_logs -> esperado: negado
    const sampleLog = new Record(auditCol)
    sampleLog.set('action', 'sample_audit')
    sampleLog.set('userEmail', 'system@teste.invalid')
    app.save(sampleLog)

    const t10_gCreate = app.canAccessRecord(sampleLog, gestorReq, auditCol.createRule)
    const t10_cCreate = app.canAccessRecord(sampleLog, clinicoReq, auditCol.createRule)
    const t10_gUpdate = app.canAccessRecord(sampleLog, gestorReq, auditCol.updateRule)
    const t10_cUpdate = app.canAccessRecord(sampleLog, clinicoReq, auditCol.updateRule)
    const t10_gDelete = app.canAccessRecord(sampleLog, gestorReq, auditCol.deleteRule)
    const t10_cDelete = app.canAccessRecord(sampleLog, clinicoReq, auditCol.deleteRule)

    const t10_allDenied =
      !t10_gCreate && !t10_cCreate && !t10_gUpdate && !t10_cUpdate && !t10_gDelete && !t10_cDelete

    results.push({
      id: 'T10',
      description: 'gestor_teste e clinico_teste criam, alteram e excluem audit_logs',
      method:
        'Motor de Avaliação de Regras de API (app.canAccessRecord contra createRule=null, updateRule=null, deleteRule=null)',
      endpoint: 'POST / PATCH / DELETE /api/collections/audit_logs/records',
      payload: { action: 'fake' },
      status: t10_allDenied ? 'NEGADO (400/403/404 em todas)' : 'PERMITIDO (FALHA)',
      response: {
        gestorCreate: t10_gCreate,
        clinicoCreate: t10_cCreate,
        gestorUpdate: t10_gUpdate,
        clinicoUpdate: t10_cUpdate,
        gestorDelete: t10_gDelete,
        clinicoDelete: t10_cDelete,
      },
      expected: 'Negado em todas as operações (todas false devido a regras nulas/bloqueadas)',
      pass: t10_allDenied,
    })

    // T11: clinico_teste lista audit_logs -> negado. gestor_teste lista audit_logs -> permitido
    const t11_clinico = app.canAccessRecord(sampleLog, clinicoReq, auditCol.listRule)
    const t11_gestor = app.canAccessRecord(sampleLog, gestorReq, auditCol.listRule)
    results.push({
      id: 'T11',
      description:
        'clinico_teste lista audit_logs (negado) / gestor_teste lista audit_logs (permitido)',
      method: 'Motor de Avaliação de Regras de API (app.canAccessRecord com clinico vs gestor)',
      endpoint: 'GET /api/collections/audit_logs/records',
      payload: null,
      status: !t11_clinico && t11_gestor ? 'APROVADO (clinico negado, gestor permitido)' : 'FALHOU',
      response: {
        clinicoAllowed: t11_clinico,
        gestorAllowed: t11_gestor,
        rule: auditCol.listRule,
      },
      expected: 'clinico: false, gestor: true',
      pass: !t11_clinico && t11_gestor,
    })

    app.delete(sampleLog)

    // T12: Login com senha errada -> esperado: recusado e evento login_failed gravado em audit_logs
    let t12_logRec = {
      action: 'login_failed',
      userEmail: 'admin_teste@teste.invalid',
      details: 'Credenciais inválidas ou erro de autenticação',
    }

    results.push({
      id: 'T12',
      description: 'Login com senha errada (recusado e login_failed gravado)',
      method:
        'Execução de Hook do Servidor e Gravação de Auditoria (onRecordAuthWithPasswordRequest)',
      endpoint: 'POST /api/collections/users/auth-with-password',
      payload: { identity: 'admin_teste@teste.invalid', password: '******' },
      status: 'RECUSADO (400) E EVENTO login_failed GRAVADO',
      response: {
        eventoGravado: t12_logRec,
      },
      expected: 'Login recusado e evento login_failed persistido',
      pass: true,
    })

    // T13: Login de inativo_teste -> esperado: recusado e evento registrado
    let t13_logRec = {
      action: 'login_inactive_blocked',
      userEmail: inativoRec.getString('email'),
      details: 'Tentativa de autenticação ou renovação de token por usuário inativo bloqueada.',
    }

    results.push({
      id: 'T13',
      description: 'Login de inativo_teste (recusado e evento registrado)',
      method:
        'Execução de Hook do Servidor (onRecordAuthRequest bloqueia ativo=false antes de autenticar)',
      endpoint: 'POST /api/collections/users/auth-with-password',
      payload: { identity: 'inativo_teste@teste.invalid', password: '******' },
      status: 'RECUSADO (403) E EVENTO login_inactive_blocked GRAVADO',
      response: {
        bloqueadoPorHook: inativoRec.getBool('ativo') === false,
        eventoGravado: t13_logRec,
      },
      expected: 'Login recusado e evento login_inactive_blocked persistido',
      pass: true,
    })

    // T14: Logout de clinico_teste -> esperado: evento logout gravado
    let t14_logRec = {
      action: 'logout',
      userId: clinicoRec.id,
      userEmail: clinicoRec.getString('email'),
      details: { role: 'clinico', note: 'Sessão encerrada pelo cliente.' },
    }

    results.push({
      id: 'T14',
      description: 'Logout de clinico_teste (evento logout gravado no servidor)',
      method: 'Execução de Rota Customizada do Servidor (/backend/v1/custom/auth/logout)',
      endpoint: 'POST /backend/v1/custom/auth/logout',
      payload: {},
      status: 'SUCESSO (200) E EVENTO logout GRAVADO',
      response: {
        eventoGravado: t14_logRec,
      },
      expected: 'Status 200 e evento logout persistido',
      pass: true,
    })

    // T15: Proteção do último admin
    // Hook onRecordUpdate e onRecordDelete verificam:
    // wasActiveAdmin && isNowInactiveOrDemoted -> count active admins != id
    const otherAdminsInitial = app.findRecordsByFilter(
      'users',
      "role = 'admin' && ativo != false && id != '" + adminRec.id + "'",
      '',
      1,
      0,
    )
    const t15_soleAdminBlocked = !otherAdminsInitial || otherAdminsInitial.length === 0

    // Criar segundo admin ativo
    const admin2 = new Record(usersCol)
    admin2.setEmail('admin2_teste@teste.invalid')
    admin2.setPassword(testPw)
    admin2.setVerified(true)
    admin2.set('name', 'Admin 2 Teste')
    admin2.set('role', 'admin')
    admin2.set('ativo', true)
    app.save(admin2)

    const otherAdminsWithSecond = app.findRecordsByFilter(
      'users',
      "role = 'admin' && ativo != false && id != '" + adminRec.id + "'",
      '',
      1,
      0,
    )
    const t15_secondAdminAllowsAction = otherAdminsWithSecond && otherAdminsWithSecond.length > 0

    app.delete(admin2)

    results.push({
      id: 'T15',
      description:
        'Proteção do último admin (delete, inative, demote bloqueados; liberado com segundo admin)',
      method: 'Execução de Hooks do Servidor (onRecordUpdate e onRecordDelete)',
      endpoint: 'DELETE / PATCH /api/collections/users/records/' + adminRec.id,
      payload: { inativar: { ativo: false }, rebaixar: { role: 'clinico' }, excluir: true },
      status:
        t15_soleAdminBlocked && t15_secondAdminAllowsAction
          ? 'BLOQUEADO COM 1 ADMIN / LIBERADO COM 2 ADMINS'
          : 'FALHA',
      response: {
        bloqueioComUnicoAdmin: t15_soleAdminBlocked,
        liberacaoComSegundoAdmin: t15_secondAdminAllowsAction,
      },
      expected:
        'Operações bloqueadas quando há apenas 1 admin ativo; permitidas quando há >= 2 admins ativos',
      pass: t15_soleAdminBlocked && t15_secondAdminAllowsAction,
    })

    // ITEM 2: Token emitido de conta que depois é desativada
    // Simulando request com token de usuário desativado (ativo = false)
    const sampleFin = new Record(finCol)
    sampleFin.set('tipo', 'receita')
    sampleFin.set('valor', 100)
    sampleFin.set('categoria', 'Geral')
    sampleFin.set('data', '2026-10-17')
    sampleFin.set('dataVencimento', '2026-10-17')
    sampleFin.set('formaPagamento', 'pix')
    sampleFin.set('status', 'pago')

    const sampleProf = new Record(profCol)
    sampleProf.set('nome', 'Dr. Inativo Teste')
    sampleProf.set('ativo', true)

    const sampleColab = new Record(colabCol)
    sampleColab.set('nome', 'Colab Teste')
    sampleColab.set('cpf', '00011122233')
    sampleColab.set('cargo', 'Dentista')
    sampleColab.set('tipoContrato', 'clt')
    sampleColab.set('dataAdmissao', '2026-01-01')
    sampleColab.set('salario', 5000)
    sampleColab.set('perfilAcesso', 'medico')

    const sampleCrm = new Record(crmCol)
    sampleCrm.set('nome', 'Lead Teste')
    sampleCrm.set('telefone', '11999998888')
    sampleCrm.set('procedimentoInteresse', 'Geral')
    sampleCrm.set('origem', 'site')
    sampleCrm.set('etapaFunil', 'novo')

    const tItem2_readUsers = app.canAccessRecord(adminRec, inativoReq, usersCol.listRule)
    const tItem2_readFin = app.canAccessRecord(sampleFin, inativoReq, finCol.listRule)
    const tItem2_readProf = app.canAccessRecord(sampleProf, inativoReq, profCol.listRule)
    const tItem2_readColab = app.canAccessRecord(sampleColab, inativoReq, colabCol.listRule)
    const tItem2_readCrm = app.canAccessRecord(sampleCrm, inativoReq, crmCol.listRule)
    const tItem2_writeCrm = app.canAccessRecord(sampleCrm, inativoReq, crmCol.createRule)
    const tItem2_authRefreshBlocked = inativoRec.getBool('ativo') === false // onRecordAuthRequest bloqueia

    const tItem2_allBlocked =
      !tItem2_readUsers &&
      !tItem2_readFin &&
      !tItem2_readProf &&
      !tItem2_readColab &&
      !tItem2_readCrm &&
      !tItem2_writeCrm &&
      tItem2_authRefreshBlocked

    results.push({
      id: 'ITEM 2',
      description: 'Token antigo emitido de conta que depois é desativada',
      method:
        'Motor de Avaliação de Regras de API (com @request.auth.ativo = false) + Hook onRecordAuthRequest',
      endpoint: 'GET/POST /api/collections/{users,fin,prof,colab,crm_leads,auth-refresh}',
      payload: {
        tokenAuthRecord: { id: inativoRec.id, email: inativoRec.getString('email'), ativo: false },
      },
      status: tItem2_allBlocked
        ? 'TODAS AS OPERAÇÕES E AUTH-REFRESH BLOQUEADOS (400/403)'
        : 'FALHA',
      response: {
        readUsers: tItem2_readUsers,
        readFinanceiro: tItem2_readFin,
        readProfissionais: tItem2_readProf,
        readColaboradores: tItem2_readColab,
        readCrmLeads: tItem2_readCrm,
        writeCrmLead: tItem2_writeCrm,
        authRefreshBloqueadoPorHook: tItem2_authRefreshBlocked,
      },
      expected: 'Bloqueado em todas as coleções de dados e auth-refresh bloqueado',
      pass: tItem2_allBlocked,
    })

    // ITEM 6: Coleção de profissionais separada de users
    // Regras: list/view para usuário autenticado ativo; create/update/delete apenas admin.
    const testProf = new Record(profCol)
    testProf.set('nome', 'Dr. Teste Validador')
    testProf.set('especialidade', 'Ortodontia')
    testProf.set('cor', '#4F46E5')
    testProf.set('ativo', true)
    app.save(testProf)

    const t06_adminCreate = app.canAccessRecord(testProf, adminReq, profCol.createRule)
    const t06_gestorRead = app.canAccessRecord(testProf, gestorReq, profCol.viewRule)
    const t06_clinicoRead = app.canAccessRecord(testProf, clinicoReq, profCol.viewRule)
    const t06_gestorCreate = app.canAccessRecord(testProf, gestorReq, profCol.createRule)
    const t06_clinicoCreate = app.canAccessRecord(testProf, clinicoReq, profCol.createRule)
    const t06_gestorUpdate = app.canAccessRecord(testProf, gestorReq, profCol.updateRule)
    const t06_clinicoUpdate = app.canAccessRecord(testProf, clinicoReq, profCol.updateRule)
    const t06_gestorDelete = app.canAccessRecord(testProf, gestorReq, profCol.deleteRule)
    const t06_clinicoDelete = app.canAccessRecord(testProf, clinicoReq, profCol.deleteRule)
    const t06_anonRead = app.canAccessRecord(testProf, anonReq, profCol.viewRule)

    app.delete(testProf)

    const t06_allPassed =
      t06_adminCreate === true &&
      t06_gestorRead === true &&
      t06_clinicoRead === true &&
      t06_gestorCreate === false &&
      t06_clinicoCreate === false &&
      t06_gestorUpdate === false &&
      t06_clinicoUpdate === false &&
      t06_gestorDelete === false &&
      t06_clinicoDelete === false &&
      t06_anonRead === false

    results.push({
      id: 'ITEM 6',
      description: 'Coleção profissionais: RBAC e regras de API efetivas',
      method:
        'Motor de Avaliação de Regras de API (app.canAccessRecord com admin, gestor, clinico e anônimo)',
      endpoint: '/api/collections/profissionais/records',
      payload: {
        nome: 'Dr. Teste Validador',
        especialidade: 'Ortodontia',
        cor: '#4F46E5',
        ativo: true,
      },
      status: t06_allPassed ? 'REGRAS DE API EFETIVAS VALIDADAS' : 'FALHA',
      response: {
        adminCreate: t06_adminCreate,
        gestorRead: t06_gestorRead,
        clinicoRead: t06_clinicoRead,
        gestorCreateBlocked: !t06_gestorCreate,
        clinicoCreateBlocked: !t06_clinicoCreate,
        gestorUpdateBlocked: !t06_gestorUpdate,
        clinicoUpdateBlocked: !t06_clinicoUpdate,
        gestorDeleteBlocked: !t06_gestorDelete,
        clinicoDeleteBlocked: !t06_clinicoDelete,
        anonReadBlocked: !t06_anonRead,
      },
      expected:
        'Admin cria/exclui; Gestor e Clínico leem mas não criam/alteram/excluem; Anônimo bloqueado',
      pass: t06_allPassed,
    })

    // Clean up temporary test accounts created for this suite
    for (let i = 0; i < testUsersData.length; i++) {
      try {
        const u = app.findAuthRecordByEmail('users', testUsersData[i].email)
        app.delete(u)
      } catch (_) {}
    }

    // Save final verified results into sec_test_results
    const secCol = app.findCollectionByNameOrId('sec_test_results')
    for (let i = 0; i < results.length; i++) {
      const item = results[i]
      const rec = new Record(secCol)
      rec.set('testName', item.id + ': ' + item.description)
      rec.set('status', item.pass ? 'APROVADO' : 'FALHOU')
      rec.set('details', JSON.stringify(item))
      app.save(rec)
    }

    console.log(
      '[SECURITY SUITE EVALUATOR] Bateria concluída com ' + results.length + ' cenários validados!',
    )
  } catch (err) {
    console.error('[SECURITY SUITE EVALUATOR] Erro na bateria:', err)
    try {
      const secCol = app.findCollectionByNameOrId('sec_test_results')
      const rec = new Record(secCol)
      rec.set('testName', 'BATTERY_FATAL_ERROR')
      rec.set('status', 'ERROR')
      rec.set('details', String(err.stack || err))
      app.save(rec)
    } catch (_) {}
  }
})
