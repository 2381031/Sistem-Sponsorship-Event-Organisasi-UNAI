// Only approved payments count toward the target. Never reopen a closed event here.
export async function closeFundedEvents(db: { query: Function }, id?: number) {
  await db.query(`UPDATE event e SET status_event = 'Ditutup'
    WHERE e.status_event IN ('Dipublikasikan', 'open', 'published', 'terbuka')
      AND e.target_dana > 0
      AND ($1::integer IS NULL OR e.id_event = $1)
      AND (SELECT COALESCE(SUM(t.jumlah), 0) FROM transaksi_sponsorship t
        WHERE t.id_event = e.id_event AND t.status_pembayaran = 'Diverifikasi') >= e.target_dana`, [id ?? null]);
}

export function sponsorshipAmount(paket: any, target: any, requested: any): number {
  const percentage = Number(paket.persentase_dana);
  const amount = percentage > 0 ? Math.round(Number(target) * percentage) / 100 : Number(requested);
  return Number.isFinite(amount) && amount > 0 ? amount : 0;
}
