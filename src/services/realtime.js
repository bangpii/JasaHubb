import { io } from 'socket.io-client';
import { API_BASE } from './api';

/**
 * Realtime JasaHub dengan fallback otomatis.
 *
 * Backend memancarkan event lewat Socket.IO (butuh hosting long-running:
 * Render/Railway/VPS). Bila koneksi WebSocket gagal (mis. backend di Vercel
 * serverless) atau tidak tersambung dalam waktu singkat, otomatis berganti ke
 * mode polling HTTP sehingga UI tetap ter-update tanpa error.
 */

const CONNECT_TIMEOUT = 3500;
const POLL_INTERVAL = 15000;

/**
 * Berlangganan perubahan katalog project.
 *
 * @param {(payload: object) => void} onChange dipanggil saat project berubah
 * @param {{ scope?: 'public'|'admin', poll?: boolean }} options
 * @returns {() => void} fungsi unsubscribe
 */
export function subscribeProjects(onChange, { scope = 'public', poll = true } = {}) {
  return subscribe('projects:changed', onChange, { scope, poll });
}

/** Berlangganan perubahan akun admin/pelanggan (dipakai panel admin). */
export function subscribeAccounts(onChange, { scope = 'admin', poll = true } = {}) {
  return subscribe('accounts:changed', onChange, { scope, poll });
}

/** Berlangganan perubahan katalog jasa. */
export function subscribeJasa(onChange, { scope = 'public', poll = true } = {}) {
  return subscribe('jasa:changed', onChange, { scope, poll });
}

/** Berlangganan perubahan pesanan (dipakai panel admin). */
export function subscribePesanan(onChange, { scope = 'admin', poll = true } = {}) {
  return subscribe('pesanan:changed', onChange, { scope, poll });
}

/**
 * Berlangganan pesan chat bot milik pelanggan yang sedang login.
 *
 * @param {number|string} userId id pelanggan (untuk room `chat:<id>`)
 * @param {string} token token auth pelanggan
 * @param {(payload: object) => void} onChange dipanggil saat pesan/typing masuk
 * @returns {() => void} fungsi unsubscribe
 */
export function subscribeChat(userId, token, onChange) {
  if (!userId || !token) return () => {};

  let socket = null;

  try {
    socket = io(API_BASE, {
      transports: ['websocket', 'polling'],
      query: { scope: 'chat' },
      auth: { token },
      reconnectionAttempts: 3,
      timeout: CONNECT_TIMEOUT,
    });

    socket.on('chat:message', (payload) => onChange({ ...payload, source: 'socket' }));
    socket.on('chat:typing', (payload) => onChange({ ...payload, source: 'socket' }));
  } catch {
    // Socket.IO tidak tersedia (mis. backend serverless) → chat tetap jalan
    // lewat REST, tanpa realtime.
  }

  return () => {
    socket?.disconnect();
  };
}

function subscribe(event, onChange, { scope, poll }) {
  let socket = null;
  let pollTimer = null;
  let connectTimer = null;
  let disposed = false;

  const startPolling = () => {
    if (disposed || !poll || pollTimer) return;
    pollTimer = setInterval(() => onChange({ source: 'poll' }), POLL_INTERVAL);
  };

  const stopPolling = () => {
    if (pollTimer) {
      clearInterval(pollTimer);
      pollTimer = null;
    }
  };

  try {
    socket = io(API_BASE, {
      transports: ['websocket', 'polling'],
      query: { scope },
      reconnectionAttempts: 3,
      timeout: CONNECT_TIMEOUT,
    });

    socket.on('connect', () => {
      clearTimeout(connectTimer);
      stopPolling();
    });

    socket.on(event, (payload) => onChange({ ...payload, source: 'socket' }));

    socket.on('connect_error', () => {
      startPolling();
    });

    // Tidak tersambung dalam waktu singkat → anggap WebSocket tak tersedia.
    connectTimer = setTimeout(() => {
      if (!socket.connected) startPolling();
    }, CONNECT_TIMEOUT);
  } catch {
    startPolling();
  }

  // Selalu bersiap untuk mode polling bila socket gagal senyap.
  startPolling();

  return () => {
    disposed = true;
    clearTimeout(connectTimer);
    stopPolling();
    socket?.disconnect();
  };
}
