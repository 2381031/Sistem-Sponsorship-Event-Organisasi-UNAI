const { test } = require('node:test');
const assert = require('node:assert/strict');
const pool = require('../dist/database').default;
const { TransaksiService } = require('../dist/sponsorships/transaksi.service');
const { EventService } = require('../dist/events/event.service');
const { sponsorshipAmount } = require('../dist/events/funding');

// Simulate persistence without touching the configured database.
function fixture({ status = 'Menunggu', owner = 7, otherApproved = 0, amount = 25, eventStatus = 'Dipublikasikan' } = {}) {
  const event = { id_event: 1, id_organisasi: 10, nama_event: 'Event Uji', target_dana: '100', status_event: eventStatus, url_proposal: '/proposal.pdf' };
  const tx = { id_transaksi: 2, id_event: 1, id_sponsor: owner, id_paket: 3, jumlah: amount, status_pembayaran: status, bukti_pembayaran: 'old.png' };
  const statements = [];
  let released = false;
  const query = async (sql, params = []) => {
    statements.push(sql);
    if (['BEGIN', 'COMMIT', 'ROLLBACK'].includes(sql)) return { rows: [] };
    if (sql.startsWith('ALTER TABLE transaksi_sponsorship ADD COLUMN IF NOT EXISTS sponsor_files')) return { rows: [] };
    if (sql.startsWith('SELECT id_pengguna FROM sponsor')) return { rows: [{ id_pengguna: 7 }] };
    if (sql.startsWith('SELECT * FROM transaksi_sponsorship')) return { rows: [{ ...tx }] };
    if (sql.startsWith('SELECT * FROM paket_sponsorship')) return { rows: params[0] === 3 ? [{ id_paket: 3, nama_paket: 'Silver', persentase_dana: '25' }] : [] };
    if (sql.startsWith('SELECT') && sql.includes('FROM event')) return { rows: [{ ...event }] };
    if (sql.startsWith('UPDATE event e')) {
      assert.match(sql, /SUM\(t.jumlah\)/);
      assert.match(sql, /t.status_pembayaran = 'Diverifikasi'/);
      assert.match(sql, />= e.target_dana/);
      if (otherApproved + (tx.status_pembayaran === 'Diverifikasi' ? Number(tx.jumlah) : 0) >= Number(event.target_dana)) event.status_event = 'Ditutup';
      return { rows: [] };
    }
    if (sql.startsWith('UPDATE transaksi_sponsorship SET status_pembayaran')) {
      assert.match(sql, /status_pembayaran = 'Menunggu'/);
      if (tx.status_pembayaran !== 'Menunggu') return { rows: [] };
      tx.status_pembayaran = params[0];
      return { rows: [{ ...tx }] };
    }
    if (sql.startsWith('UPDATE transaksi_sponsorship SET id_paket')) {
      Object.assign(tx, { id_paket: params[0], nama_paket: params[1], jumlah: params[2], bukti_pembayaran: params[3] });
      return { rows: [{ ...tx }] };
    }
    if (sql.startsWith('UPDATE event SET')) {
      if (sql.includes('target_dana')) event.target_dana = params[0];
      if (sql.includes('status_event')) event.status_event = params[0];
      return { rows: [] };
    }
    throw new Error('Unexpected SQL: ' + sql);
  };
  pool.query = query;
  pool.connect = async () => ({ query, release: () => { released = true; } });
  return { service: new TransaksiService(), event, tx, statements, released: () => released };
}

test('pending owner can edit; server calculates amount and keeps old proof', async () => {
  const f = fixture();
  const result = await f.service.update(2, 7, { id_paket: 3, jumlah: 999 });
  assert.equal(result.jumlah, 25);
  assert.equal(result.nama_paket, 'Silver');
  assert.equal(result.bukti_pembayaran, 'old.png');
  assert.equal(result.status_pembayaran, 'Menunggu');
  assert.equal(f.statements.at(-1), 'COMMIT');
  assert.ok(f.released());
});

test('edit rejects approved/rejected transactions, another owner, and unrelated package', async () => {
  for (const [options, owner, data, message] of [
    [{ status: 'Diverifikasi' }, 7, {}, /Menunggu/],
    [{ status: 'Ditolak' }, 7, {}, /Menunggu/],
    [{}, 8, {}, /akses/],
    [{}, 7, { id_paket: 99 }, /Paket/],
  ]) {
    const f = fixture(options);
    await assert.rejects(f.service.update(2, owner, data), message);
    assert.equal(f.statements.at(-1), 'ROLLBACK');
    assert.ok(!f.statements.some(sql => sql.startsWith('UPDATE transaksi')));
    assert.ok(f.released());
  }
});

test('approval closes at/exceeding target, but not below; rejection does not count', async () => {
  for (const [otherApproved, decision, expected] of [[74, 'Diverifikasi', 'Dipublikasikan'], [75, 'Diverifikasi', 'Ditutup'], [90, 'Diverifikasi', 'Ditutup'], [75, 'Ditolak', 'Dipublikasikan']]) {
    const f = fixture({ otherApproved });
    await f.service.updateStatus(2, decision);
    assert.equal(f.event.status_event, expected);
    const lock = f.statements.findIndex(sql => sql.includes('FOR UPDATE'));
    const write = f.statements.findIndex(sql => sql.startsWith('UPDATE transaksi'));
    assert.ok(lock < write);
    assert.equal(f.statements.at(-1), 'COMMIT');
  }
});

test('duplicate approval is rejected', async () => {
  const f = fixture({ status: 'Diverifikasi' });
  await assert.rejects(f.service.updateStatus(2, 'Diverifikasi'), /sudah diproses/);
  assert.equal(f.statements.at(-1), 'ROLLBACK');
});

test('closed events reject new sponsorships', async () => {
  const f = fixture({ eventStatus: 'Ditutup' });
  await assert.rejects(f.service.create({ id_pengguna: 7, id_event: 1, id_paket: 3, jumlah: 25 }), /ditutup/);
  assert.equal(f.statements.at(-1), 'ROLLBACK');
});

test('lowering target closes funded event; reopening cannot bypass funded target', async () => {
  const f = fixture({ status: 'Diverifikasi', amount: 50 });
  const service = new EventService();
  service.findOne = async () => ({ ...f.event });
  await service.update(1, { target_dana: 50 });
  assert.equal(f.event.status_event, 'Ditutup');
  await service.updateStatus(1, 'Dipublikasikan');
  assert.equal(f.event.status_event, 'Ditutup');
});

test('amount calculation handles PostgreSQL numeric strings and special donations', () => {
  assert.equal(sponsorshipAmount({ persentase_dana: '25' }, '1000000', 1), 250000);
  assert.equal(sponsorshipAmount({ persentase_dana: '0' }, '1000000', '125000'), 125000);
  for (const amount of [0, -1, 'invalid', Infinity]) assert.equal(sponsorshipAmount({ persentase_dana: '0' }, 100, amount), 0);
});
