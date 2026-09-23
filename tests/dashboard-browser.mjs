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
    calls, errors,
    release(path, data, status = 200) {
      const done = pending.get(path);
      if (!done) throw new Error(`No pending request: ${path}`);
      pending.delete(path);
      done(response(data, status));
    },
  };
  window.fetch = async (input, options = {}) => {
    const url = new URL(typeof input === 'string' ? input : input.url, location.href);
    if (!url.pathname.startsWith('/api/')) return nativeFetch(input, options);
    const method = options.method || 'GET';
    calls.push({ path: url.pathname, method });
    if (config.hold?.includes(`${method} ${url.pathname}`)) {
      return new Promise(done => pending.set(url.pathname, done));
    }
    if (method === 'GET' && url.pathname === '/api/events') return response([config.event]);
    if (method === 'GET' && url.pathname === '/api/sponsorships') return response([]);
    if (method === 'GET' && url.pathname === '/api/dokumentasi') return response([]);
    if (method === 'GET' && url.pathname === '/api/users/organizations') return response([config.organization]);
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
  await until(() => includes(sponsorPage, 'Riwayat Sponsorship Saya'), 'immediate history navigation', 1200);
  assert.ok(Date.now() - submittedAt < 1200, 'success navigation contains artificial delay');
  assert.equal(await includes(sponsorPage, 'Bukti transfer berhasil dikirim!'), true);
  assert.equal(await includes(sponsorPage, 'Total: 1 sponsorship'), true, 'mutation response not applied');
  assert.equal(count(await calls(sponsorPage), '/api/sponsorships', 'POST'), 1, 'double submit reached API');
  assert.equal(count(await calls(sponsorPage), '/api/sponsorships'), 1, 'submission reloaded transaction list');
  assert.deepEqual(await sponsorPage.evaluate('window.__mock.errors'), []);
  await sponsorTab.close();
  console.log('PASS: organizations loaded once; duplicate submit blocked; immediate history uses mutation response.');
  console.log('All 5 dashboard browser smoke checks passed (mock API, no database changes).');
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
