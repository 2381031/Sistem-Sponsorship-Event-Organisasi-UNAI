// Local integration smoke checks. All API traffic is mocked; no database is used.
// Run: node tests/dashboard-browser.mjs (Node 22+, Edge/Chrome via BROWSER_PATH).
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, join, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createServer } from 'vite';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const browserPath = process.env.BROWSER_PATH || 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const sleep = ms => new Promise(done => setTimeout(done, ms));
async function until(check, label, timeout = 10000) {
  const deadline = Date.now() + timeout;
  while (Date.now() < deadline) {
    const result = await check();
    if (result) return result;
    await sleep(30);
  }
  throw new Error(`Timed out: ${label}`);
}

class CDP {
  constructor(url) {
    this.nextId = 0;
    this.pending = new Map();
    this.ws = new WebSocket(url);
    this.ready = new Promise((done, fail) => {
      this.ws.addEventListener('open', done, { once: true });
      this.ws.addEventListener('error', fail, { once: true });
    });
    this.ws.addEventListener('message', event => {
      const message = JSON.parse(event.data);
      const call = this.pending.get(message.id);
      if (!call) return;
      this.pending.delete(message.id);
      clearTimeout(call.timer);
      if (message.error) call.fail(new Error(message.error.message));
      else call.done(message.result);
    });
  }
  async send(method, params = {}) {
    await this.ready;
    const id = ++this.nextId;
    const result = new Promise((done, fail) => {
      const timer = setTimeout(() => { this.pending.delete(id); fail(new Error(`CDP timeout: ${method}`)); }, 10000);
      this.pending.set(id, { done, fail, timer });
    });
    this.ws.send(JSON.stringify({ id, method, params }));
    return result;
  }
  async evaluate(expression) {
    const result = await this.send('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true });
    if (result.exceptionDetails) throw new Error(result.exceptionDetails.exception?.description || result.exceptionDetails.text);
    return result.result.value;
  }
  close() { this.ws.close(); }
}

const organization = { id: 7, email: 'organization@example.invalid', peran: 'Organisasi', status_akun: 'Aktif', profil: { nama_organisasi: 'Organisasi Smoke', nama_bank: 'Bank Uji', nomor_rekening: '12345', nama_rekening: 'Organisasi Smoke' } };
const sponsor = { id: 8, email: 'sponsor@example.invalid', peran: 'Sponsor', status_akun: 'Aktif', profil: { nama_perusahaan: 'Sponsor Smoke' } };
const event = { id_event: 11, id_organisasi: 7, nama_event: 'Event Smoke Independen', tanggal_event: '2026-10-01', deskripsi: 'Event pengujian lokal', target_dana: 1000000, dana_terkumpul: 0, url_proposal: '/proposal-mock.pdf', status_event: 'Dipublikasikan', paket_tersedia: [{ id_paket: 21, id_event: 11, nama_paket: 'Spesial', persentase_dana: 0, deskripsi_keuntungan: 'Kontribusi sukarela' }] };

function mockApi(config) {
  const nativeFetch = window.fetch.bind(window);
  const calls = [];
  const pending = new Map();
  const errors = [];
  window.addEventListener('error', event => errors.push(event.message));
  window.addEventListener('unhandledrejection', event => errors.push(String(event.reason)));
  localStorage.clear();
  localStorage.setItem('unai_token', 'local-smoke-token');
  localStorage.setItem('unai_current_user', JSON.stringify(config.user));
  const response = (data, status = 200) => new Response(JSON.stringify(data), { status, headers: { 'content-type': 'application/json' } });
  window.__mock = {
    calls, errors, docs: [], confirmResult: true, confirmations: [],
    release(path, data, status = 200) {
      const done = pending.get(path);
      if (!done) throw new Error(`No pending request: ${path}`);
      pending.delete(path);
      done(response(data, status));
    },
  };
  window.confirm = message => { window.__mock.confirmations.push(message); return window.__mock.confirmResult; };
  const nativeSetInterval = window.setInterval.bind(window);
  window.setInterval = (callback, delay, ...args) => {
    if (delay === 30000) window.__mock.refresh = () => {
      const nativeNow = Date.now;
      Date.now = () => nativeNow() + 31000;
      try { callback(...args); } finally { Date.now = nativeNow; }
    };
    return nativeSetInterval(callback, delay, ...args);
  };
  window.fetch = async (input, options = {}) => {
    const url = new URL(typeof input === 'string' ? input : input.url, location.href);
    if (!url.pathname.startsWith('/api/')) return nativeFetch(input, options);
    const method = options.method || 'GET';
    calls.push({ path: url.pathname, method, ...(typeof options.body === 'string' ? { body: JSON.parse(options.body) } : {}), ...(options.body instanceof FormData ? { fields: Object.fromEntries([...options.body].map(([key, value]) => [key, value instanceof File ? value.name : value])) } : {}), ...(options.body instanceof FormData && url.pathname === '/api/dokumentasi' ? {
      eventId: options.body.get('id_event'), fileName: options.body.get('file')?.name,
    } : {}) });
    if (config.hold?.includes(`${method} ${url.pathname}`)) {
      return new Promise(done => pending.set(url.pathname, done));
    }
    if (method === 'GET' && url.pathname === '/api/events') return response([config.event]);
    if (method === 'GET' && url.pathname === '/api/sponsorships') return response(config.transactions || []);
    if (method === 'GET' && url.pathname === '/api/dokumentasi') return response(window.__mock.docs);
    if (method === 'GET' && url.pathname === '/api/users/organizations') return response([config.organization]);
    if (method === 'GET' && url.pathname === '/api/users') return response(config.users || []);
    if (method === 'GET' && url.pathname === `/api/users/${config.user.id}`) return response(config.user);
    throw new Error(`Unexpected mocked API request: ${method} ${url.pathname}`);
  };
}

let server;
let browser;
let browserCdp;
let profile;
let browserFailure;
const pages = [];
try {
  server = await createServer({ root, server: { host: '127.0.0.1', port: 0 }, plugins: [{
    name: 'block-unmocked-api',
    configureServer(instance) {
      instance.middlewares.use((request, response, next) => {
        if (!request.url?.startsWith('/api/')) return next();
        response.statusCode = 501;
        response.end('Browser test prohibits live API access.');
      });
    },
  }] });
  await server.listen();
  const address = server.httpServer.address();
  const origin = `http://127.0.0.1:${address.port}`;
  profile = await mkdtemp(join(tmpdir(), 'unai-dashboard-smoke-'));
  browser = spawn(browserPath, ['--headless=new', '--disable-gpu', '--no-first-run', '--no-default-browser-check', '--disable-background-networking', '--remote-debugging-port=0', `--user-data-dir=${profile}`, 'about:blank'], { windowsHide: true, stdio: 'ignore' });
  browser.on('error', error => { browserFailure = error; });
  const debugPort = await until(async () => {
    if (browserFailure) throw browserFailure;
    try { return (await readFile(join(profile, 'DevToolsActivePort'), 'utf8')).split('\n')[0]; }
    catch { return null; }
  }, 'Edge DevTools port');
  const debugOrigin = `http://127.0.0.1:${debugPort}`;
  const version = await (await fetch(`${debugOrigin}/json/version`)).json();
  browserCdp = new CDP(version.webSocketDebuggerUrl);

  async function openPage(config) {
    const { targetId } = await browserCdp.send('Target.createTarget', { url: 'about:blank' });
    const targets = await (await fetch(`${debugOrigin}/json/list`)).json();
    const page = new CDP(targets.find(target => target.id === targetId).webSocketDebuggerUrl);
    pages.push(page);
    await page.send('Page.enable');
    await page.send('Page.addScriptToEvaluateOnNewDocument', { source: `(${mockApi.toString()})(${JSON.stringify({ event, organization, ...config })})` });
    await page.send('Page.navigate', { url: origin });
    return { page, close: () => browserCdp.send('Target.closeTarget', { targetId }) };
  }
  const includes = (page, text) => page.evaluate(`document.body.innerText.includes(${JSON.stringify(text)})`);
  const calls = page => page.evaluate('window.__mock.calls');
  const count = (list, path, method = 'GET') => list.filter(call => call.path === path && call.method === method).length;
  const click = (page, text) => page.evaluate(`(() => { const button = [...document.querySelectorAll('button')].find(button => button.textContent.includes(${JSON.stringify(text)})); if (!button) throw new Error('Missing button: ' + ${JSON.stringify(text)}); button.click(); })()`);

  console.log('Checking organization loading while documentation/profile are pending...');
  const orgTab = await openPage({ user: organization, hold: ['GET /api/dokumentasi', 'GET /api/users/7'] });
  const orgPage = orgTab.page;
  await until(() => includes(orgPage, event.nama_event), 'organization event before secondary data');
  await orgPage.evaluate(`for (let i = 0; i < 5; i++) window.dispatchEvent(new Event('focus'))`);
  await sleep(100);
  for (const path of ['/api/events', '/api/sponsorships', '/api/dokumentasi', '/api/users/7']) {
    assert.equal(count(await calls(orgPage), path), 1, `StrictMode/focus duplicate for ${path}`);
  }
  assert.equal(count(await calls(orgPage), '/api/users/organizations'), 0);
  console.log('PASS: primary dashboard visible; concurrent StrictMode/focus reads deduplicated.');

  await orgPage.evaluate(`window.__mock.release('/api/dokumentasi', { message: 'Dokumentasi mock unavailable' }, 500)`);
  await until(() => includes(orgPage, 'Dokumentasi mock unavailable'), 'secondary error banner');
  assert.equal(await includes(orgPage, event.nama_event), true, 'documentation failure hides events');
  console.log('PASS: documentation failure preserves loaded event data.');

  await orgPage.evaluate(`document.querySelector('button[title="Logout"]').click()`);
  await until(() => includes(orgPage, 'Daftar Akun Baru'), 'logout shows login');
  await orgPage.evaluate(`window.__mock.release('/api/users/7', ${JSON.stringify({ ...organization, profil: { nama_organisasi: 'STALE RESPONSE' } })})`);
  await sleep(100);
  assert.equal(await includes(orgPage, 'Dashboard Monitoring'), false);
  assert.equal(await orgPage.evaluate(`localStorage.getItem('unai_current_user')`), null);
  assert.deepEqual(await orgPage.evaluate('window.__mock.errors'), []);
  await orgTab.close();
  console.log('PASS: late profile response cannot restore a logged-out session.');

  console.log('Checking sponsor organization request and payment submit...');
  const sponsorTab = await openPage({ user: sponsor, hold: ['POST /api/sponsorships'] });
  const sponsorPage = sponsorTab.page;
  await until(() => includes(sponsorPage, 'Cari Event & Ajukan Sponsorship'), 'sponsor dashboard');
  await sponsorPage.evaluate(`for (let i = 0; i < 5; i++) window.dispatchEvent(new Event('focus'))`);
  await sleep(100);
  assert.equal(count(await calls(sponsorPage), '/api/users/organizations'), 1);
  assert.equal(count(await calls(sponsorPage), '/api/sponsorships'), 1);
  await click(sponsorPage, 'Lihat Detail');
  await until(() => includes(sponsorPage, 'Lanjutkan Pembayaran'), 'package selection');
  await click(sponsorPage, 'Lanjutkan Pembayaran');
  await until(() => includes(sponsorPage, 'Upload Bukti Pembayaran'), 'payment form');
  await sponsorPage.evaluate(`(() => {
    const amount = document.querySelector('input[type="number"]');
    Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set.call(amount, '100000');
    amount.dispatchEvent(new Event('input', { bubbles: true }));
    const transfer = new DataTransfer();
    transfer.items.add(new File([Uint8Array.from(atob('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jf1cAAAAASUVORK5CYII='), c => c.charCodeAt(0))], 'proof.png', { type: 'image/png' }));
    const file = document.querySelector('input[type="file"]');
    file.files = transfer.files;
    file.dispatchEvent(new Event('change', { bubbles: true }));
  })()`);
  await sleep(30);
  await sponsorPage.evaluate(`(() => { const form = document.querySelector('form'); form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true })); form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true })); })()`);
  await until(async () => count(await calls(sponsorPage), '/api/sponsorships', 'POST') === 1, 'payment submission');
  await until(() => includes(sponsorPage, 'Mengirim...'), 'pending submit indicator');
  const tx = { id_transaksi: 31, id_event: 11, id_sponsor: 8, id_paket: 21, jumlah: 100000, bukti_pembayaran: '/proof-mock.png', status_pembayaran: 'Menunggu', id_admin_verifikator: null, tanggal_transaksi: '2026-09-22', nama_event: event.nama_event, nama_sponsor: 'Sponsor Smoke', nama_paket: 'Spesial', sponsor_files: [] };
  const submittedAt = Date.now();
  await sponsorPage.evaluate(`window.__mock.release('/api/sponsorships', ${JSON.stringify(tx)})`);
  await until(() => sponsorPage.evaluate(`document.querySelector('h2')?.textContent === 'Riwayat Sponsorship Saya'`), 'immediate history navigation', 1200);
  assert.ok(Date.now() - submittedAt < 1200, 'success navigation contains artificial delay');
  assert.equal(await includes(sponsorPage, 'Bukti transfer berhasil dikirim!'), true);
  assert.equal(await includes(sponsorPage, 'Total: 1 sponsorship'), true, 'mutation response not applied');
  assert.equal(count(await calls(sponsorPage), '/api/sponsorships', 'POST'), 1, 'double submit reached API');
  assert.equal(count(await calls(sponsorPage), '/api/sponsorships'), 1, 'submission reloaded transaction list');
  assert.deepEqual(await sponsorPage.evaluate('window.__mock.errors'), []);
  await sponsorTab.close();
  console.log('PASS: organizations loaded once; duplicate submit blocked; immediate history uses mutation response.');
  console.log('Checking sponsorship corrections while awaiting verification...');
  const oldLogo = { kind: 'logo', name: 'logo.png', url: '/api/uploads/sponsor-files/logo.png', mime: 'image/png' };
  const oldBrochure = { kind: 'promosi', name: 'brochure.pdf', url: '/api/uploads/sponsor-files/brochure.pdf', mime: 'application/pdf' };
  const editingEvent = { ...event, paket_tersedia: [event.paket_tersedia[0], { id_paket: 22, nama_paket: 'Gold', persentase_dana: 50, deskripsi_keuntungan: 'Logo dan brosur' }] };
  const editingTx = { ...tx, bukti_pembayaran: '/api/uploads/sponsor-files/proof.png', sponsor_files: [oldLogo, oldBrochure] };
  const editTab = await openPage({ user: sponsor, event: editingEvent, transactions: [editingTx, { ...tx, id_transaksi: 32, status_pembayaran: 'Diverifikasi' }, { ...tx, id_transaksi: 33, status_pembayaran: 'Ditolak' }], hold: ['PATCH /api/sponsorships/31'] });
  const editPage = editTab.page;
  await until(() => includes(editPage, 'Cari Event & Ajukan Sponsorship'), 'edit sponsor dashboard');
  await click(editPage, 'Riwayat');
  await until(() => includes(editPage, 'Edit Sponsorship'), 'pending edit action');
  assert.equal(await editPage.evaluate(`Array.from(document.querySelectorAll('button')).filter(b => b.textContent === 'Edit Sponsorship').length`), 1, 'only pending sponsorship editable');
  await click(editPage, 'Edit Sponsorship');
  assert.equal(await editPage.evaluate(`document.querySelector('input[name="nama_sponsor"]').value`), 'Sponsor Smoke');
  await editPage.evaluate(`(() => {
    const setInput = (selector, value) => { const input = document.querySelector(selector); Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set.call(input, value); input.dispatchEvent(new Event('input', { bubbles: true })); };
    setInput('input[name="nama_sponsor"]', 'Nama Sponsor Benar');
    setInput('input[name="nama_pengirim"]', 'Andre');
    const select = document.querySelector('form select'); select.value = '22'; select.dispatchEvent(new Event('change', { bubbles: true }));
    const file = document.querySelector('input[name="bukti_pembayaran"]');
    const transfer = new DataTransfer(); transfer.items.add(new File([new Uint8Array([137,80,78,71,13,10,26,10])], 'correct-proof.png', { type: 'image/png' }));
    file.files = transfer.files; file.dispatchEvent(new Event('change', { bubbles: true }));
  })()`);
  await until(() => includes(editPage, 'Nominal sesuai paket:'), 'fixed package amount');
  assert.equal(await editPage.evaluate(`document.querySelector('form input[type="number"]')`), null, 'fixed package price must not be editable');
  await click(editPage, 'Hapus lampiran tersimpan');
  await editPage.evaluate(`(() => { const form = document.querySelector('form'); for (let i = 0; i < 2; i++) form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true })); })()`);
  await until(async () => count(await calls(editPage), '/api/sponsorships/31', 'PATCH') === 1, 'single sponsorship edit request');
  const editRequest = (await calls(editPage)).find(call => call.method === 'PATCH');
  assert.deepEqual(editRequest.fields, { id_paket: '22', jumlah: '500000', nama_sponsor: 'Nama Sponsor Benar', nama_pengirim: 'Andre', bukti_pembayaran: 'correct-proof.png', remove_materials: '["promosi"]' });
  assert.equal(await editPage.evaluate(`document.querySelector('fieldset').disabled`), true);
  await editPage.evaluate(`window.__mock.release('/api/sponsorships/31', { message: 'Simpan gagal sementara' }, 500)`);
  await until(() => includes(editPage, 'Simpan gagal sementara'), 'failed edit is visible');
  assert.equal(await editPage.evaluate(`document.querySelector('input[name="nama_sponsor"]').value`), 'Nama Sponsor Benar');
  await click(editPage, 'Simpan Perubahan');
  await until(async () => count(await calls(editPage), '/api/sponsorships/31', 'PATCH') === 2, 'edit retry');
  await editPage.evaluate(`window.__mock.release('/api/sponsorships/31', ${JSON.stringify({ ...editingTx, id_paket: 22, nama_paket: 'Gold', jumlah: 500000, nama_sponsor: 'Nama Sponsor Benar', nama_pengirim: 'Andre', sponsor_files: [oldLogo], bukti_pembayaran: '/api/uploads/sponsor-files/correct-proof.png' })})`);
  await until(() => includes(editPage, 'Sponsorship diperbarui dan masih menunggu persetujuan Admin.'), 'edit applied immediately');
  assert.equal(await includes(editPage, 'Nama Sponsor Benar'), true);
  assert.equal(await includes(editPage, 'brochure.pdf'), false);
  assert.equal(count(await calls(editPage), '/api/sponsorships'), 1, 'edit should not reload list');
  assert.deepEqual(await editPage.evaluate('window.__mock.errors'), []);
  await editTab.close();
  console.log('PASS: only pending owner edits package, names, proof and optional attachments; failed edit retains draft.');
  console.log('Checking organization documentation upload, retry, and duplicate submit...');
  const uploadTab = await openPage({ user: organization, hold: ['POST /api/dokumentasi'] });
  const uploadPage = uploadTab.page;
  await until(() => includes(uploadPage, 'Lihat Semua Event'), 'organization dashboard');
  await click(uploadPage, 'Lihat Semua Event');
  await until(() => includes(uploadPage, 'Unggah Dokumentasi Kegiatan'), 'documentation form');
  const selectDocumentation = async (name, type, size = 20) => {
    await uploadPage.evaluate(`(() => {
      const transfer = new DataTransfer();
      transfer.items.add(new File([new Uint8Array(${size})], ${JSON.stringify(name)}, { type: ${JSON.stringify(type)} }));
      const input = document.getElementById('documentation-11');
      input.files = transfer.files;
      input.dispatchEvent(new Event('change', { bubbles: true }));
    })()`);
  };
  await selectDocumentation('too-large.pdf', 'application/pdf', 4 * 1024 * 1024 + 1);
  await click(uploadPage, 'Unggah Dokumentasi');
  await until(() => includes(uploadPage, 'Pilih dokumentasi JPG, PDF, atau MP4 maksimal 4 MB.'), 'size validation');
  assert.equal(count(await calls(uploadPage), '/api/dokumentasi', 'POST'), 0);
  await selectDocumentation('pelaksanaan.pdf', 'application/pdf');
  await uploadPage.evaluate(`(() => { const form = document.querySelector('form[aria-label]'); for (let i = 0; i < 2; i++) form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true })); })()`);
  await until(() => includes(uploadPage, 'Mengunggah...'), 'upload indicator');
  const uploadCalls = (await calls(uploadPage)).filter(call => call.method === 'POST');
  assert.equal(uploadCalls.length, 1);
  assert.equal(uploadCalls[0].eventId, '11');
  assert.equal(uploadCalls[0].fileName, 'pelaksanaan.pdf');
  await uploadPage.evaluate(`window.__mock.release('/api/dokumentasi', { message: 'Unggah gagal untuk pengujian' }, 500)`);
  await until(() => includes(uploadPage, 'Unggah gagal untuk pengujian'), 'upload error');
  assert.equal(await uploadPage.evaluate(`document.getElementById('documentation-11').files[0].name`), 'pelaksanaan.pdf');
  await click(uploadPage, 'Unggah Dokumentasi');
  await until(async () => count(await calls(uploadPage), '/api/dokumentasi', 'POST') === 2, 'upload retry');
  const uploadedDoc = { id_dokumentasi: 51, id_event: 11, id_pengguna: 7, tipe_file: 'PDF', url_file: '/api/uploads/dokumentasi/pelaksanaan.pdf' };
  await uploadPage.evaluate(`window.__mock.release('/api/dokumentasi', ${JSON.stringify(uploadedDoc)})`);
  await until(() => includes(uploadPage, 'Dokumentasi berhasil diunggah'), 'upload success without reload');
  assert.equal(await includes(uploadPage, 'Dokumentasi Kegiatan (1)'), true);
  assert.equal(await uploadPage.evaluate(`document.getElementById('documentation-11').value`), '');
  assert.equal(count(await calls(uploadPage), '/api/dokumentasi'), 1, 'upload reloaded documentation');
  assert.deepEqual(await uploadPage.evaluate('window.__mock.errors'), []);
  await uploadTab.close();
  console.log('PASS: size validated, event identified, duplicate blocked, failed upload retryable, gallery updates immediately.');

  const recipientTab = await openPage({ user: sponsor, transactions: [{ ...tx, status_pembayaran: 'Diverifikasi' }] });
  const recipientPage = recipientTab.page;
  await until(() => includes(recipientPage, 'Cari Event & Ajukan Sponsorship'), 'recipient dashboard');
  await click(recipientPage, 'Riwayat');
  await until(() => includes(recipientPage, 'Dokumentasi Kegiatan (0)'), 'recipient empty documentation');
  await recipientPage.evaluate(`window.__mock.docs = ${JSON.stringify([uploadedDoc])}; window.__mock.refresh();`);
  await until(() => includes(recipientPage, 'Dokumentasi Kegiatan (1)'), 'automatic documentation refresh');
  assert.equal(await recipientPage.evaluate(`document.querySelector('a[href="/api/uploads/dokumentasi/pelaksanaan.pdf"]')?.textContent`), 'Buka Dokumentasi PDF');
  assert.equal(await includes(recipientPage, 'Proposal Event Organisasi'), true);
  assert.deepEqual(await recipientPage.evaluate('window.__mock.errors'), []);
  await recipientTab.close();
  console.log('PASS: sponsor history receives documentation through background refresh, separately from event proposal.');
  console.log('Checking sponsor email profile persistence and duplicate-email failure...');
  const profileTab = await openPage({ user: sponsor, hold: ['PATCH /api/users/8'] });
  const profilePage = profileTab.page;
  await until(() => includes(profilePage, 'Cari Event & Ajukan Sponsorship'), 'profile dashboard');
  await click(profilePage, 'Profil');
  await until(() => includes(profilePage, 'Update Profil'), 'profile form');
  await profilePage.evaluate(`(() => {
    const email = document.querySelector('input[name="email"]');
    Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set.call(email, 'sponsor.updated@example.invalid');
    email.dispatchEvent(new Event('input', { bubbles: true }));
  })()`);
  await profilePage.evaluate(`document.querySelector('form').dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }))`);
  await until(async () => count(await calls(profilePage), '/api/users/8', 'PATCH') === 1, 'profile update');
  assert.equal((await calls(profilePage)).find(call => call.method === 'PATCH').body.email, 'sponsor.updated@example.invalid');
  await profilePage.evaluate(`window.__mock.release('/api/users/8', { message: 'Email sudah digunakan akun lain.' }, 409)`);
  await until(() => includes(profilePage, 'Email sudah digunakan akun lain.'), 'email conflict shown');
  assert.equal(await profilePage.evaluate(`JSON.parse(localStorage.getItem('unai_current_user')).email`), sponsor.email);
  await profilePage.evaluate(`document.querySelector('form').dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }))`);
  await until(async () => count(await calls(profilePage), '/api/users/8', 'PATCH') === 2, 'profile retry');
  await profilePage.evaluate(`window.__mock.release('/api/users/8', ${JSON.stringify({ ...sponsor, email: 'sponsor.updated@example.invalid' })})`);
  await until(() => includes(profilePage, 'Profil berhasil diperbarui!'), 'profile saved');
  assert.equal(await profilePage.evaluate(`JSON.parse(localStorage.getItem('unai_current_user')).email`), 'sponsor.updated@example.invalid');
  await click(profilePage, 'Riwayat');
  await click(profilePage, 'Profil');
  assert.equal(await profilePage.evaluate(`document.querySelector('input[name="email"]').value`), 'sponsor.updated@example.invalid');
  assert.deepEqual(await profilePage.evaluate('window.__mock.errors'), []);
  await profileTab.close();
  console.log('PASS: edited email sent to server, conflicts preserve session, successful response updates profile and session.');
  const activeAccountsTab = await openPage({ user: { id: 1, email: 'admin@example.invalid', peran: 'Admin', status_akun: 'Aktif' }, users: [organization, sponsor] });
  await until(() => includes(activeAccountsTab.page, 'Tidak ada akun yang menunggu verifikasi.'), 'active accounts dashboard ready');
  await click(activeAccountsTab.page, 'Pengguna');
  await until(() => includes(activeAccountsTab.page, 'Total: 2 pengguna'), 'active accounts loaded');
  assert.equal(await activeAccountsTab.page.evaluate(`document.querySelectorAll('button[aria-label^="Tolak akun"]').length`), 0, 'approved accounts cannot be rejected');
  assert.equal(await activeAccountsTab.page.evaluate(`document.querySelectorAll('button[aria-label^="Hapus akun"]').length`), 2, 'approved accounts can be deleted');
  await activeAccountsTab.close();
  console.log('Checking admin rejection and account removal...');
  const admin = { id: 1, email: 'admin@example.invalid', peran: 'Admin', status_akun: 'Aktif' };
  const adminTab = await openPage({ user: admin, users: [admin, { ...organization, status_akun: 'Menunggu Verifikasi' }, { ...sponsor, status_akun: 'Menunggu Verifikasi' }], transactions: [{ ...tx, sponsor_files: [oldBrochure] }],
    hold: ['PATCH /api/users/7/status', 'PATCH /api/users/8/status', 'DELETE /api/users/7', 'DELETE /api/users/8', 'PATCH /api/sponsorships/31/verify'] });
  const adminPage = adminTab.page;
  await until(() => includes(adminPage, 'Tolak Akun'), 'admin account decisions');
  for (const user of [organization, sponsor]) {
    await click(adminPage, 'Tolak Akun');
    const path = `/api/users/${user.id}/status`;
    await until(async () => count(await calls(adminPage), path, 'PATCH') === 1, 'account rejection request');
    assert.deepEqual((await calls(adminPage)).find(call => call.path === path).body, { status: 'Ditolak' });
    await adminPage.evaluate(`window.__mock.release(${JSON.stringify(path)}, ${JSON.stringify({ ...user, status_akun: 'Ditolak' })})`);
    await until(() => includes(adminPage, 'Akun ditolak.'), 'account rejection success');
  }
  await until(() => includes(adminPage, 'Tidak ada akun yang menunggu verifikasi.'), 'pending accounts removed');
  await click(adminPage, 'Pembayaran');
  await until(() => includes(adminPage, 'Tolak Pembayaran'), 'payment rejection button');
  assert.equal(await includes(adminPage, 'BUKTI PEMBAYARAN DAN LAMPIRAN SPONSOR'), true);
  assert.equal(await includes(adminPage, 'brochure.pdf'), true);
  await adminPage.evaluate(`(() => { const button = [...document.querySelectorAll('button')].find(b => b.textContent.includes('Tolak Pembayaran')); button.click(); button.click(); })()`);
  await until(async () => count(await calls(adminPage), '/api/sponsorships/31/verify', 'PATCH') === 1, 'payment rejection single request');
  assert.deepEqual((await calls(adminPage)).find(call => call.path === '/api/sponsorships/31/verify').body, { status: 'Ditolak' });
  await adminPage.evaluate(`window.__mock.release('/api/sponsorships/31/verify', { message: 'Penolakan belum tersimpan' }, 500)`);
  await until(() => includes(adminPage, 'Penolakan belum tersimpan'), 'failed rejection shown');
  assert.equal(await includes(adminPage, 'Tolak Pembayaran'), true);
  await click(adminPage, 'Tolak Pembayaran');
  await until(async () => count(await calls(adminPage), '/api/sponsorships/31/verify', 'PATCH') === 2, 'payment rejection retry');
  await adminPage.evaluate(`window.__mock.release('/api/sponsorships/31/verify', ${JSON.stringify({ ...tx, status_pembayaran: 'Ditolak' })})`);
  await until(() => includes(adminPage, 'Tidak ada pembayaran pending.'), 'rejected payment removed from queue');
  assert.equal(await includes(adminPage, 'Pembayaran ditolak.'), true);
  await click(adminPage, 'Pengguna');
  await until(() => includes(adminPage, 'Total: 3 pengguna'), 'user management');
  assert.equal(await adminPage.evaluate(`document.querySelectorAll('button[aria-label^="Hapus akun"]').length`), 2, 'admin account must have no delete button');
  await adminPage.evaluate('window.__mock.confirmResult = false');
  await click(adminPage, 'Hapus Akun');
  assert.equal((await calls(adminPage)).filter(call => call.method === 'DELETE').length, 0, 'cancel must not delete');
  await adminPage.evaluate('window.__mock.confirmResult = true');
  for (const [index, user] of [organization, sponsor].entries()) {
    await click(adminPage, 'Hapus Akun');
    const path = `/api/users/${user.id}`;
    await until(async () => count(await calls(adminPage), path, 'DELETE') === 1, 'account deletion request');
    if (index === 0) {
      await adminPage.evaluate(`window.__mock.release(${JSON.stringify(path)}, { message: 'Penghapusan gagal sementara' }, 500)`);
      await until(() => includes(adminPage, 'Penghapusan gagal sementara'), 'deletion failure shown');
      assert.equal(await includes(adminPage, 'Total: 3 pengguna'), true, 'failed removal must retain account');
      await click(adminPage, 'Hapus Akun');
      await until(async () => count(await calls(adminPage), path, 'DELETE') === 2, 'account deletion retry');
    }
    await adminPage.evaluate(`window.__mock.release(${JSON.stringify(path)}, { message: 'Akun dihapus' })`);
    await until(() => includes(adminPage, `Total: ${2 - index} pengguna`), 'account removed after successful response');
  }
  assert.equal(count(await calls(adminPage), '/api/users'), 1, 'mutations must not reload entire user list');
  assert.deepEqual(await adminPage.evaluate('window.__mock.errors'), []);
  await adminTab.close();
  console.log('PASS: both roles rejected/deleted, payment rejection retryable, cancel respected, admin protected.');
  console.log('All dashboard browser smoke checks passed (mock API, no database changes).');
} finally {
  for (const page of pages) page.close();
  if (browserCdp) {
    await browserCdp.send('Browser.close').catch(() => {});
    browserCdp.close();
  }
  if (browser && browser.exitCode === null) {
    await Promise.race([new Promise(done => browser.once('exit', done)), sleep(2000)]);
    if (browser.exitCode === null) browser.kill();
  }
  await server?.close();
  if (profile) {
    const resolvedProfile = resolve(profile);
    const temporaryRoot = resolve(tmpdir());
    assert.ok(resolvedProfile.startsWith(`${temporaryRoot}${sep}unai-dashboard-smoke-`), 'Refusing cleanup outside test profile');
    await rm(resolvedProfile, { recursive: true, force: true, maxRetries: 3, retryDelay: 100 }).catch(() => {});
  }
}
