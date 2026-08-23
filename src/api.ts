const API_BASE = '/api';

function getToken(): string | null {
  return localStorage.getItem('unai_token');
}

function setToken(token: string) {
  localStorage.setItem('unai_token', token);
}

function clearToken() {
  localStorage.removeItem('unai_token');
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getToken();
  const isFormData = typeof FormData !== 'undefined' && options.body instanceof FormData;
  const headers: Record<string, string> = {
    ...(!isFormData ? { 'Content-Type': 'application/json' } : {}),
    ...((options.headers as Record<string, string>) || {}),
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers,
  });

  const json = await res.json().catch(() => null);
  if (!res.ok) {
    throw new Error(json?.message || `HTTP ${res.status}`);
  }
  return json as T;
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
    return request<any>('/events', { method: 'POST', body: JSON.stringify(data) });
  },

  async updateEvent(id: number, data: any) {
    return request<any>(`/events/${id}`, { method: 'PATCH', body: JSON.stringify(data) });
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
    return request<any>(`/sponsorships/${id}`, { method: 'PATCH', body: JSON.stringify(data) });
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
    return request<any>('/dokumentasi', { method: 'POST', body: JSON.stringify(data) });
  },

  async deleteDoc(id: number) {
    return request<any>(`/dokumentasi/${id}`, { method: 'DELETE' });
  },
};
