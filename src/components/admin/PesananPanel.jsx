import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import 'boxicons/css/boxicons.min.css';
import { motion as Motion, AnimatePresence } from 'framer-motion';
import { Bar, Doughnut } from 'react-chartjs-2';
import {
  ArcElement,
  BarElement,
  CategoryScale,
  Chart as ChartJS,
  Legend,
  LinearScale,
  Tooltip,
} from 'chart.js';
import { adminApi } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useSettings } from '../../context/SettingsContext';
import { Pagination } from './AccountTable';

ChartJS.register(CategoryScale, LinearScale, BarElement, ArcElement, Tooltip, Legend);

const ORANGE = '#f49827';
const ORANGE_SOFT = '#ffc370';
const DONUT_PALETTE = ['#f49827', '#ffc370', '#c98a3b', '#8a5a1f', '#e0b070', '#a8763a'];

const STATUS_STYLE = {
  baru: 'bg-[#f49827]/15 text-[#f49827] border-[#f49827]/30',
  diproses: 'bg-amber-500/10 text-amber-300 border-amber-500/25',
  selesai: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
  batal: 'bg-red-500/15 text-red-400 border-red-500/30',
};

const STATUS_LABEL = { baru: 'Baru', diproses: 'Diproses', selesai: 'Selesai', batal: 'Batal' };

const STATUS_FILTERS = [
  { value: '', label: 'Semua' },
  { value: 'baru', label: 'Baru' },
  { value: 'diproses', label: 'Diproses' },
  { value: 'selesai', label: 'Selesai' },
  { value: 'batal', label: 'Batal' },
];

const StatusPill = ({ status }) => (
  <span
    className={`font-poppins inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-medium ${
      STATUS_STYLE[status] ?? 'border-line text-muted'
    }`}
  >
    {STATUS_LABEL[status] ?? status}
  </span>
);

