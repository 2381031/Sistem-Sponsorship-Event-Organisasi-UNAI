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
const { NotificationsController } = require('../dist/common/notifications.controller');
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
  for (const controller of [UserController, EventController, DokumentasiController, TransaksiController, NotificationsController]) {
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

test('transactions use server-side role/owner filters', async () => {
  for (const role of ['Sponsor', 'Organisasi', 'Admin']) {
    pool.query = async (sql, params) => {
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

test('notification read checks recipient; unauthorized notification stays inaccessible', async () => {
  pool.query = async (sql, params) => {
    if (sql.startsWith('CREATE TABLE')) return { rows: [] };
    assert.match(sql, /id_pengguna = \$2/);
    assert.deepEqual(params, [10, 7]);
    return { rows: [] };
  };
  await assert.rejects(new NotificationsController().read(10, req('Organisasi')), /tidak ditemukan/);
});
