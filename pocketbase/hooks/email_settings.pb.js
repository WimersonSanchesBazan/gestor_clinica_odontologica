// pocketbase/hooks/email_settings.pb.js

// Custom router endpoint for testing email connection or sending a test email
routerAdd('POST', '/backend/v1/custom/test-email', (e) => {
  // 1. Verify that request is from an authenticated admin
  const authRecord = e.requestInfo?.auth
  if (!authRecord || authRecord.getString('role') !== 'admin') {
    throw new ForbiddenError('Apenas administradores podem testar a configuração de e-mail.')
  }

  const data = e.requestInfo.body || {}
  const targetEmail = data.targetEmail || authRecord.getString('email')
  const provider = data.provider || 'skip_cloud'

  if (!targetEmail) {
    throw new BadRequestError('Destinatário de teste não informado.')
  }

  // Attempt transactional mail via PocketBase / Skip Cloud mailer
  try {
    const mailer = e.app.newMailClient()
    const message = new MailerMessage({
      from: {
        address:
          data.senderEmail ||
          e.app.settings().meta.senderAddress ||
          'nao-responder@clinicapro.com.br',
        name: data.senderName || e.app.settings().meta.senderName || 'Clínica Odontológica',
      },
      to: [{ address: targetEmail }],
      subject: 'Teste de Configuração de E-mail — Gestão Clínica Odontológica',
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eaeaea; border-radius: 8px;">
          <h2 style="color: #6366f1;">Teste de E-mail Bem-sucedido</h2>
          <p>Olá,</p>
          <p>Este é um e-mail de teste enviado para validar as configurações de mensageria da sua clínica odontológica.</p>
          <p style="font-size: 13px; color: #666;">Provedor selecionado: <strong>${provider}</strong></p>
          <p style="font-size: 13px; color: #666;">Horário do envio: ${new Date().toISOString()}</p>
          <hr style="border: none; border-top: 1px solid #eaeaea; margin: 20px 0;" />
          <p style="font-size: 11px; color: #999;">Sistema de Gestão de Clínica Odontológica · Não responda a este e-mail.</p>
        </div>
      `,
    })

    mailer.send(message)

    // Log the test in audit_logs
    try {
      const auditCol = e.app.findCollectionByNameOrId('audit_logs')
      const log = new Record(auditCol)
      log.set('action', 'email_test_success')
      log.set('userId', authRecord.id)
      log.set('userEmail', authRecord.getString('email'))
      log.set('targetEntity', 'email_settings')
      log.set('details', JSON.stringify({ recipient: targetEmail, provider: provider }))
      e.app.save(log)
    } catch (_) {}

    return e.json(200, {
      success: true,
      message:
        'Envio de teste aceito pelo serviço gerenciado da instância para ' +
        targetEmail +
        '. A entrega real na caixa de entrada depende do mailer da instância.',
    })
  } catch (err) {
    // Audit failed attempt: Sanitize error messages before persisting.
    // Never record raw SMTP negotiation traces, passwords or credentials in audit logs.
    let safeError = 'Falha técnica no envio de e-mail de teste'
    let safeCode = 'MAIL_SEND_ERROR'

    const rawMessage = String(err.message || err || '').toLowerCase()
    if (
      rawMessage.includes('auth') ||
      rawMessage.includes('535') ||
      rawMessage.includes('password')
    ) {
      safeError = 'Falha de autenticação no servidor de e-mail'
      safeCode = 'SMTP_AUTH_FAILED'
    } else if (rawMessage.includes('timeout') || rawMessage.includes('deadline')) {
      safeError = 'Tempo limite excedido ao conectar ao servidor de e-mail'
      safeCode = 'SMTP_TIMEOUT'
    } else if (rawMessage.includes('connection refused') || rawMessage.includes('connect:')) {
      safeError = 'Conexão recusada pelo host de e-mail'
      safeCode = 'SMTP_CONNECTION_REFUSED'
    } else if (rawMessage.includes('no such host') || rawMessage.includes('dns')) {
      safeError = 'Host de e-mail não encontrado (falha de DNS)'
      safeCode = 'SMTP_DNS_ERROR'
    }

    try {
      const auditCol = e.app.findCollectionByNameOrId('audit_logs')
      const log = new Record(auditCol)
      log.set('action', 'email_test_failed')
      log.set('userId', authRecord.id)
      log.set('userEmail', authRecord.getString('email'))
      log.set('targetEntity', 'email_settings')
      // Only generic sanitized description and technical code, zero credentials or raw parameters
      log.set(
        'details',
        JSON.stringify({ errorCode: safeCode, description: safeError, provider: provider }),
      )
      e.app.save(log)
    } catch (_) {}

    return e.json(500, {
      success: false,
      message:
        safeError + ' (Código: ' + safeCode + '). Verifique o mailer gerenciado da instância.',
    })
  }
})
