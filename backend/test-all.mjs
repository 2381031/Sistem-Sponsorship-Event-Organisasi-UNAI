import { spawn } from 'child_process';
import { resolve } from 'path';

const backendDir = resolve(import.meta.dirname);

// Start the server
const server = spawn('node', ['node_modules/tsx/dist/cli.mjs', 'src/main.ts'], {
  cwd: backendDir,
  stdio: ['ignore', 'pipe', 'pipe'],
});

let serverOutput = '';
server.stdout.on('data', (data) => {
  serverOutput += data.toString();
  process.stdout.write('[SERVER] ' + data.toString());
});
server.stderr.on('data', (data) => {
  serverOutput += data.toString();
  process.stderr.write('[SERVER ERR] ' + data.toString());
});

// Wait for server to start
function waitForServer(timeout = 15000) {
  return new Promise((resolve, reject) => {
    const start = Date.now();
    const check = setInterval(() => {
      if (serverOutput.includes('successfully started')) {
        clearInterval(check);
        resolve();
      } else if (Date.now() - start > timeout) {
        clearInterval(check);
        reject(new Error('Server startup timeout'));
      }
    }, 200);
  });
}

async function test() {
  try {
    console.log('\n=== Starting server... ===');
    await waitForServer();
    console.log('=== Server started! ===\n');

    // Test 1: Register organisasi
    console.log('--- Test 1: Register organisasi ---');
    const regRes = await fetch('http://localhost:4000/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'org1@test.com',
        password: 'password123',
        nama_lengkap: 'Budi Organisasi',
        peran: 'organisasi',
        organisasiDetails: {
          nama_organisasi: 'Organisasi UNAI',
          deskripsi: 'Test',
          no_telp: '08123456789',
          nama_rekening: 'BNI',
          nomor_rekening: '12345678',
        },
      }),
    });
    const regData = await regRes.json();
    console.log(`Status: ${regRes.status}`);
    console.log('Response:', JSON.stringify(regData, null, 2));

    // Test 2: Register sponsor
    console.log('\n--- Test 2: Register sponsor ---');
    const regRes2 = await fetch('http://localhost:4000/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'sponsor1@test.com',
        password: 'password123',
        nama_lengkap: 'Sponsor Test',
        peran: 'sponsor',
        sponsorDetails: {
          nama_perusahaan: 'PT Sponsor',
          alamat: 'Jl Sponsor No 1',
          no_telp: '08987654321',
        },
      }),
    });
    const regData2 = await regRes2.json();
    console.log(`Status: ${regRes2.status}`);
    console.log('Response:', JSON.stringify(regData2, null, 2));

    // Test 3: Login as admin
    console.log('\n--- Test 3: Login admin ---');
    const loginRes = await fetch('http://localhost:4000/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'admin@unai.ac.id', password: 'admin123' }),
    });
    const loginData = await loginRes.json();
    console.log(`Status: ${loginRes.status}`);
    console.log('Response:', JSON.stringify(loginData, null, 2));

    if (loginRes.ok) {
      const token = loginData.accessToken;

      // Test 4: Approve org user
      console.log('\n--- Test 4: Approve org user (status) ---');
      const approveRes = await fetch('http://localhost:4000/api/users/1/status', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ status: 'Terverifikasi' }),
      });
      const approveData = await approveRes.json();
      console.log(`Status: ${approveRes.status}`);
      console.log('Response:', JSON.stringify(approveData, null, 2));

      // Test 5: Login as org
      console.log('\n--- Test 5: Login organisasi ---');
      const loginOrg = await fetch('http://localhost:4000/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'org1@test.com', password: 'password123' }),
      });
      const loginOrgData = await loginOrg.json();
      console.log(`Status: ${loginOrg.status}`);
      console.log('Response:', JSON.stringify(loginOrgData, null, 2));

      if (loginOrg.ok) {
        const orgToken = loginOrgData.accessToken;

        // Test 6: Create event
        console.log('\n--- Test 6: Create event ---');
        const evRes = await fetch('http://localhost:4000/api/events', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${orgToken}` },
          body: JSON.stringify({
            nama_event: 'Event UNAI 2026',
            tanggal_event: '2026-08-15',
            deskripsi: 'Event tahunan',
            target_dana: 50000000,
            paket_tersedia: [
              { nama_paket: 'Platinum', persentase_dana: 40, deskripsi_keuntungan: 'Sponsor Utama' },
              { nama_paket: 'Gold', persentase_dana: 35, deskripsi_keuntungan: 'Sponsor Gold' },
            ],
          }),
        });
        const evData = await evRes.json();
        console.log(`Status: ${evRes.status}`);
        console.log('Response:', JSON.stringify(evData, null, 2));
      }
    }

    // Test 7: Get all users
    console.log('\n--- Test 7: Get all users ---');
    const usersRes = await fetch('http://localhost:4000/api/users');
    const usersData = await usersRes.json();
    console.log(`Status: ${usersRes.status}`);
    console.log('Response:', JSON.stringify(usersData, null, 2));

    // Test 8: Get all events
    console.log('\n--- Test 8: Get all events ---');
    const eventsRes = await fetch('http://localhost:4000/api/events');
    const eventsData = await eventsRes.json();
    console.log(`Status: ${eventsRes.status}`);
    console.log('Response:', JSON.stringify(eventsData, null, 2));

    console.log('\n=== ALL TESTS DONE ===');
  } catch (err) {
    console.error('Test error:', err.message);
  } finally {
    server.kill();
    process.exit(0);
  }
}

test();
