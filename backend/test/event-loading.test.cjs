const { test } = require('node:test');
const assert = require('node:assert/strict');
const pool = require('../dist/database').default;
const { EventService } = require('../dist/events/event.service');

test('event list batches packages and keeps packages attached to the correct event', async () => {
  const original = pool.query;
  let packageQueries = 0;
  pool.query = async (sql, params) => {
    if (sql.startsWith('UPDATE')) return { rows: [] };
    if (sql.includes('FROM event e')) return { rows: [{ id_event: 3 }, { id_event: 2 }, { id_event: 1 }] };
    packageQueries++;
    assert.deepEqual(params, [[3, 2, 1]]);
    return { rows: [{ id_event: 1, id_paket: 10 }, { id_event: 3, id_paket: 30 }, { id_event: 3, id_paket: 31 }] };
  };
  try {
    const events = await new EventService().findAll({ peran: 'Admin', id_pengguna: 7 });
    assert.equal(packageQueries, 1);
    assert.deepEqual(events.map(event => event.paket_tersedia.map(p => p.id_paket)), [[30, 31], [], [10]]);
  } finally { pool.query = original; }
});