const formatDate = (iso) => {
  if (!iso) return '-';
  try {
    return new Date(iso).toLocaleString('id-ID', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return '-';
  }
};

const StatTile = ({ icon, label, value, tone = 'text-[#f49827]' }) => (
  <div className="flex items-center gap-3 rounded-2xl border border-line bg-black/[0.02] px-3.5 py-3 dark:bg-white/[0.02]">
    <span className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-[#f49827]/12 text-xl ${tone}`}>
      <i className={`bx ${icon}`} />
    </span>
    <div className="min-w-0">
      <p className="font-poppins text-[10px] uppercase tracking-wide text-muted">{label}</p>
      <p className="font-poppins text-lg font-bold text-fg">{value}</p>
    </div>
  </div>
);

/**
 * Susun template pesan WhatsApp konfirmasi untuk dikirim admin ke pelanggan.
 * Menyesuaikan jenis jasa yang dipesan secara elegan & profesional.
 */
const buildWaMessage = (pesanan, account) => {
  const nama = pesanan.namaLengkap?.split(' ')[0] || 'Kak';
  const jasa = pesanan.jenisJasa || 'layanan kami';
  return [
    `Halo ${nama}, kami dari tim JasaHub 👋`,
    '',
    `Terima kasih telah memesan *${jasa}* di platform website kami.`,
    '',
    ...(account
      ? [
          'Akun pelanggan Anda sudah dibuat otomatis:',
          `Email: ${account.email}`,
          `Password: ${account.password}`,
          'Silakan login di website untuk memantau proses pesanan Anda.',
          '',
        ]
      : []),
    'Untuk memastikan hasil terbaik, boleh kami tahu secara singkat, project seperti apa yang ingin diselesaikan?',
    'Kami siap membantu merancang solusinya bersama Anda. 😊',
    '',
    'Salam,',
    'Tim JasaHub',
  ].join('\n');
};

// ---------------- Modal: Komposisi pesan WA ----------------
const SendWaModal = ({ open, pesanan, account, busy, onClose, onConfirm }) => {
  const [text, setText] = useState('');

  useEffect(() => {
    if (open && pesanan) setText(buildWaMessage(pesanan, account));
  }, [open, pesanan, account]);

  const waLink = pesanan
    ? `https://wa.me/${pesanan.nomorWa}?text=${encodeURIComponent(text)}`
    : '#';

  return (
    <AnimatePresence>
      {open && pesanan && (
        <Motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
          onClick={onClose}
        >
          <Motion.div
            initial={{ opacity: 0, scale: 0.94, y: 18 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.94, y: 18 }}
            transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-lg overflow-hidden rounded-3xl border border-line bg-page shadow-[0_24px_60px_-12px_rgba(0,0,0,0.5)]"
          >
            <div className="flex items-center justify-between border-b border-line px-5 py-4">
              <div className="flex items-center gap-2.5">
                <span className="grid h-9 w-9 place-items-center rounded-xl bg-[#25D366]/15 text-xl text-[#25D366]">
                  <i className="bx bxl-whatsapp" />
                </span>
                <div>
                  <h3 className="font-poppins text-sm font-semibold text-fg">Kirim Pesan WhatsApp</h3>
                  <p className="font-poppins text-[11px] text-muted">
                    {pesanan.namaLengkap} · +{pesanan.nomorWa}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={onClose}
                aria-label="Tutup"
                className="grid h-8 w-8 place-items-center rounded-lg text-muted transition-colors hover:text-[#f49827]"
              >
                <i className="bx bx-x text-xl" />
              </button>
            </div>

            <div className="space-y-3 px-5 py-4">
              <label className="block">
                <span className="font-poppins mb-1 block text-[11px] font-semibold text-muted">
                  Isi pesan (bisa diedit)
                </span>
                <textarea
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  rows={9}
                  className="font-poppins w-full resize-none rounded-xl border border-line bg-transparent px-3 py-2.5 text-xs leading-relaxed text-fg outline-none transition-colors focus:border-[#f49827]"
                />
              </label>

              <div className="flex gap-3 pt-1">
                <button
                  type="button"
                  onClick={onClose}
                  className="font-poppins flex-1 cursor-pointer rounded-xl border border-line py-2.5 text-sm font-semibold text-fg transition-colors hover:border-[#f49827] hover:text-[#f49827]"
                >
                  Batal
                </button>
                <a
                  href={waLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => onConfirm(pesanan)}
                  className="font-poppins flex flex-[1.4] cursor-pointer items-center justify-center gap-2 rounded-xl bg-[#25D366] py-2.5 text-sm font-semibold text-black transition-colors hover:bg-[#1fb457]"
                >
                  {busy ? (
                    <i className="bx bx-loader-alt bx-spin text-base" />
                  ) : (
                    <i className="bx bxl-whatsapp text-base" />
                  )}
                  Buka & Kirim
                </a>
              </div>
            </div>
          </Motion.div>
        </Motion.div>
      )}
    </AnimatePresence>
  );
};

// ---------------- Confirm Delete ----------------
const ConfirmDelete = ({ open, name, onClose, onConfirm, busy }) => (
  <AnimatePresence>
    {open && (
      <Motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
        onClick={onClose}
      >
        <Motion.div
          initial={{ opacity: 0, scale: 0.94, y: 18 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.94, y: 18 }}
          transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
          onClick={(e) => e.stopPropagation()}
          className="w-full max-w-sm rounded-3xl border border-line bg-page p-7 text-center shadow-[0_24px_60px_-12px_rgba(0,0,0,0.5)]"
        >
          <span className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-red-500/15 text-4xl text-red-400">
            <i className="bx bx-trash" />
          </span>
          <h3 className="font-poppins mt-4 text-lg font-semibold text-fg">Hapus pesanan ini?</h3>
          <p className="font-poppins mt-1.5 text-sm text-muted">
            Pesanan dari <span className="font-semibold text-fg">{name}</span> akan dihapus permanen.
          </p>
          <div className="mt-6 flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="font-poppins flex-1 cursor-pointer rounded-xl border border-line py-2.5 text-sm font-semibold text-fg transition-colors hover:border-[#f49827] hover:text-[#f49827]"
            >
              Batal
            </button>
            <button
              type="button"
              onClick={onConfirm}
              disabled={busy}
              className="font-poppins flex-1 cursor-pointer rounded-xl bg-red-500 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-red-600 disabled:opacity-50"
            >
              {busy ? 'Menghapus...' : 'Hapus'}
            </button>
          </div>
        </Motion.div>
      </Motion.div>
    )}
  </AnimatePresence>
);

const PesananPanel = ({ search = '', refreshKey = 0 }) => {
  const { user } = useAuth();
  const { theme } = useSettings();
  const ready = user?.role === 'admin';
  const isLight = theme === 'light';
  const printRef = useRef(null);

  const [rows, setRows] = useState([]);
  const [meta, setMeta] = useState({ page: 1, totalPages: 1, total: 0 });
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(false);
  const [listError, setListError] = useState('');

  const [stats, setStats] = useState(null);
  const [sending, setSending] = useState(null);
  const [waAccount, setWaAccount] = useState(null);
  const [busy, setBusy] = useState(false);
  const [deleting, setDeleting] = useState(null);

  const openWa = async (row) => {
    setSending(row);
    setWaAccount(null);
    try {
      const account = await adminApi.pesananAccount(row.id);
      setWaAccount(account?.email ? account : null);
    } catch {
      setWaAccount(null);
    }
  };

  const load = useCallback(async () => {
    if (!ready) return;
    setLoading(true);
    setListError('');
    try {
      const data = await adminApi.listPesanan({ page, pageSize: 8, search, status });
      setRows(data.items);
      setMeta({ page: data.page, totalPages: data.totalPages, total: data.total });
    } catch (err) {
      setListError(err.message || 'Gagal memuat data pesanan');
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- refreshKey memicu refetch realtime
  }, [page, search, status, ready, refreshKey]);

  const loadStats = useCallback(async () => {
    if (!ready) return;
    try {
      setStats(await adminApi.pesananStats());
    } catch {
      /* statistik opsional, abaikan bila gagal */
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- refreshKey memicu refetch realtime
  }, [ready, refreshKey]);

  useEffect(() => {
    load();
  }, [load]);
  useEffect(() => {
    loadStats();
  }, [loadStats]);
  useEffect(() => {
    setPage(1);
  }, [search, status]);

  const axisColor = isLight ? '#57534e' : '#a1a1aa';
  const gridColor = isLight ? 'rgba(23,21,15,0.08)' : 'rgba(255,255,255,0.06)';

  const barData = useMemo(
    () => ({
      labels: (stats?.weekly ?? []).map((d) => d.label),
      datasets: [
        {
          label: 'Pesanan',
          data: (stats?.weekly ?? []).map((d) => d.count),
          backgroundColor: ORANGE,
          hoverBackgroundColor: ORANGE_SOFT,
          borderRadius: 6,
          borderSkipped: false,
          barThickness: 16,
        },
      ],
    }),
    [stats],
  );

  const barOptions = useMemo(
    () => ({
      responsive: true,
      maintainAspectRatio: false,
      animation: { duration: 900, easing: 'easeOutQuart' },
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: isLight ? '#17150f' : '#1a1712',
          titleFont: { family: 'Poppins', size: 11 },
          bodyFont: { family: 'Poppins', size: 11 },
          padding: 10,
          cornerRadius: 10,
          displayColors: false,
        },
      },
      scales: {
        x: {
          grid: { display: false },
          border: { display: false },
          ticks: { color: axisColor, font: { family: 'Poppins', size: 10 } },
        },
        y: {
          beginAtZero: true,
          grid: { color: gridColor, drawTicks: false },
          border: { display: false },
          ticks: { color: axisColor, font: { family: 'Poppins', size: 10 }, padding: 6, precision: 0 },
        },
      },
    }),
    [isLight, axisColor, gridColor],
  );

  const donutData = useMemo(
    () => ({
      labels: (stats?.monthly ?? []).map((d) => d.label),
      datasets: [
        {
          data: (stats?.monthly ?? []).map((d) => d.count),
          backgroundColor: (stats?.monthly ?? []).map(
            (_, i) => DONUT_PALETTE[i % DONUT_PALETTE.length],
          ),
          borderColor: isLight ? '#ffffff' : '#17150f',
          borderWidth: 2,
          hoverOffset: 6,
        },
      ],
    }),
    [stats, isLight],
  );

  const donutOptions = useMemo(
    () => ({
      responsive: true,
      maintainAspectRatio: false,
      cutout: '62%',
      plugins: {
        legend: {
          position: 'bottom',
          labels: {
            color: axisColor,
            font: { family: 'Poppins', size: 10 },
            boxWidth: 10,
            boxHeight: 10,
            padding: 12,
          },
        },
        tooltip: {
          backgroundColor: isLight ? '#17150f' : '#1a1712',
          titleFont: { family: 'Poppins', size: 11 },
          bodyFont: { family: 'Poppins', size: 11 },
          padding: 10,
          cornerRadius: 10,
        },
      },
    }),
    [isLight, axisColor],
  );

  const changeStatus = async (row, next) => {
    try {
      const updated = await adminApi.updatePesananStatus(row.id, next);
      setRows((list) => list.map((r) => (r.id === updated.id ? { ...r, ...updated } : r)));
      loadStats();
    } catch (err) {
      setListError(err.message || 'Gagal mengubah status');
    }
  };

  const confirmWaSent = async (row) => {
    setBusy(true);
    try {
      const updated = await adminApi.markPesananWaSent(row.id, true);
      setRows((list) => list.map((r) => (r.id === updated.id ? { ...r, ...updated } : r)));
      loadStats();
    } catch (err) {
      setListError(err.message || 'Gagal menandai pesan terkirim');
    } finally {
      setBusy(false);
      setSending(null);
    }
  };

  const confirmDelete = async () => {
    setBusy(true);
    try {
      await adminApi.deletePesanan(deleting.id);
      setDeleting(null);
      await Promise.all([load(), loadStats()]);
    } catch (err) {
      setListError(err.message || 'Gagal menghapus pesanan');
      setDeleting(null);
    } finally {
      setBusy(false);
    }
  };

  const exportPdf = () => {
    const node = printRef.current;
    if (!node) return;
    const win = window.open('', '_blank', 'width=900,height=700');
    if (!win) return;
    const styles = `
      * { box-sizing: border-box; }
      body { font-family: Poppins, Arial, sans-serif; color: #17150f; padding: 32px; }
      h1 { font-size: 20px; margin: 0 0 4px; }
      .sub { color: #78716c; font-size: 12px; margin-bottom: 20px; }
      table { width: 100%; border-collapse: collapse; font-size: 11px; }
      th, td { text-align: left; padding: 8px 10px; border-bottom: 1px solid #e7e5e4; vertical-align: top; }
      th { background: #fdf2e3; color: #b9761a; text-transform: uppercase; letter-spacing: 0.04em; font-size: 10px; }
      .pill { display: inline-block; padding: 2px 8px; border-radius: 999px; font-size: 10px; border: 1px solid #d6d3d1; }
      .foot { margin-top: 20px; font-size: 10px; color: #a8a29e; }
    `;
    const rowsHtml = rows
      .map(
        (r) => `<tr>
          <td>${r.no}</td>
          <td>${r.namaLengkap}</td>
          <td>${r.jenisJasa}</td>
          <td>+${r.nomorWa}</td>
          <td><span class="pill">${STATUS_LABEL[r.status] ?? r.status}</span></td>
          <td>${r.waSent ? 'Terkirim' : 'Belum'}</td>
          <td>${formatDate(r.createdAt)}</td>
        </tr>`,
      )
      .join('');
    win.document.write(`<!doctype html><html><head><title>Daftar Pesanan JasaHub</title>
      <style>${styles}</style></head><body>
      <h1>Daftar Pesanan — JasaHub</h1>
      <p class="sub">Diekspor ${formatDate(new Date().toISOString())} · Total ${meta.total} pesanan${
        status ? ` · Filter: ${STATUS_LABEL[status] ?? status}` : ''
      }</p>
      <table>
        <thead><tr><th>#</th><th>Nama</th><th>Jenis Jasa</th><th>WhatsApp</th><th>Status</th><th>WA Terkirim</th><th>Tanggal</th></tr></thead>
        <tbody>${rowsHtml}</tbody>
      </table>
      <p class="foot">JasaHub · Dokumen dibuat otomatis dari panel admin.</p>
      </body></html>`);
    win.document.close();
    win.focus();
    setTimeout(() => win.print(), 350);
  };

  const totals = stats?.totals;

  return (
    <div className="flex h-full flex-col">
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="font-poppins text-[10px] uppercase tracking-[0.28em] text-[#f49827]">
            Transaksi
          </p>
          <h2 className="font-poppins text-lg font-semibold text-fg">Pesanan Masuk</h2>
          <p className="font-poppins mt-1 text-xs text-muted">
            {meta.total} pesanan dari pelanggan melalui halaman Jasa Kami.
          </p>
        </div>
        <button
          type="button"
          onClick={exportPdf}
          disabled={rows.length === 0}
          className="font-poppins flex shrink-0 cursor-pointer items-center gap-1.5 rounded-xl border border-line px-3.5 py-2 text-xs font-semibold text-fg transition-colors hover:border-[#f49827] hover:text-[#f49827] disabled:cursor-not-allowed disabled:opacity-40"
        >
          <i className="bx bxs-file-pdf text-base text-[#f49827]" />
          Export PDF
        </button>
      </div>

      {listError && (
        <p className="font-poppins mb-3 rounded-xl border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs text-red-400">
          {listError}
        </p>
      )}

      {/* Statistik */}
      <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-5">
        <StatTile icon="bx-cart-alt" label="Total" value={totals?.all ?? 0} />
        <StatTile icon="bx-time-five" label="Baru" value={totals?.baru ?? 0} />
        <StatTile icon="bx-loader-circle" label="Diproses" value={totals?.diproses ?? 0} />
        <StatTile icon="bx-check-circle" label="Selesai" value={totals?.selesai ?? 0} />
        <StatTile icon="bxl-whatsapp" label="WA Terkirim" value={totals?.waSent ?? 0} tone="text-emerald-400" />
      </div>

      {/* Grafik */}
      <div className="mb-4 grid grid-cols-1 gap-4 xl:grid-cols-2">
        <div className="rounded-2xl border border-line bg-black/[0.02] p-4 dark:bg-white/[0.02]">
          <div className="mb-3 flex items-center justify-between">
            <div>
              <p className="font-poppins text-[10px] uppercase tracking-[0.24em] text-muted">
                Grafik Batang
              </p>
              <h3 className="font-poppins text-sm font-semibold text-fg">Pesanan 7 Hari</h3>
            </div>
            <span className="font-poppins inline-flex items-center gap-1 rounded-full border border-line px-2 py-1 text-[10px] text-muted">
              <i className="bx bx-calendar text-[#f49827]" />
              Mingguan
            </span>
          </div>
          <div className="h-[180px]">
            <Bar data={barData} options={barOptions} />
          </div>
        </div>

        <div className="rounded-2xl border border-line bg-black/[0.02] p-4 dark:bg-white/[0.02]">
          <div className="mb-3 flex items-center justify-between">
            <div>
              <p className="font-poppins text-[10px] uppercase tracking-[0.24em] text-muted">
                Grafik Lingkar
              </p>
              <h3 className="font-poppins text-sm font-semibold text-fg">Jenis Jasa 1 Bulan</h3>
            </div>
            <span className="font-poppins inline-flex items-center gap-1 rounded-full border border-line px-2 py-1 text-[10px] text-muted">
              <i className="bx bx-pie-chart-alt text-[#f49827]" />
              30 Hari
            </span>
          </div>
          <div className="h-[180px]">
            {(stats?.monthly ?? []).length === 0 ? (
              <div className="grid h-full place-items-center text-xs text-muted">
                Belum ada pesanan dalam 30 hari
              </div>
            ) : (
              <Doughnut data={donutData} options={donutOptions} />
            )}
          </div>
        </div>
      </div>

      {/* Filter status */}
      <div className="mb-3 flex flex-wrap items-center gap-2">
        {STATUS_FILTERS.map((f) => (
          <button
            key={f.value || 'all'}
            type="button"
            onClick={() => setStatus(f.value)}
            className={`font-poppins cursor-pointer rounded-full border px-3 py-1.5 text-[11px] font-medium transition-colors ${
              status === f.value
                ? 'border-[#f49827] bg-[#f49827]/15 text-[#f49827]'
                : 'border-line text-muted hover:border-[#f49827]/50 hover:text-fg'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Tabel */}
      <div className="min-h-0 flex-1" ref={printRef}>
        {loading ? (
          <div className="grid place-items-center py-16 text-xs text-muted">
            <span>
              <i className="bx bx-loader-alt bx-spin mr-2 text-base" />
              Memuat pesanan...
            </span>
          </div>
        ) : rows.length === 0 ? (
          <div className="grid place-items-center py-16 text-xs text-muted">
            Belum ada pesanan masuk
          </div>
        ) : (
          <div className="admin-scroll overflow-x-auto">
            <table className="w-full min-w-[860px] border-collapse">
              <thead>
                <tr className="border-b border-line text-left">
                  {['#', 'Pelanggan', 'Jenis Jasa', 'WhatsApp', 'Status', 'Aksi'].map((h) => (
                    <th
                      key={h}
                      className="font-poppins px-3 py-2.5 text-[10px] font-semibold uppercase tracking-wide text-muted"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr
                    key={r.id}
                    className="border-b border-line/60 transition-colors hover:bg-black/[0.02] dark:hover:bg-white/[0.03]"
                  >
                    <td className="font-poppins px-3 py-3 text-[11px] text-muted">
                      {String(r.no).padStart(2, '0')}
                    </td>
                    <td className="px-3 py-3">
                      <p className="font-poppins text-xs font-semibold text-fg">{r.namaLengkap}</p>
                      <p className="font-poppins max-w-[220px] truncate text-[10px] text-muted">
                        {r.alamat || '-'}
                      </p>
                    </td>
                    <td className="px-3 py-3">
                      <p className="font-poppins text-xs text-fg">{r.jenisJasa}</p>
                      <p className="font-poppins text-[10px] text-muted">{formatDate(r.createdAt)}</p>
                    </td>
                    <td className="px-3 py-3">
                      <a
                        href={`https://wa.me/${r.nomorWa}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-poppins inline-flex items-center gap-1 text-xs text-[#25D366] hover:underline"
                      >
                        <i className="bx bxl-whatsapp text-sm" />+{r.nomorWa}
                      </a>
                      {r.waSent && (
                        <p className="font-poppins mt-0.5 inline-flex items-center gap-1 text-[10px] text-emerald-400">
                          <i className="bx bx-check-double text-sm" />
                          Terkirim {r.waSentAt ? formatDate(r.waSentAt) : ''}
                        </p>
                      )}
                    </td>
                    <td className="px-3 py-3">
                      <select
                        value={r.status}
                        onChange={(e) => changeStatus(r, e.target.value)}
                        className="font-poppins cursor-pointer rounded-lg border border-line bg-transparent px-2 py-1 text-[11px] text-fg outline-none transition-colors focus:border-[#f49827]"
                      >
                        {Object.entries(STATUS_LABEL).map(([v, l]) => (
                          <option key={v} value={v}>
                            {l}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="px-3 py-3">
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => openWa(r)}
                          aria-label="Kirim pesan WA"
                          title="Kirim pesan WA konfirmasi"
                          className="grid h-8 w-8 cursor-pointer place-items-center rounded-lg border border-line text-[#25D366] transition-colors hover:border-[#25D366]/60 hover:bg-[#25D366]/10"
                        >
                          <i className="bx bxl-whatsapp text-base" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeleting(r)}
                          aria-label="Hapus"
                          title="Hapus"
                          className="grid h-8 w-8 cursor-pointer place-items-center rounded-lg border border-line text-muted transition-colors hover:border-red-500/50 hover:text-red-400"
                        >
                          <i className="bx bx-trash text-base" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="mt-3">
        <Pagination page={meta.page} totalPages={meta.totalPages} total={meta.total} onPage={setPage} />
      </div>

      <SendWaModal
        open={!!sending}
        pesanan={sending}
        account={waAccount}
        busy={busy}
        onClose={() => {
          setSending(null);
          setWaAccount(null);
        }}
        onConfirm={confirmWaSent}
      />

      <ConfirmDelete
        open={!!deleting}
        name={deleting?.namaLengkap}
        onClose={() => setDeleting(null)}
        onConfirm={confirmDelete}
        busy={busy}
      />
    </div>
  );
};

export default PesananPanel;
