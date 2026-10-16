migrate(
  (app) => {
    // Intentionally empty on fresh clones. The demo account (demo@clinicapro.com.br)
    // stays on the original template project (already seeded there) so the
    // "Entrar como Demo" browsing still works before duplicating; a duplicated
    // clinic starts clean without it.
  },
  (app) => {},
)
