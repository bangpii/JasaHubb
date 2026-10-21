const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export { API_BASE };

export const getToken = () =>
  localStorage.getItem('token') || sessionStorage.getItem('token') || '';

const authHeaders = () => {
  const token = getToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
};

async function request(path, { method = 'GET', body, ...rest } = {}) {
  const response = await fetch(`${API_BASE}${path}`, {
    method,
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: body === undefined ? undefined : JSON.stringify(body),
    ...rest,
  });

  let data = null;
  try {
    data = await response.json();
  } catch {
    data = null;
  }

  if (!response.ok) {
    const error = new Error(data?.message || 'Terjadi kesalahan pada server');
    error.status = response.status;
    error.data = data;
    throw error;
  }
  return data;
}

export const adminApi = {
  listAdmins: (params = {}) => request(`/api/admin/admins?${toQuery(params)}`),  createAdmin: (payload) => request('/api/admin/admins', { method: 'POST', body: payload }),
  updateAdmin: (id, payload) => request(`/api/admin/admins/${id}`, { method: 'PUT', body: payload }),
  deleteAdmin: (id) => request(`/api/admin/admins/${id}`, { method: 'DELETE' }),

  listPelanggan: (params = {}) => request(`/api/admin/pelanggan?${toQuery(params)}`),
  createPelanggan: (payload) => request('/api/admin/pelanggan', { method: 'POST', body: payload }),
  updatePelanggan: (id, payload) =>
    request(`/api/admin/pelanggan/${id}`, { method: 'PUT', body: payload }),
  deletePelanggan: (id) => request(`/api/admin/pelanggan/${id}`, { method: 'DELETE' }),

  revealAdmin: (id, password) =>
    request(`/api/admin/admins/${id}/reveal`, { method: 'POST', body: { password } }),
  revealPelanggan: (id, password) =>
    request(`/api/admin/pelanggan/${id}/reveal`, { method: 'POST', body: { password } }),

  listProjects: (params = {}) => request(`/api/admin/projects?${toQuery(params)}`),
  createProject: (payload) => request('/api/admin/projects', { method: 'POST', body: payload }),
  updateProject: (id, payload) =>
    request(`/api/admin/projects/${id}`, { method: 'PUT', body: payload }),
  deleteProject: (id) => request(`/api/admin/projects/${id}`, { method: 'DELETE' }),

  listJasa: (params = {}) => request(`/api/admin/jasa?${toQuery(params)}`),
  createJasa: (payload) => request('/api/admin/jasa', { method: 'POST', body: payload }),
  updateJasa: (id, payload) => request(`/api/admin/jasa/${id}`, { method: 'PUT', body: payload }),
  deleteJasa: (id) => request(`/api/admin/jasa/${id}`, { method: 'DELETE' }),

  listPesanan: (params = {}) => request(`/api/admin/pesanan?${toQuery(params)}`),
  pesananStats: () => request('/api/admin/pesanan/stats'),
  dashboardSummary: () => request('/api/admin/pesanan/dashboard'),
  updatePesananStatus: (id, status) =>
    request(`/api/admin/pesanan/${id}/status`, { method: 'PATCH', body: { status } }),
  markPesananWaSent: (id, sent = true) =>
    request(`/api/admin/pesanan/${id}/wa-sent`, { method: 'PATCH', body: { sent } }),
  deletePesanan: (id) => request(`/api/admin/pesanan/${id}`, { method: 'DELETE' }),
  pesananAccount: (id) => request(`/api/admin/pesanan/${id}/account`),
};

function toQuery(params) {
  return new URLSearchParams(
    Object.entries(params).filter(([, v]) => v !== undefined && v !== null && v !== ''),
  ).toString();
}

export const publicApi = {
  listProjects: (params = {}) => request(`/api/projects?${toQuery(params)}`),
  getProject: (slug) => request(`/api/projects/${slug}`),
  listJasa: (params = {}) => request(`/api/jasa?${toQuery(params)}`),
  getJasa: (slug) => request(`/api/jasa/${slug}`),
  createPesanan: (payload) => request('/api/pesanan', { method: 'POST', body: payload }),
  myPesanan: () => request('/api/pesanan/mine'),
};

export const chatApi = {
  listMessages: () => request('/api/chat/messages'),
  sendMessage: (content) => request('/api/chat/messages', { method: 'POST', body: { content } }),
  setTyping: (typing) => request('/api/chat/typing', { method: 'POST', body: { typing } }),
};

export const contactApi = {
  sendMessage: (payload) => request('/api/contact', { method: 'POST', body: payload }),
};
