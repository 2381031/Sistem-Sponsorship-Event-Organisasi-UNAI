import assert from 'node:assert/strict';
import { afterEach, beforeEach, test, type TestContext } from 'node:test';
import { api } from '../src/api';

let restoreStorage: () => void;
beforeEach(() => {
  const descriptor = Object.getOwnPropertyDescriptor(globalThis, 'localStorage');
  const values = new Map<string, string>();
  const storage: Storage = {
    get length() { return values.size; },
    clear: () => values.clear(),
    getItem: (key) => values.get(key) ?? null,
    key: (index) => [...values.keys()][index] ?? null,
    removeItem: (key) => { values.delete(key); },
    setItem: (key, value) => { values.set(key, value); },
  };
  Object.defineProperty(globalThis, 'localStorage', { configurable: true, value: storage });
  api.clearToken();
  restoreStorage = () => {
    api.clearToken();
    if (descriptor) Object.defineProperty(globalThis, 'localStorage', descriptor);
    else Reflect.deleteProperty(globalThis, 'localStorage');
  };
});
afterEach(() => restoreStorage());

function deferredResponse() {
  let resolve!: (value: Response) => void;
  let reject!: (reason: unknown) => void;
  const promise = new Promise<Response>((accept, fail) => { resolve = accept; reject = fail; });
  return { promise, resolve, reject };
}

