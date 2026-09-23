const { test } = require('node:test');
const assert = require('node:assert/strict');
const pool = require('../dist/database').default;
const { UserService } = require('../dist/users/user.service');

test('organization and sponsor accounts can be deleted; admin accounts are protected', async () => {
  const original = pool.query;
  try {
    for (const peran of ['Organisasi', 'Sponsor', 'Admin']) {
      let deleted = false;
      pool.query = async (sql, params) => {
        assert.deepEqual(params, [7]);
        if (sql.startsWith('SELECT')) return { rows: [{ id_pengguna: 7, peran }] };
        deleted = true;
        return { rows: [] };
      };
      const action = new UserService().delete(7);
      if (peran === 'Admin') await assert.rejects(action, error => error.getStatus() === 403);
      else await action;
      assert.equal(deleted, peran !== 'Admin');
    }
  } finally { pool.query = original; }
});

test('referenced accounts return a clear conflict without deleting related records', async () => {
  const original = pool.query;
  const statements = [];
  pool.query = async sql => {
    statements.push(sql);
    if (sql.startsWith('SELECT')) return { rows: [{ id_pengguna: 7, peran: 'Sponsor' }] };
    throw Object.assign(new Error('Foreign key violation'), { code: '23503' });
  };
  try {
    await assert.rejects(new UserService().delete(7), error => error.getStatus() === 409 && /Riwayat pembayaran tetap/.test(error.message));
    assert.equal(statements.length, 2);
    assert.equal(statements[1], 'DELETE FROM users WHERE id_pengguna = $1');
  } finally { pool.query = original; }
});
