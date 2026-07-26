const body = {
  email: "org3@test.com",
  password: "password123",
  nama_lengkap: "Test Org",
  peran: "organisasi",
  organisasiDetails: {
    nama_organisasi: "Org UNAI",
    deskripsi: "Test",
    no_telp: "08123456789",
    nama_rekening: "BNI",
    nomor_rekening: "12345678"
  }
};

async function test() {
  try {
    console.log("Testing POST /api/auth/register...");
    const res = await fetch("http://localhost:4000/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = await res.json();
    console.log("Status:", res.status);
    console.log("Response:", JSON.stringify(data, null, 2));

    if (res.ok) {
      console.log("\nTesting POST /api/auth/login...");
      const loginRes = await fetch("http://localhost:4000/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: "org3@test.com", password: "password123" }),
      });
      const loginData = await loginRes.json();
      console.log("Login Status:", loginRes.status);
      console.log("Login Response:", JSON.stringify(loginData, null, 2));
    }
  } catch (err) {
    console.error("Error:", err.message);
  }
  process.exit(0);
}

test();
