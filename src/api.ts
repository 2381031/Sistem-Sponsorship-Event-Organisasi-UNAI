const API_BASE = '/api';
const pendingReads = new Map<string, Promise<unknown>>();
let dataRevision = 0;

function getToken(): string | null {
  return localStorage.getItem('unai_token');
}

function setToken(token: string) {
  pendingReads.clear();
  localStorage.setItem('unai_token', token);
}

function clearToken() {
  pendingReads.clear();
  localStorage.removeItem('unai_token');
}

function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getToken();
  const isRead = !options.method || options.method === 'GET';
  // Share concurrent reads only; never cache results or retry a submission.
  if (!isRead) { dataRevision++; pendingReads.clear(); }
  const key = `${token}:${dataRevision}:${path}`;
  const existing = isRead && pendingReads.get(key);
  if (existing) return existing as Promise<T>;
  const operation = sendRequest<T>(path, options, token).finally(() => {
    if (pendingReads.get(key) === operation) pendingReads.delete(key);
    if (!isRead) { dataRevision++; pendingReads.clear(); }
  });
  if (isRead) pendingReads.set(key, operation);
  return operation;
}

async function sendRequest<T>(path: string, options: RequestInit, token: string | null): Promise<T> {
  const isFormData = typeof FormData !== 'undefined' && options.body instanceof FormData;
  const isRead = !options.method || options.method === 'GET';
  const headers: Record<string, string> = {
    ...(!isFormData ? { 'Content-Type': 'application/json' } : {}),
    ...((options.headers as Record<string, string>) || {}),
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), isRead ? 20000 : 90000);
  try {
  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers,
    signal: controller.signal,
  });

  const json = await res.json().catch(() => null);
  if (!res.ok) {
    if (res.status === 401) {
      throw new Error('Sesi login sudah tidak valid. Silakan keluar dan masuk kembali.');
    }
    if (res.status === 413) throw new Error('Ukuran unggahan terlalu besar. Pilih berkas yang lebih kecil.');
    throw new Error(Array.isArray(json?.message) ? json.message.join('. ') : json?.message || `HTTP ${res.status}`);
  }
  if (json === null) {
    throw new Error('Respons server tidak valid. Periksa apakah layanan API berjalan.');
  }
  return json as T;
  } catch (error) {
    if (controller.signal.aborted) {
      throw new Error(isRead
        ? 'Server belum merespons. Silakan coba muat data kembali.'
        : 'Waktu tunggu habis. Periksa daftar atau riwayat terlebih dahulu karena pengiriman mungkin sudah tersimpan sebelum mencoba lagi.');
    }
    throw error;
  } finally { clearTimeout(timeout); }
}

export const api = {
  clearToken,

  // ---- AUTH ----
  async register(data: {
    email: string;
    password: string;
    nama_lengkap: string;
    peran: string;
    organisasiDetails?: any;
    sponsorDetails?: any;
  }) {
    const result = await request<{ message: string; user: any }>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    return result;
  },

  async login(email: string, password: string) {
    const result = await request<{ accessToken: string; user: any }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    setToken(result.accessToken);
    return result;
  },

  // ---- USERS ----
  async getUsers() {
    return request<any[]>('/users');
  },

  async getOrganizations() {
    return request<any[]>('/users/organizations');
  },

  async getUser(id: number) {
    return request<any>(`/users/${id}`);
  },

  async updateUser(id: number, data: any) {
    return request<any>(`/users/${id}`, { method: 'PATCH', body: JSON.stringify(data) });
  },

  async updateUserStatus(id: number, status: string) {
    return request<any>(`/users/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status }) });
  },

  async deleteUser(id: number) {
    return request<any>(`/users/${id}`, { method: 'DELETE' });
  },

  // ---- EVENTS ----
  async getEvents() {
    return request<any[]>('/events');
  },

  async getEvent(id: number) {
    return request<any>(`/events/${id}`);
  },

  async createEvent(data: any) {
    const body = data instanceof FormData ? data : JSON.stringify(data);
    return request<any>('/events', { method: 'POST', body });
  },

  async updateEvent(id: number, data: any) {
    const body = data instanceof FormData ? data : JSON.stringify(data);
    return request<any>(`/events/${id}`, { method: 'PATCH', body });
  },

  async updateEventStatus(id: number, status: string) {
    return request<any>(`/events/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status }) });
  },

  async deleteEvent(id: number) {
    return request<any>(`/events/${id}`, { method: 'DELETE' });
  },

  // ---- SPONSORSHIPS (TRANSAKSI) ----
  async getTransactions() {
    return request<any[]>('/sponsorships');
  },

  async getMyTransactions() {
    return request<any[]>('/sponsorships/my');
  },

  async createTransaction(data: any) {
    const body = data instanceof FormData ? data : JSON.stringify(data);
    return request<any>('/sponsorships', { method: 'POST', body });
  },

  async updateTransaction(id: number, data: any) {
    const body = data instanceof FormData ? data : JSON.stringify(data);
    return request<any>(`/sponsorships/${id}`, { method: 'PATCH', body });
  },

  async verifyTransaction(id: number, status: string) {
    return request<any>(`/sponsorships/${id}/verify`, { method: 'PATCH', body: JSON.stringify({ status }) });
  },

  // ---- DOKUMENTASI ----
  async getDocsByEvent(idEvent: number) {
    return request<any[]>(`/dokumentasi/event/${idEvent}`);
  },

  async getAllDocs() {
    return request<any[]>('/dokumentasi');
  },

  async createDoc(data: any) {
    const body = data instanceof FormData ? data : JSON.stringify(data);
    return request<any>('/dokumentasi', { method: 'POST', body });
  },

  async deleteDoc(id: number) {
    return request<any>(`/dokumentasi/${id}`, { method: 'DELETE' });
  },

};
