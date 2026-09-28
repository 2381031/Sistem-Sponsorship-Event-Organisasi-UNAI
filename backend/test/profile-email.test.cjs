const { test } = require('node:test');
const assert = require('node:assert/strict');
const pool = require('../dist/database').default;
const { UserService } = require('../dist/users/user.service');
const { UpdateUserDto } = require('../dist/users/dto/update-user.dto');
const { plainToInstance } = require('class-transformer');
const { validate } = require('class-validator');

test('profile email is validated and trimmed', async () => {
  const valid = plainToInstance(UpdateUserDto, { email: ' sponsor@example.org ' });
  assert.equal(valid.email, 'sponsor@example.org');
  assert.equal((await validate(valid)).length, 0);
  for (const email of ['invalid', '', 'x'.repeat(255) + '@example.org']) {
    assert.ok((await validate(plainToInstance(UpdateUserDto, { email }))).length);
  }
});

test('email and sponsor profile persist together, with updated account returned', async () => {
  const oldQuery = pool.query, oldConnect = pool.connect;
  const statements = [];
  const updated = { id: 8, email: 'new@example.org', peran: 'Sponsor', status_akun: 'Aktif', profil: { nama_perusahaan: 'Sponsor' } };
  pool.query = async sql => ({ rows: [sql.startsWith('SELECT *') ? { id_pengguna: 8, email: 'old@example.org', peran: 'Sponsor' } : updated] });
  pool.connect = async () => ({ query: async (sql, params) => {
    statements.push(sql);
    if (sql.startsWith('UPDATE users')) assert.equal(params[0], updated.email);
    return { rows: [] };
  }, release() {} });
  try {
    assert.deepEqual(await new UserService().update(8, { email: updated.email, sponsorDetails: { nama_perusahaan: 'Sponsor', no_telp: '123' } }), updated);
    assert.ok(statements.some(sql => sql.startsWith('UPDATE sponsor')));
    assert.equal(statements.at(-1), 'COMMIT');
  } finally { pool.query = oldQuery; pool.connect = oldConnect; }
});

test('duplicate email rolls back without updating sponsor details', async () => {
  const oldQuery = pool.query, oldConnect = pool.connect;
  const statements = [];
  pool.query = async () => ({ rows: [{ id_pengguna: 8, peran: 'Sponsor', email: 'old@example.org' }] });
  pool.connect = async () => ({ query: async sql => {
    statements.push(sql);
    if (sql.startsWith('UPDATE users')) throw Object.assign(new Error('duplicate'), { code: '23505' });
    return { rows: [] };
  }, release() {} });
  try {
    await assert.rejects(new UserService().update(8, { email: 'used@example.org', sponsorDetails: { nama_perusahaan: 'Sponsor', no_telp: '123' } }), error => error.getStatus() === 409);
    assert.equal(statements.at(-1), 'ROLLBACK');
    assert.ok(!statements.some(sql => sql.startsWith('UPDATE sponsor')));
  } finally { pool.query = oldQuery; pool.connect = oldConnect; }
});
