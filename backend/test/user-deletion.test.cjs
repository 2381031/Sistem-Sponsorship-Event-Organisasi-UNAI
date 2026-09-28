const { test } = require('node:test');
const assert = require('node:assert/strict');
const pool = require('../dist/database').default;
const { UserService } = require('../dist/users/user.service');
const { JwtStrategy } = require('../dist/auth/jwt.strategy');

test('deleting either role retains financial records and closes organization events', async () => {
  const original = pool.connect;
  try {
    for (const peran of ['Organisasi', 'Sponsor', 'Admin']) {
      const statements = [];
      let released = false;
      pool.connect = async () => ({ query: async (sql, params) => {
        statements.push(sql);
        if (params) assert.deepEqual(params, [7]);
        if (sql.startsWith('SELECT')) return { rows: [{ peran, status_akun: 'Aktif' }] };
        return { rows: [] };
      }, release: () => { released = true; } });
      const action = new UserService().delete(7);
      if (peran === 'Admin') await assert.rejects(action, error => error.getStatus() === 403);
      else await action;
      assert.equal(statements[0], 'BEGIN');
      assert.match(statements[1], /FOR UPDATE/);
      assert.equal(statements.some(sql => sql.includes("status_akun = 'Dihapus'")), peran !== 'Admin');
      assert.equal(statements.some(sql => sql.startsWith('UPDATE event')), peran === 'Organisasi');
      assert.equal(statements.at(-1), peran === 'Admin' ? 'ROLLBACK' : 'COMMIT');
      assert.ok(!statements.some(sql => /DELETE FROM|UPDATE transaksi_sponsorship/.test(sql)));
      assert.equal(released, true);
    }
  } finally { pool.connect = original; }
});

test('missing or deleted accounts cannot be deleted; event closure failure rolls back', async () => {
  const original = pool.connect;
  try {
    for (const [user, failClose, expected] of [
      [null, false, 404], [{ peran: 'Sponsor', status_akun: 'Dihapus' }, false, 404],
      [{ peran: 'Organisasi', status_akun: 'Aktif' }, true, null],
    ]) {
      const statements = [];
      let released = false;
      pool.connect = async () => ({ query: async sql => {
        statements.push(sql);
        if (sql.startsWith('SELECT')) return { rows: user ? [user] : [] };
        if (sql.startsWith('UPDATE event') && failClose) throw new Error('Simulated database failure');
        return { rows: [] };
      }, release: () => { released = true; } });
      await assert.rejects(new UserService().delete(7), error => expected ? error.getStatus() === expected : /Simulated/.test(error.message));
      assert.equal(statements.at(-1), 'ROLLBACK');
      assert.equal(statements.includes('COMMIT'), false);
      assert.equal(released, true);
    }
  } finally { pool.connect = original; }
});

test('deleted accounts are excluded from management and rejected by an existing JWT', async () => {
  const original = pool.query;
  try {
    pool.query = async sql => {
      assert.match(sql, /WHERE u.status_akun <> 'Dihapus'/);
      return { rows: [] };
    };
    assert.deepEqual(await new UserService().findAll(), []);
    for (const status_akun of ['Dihapus', 'Ditolak']) {
      pool.query = async () => ({ rows: [{ id_pengguna: 7, peran: 'Sponsor', status_akun }] });
      await assert.rejects(new JwtStrategy().validate({ sub: 7 }), error => error.getStatus() === 401);
    }
  } finally { pool.query = original; }
});

test('status changes cannot affect admin accounts or restore deleted accounts', async () => {
  const original = pool.query;
  try {
    for (const [user, statusCode] of [[{ peran: 'Admin', status_akun: 'Aktif' }, 403], [{ peran: 'Sponsor', status_akun: 'Dihapus' }, 404]]) {
      pool.query = async sql => {
        if (sql.startsWith('UPDATE')) {
          assert.match(sql, /peran IN \('Organisasi', 'Sponsor'\)/);
          assert.match(sql, /status_akun <> 'Dihapus'/);
          return { rows: [] };
        }
        return { rows: [user] };
      };
      await assert.rejects(new UserService().updateStatus(7, 'Aktif'), error => error.getStatus() === statusCode);
      await assert.rejects(new UserService().updateStatus(7, 'Ditolak'), error => error.getStatus() === statusCode);
    }
  } finally { pool.query = original; }
});
