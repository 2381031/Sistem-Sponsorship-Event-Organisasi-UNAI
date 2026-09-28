const { test } = require('node:test');
const assert = require('node:assert/strict');
require('reflect-metadata');
const pool = require('../dist/database').default;
const { documentFormat, DOCUMENT_MAX_BYTES } = require('../dist/common/document-file');
const { UserController } = require('../dist/users/user.controller');
const { EventController } = require('../dist/events/event.controller');
const { DokumentasiController } = require('../dist/common/dokumentasi.controller');
const { TransaksiController } = require('../dist/sponsorships/sponsorship.controller');
const { TransaksiService } = require('../dist/sponsorships/transaksi.service');
const { DokumentasiService } = require('../dist/common/dokumentasi.service');
const { JwtStrategy } = require('../dist/auth/jwt.strategy');
const { AuthService } = require('../dist/auth/auth.service');
const { GUARDS_METADATA } = require('@nestjs/common/constants');

const req = (peran, id_pengguna = 7) => ({ user: { peran, id_pengguna } });

test('documentation accepts JPG/PDF/MP4 and rejects forged or oversized uploads', () => {
  for (const [mime, buffer, type] of [
    ['application/pdf', Buffer.from('%PDF-1.4'), 'PDF'],
    ['image/jpeg', Buffer.from([255, 216, 255, 224]), 'JPG'],
    ['video/mp4', Buffer.from([0, 0, 0, 20, ...Buffer.from('ftypisom')]), 'MP4'],
  ]) assert.equal(documentFormat({ mimetype: mime, buffer }).type, type);
  for (const file of [undefined, { mimetype: 'application/pdf', buffer: Buffer.from('fake') },
    { mimetype: 'image/png', buffer: Buffer.from('%PDF-') },
    { mimetype: 'video/mp4', buffer: Buffer.alloc(DOCUMENT_MAX_BYTES + 1) }]) {
    assert.throws(() => documentFormat(file));
  }
});

test('all data controllers require JWT, including their GET routes', () => {
  for (const controller of [UserController, EventController, DokumentasiController, TransaksiController]) {
    assert.ok(Reflect.getMetadata(GUARDS_METADATA, controller)?.length > 0);
  }
});

test('only admin can delete users; profiles cannot change account role', async () => {
  let deleted = false;
  const controller = new UserController({ delete: async () => { deleted = true; } });
  await assert.rejects(controller.delete(8, req('Sponsor')), /Admin/);
  assert.equal(deleted, false);
  await assert.rejects(controller.update(7, { peran: 'Admin' }, req('Sponsor')), /Peran/);
  await controller.delete(8, req('Admin'));
  assert.equal(deleted, true);
});

test('registration cannot create an admin and stale JWT cannot access disabled account', async () => {
  const auth = new AuthService({}, {});
  await assert.rejects(auth.register({ peran: 'Admin' }), /Organisasi atau Sponsor/);
  pool.query = async () => ({ rows: [{ id_pengguna: 7, status_akun: 'Ditolak' }] });
  await assert.rejects(new JwtStrategy().validate({ sub: 7, role: 'Admin' }), /tidak aktif/);
  pool.query = async () => ({ rows: [{ id_pengguna: 7, status_akun: 'Aktif', peran: 'Sponsor' }] });
  assert.equal((await new JwtStrategy().validate({ sub: 7, role: 'Admin' })).peran, 'Sponsor');
});

test('only admin can reject accounts or payments; self deletion is blocked', async () => {
  const decisions = [];
  const users = new UserController({ updateStatus: async (...args) => decisions.push(args), delete: async id => decisions.push(['delete', id]) });
  const payments = new TransaksiController({ updateStatus: async (...args) => decisions.push(args) });
  for (const role of ['Sponsor', 'Organisasi']) {
    await assert.rejects(users.updateStatus(8, 'Ditolak', req(role)), /Admin/);
    await assert.rejects(payments.verify(31, 'Ditolak', req(role)), /Admin/);
    await assert.rejects(users.delete(8, req(role)), /Admin/);
  }
  assert.deepEqual(decisions, []);
  await users.updateStatus(8, 'Ditolak', req('Admin'));
  await payments.verify(31, 'Ditolak', req('Admin'));
  assert.deepEqual(decisions, [[8, 'Ditolak', 7], [31, 'Ditolak']]);
  await assert.rejects(users.delete(7, req('Admin')), /sedang digunakan/);
});

test('transactions use server-side role/owner filters', async () => {
  for (const role of ['Sponsor', 'Organisasi', 'Admin']) {
    pool.query = async (sql, params) => {
      if (sql.startsWith('ALTER TABLE transaksi_sponsorship ADD COLUMN IF NOT EXISTS sponsor_files')) return { rows: [] };
      assert.deepEqual(params, [role, 7]);
      assert.match(sql, /t.id_sponsor = \$2/);
      assert.match(sql, /e.id_organisasi = \$2/);
      return { rows: [] };
    };
    await new TransaksiService().findAll(req(role).user);
  }
});

test('non-owner cannot delete event or documentation', async () => {
  await assert.rejects(new EventController({ findOne: async () => ({ id_organisasi: 8 }) }).delete(1, req('Organisasi')), /pemilik/);
  pool.query = async () => ({ rows: [{ id_organisasi: 8 }] });
  await assert.rejects(new DokumentasiService().delete(1, req('Organisasi').user), /pemilik/);
});

test('documentation upload requires the organization that owns the event', async () => {
  const controller = new DokumentasiController({ create: () => assert.fail('Unauthorized upload was saved') });
  const file = { mimetype: 'application/pdf', buffer: Buffer.from('%PDF-1.4') };
  await assert.rejects(controller.create({ id_event: 1 }, req('Sponsor'), file), /Hanya organisasi/);
  pool.query = async () => ({ rows: [{ id_organisasi: 8 }] });
  await assert.rejects(controller.create({ id_event: 1 }, req('Organisasi'), file), /pemilik event/);
  await assert.rejects(controller.create({ id_event: 'invalid' }, req('Organisasi'), file), /ID event/);
  pool.query = async () => ({ rows: [] });
  await assert.rejects(controller.create({ id_event: 1 }, req('Organisasi'), file), /Event tidak ditemukan/);
});

test('documentation query scopes sponsors to verified contributions to the same event', async () => {
  for (const role of ['Sponsor', 'Organisasi', 'Admin']) {
    pool.query = async (sql, params) => {
      assert.deepEqual(params, [role, 7, null]);
      assert.match(sql, /\$1 = 'Admin'/);
      assert.match(sql, /\$1 = 'Organisasi' AND e.id_organisasi = \$2/);
      assert.match(sql, /\$1 = 'Sponsor' AND EXISTS/);
      assert.match(sql, /t.id_event = e.id_event AND t.id_sponsor = \$2 AND t.status_pembayaran = 'Diverifikasi'/);
      assert.doesNotMatch(sql, /e.status_event IN/);
      return { rows: [] };
    };
    await new DokumentasiService().findAll(req(role).user);
  }
});

test('event documentation route preserves access scope and filters event in the database', async () => {
  pool.query = async (sql, params) => {
    assert.deepEqual(params, ['Sponsor', 7, 11]);
    assert.match(sql, /d.id_event = \$3/);
    assert.match(sql, /t.status_pembayaran = 'Diverifikasi'/);
    return { rows: [{ id_dokumentasi: 1, id_event: 11 }] };
  };
  const docs = await new DokumentasiController(new DokumentasiService()).findByEvent(11, req('Sponsor'));
  assert.equal(docs[0].id_event, 11);
});
