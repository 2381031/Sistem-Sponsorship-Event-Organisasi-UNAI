const { test } = require('node:test');
const assert = require('node:assert/strict');
require('reflect-metadata');
const pool = require('../dist/database').default;
const { EventService } = require('../dist/events/event.service');
const { EVENT_VISIBILITY_SQL } = require('../dist/events/event-visibility');
const { UserService } = require('../dist/users/user.service');
const { UserController } = require('../dist/users/user.controller');
const { PATH_METADATA } = require('@nestjs/common/constants');

test('organization directory is restricted to Sponsor/Admin and precedes the dynamic user route', async () => {
  const calls = [];
  const organizations = [{ id: 4, peran: 'Organisasi', profil: { nama_organisasi: 'HIMA' } }];
  const controller = new UserController({ findOrganizations: async user => { calls.push(user); return organizations; } });
  for (const peran of ['Organisasi', 'Unknown']) {
    await assert.rejects(controller.findOrganizations({ user: { peran, id_pengguna: 3 } }), /Sponsor dan Admin/);
  }
  assert.equal(calls.length, 0);
  for (const peran of ['Sponsor', 'Admin']) {
    const user = { peran, id_pengguna: 3 };
    assert.deepEqual(await controller.findOrganizations({ user }), organizations);
    assert.deepEqual(calls.at(-1), user);
  }
  const routes = Object.getOwnPropertyNames(UserController.prototype)
    .map(name => Reflect.getMetadata(PATH_METADATA, UserController.prototype[name]));
  assert.ok(routes.indexOf('organizations') < routes.indexOf(':id'));
});

test('organization directory loads all public profiles in one query under event visibility rules', async () => {
  const original = pool.query;
  const organizations = [1, 2, 3].map(id => ({ id, peran: 'Organisasi', profil: { id_pengguna: id } }));
  let queries = 0;
  pool.query = async (sql, params) => {
    queries++;
    assert.deepEqual(params, ['Sponsor', 7]);
    assert.ok(sql.includes(EVENT_VISIBILITY_SQL));
    assert.match(sql, /WHERE e.id_organisasi = u.id_pengguna AND/);
    assert.match(sql, /WHERE u.peran = 'Organisasi' AND EXISTS/);
    assert.doesNotMatch(sql, /u\.\*|u\.email|u\.kata_sandi/);
    return { rows: organizations };
  };
  try {
    assert.deepEqual(await new UserService().findOrganizations({ peran: 'Sponsor', id_pengguna: 7 }), organizations);
    assert.equal(queries, 1);
  } finally { pool.query = original; }
});

test('profile lookup returns the existing profile shape in one query and preserves missing-user errors', async () => {
  const original = pool.query;
  const profile = { id: 2, email: 'org@example.test', peran: 'Organisasi', status_akun: 'Aktif', profil: { id_pengguna: 2, nama_organisasi: 'HIMA' } };
  let queries = 0;
  pool.query = async (sql, params) => {
    queries++;
    assert.match(sql, /LEFT JOIN organisasi/);
    assert.match(sql, /LEFT JOIN sponsor/);
    return { rows: params[0] === 2 ? [profile] : [] };
  };
  try {
    assert.deepEqual(await new UserService().findByIdWithProfile(2), profile);
    assert.equal(queries, 1);
    await assert.rejects(new UserService().findByIdWithProfile(999), /User not found/);
  } finally { pool.query = original; }
});

const eventInput = {
  id_pengguna: 3, nama_event: 'Seminar', tanggal_event: '2026-10-01', target_dana: 100000,
  url_proposal: 'https://example.test/proposal.pdf',
  paket_tersedia: [
    { nama_paket: 'Gold', persentase_dana: 75, deskripsi_keuntungan: 'Logo utama' },
    { nama_paket: 'Silver', persentase_dana: 25 },
    { nama_paket: 'Spesial', persentase_dana: 0 },
  ],
};

test('creating an event inserts every package atomically in one query without fetching the event again', async () => {
  const originalQuery = pool.query;
  const originalConnect = pool.connect;
  const queries = [];
  let released = false;
  const event = { id_event: 22, nama_event: 'Seminar' };
  const packages = eventInput.paket_tersedia.map((p, i) => ({ ...p, id_event: 22, id_paket: 30 + i }));
  pool.query = async sql => {
    assert.match(sql, /SELECT id_pengguna FROM organisasi/);
    return { rows: [{ id_pengguna: 3 }] };
  };
  pool.connect = async () => ({
    query: async (sql, params) => {
      queries.push(sql);
      if (sql.startsWith('INSERT INTO event')) return { rows: [event] };
      if (sql.startsWith('INSERT INTO paket_sponsorship')) {
        assert.deepEqual(params, [22, ['Gold', 'Silver', 'Spesial'], [75, 25, 0], ['Logo utama', null, null]]);
        return { rows: packages };
      }
      return { rows: [] };
    },
    release: () => { released = true; },
  });
  try {
    assert.deepEqual(await new EventService().create(eventInput), { ...event, paket_tersedia: packages });
    assert.equal(queries.filter(sql => sql.startsWith('INSERT INTO paket_sponsorship')).length, 1);
    assert.equal(queries[0], 'BEGIN');
    assert.equal(queries.at(-1), 'COMMIT');
    assert.equal(released, true);
  } finally { pool.query = originalQuery; pool.connect = originalConnect; }
});

test('a failed package insert rolls back its event and releases the database connection', async () => {
  const originalQuery = pool.query;
  const originalConnect = pool.connect;
  const queries = [];
  let released = false;
  pool.query = async () => ({ rows: [{ id_pengguna: 3 }] });
  pool.connect = async () => ({
    query: async sql => {
      queries.push(sql);
      if (sql.startsWith('INSERT INTO event')) return { rows: [{ id_event: 22 }] };
      if (sql.startsWith('INSERT INTO paket_sponsorship')) throw new Error('Package insert failed');
      return { rows: [] };
    },
    release: () => { released = true; },
  });
  try {
    await assert.rejects(new EventService().create(eventInput), /Package insert failed/);
    assert.equal(queries.at(-1), 'ROLLBACK');
    assert.equal(queries.includes('COMMIT'), false);
    assert.equal(released, true);
  } finally { pool.query = originalQuery; pool.connect = originalConnect; }
});

test('status updates return the refreshed profile and preserve not-found behavior without redundant reads', async () => {
  const original = pool.query;
  let queries = 0;
  const user = { id: 2, status_akun: 'Aktif', profil: null };
  pool.query = async (sql, params) => {
    queries++;
    if (sql.startsWith('UPDATE')) return { rows: params[1] === 2 ? [{ id_pengguna: 2 }] : [] };
    return { rows: [user] };
  };
  try {
    assert.deepEqual(await new UserService().updateStatus(2, 'Aktif'), user);
    assert.equal(queries, 2);
    await assert.rejects(new UserService().updateStatus(999, 'Aktif'), /User not found/);
    assert.equal(queries, 3);
  } finally { pool.query = original; }
});
