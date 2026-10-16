migrate(
  (app) => {
    // 1. Audit Logs Collection
    const auditLogs = new Collection({
      name: 'audit_logs',
      type: 'base',
      // View/List: only admins or managers with permission
      listRule:
        "@request.auth.id != '' && (@request.auth.role = 'admin' || @request.auth.role = 'gestor')",
      viewRule:
        "@request.auth.id != '' && (@request.auth.role = 'admin' || @request.auth.role = 'gestor')",
      // Create: only authenticated users (logged from backend hooks or app)
      createRule: "@request.auth.id != ''",
      // Immutable: update and delete are null (superusers/backend only)
      updateRule: null,
      deleteRule: null,
      fields: [
        { name: 'action', type: 'text', required: true },
        {
          name: 'userId',
          type: 'relation',
          required: false,
          collectionId: '_pb_users_auth_',
          cascadeDelete: false,
          maxSelect: 1,
        },
        { name: 'userEmail', type: 'text', required: false },
        { name: 'targetEntity', type: 'text', required: false },
        { name: 'targetId', type: 'text', required: false },
        { name: 'details', type: 'json', required: false },
        { name: 'ipAddress', type: 'text', required: false },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
      indexes: [
        'CREATE INDEX idx_audit_action ON audit_logs (action)',
        'CREATE INDEX idx_audit_created ON audit_logs (created DESC)',
      ],
    })
    app.save(auditLogs)

    // 2. Email Configuration Collection
    // Note: Stores non-sensitive metadata for email configuration.
    // Sensitive secrets (like Google App Passwords) must NEVER be exposed to frontend.
    const emailSettings = new Collection({
      name: 'email_settings',
      type: 'base',
      // Only admins can see and update email settings
      listRule: "@request.auth.id != '' && @request.auth.role = 'admin'",
      viewRule: "@request.auth.id != '' && @request.auth.role = 'admin'",
      createRule: "@request.auth.id != '' && @request.auth.role = 'admin'",
      updateRule: "@request.auth.id != '' && @request.auth.role = 'admin'",
      deleteRule: null,
      fields: [
        {
          name: 'provider',
          type: 'select',
          required: true,
          values: ['gmail', 'smtp', 'skip_cloud'],
          maxSelect: 1,
        },
        { name: 'senderName', type: 'text', required: true },
        { name: 'senderEmail', type: 'text', required: true },
        { name: 'smtpHost', type: 'text', required: false },
        { name: 'smtpPort', type: 'number', required: false },
        {
          name: 'security',
          type: 'select',
          required: false,
          values: ['starttls', 'ssl', 'none'],
          maxSelect: 1,
        },
        { name: 'smtpUser', type: 'text', required: false },
        { name: 'hasAppPassword', type: 'bool', required: false },
        { name: 'publicAppUrl', type: 'text', required: false },
        { name: 'lastTestedAt', type: 'date', required: false },
        { name: 'lastTestStatus', type: 'text', required: false },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
    })
    app.save(emailSettings)
  },
  (app) => {
    try {
      const auditLogs = app.findCollectionByNameOrId('audit_logs')
      app.delete(auditLogs)
    } catch (_) {}
    try {
      const emailSettings = app.findCollectionByNameOrId('email_settings')
      app.delete(emailSettings)
    } catch (_) {}
  },
)
