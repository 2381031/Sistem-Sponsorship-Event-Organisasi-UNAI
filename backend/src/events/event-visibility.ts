// Queries using this predicate bind [role, userId] and alias the event table as e.
// Keep the organization directory and event list under the same visibility rules.
export const EVENT_VISIBILITY_SQL = `($1 = 'Admin' OR e.id_organisasi = $2
  OR ($1 = 'Sponsor' AND (e.status_event IN ('Dipublikasikan', 'published', 'open', 'terbuka', 'Ditutup', 'closed')
    OR EXISTS (SELECT 1 FROM transaksi_sponsorship t WHERE t.id_event = e.id_event AND t.id_sponsor = $2))))`;