function jsonResponse(value: unknown, status = 200) {
  return new Response(JSON.stringify(value), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

function mockPendingFetch(t: TestContext) {
  const requests: Array<{ url: string; options: RequestInit; response: ReturnType<typeof deferredResponse> }> = [];
  t.mock.method(globalThis, 'fetch', (url: string, options: RequestInit) => {
    const response = deferredResponse();
    requests.push({ url, options, response });
    return response.promise;
  });
  return requests;
}

test('concurrent reads share one request, while a later read fetches fresh data', async (t) => {
  const requests = mockPendingFetch(t);
  const first = api.getEvents();
  const second = api.getEvents();
  assert.equal(requests.length, 1);
  assert.equal(requests[0].url, '/api/events');
  requests[0].response.resolve(jsonResponse([{ id_event: 1 }]));
  const results = await Promise.all([first, second]);
  assert.deepEqual(results, [[{ id_event: 1 }], [{ id_event: 1 }]]);

  const next = api.getEvents();
  assert.equal(requests.length, 2);
  requests[1].response.resolve(jsonResponse([{ id_event: 2 }]));
  assert.deepEqual(await next, [{ id_event: 2 }]);
});

test('reads from different endpoints are not combined', async (t) => {
  const requests = mockPendingFetch(t);
  const events = api.getEvents();
  const users = api.getUsers();
  assert.deepEqual(requests.map(({ url }) => url), ['/api/events', '/api/users']);
  requests[0].response.resolve(jsonResponse([{ id_event: 1 }]));
  requests[1].response.resolve(jsonResponse([{ id_pengguna: 2 }]));
  assert.deepEqual(await events, [{ id_event: 1 }]);
  assert.deepEqual(await users, [{ id_pengguna: 2 }]);
});

test('starting and completing a mutation both invalidate pending reads', async (t) => {
  const requests = mockPendingFetch(t);
  const beforeMutation = api.getEvents();
  const mutation = api.updateEvent(1, { nama_event: 'Updated' });
  const duringMutation = api.getEvents();
  assert.equal(requests.length, 3);
  assert.equal(requests[1].options.method, 'PATCH');

  // Completing an older read must not discard the read started after the mutation.
  requests[0].response.resolve(jsonResponse([{ nama_event: 'Before' }]));
  await beforeMutation;
  const sharedDuringMutation = api.getEvents();
  assert.equal(requests.length, 3);

  requests[1].response.resolve(jsonResponse({ nama_event: 'Updated' }));
  await mutation;
  const afterMutation = api.getEvents();
  assert.equal(requests.length, 4);
  requests[2].response.resolve(jsonResponse([{ nama_event: 'During' }]));
  requests[3].response.resolve(jsonResponse([{ nama_event: 'Updated' }]));
  assert.deepEqual(await duringMutation, [{ nama_event: 'During' }]);
  assert.deepEqual(await sharedDuringMutation, [{ nama_event: 'During' }]);
  assert.deepEqual(await afterMutation, [{ nama_event: 'Updated' }]);
});

test('a failed mutation also releases reads so a retry can load current server state', async (t) => {
  const requests = mockPendingFetch(t);
  const mutation = api.updateEvent(1, { nama_event: 'Updated' });
  const duringMutation = api.getEvents();
  const rejected = assert.rejects(mutation, /Connection lost/);
  requests[0].response.reject(new Error('Connection lost'));
  await rejected;

  const afterFailure = api.getEvents();
  assert.equal(requests.length, 3);
  requests[1].response.resolve(jsonResponse([{ nama_event: 'Before' }]));
  requests[2].response.resolve(jsonResponse([{ nama_event: 'Updated' }]));
  await duringMutation;
  assert.deepEqual(await afterFailure, [{ nama_event: 'Updated' }]);
});

test('different login tokens never share an in-flight response', async (t) => {
  const requests = mockPendingFetch(t);
  localStorage.setItem('unai_token', 'token-sponsor-a');
  const first = api.getMyTransactions();
  localStorage.setItem('unai_token', 'token-sponsor-b');
  const second = api.getMyTransactions();
  assert.equal(requests.length, 2);
  assert.equal(new Headers(requests[0].options.headers).get('Authorization'), 'Bearer token-sponsor-a');
  assert.equal(new Headers(requests[1].options.headers).get('Authorization'), 'Bearer token-sponsor-b');
  requests[0].response.resolve(jsonResponse([{ sponsor: 'A' }]));
  requests[1].response.resolve(jsonResponse([{ sponsor: 'B' }]));
  assert.deepEqual(await first, [{ sponsor: 'A' }]);
  assert.deepEqual(await second, [{ sponsor: 'B' }]);
});

test('clearing a session invalidates pending reads even when the same token is used again', async (t) => {
  const requests = mockPendingFetch(t);
  localStorage.setItem('unai_token', 'token-a');
  const previousSession = api.getEvents();
  api.clearToken();
  assert.equal(localStorage.getItem('unai_token'), null);
  localStorage.setItem('unai_token', 'token-a');
  const newSession = api.getEvents();
  assert.equal(requests.length, 2);
  requests[0].response.resolve(jsonResponse([{ session: 'old' }]));
  requests[1].response.resolve(jsonResponse([{ session: 'new' }]));
  await previousSession;
  assert.deepEqual(await newSession, [{ session: 'new' }]);
});

test('failed concurrent reads are not cached and can be explicitly retried', async (t) => {
  const requests = mockPendingFetch(t);
  const first = api.getEvents();
  const second = api.getEvents();
  const failures = Promise.all([
    assert.rejects(first, /Database temporarily unavailable/),
    assert.rejects(second, /Database temporarily unavailable/),
  ]);
  assert.equal(requests.length, 1);
  requests[0].response.resolve(jsonResponse({ message: 'Database temporarily unavailable' }, 503));
  await failures;

  const retry = api.getEvents();
  assert.equal(requests.length, 2);
  requests[1].response.resolve(jsonResponse([{ id_event: 1 }]));
  assert.deepEqual(await retry, [{ id_event: 1 }]);
});

test('all file upload methods let the browser supply the multipart Content-Type', async (t) => {
  const requests = mockPendingFetch(t);
  localStorage.setItem('unai_token', 'upload-token');
  const uploaders = [
    (body: FormData) => api.createEvent(body),
    (body: FormData) => api.updateEvent(1, body),
    (body: FormData) => api.createTransaction(body),
    (body: FormData) => api.updateTransaction(1, body),
    (body: FormData) => api.createDoc(body),
  ];
  for (const upload of uploaders) {
    const body = new FormData();
    body.append('proposal', new Blob(['%PDF-test'], { type: 'application/pdf' }), 'proposal.pdf');
    const result = upload(body);
    const request = requests.at(-1)!;
    assert.equal(request.options.body, body);
    assert.equal(new Headers(request.options.headers).has('Content-Type'), false);
    assert.equal(new Headers(request.options.headers).get('Authorization'), 'Bearer upload-token');
    request.response.resolve(jsonResponse({ uploaded: true }));
    assert.deepEqual(await result, { uploaded: true });
  }
});

test('a stalled read is aborted after 20 seconds and can be retried', async (t) => {
  t.mock.timers.enable({ apis: ['setTimeout'] });
  let calls = 0;
  let signal: AbortSignal | null | undefined;
  t.mock.method(globalThis, 'fetch', (_url: string, options: RequestInit) => {
    calls++;
    if (calls > 1) return Promise.resolve(jsonResponse([]));
    signal = options.signal;
    return new Promise<Response>((_resolve, reject) => {
      signal!.addEventListener('abort', () => reject(new DOMException('Aborted', 'AbortError')), { once: true });
    });
  });
  const read = api.getEvents();
  const failure = assert.rejects(read, /Server belum merespons.*muat data kembali/);
  t.mock.timers.tick(19999);
  assert.equal(signal!.aborted, false);
  t.mock.timers.tick(1);
  assert.equal(signal!.aborted, true);
  await failure;
  assert.equal(calls, 1);
  assert.deepEqual(await api.getEvents(), []);
  assert.equal(calls, 2);
});

test('a stalled submission times out after 90 seconds with an uncertain-outcome warning and no retry', async (t) => {
  t.mock.timers.enable({ apis: ['setTimeout'] });
  let calls = 0;
  let signal: AbortSignal | null | undefined;
  t.mock.method(globalThis, 'fetch', (_url: string, options: RequestInit) => {
    calls++;
    signal = options.signal;
    return new Promise<Response>((_resolve, reject) => {
      signal!.addEventListener('abort', () => reject(new DOMException('Aborted', 'AbortError')), { once: true });
    });
  });
  const submission = api.createTransaction({ id_event: 1, jumlah: 100000 });
  const failure = assert.rejects(submission, /Periksa daftar atau riwayat.*mungkin sudah tersimpan/);
  t.mock.timers.tick(89999);
  assert.equal(signal!.aborted, false);
  t.mock.timers.tick(1);
  assert.equal(signal!.aborted, true);
  await failure;
  t.mock.timers.tick(180000);
  assert.equal(calls, 1);
});

test('submissions are never deduplicated or automatically retried after a failure', async (t) => {
  const requests = mockPendingFetch(t);
  const data = { id_event: 1, jumlah: 100000 };
  const first = api.createTransaction(data);
  const second = api.createTransaction(data);
  assert.equal(requests.length, 2);
  assert.equal(requests[0].options.method, 'POST');
  assert.equal(new Headers(requests[0].options.headers).get('Content-Type'), 'application/json');
  const failure = assert.rejects(first, /Connection lost/);
  requests[0].response.reject(new Error('Connection lost'));
  requests[1].response.resolve(jsonResponse({ id_transaksi: 2 }));
  await failure;
  assert.deepEqual(await second, { id_transaksi: 2 });
  assert.equal(requests.length, 2);
});
