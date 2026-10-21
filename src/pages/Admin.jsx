import { useEffect, useMemo, useState } from "react";
import { motion as Motion, AnimatePresence } from "framer-motion";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  Tooltip,
  Legend,
} from "chart.js";
import { Bar, Doughnut } from "react-chartjs-2";
import "boxicons/css/boxicons.min.css";
import MagicBento from "../components/admin/MagicBento";
import AdminGate from "../components/admin/AdminGate";
import AdminAccountsPanel from "../components/admin/AdminAccountsPanel";
import PelangganAccountsPanel from "../components/admin/PelangganAccountsPanel";
import JasaAktifPanel from "../components/admin/JasaAktifPanel";
import ProjectAktifPanel from "../components/admin/ProjectAktifPanel";
import PesananPanel from "../components/admin/PesananPanel";
import PaperBackground from "../components/PaperBackground";
import ConfirmLogout from "../components/ConfirmLogout";
import { useAuth } from "../context/AuthContext";
import { useSettings } from "../context/SettingsContext";
import { adminApi } from "../services/api";
import { subscribeAccounts, subscribeProjects, subscribeJasa, subscribePesanan } from "../services/realtime";
import "../css/admin.css";

ChartJS.register(CategoryScale, LinearScale, BarElement, ArcElement, Tooltip, Legend);

const ORANGE = "#f49827";
const ORANGE_SOFT = "#ffc370";
const ORANGE_DEEP = "#8a5a1f";

const centerTotal = {
  id: "centerTotal",
  beforeDraw(chart, _args, opts) {
    const { ctx, chartArea } = chart;
    if (!chartArea) return;
    const { left, right, top, bottom } = chartArea;
    const x = (left + right) / 2;
    const y = (top + bottom) / 2;
    ctx.save();
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillStyle = opts.color ?? "#fff";
    ctx.font = "700 24px Poppins, sans-serif";
    ctx.fillText(opts.value ?? "", x, y - 8);
    ctx.fillStyle = opts.subColor ?? "#a1a1aa";
    ctx.font = "500 10px Poppins, sans-serif";
    ctx.fillText(opts.label ?? "", x, y + 14);
    ctx.restore();
  },
};

const NAV = [
  { id: "users", label: "Dashboard", icon: "bx-home-alt", page: "dashboard" },
  { id: "orders", label: "Pesanan", icon: "bx-cart-alt", page: "pesanan" },
  { id: "services", label: "Jasa Aktif", icon: "bx-briefcase-alt-2", page: "jasa-aktif" },
  { id: "projects", label: "Project Aktif", icon: "bx-rocket", page: "projects" },
  { id: "pelanggan", label: "Akun Pelanggan", icon: "bx-group", page: "pelanggan" },
  { id: "admins", label: "Akun Admin", icon: "bx-shield-quarter", page: "admins" },
];

const PAGE_META = {
  dashboard: { eyebrow: "Dashboard", title: "Ringkasan Admin", placeholder: "Cari pesanan..." },
  pesanan: { eyebrow: "Transaksi", title: "Pesanan Masuk", placeholder: "Cari pesanan..." },
  "jasa-aktif": { eyebrow: "Katalog", title: "Jasa Aktif", placeholder: "Cari jasa..." },
  projects: { eyebrow: "Katalog", title: "Project Aktif", placeholder: "Cari project..." },
  pelanggan: { eyebrow: "Akun", title: "Akun Pelanggan", placeholder: "Cari pelanggan..." },
  admins: { eyebrow: "Akun", title: "Akun Admin", placeholder: "Cari admin..." },
};

const STATUS_LABEL = { baru: "Baru", diproses: "Diproses", selesai: "Selesai", batal: "Batal" };

const STATUS_STYLE = {
  Selesai: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
  Proses: "bg-[#f49827]/15 text-[#f49827] border-[#f49827]/30",
  Menunggu: "bg-amber-500/10 text-amber-300 border-amber-500/25",
};

const PESANAN_STATUS_STYLE = {
  baru: "bg-amber-500/10 text-amber-300 border-amber-500/25",
  diproses: "bg-[#f49827]/15 text-[#f49827] border-[#f49827]/30",
  selesai: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
  batal: "bg-red-500/15 text-red-400 border-red-500/30",
};

const formatTanggal = (iso) => {
  if (!iso) return "-";
  try {
    return new Date(iso).toLocaleDateString("id-ID", { day: "2-digit", month: "short" });
  } catch {
    return "-";
  }
};

const formatNumber = (n) => Number(n ?? 0).toLocaleString("id-ID");

const SectionHeading = ({ eyebrow, title, desc }) => (
  <div className="mb-4">
    <p className="font-poppins text-[10px] uppercase tracking-[0.28em] text-[#f49827]">{eyebrow}</p>
    <h2 className="font-poppins text-lg font-semibold text-fg">{title}</h2>
    {desc && <p className="font-poppins mt-1 text-xs leading-relaxed text-muted">{desc}</p>}
  </div>
);

const StatCard = ({ label, value, delta, icon, note, id }) => (
  <div id={id} className="flex h-full flex-col justify-between">
    <div className="flex items-start justify-between gap-2">
      <span className="font-poppins text-xs font-medium text-muted">{label}</span>
      <span className="grid h-8 w-8 place-items-center rounded-xl bg-[#f49827]/15 text-base text-[#f49827]">
        <i className={`bx ${icon}`} />
      </span>
    </div>
    <div>
      <p className="font-poppins text-3xl font-semibold leading-none text-fg">{value}</p>
      <div className="mt-2 flex items-center gap-1.5">
        <span className="font-poppins inline-flex items-center gap-0.5 rounded-full bg-emerald-500/15 px-1.5 py-0.5 text-[10px] font-semibold text-emerald-400">
          <i className="bx bx-up-arrow-alt text-xs" />
          {delta}
        </span>
        <span className="font-poppins text-[10px] text-muted">{note}</span>
      </div>
    </div>
  </div>
);

const StatusPill = ({ status }) => {
  const style = PESANAN_STATUS_STYLE[status] ?? STATUS_STYLE[status] ?? "border-line text-muted";
  const label = STATUS_LABEL[status] ?? status;
  return (
    <span
      className={`font-poppins inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-medium ${style}`}
    >
      {label}
    </span>
  );
};

const AdminDashboard = () => {
  const { theme, toggleTheme } = useSettings();
  const { user, isAuthenticated, logout } = useAuth();
  const [active, setActive] = useState("users");
  const [page, setPage] = useState("dashboard");
  const [confirmLogout, setConfirmLogout] = useState(false);
  const [search, setSearch] = useState("");
  const [accountsRefresh, setAccountsRefresh] = useState(0);
  const [projectsRefresh, setProjectsRefresh] = useState(0);
  const [jasaRefresh, setJasaRefresh] = useState(0);
  const [pesananRefresh, setPesananRefresh] = useState(0);
  const [summary, setSummary] = useState(null);
  const [projectsList, setProjectsList] = useState([]);

  // Realtime: segarkan tabel akun & katalog saat data berubah (antar tab admin).
  useEffect(() => {
    const offAccounts = subscribeAccounts(() =>
      setAccountsRefresh((n) => n + 1)
    );
    const offProjects = subscribeProjects(
      () => setProjectsRefresh((n) => n + 1),
      { scope: "admin" }
    );
    const offJasa = subscribeJasa(() => setJasaRefresh((n) => n + 1), {
      scope: "admin",
    });
    const offPesanan = subscribePesanan(() => setPesananRefresh((n) => n + 1), {
      scope: "admin",
    });
    return () => {
      offAccounts();
      offProjects();
      offJasa();
      offPesanan();
    };
  }, []);

  const adminName = user?.nama || user?.username || user?.name || "BangPiii";
  const isLight = theme === "light";
  const meta = PAGE_META[page] || PAGE_META.dashboard;

  // Muat ringkasan dashboard dari API (angka nyata), disegarkan saat realtime berubah
  // dan saat status login berubah (permintaan pertama sebelum login pasti 401).
  useEffect(() => {
    if (!isAuthenticated) {
      setSummary(null);
      return;
    }
    let alive = true;
    adminApi
      .dashboardSummary()
      .then((data) => {
        if (alive) setSummary(data);
      })
      .catch(() => {
        /* ringkasan opsional; biarkan nilai default 0 */
      });
    return () => {
      alive = false;
    };
  }, [isAuthenticated, accountsRefresh, projectsRefresh, jasaRefresh, pesananRefresh]);

  // Muat daftar project untuk kartu "Project Aktif" di dashboard.
  useEffect(() => {
    if (!isAuthenticated) return;
    let alive = true;
    adminApi
      .listProjects({ page: 1, pageSize: 50 })
      .then((data) => {
        if (alive) setProjectsList(data.items ?? []);
      })
      .catch(() => {
        /* kartu opsional; biarkan kosong */
      });
    return () => {
      alive = false;
    };
  }, [isAuthenticated, projectsRefresh]);

  const counts = summary?.counts ?? {
    pelanggan: 0,
    admin: 0,
    pesanan: 0,
    pesananSebelumHariIni: 0,
    jasaAktif: 0,
    projectAktif: 0,
  };
  const statusDist = summary?.status ?? { baru: 0, diproses: 0, selesai: 0, batal: 0 };
  const { baru: stBaru, diproses: stDiproses, selesai: stSelesai, batal: stBatal } = statusDist;

  const goTo = (navItem) => {
    setActive(navItem.id);
    if (navItem.page && navItem.page !== page) {
      setSearch("");
      setPage(navItem.page);
      return;
    }
    if (navItem.page === "dashboard" && page !== "dashboard") {
      setPage("dashboard");
    }
    const el = document.getElementById(`section-${navItem.id}`);
    if (el) el.scrollIntoView({ behavior: "smooth", block: "center" });
  };
  const axisColor = isLight ? "#57534e" : "#a1a1aa";
  const gridColor = isLight ? "rgba(23,21,15,0.08)" : "rgba(255,255,255,0.06)";

  const barData = useMemo(
    () => ({
      labels: (summary?.weekly ?? []).map((d) => d.label),
      datasets: [
        {
          label: "Pesanan",
          data: (summary?.weekly ?? []).map((d) => d.count),
          backgroundColor: ORANGE,
          hoverBackgroundColor: ORANGE_SOFT,
          borderRadius: 7,
          borderSkipped: false,
          barThickness: 14,
        },
      ],
    }),
    [summary],
  );

  const barOptions = useMemo(
    () => ({
      responsive: true,
      maintainAspectRatio: false,
      animation: { duration: 900, easing: "easeOutQuart" },
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: isLight ? "#17150f" : "#1a1712",
          titleFont: { family: "Poppins", size: 11 },
          bodyFont: { family: "Poppins", size: 11 },
          padding: 10,
          cornerRadius: 10,
          displayColors: false,
        },
      },
      scales: {
        x: {
          grid: { display: false },
          border: { display: false },
          ticks: { color: axisColor, font: { family: "Poppins", size: 10 } },
        },
        y: {
          beginAtZero: true,
          grid: { color: gridColor, drawTicks: false },
          border: { display: false },
          ticks: { color: axisColor, font: { family: "Poppins", size: 10 }, padding: 6 },
        },
      },
    }),
    [isLight, axisColor, gridColor],
  );

  const orderData = useMemo(
    () => ({
      labels: (summary?.jasa ?? []).map((j) => j.name),
      datasets: [
        {
          label: "Pesanan",
          data: (summary?.jasa ?? []).map((j) => j.orders),
          backgroundColor: ORANGE,
          hoverBackgroundColor: ORANGE_SOFT,
          borderRadius: 6,
          borderSkipped: false,
          barThickness: 12,
        },
      ],
    }),
    [summary],
  );

  const orderOptions = useMemo(
    () => ({
      responsive: true,
      maintainAspectRatio: false,
      animation: { duration: 900, easing: "easeOutQuart" },
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: isLight ? "#17150f" : "#1a1712",
          titleFont: { family: "Poppins", size: 11 },
          bodyFont: { family: "Poppins", size: 11 },
          padding: 10,
          cornerRadius: 10,
          displayColors: false,
        },
      },
      scales: {
        x: {
          grid: { display: false },
          border: { display: false },
          ticks: { color: axisColor, font: { family: "Poppins", size: 10 } },
        },
        y: {
          beginAtZero: true,
          grid: { color: gridColor, drawTicks: false },
          border: { display: false },
          ticks: { color: axisColor, font: { family: "Poppins", size: 10 }, padding: 6 },
        },
      },
    }),
    [isLight, axisColor, gridColor],
  );

  const donutData = useMemo(
    () => ({
      labels: ["Selesai", "Diproses", "Baru", "Batal"],
      datasets: [
        {
          data: [stSelesai, stDiproses, stBaru, stBatal],
          backgroundColor: ["#10b981", ORANGE, ORANGE_SOFT, "#ef4444"],
          hoverBackgroundColor: ["#34d399", "#ffab3d", "#ffd199", "#f87171"],
          borderWidth: 0,
          hoverOffset: 4,
        },
      ],
    }),
    [stSelesai, stDiproses, stBaru, stBatal],
  );

  const donutOptions = useMemo(
    () => ({
      responsive: true,
      maintainAspectRatio: false,
      cutout: "72%",
      animation: { duration: 900, easing: "easeOutQuart" },
      plugins: {
        legend: {
          position: "bottom",
          labels: {
            color: axisColor,
            usePointStyle: true,
            pointStyle: "circle",
            boxWidth: 6,
            boxHeight: 6,
            padding: 12,
            font: { family: "Poppins", size: 10 },
          },
        },
        tooltip: {
          backgroundColor: isLight ? "#17150f" : "#1a1712",
          titleFont: { family: "Poppins", size: 11 },
          bodyFont: { family: "Poppins", size: 11 },
          padding: 10,
          cornerRadius: 10,
        },
        centerTotal: {
          value: formatNumber(counts.pesanan),
          label: "TOTAL PESANAN",
          color: isLight ? "#17150f" : "#f5f3ef",
          subColor: axisColor,
        },
      },
    }),
    [isLight, axisColor, counts.pesanan],
  );

  const items = [
    {
      key: "welcome",
      label: "Selamat datang",
      colSpan: 2,
      rowSpan: 2,
      className: "admin-fade-up",
      content: (
        <div className="flex h-full flex-col justify-between gap-4">
          <div className="flex items-center justify-between">
            <span className="font-poppins inline-flex items-center gap-1.5 rounded-full border border-[#f49827]/30 bg-[#f49827]/10 px-2.5 py-1 text-[10px] font-semibold text-[#f49827]">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[#f49827]" />
              ADMIN PANEL
            </span>
            <span className="font-poppins text-[10px] uppercase tracking-[0.2em] text-muted">
              1 Halaman
            </span>
          </div>

          <div className="flex items-center gap-4">
            <div className="relative">
              <div className="absolute inset-0 rounded-2xl bg-[#f49827]/25 blur-lg" />
              <img
                src="/profile.png"
                alt={adminName}
                className="relative h-16 w-16 rounded-2xl border border-white/15 object-cover sm:h-20 sm:w-20"
                onError={(e) => {
                  e.currentTarget.style.display = "none";
                }}
              />
            </div>
            <div className="min-w-0">
              <p className="font-poppins text-[11px] text-muted">Halo, selamat datang</p>
              <h1 className="font-poppins truncate text-xl font-semibold text-fg sm:text-2xl">
                {adminName}
              </h1>
              <p className="font-poppins mt-1 text-xs leading-relaxed text-muted">
                Semua aktivitas JasaHub ada di sini: pengguna, pesanan, dan jasa aktif.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2">
            {[
              { label: "Pelanggan", value: formatNumber(counts.pelanggan) },
              { label: "Pesanan", value: formatNumber(counts.pesananSebelumHariIni) },
              { label: "Jasa Aktif", value: formatNumber(counts.jasaAktif) },
            ].map((s) => (
              <div
                key={s.label}
                className="rounded-xl border border-line bg-black/10 px-2.5 py-2 dark:bg-white/5"
              >
                <p className="font-poppins text-base font-semibold text-fg">{s.value}</p>
                <p className="font-poppins text-[9px] uppercase tracking-wider text-muted">
                  {s.label}
                </p>
              </div>
            ))}
          </div>
        </div>
      ),
    },
    {
      key: "users",
      label: "Pelanggan",
      colSpan: 1,
      rowSpan: 1,
      className: "admin-fade-up",
      content: (
        <StatCard
          id="section-users"
          label="Pelanggan"
          value={formatNumber(counts.pelanggan)}
          delta={formatNumber(counts.admin)}
          note="admin terdaftar"
          icon="bx-user"
        />
      ),
    },
    {
      key: "orders",
      label: "Pesanan",
      colSpan: 1,
      rowSpan: 1,
      className: "admin-fade-up",
      content: (
        <StatCard
          id="section-orders"
          label="Pesanan"
          value={formatNumber(counts.pesananSebelumHariIni)}
          delta={formatNumber(statusDist.baru)}
          note="pesanan sebelum hari ini"
          icon="bx-cart-alt"
        />
      ),
    },
    {
      key: "services",
      label: "Jasa Aktif",
      colSpan: 2,
      rowSpan: 1,
      className: "admin-fade-up",
      content: (
        <div id="section-services" className="flex h-full flex-col justify-between gap-1.5">
          <div className="flex items-center justify-between">
            <span className="font-poppins text-xs font-medium text-muted">Jasa Aktif</span>
            <span className="font-poppins rounded-full bg-[#f49827]/15 px-2 py-0.5 text-[10px] font-semibold text-[#f49827]">
              {counts.jasaAktif} layanan
            </span>
          </div>
          <div className="space-y-1.5">
            {(summary?.jasa ?? []).length === 0 ? (
              <p className="font-poppins py-4 text-center text-[11px] text-muted">
                Belum ada jasa aktif
              </p>
            ) : (
              (summary?.jasa ?? []).map((s) => (
                <div key={s.name} className="flex items-center gap-2">
                  <span className="grid h-6 w-6 shrink-0 place-items-center rounded-lg bg-black/10 text-sm text-[#f49827] dark:bg-white/5">
                    <i className="bx bx-briefcase-alt-2" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <p className="font-poppins truncate text-[11px] font-medium text-fg">{s.name}</p>
                      <span className="font-poppins shrink-0 text-[10px] text-muted">{s.orders}</span>
                    </div>
                    <div className="admin-service-bar mt-1">
                      <span style={{ width: `${s.share}%` }} />
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      ),
    },
    {
      key: "visitors",
      label: "Pesanan",
      colSpan: 2,
      rowSpan: 2,
      className: "admin-fade-up",
      content: (
        <div className="flex h-full flex-col">
          <div className="flex items-center justify-between">
            <SectionHeading
              eyebrow="Grafik Batang"
              title="Pesanan Masuk"
              desc="7 hari terakhir"
            />
            <span className="font-poppins hidden shrink-0 items-center gap-1 rounded-full border border-line px-2 py-1 text-[10px] text-muted sm:inline-flex">
              <i className="bx bx-calendar text-[#f49827]" />
              Mingguan
            </span>
          </div>
          <div className="admin-chart-wrap">
            <Bar data={barData} options={barOptions} />
          </div>
        </div>
      ),
    },
    {
      key: "status",
      label: "Status",
      colSpan: 1,
      rowSpan: 2,
      className: "admin-fade-up",
      content: (
        <div className="flex h-full flex-col">
          <SectionHeading eyebrow="Grafik Lingkar" title="Status Pesanan" desc="Distribusi pesanan" />
          <div className="admin-chart-wrap">
            <Doughnut data={donutData} options={donutOptions} plugins={[centerTotal]} />
          </div>
        </div>
      ),
    },
    {
      key: "chat",
      label: "Status",
      colSpan: 1,
      rowSpan: 2,
      className: "admin-fade-up",
      content: (
        <div className="flex h-full flex-col">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="grid h-7 w-7 place-items-center rounded-lg bg-[#f49827]/15 text-sm text-[#f49827]">
                <i className="bx bx-pie-chart-alt-2" />
              </span>
              <div>
                <p className="font-poppins text-xs font-semibold text-fg">Ringkasan Status</p>
                <p className="font-poppins text-[9px] text-muted">Sebaran pesanan</p>
              </div>
            </div>
            <span className="font-poppins inline-flex items-center gap-1 rounded-full bg-emerald-500/15 px-2 py-0.5 text-[9px] font-semibold text-emerald-400">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
              LIVE
            </span>
          </div>

          <div className="mt-3 flex-1 space-y-2.5">
            {[
              { key: "selesai", label: "Selesai", value: statusDist.selesai, icon: "bx-check-circle", tone: "text-emerald-400" },
              { key: "diproses", label: "Diproses", value: statusDist.diproses, icon: "bx-loader-circle", tone: "text-[#f49827]" },
              { key: "baru", label: "Baru", value: statusDist.baru, icon: "bx-time-five", tone: "text-amber-300" },
              { key: "batal", label: "Batal", value: statusDist.batal, icon: "bx-x-circle", tone: "text-red-400" },
            ].map((s) => {
              const pct = counts.pesanan ? Math.round((s.value / counts.pesanan) * 100) : 0;
              return (
                <div key={s.key} className="flex items-center gap-2.5">
                  <span className={`grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-black/10 text-base dark:bg-white/5 ${s.tone}`}>
                    <i className={`bx ${s.icon}`} />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <p className="font-poppins text-[11px] font-medium text-fg">{s.label}</p>
                      <span className="font-poppins shrink-0 text-[10px] text-muted">
                        {formatNumber(s.value)} · {pct}%
                      </span>
                    </div>
                    <div className="admin-service-bar mt-1">
                      <span style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="font-poppins mt-2 flex items-center gap-1.5 rounded-full border border-line px-2.5 py-1.5 text-[10px] text-muted">
            <i className="bx bx-data text-sm text-[#f49827]" />
            Diperbarui realtime dari database
          </div>
        </div>
      ),
    },
    {
      key: "recent",
      label: "Pesanan Terbaru",
      colSpan: 2,
      rowSpan: 2,
      className: "admin-fade-up",
      content: (
        <div className="flex h-full flex-col">
          <SectionHeading eyebrow="Pesanan" title="Pesanan Terbaru" desc="5 transaksi terakhir" />
          <div className="admin-chat-scroll flex-1 space-y-1.5 pr-1">
            {(summary?.recent ?? []).length === 0 ? (
              <p className="font-poppins py-6 text-center text-[11px] text-muted">
                Belum ada pesanan masuk
              </p>
            ) : (
              (summary?.recent ?? []).map((o) => (
                <div
                  key={o.id}
                  className="flex items-center gap-2 rounded-xl border border-transparent px-1.5 py-1.5 transition-colors hover:border-line hover:bg-black/5 dark:hover:bg-white/5"
                >
                  <span className="grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-[#f49827]/15 text-xs text-[#f49827]">
                    <i className="bx bx-receipt" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="font-poppins truncate text-[11px] font-medium text-fg">
                      {o.namaLengkap}
                    </p>
                    <p className="font-poppins truncate text-[9px] text-muted">
                      #{o.id} · {o.jenisJasa}
                    </p>
                  </div>
                  <div className="flex shrink-0 flex-col items-end gap-1">
                    <StatusPill status={o.status} />
                    <span className="font-poppins text-[9px] text-muted">
                      {formatTanggal(o.createdAt)}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      ),
    },
    {
      key: "order-chart",
      label: "Pesanan",
      colSpan: 2,
      rowSpan: 2,
      className: "admin-fade-up",
      content: (
        <div className="flex h-full flex-col">
          <SectionHeading eyebrow="Grafik Batang" title="Pesanan per Jasa" desc="Total pesanan tiap layanan" />
          <div className="admin-chart-wrap">
            <Bar data={orderData} options={orderOptions} />
          </div>
        </div>
      ),
    },
    {
      key: "projects",
      label: "Project Aktif",
      colSpan: 2,
      rowSpan: 2,
      className: "admin-fade-up",
      content: (
        <div id="section-projects" className="flex h-full flex-col">
          <div className="flex items-center justify-between">
            <SectionHeading eyebrow="Proyek" title="Project Aktif" desc="Katalog portofolio yang tayang" />
            <span className="font-poppins rounded-full bg-[#f49827]/15 px-2 py-0.5 text-[10px] font-semibold text-[#f49827]">
              {projectsList.length} proyek
            </span>
          </div>
          <div className="admin-chat-scroll flex-1 space-y-2 pr-1">
            {projectsList.length === 0 ? (
              <p className="font-poppins py-6 text-center text-[11px] text-muted">
                Belum ada project terdaftar
              </p>
            ) : (
              projectsList.map((p) => (
                <div
                  key={p.id}
                  className="rounded-xl border border-transparent px-2 py-2 transition-colors hover:border-line hover:bg-black/5 dark:hover:bg-white/5"
                >
                  <div className="flex items-center gap-2">
                    <span className="grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-[#f49827]/15 text-xs text-[#f49827]">
                      <i className="bx bx-rocket" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="font-poppins truncate text-[11px] font-medium text-fg">{p.name}</p>
                      <p className="font-poppins truncate text-[9px] text-muted">
                        {p.slug}
                        {p.languages?.length ? ` · ${p.languages.slice(0, 2).join(", ")}` : ""}
                      </p>
                    </div>
                    <div className="flex shrink-0 flex-col items-end gap-1">
                      <span
                        className={`font-poppins inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-medium ${
                          p.isActive
                            ? "border-emerald-500/30 bg-emerald-500/15 text-emerald-400"
                            : "border-amber-500/25 bg-amber-500/10 text-amber-300"
                        }`}
                      >
                        {p.isActive ? "Aktif" : "Nonaktif"}
                      </span>
                    </div>
                  </div>
                  <div className="mt-1.5 flex items-center gap-2">
                    <div className="admin-service-bar flex-1">
                      <span style={{ width: p.isActive ? "100%" : "0%" }} />
                    </div>
                    <span className="font-poppins shrink-0 text-[9px] text-muted">
                      {p.isActive ? "Tayang" : "Disembunyikan"}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      ),
    },
  ];

  return (
    <div className="admin-root bg-page font-poppins text-fg">
      {isLight && <PaperBackground />}
      <div className="flex h-full">
        {/* Sidebar desktop */}
        <aside className="hidden w-60 shrink-0 flex-col border-r border-line px-4 py-5 lg:flex">
          <a href="/" className="mb-8 flex items-baseline gap-1 px-2">
            <span className="font-anton text-xl tracking-wide">JASA</span>
            <span className="font-anton text-xl text-[#f49827]">HUB</span>
          </a>

          <p className="font-poppins mb-2 px-2 text-[9px] font-semibold uppercase tracking-[0.26em] text-muted">
            Menu
          </p>
          <nav className="space-y-1">
            {NAV.map((n) => (
              <button
                key={n.id}
                data-active={active === n.id}
                onClick={() => goTo(n)}
                className={`admin-nav-item font-poppins flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-xs font-medium transition-all duration-300 ${
                  active === n.id
                    ? "bg-[#f49827]/15 text-[#f49827]"
                    : "text-muted hover:bg-black/5 hover:text-fg dark:hover:bg-white/5"
                }`}
              >
                <i className={`bx ${n.icon} text-base`} />
                {n.label}
              </button>
            ))}
          </nav>

          <div className="mt-auto space-y-1">
            <button
              onClick={toggleTheme}
              className="font-poppins flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-xs font-medium text-muted transition-colors hover:bg-black/5 hover:text-fg dark:hover:bg-white/5"
            >
              <i className={`bx ${isLight ? "bx-moon" : "bx-sun"} text-base`} />
              {isLight ? "Tema Gelap" : "Tema Terang"}
            </button>
            <div className="mt-2 flex items-center gap-2.5 rounded-xl border border-line px-2.5 py-2">
              <img
                src="/profile.png"
                alt={adminName}
                className="h-8 w-8 rounded-lg object-cover"
                onError={(e) => {
                  e.currentTarget.style.display = "none";
                }}
              />
              <div className="min-w-0 flex-1">
                <p className="font-poppins truncate text-[11px] font-semibold text-fg">{adminName}</p>
                <p className="font-poppins text-[9px] text-muted">Administrator</p>
              </div>
              <button
                onClick={() => setConfirmLogout(true)}
                aria-label="Keluar"
                className="grid h-7 w-7 shrink-0 place-items-center rounded-lg text-muted transition-colors hover:text-[#f49827]"
              >
                <i className="bx bx-log-out text-base" />
              </button>
            </div>
          </div>
        </aside>

        {/* Main */}
        <main className="flex min-w-0 flex-1 flex-col">
          {/* Header */}
          <header className="flex shrink-0 items-center gap-3 border-b border-line px-4 py-3 sm:px-6">
            <a href="/" className="flex items-baseline gap-1 lg:hidden">
              <span className="font-anton text-lg">JASA</span>
              <span className="font-anton text-lg text-[#f49827]">HUB</span>
            </a>

            <div className="hidden lg:block">
              <p className="font-poppins text-[10px] uppercase tracking-[0.24em] text-muted">{meta.eyebrow}</p>
              <h1 className="font-poppins text-sm font-semibold text-fg">{meta.title}</h1>
            </div>

            <div className="ml-auto flex items-center gap-2">
              <div className="hidden items-center gap-2 rounded-full border border-line px-3 py-1.5 sm:flex">
                <i className="bx bx-search text-sm text-muted" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder={meta.placeholder}
                  className="font-poppins w-28 bg-transparent text-[11px] text-fg outline-none placeholder:text-muted md:w-40"
                />
              </div>
              <button
                onClick={toggleTheme}
                aria-label="Ganti tema"
                className="grid h-9 w-9 place-items-center rounded-full border border-line text-base text-fg transition-all duration-300 hover:border-[#f49827] hover:text-[#f49827] lg:hidden"
              >
                <i className={`bx ${isLight ? "bx-moon" : "bx-sun"}`} />
              </button>
              <button
                onClick={() => goTo(NAV.find((n) => n.page === "pesanan"))}
                aria-label="Notifikasi"
                title={
                  statusDist.baru > 0
                    ? `${statusDist.baru} pesanan baru`
                    : "Tidak ada pesanan baru"
                }
                className="relative grid h-9 w-9 place-items-center rounded-full border border-line text-base text-fg transition-all duration-300 hover:border-[#f49827] hover:text-[#f49827]"
              >
                <i className="bx bx-bell" />
                {statusDist.baru > 0 && (
                  <span className="absolute -right-1 -top-1 grid min-w-[18px] h-[18px] place-items-center rounded-full bg-red-500 px-1 font-poppins text-[10px] font-bold leading-none text-white shadow-[0_0_6px_rgba(239,68,68,0.7)]">
                    {statusDist.baru > 99 ? "99+" : statusDist.baru}
                  </span>
                )}
              </button>
              <img
                src="/profile.png"
                alt={adminName}
                className="h-9 w-9 rounded-full border border-line object-cover"
                onError={(e) => {
                  e.currentTarget.style.display = "none";
                }}
              />
            </div>
          </header>

          {/* Internal scroll area */}
          <div className="admin-scroll flex-1 px-4 py-4 pb-24 sm:px-6 sm:pb-6 lg:pb-12">
            <div className="w-full overflow-hidden">
              <AnimatePresence mode="wait" initial={false}>
                {page === "dashboard" ? (
                  <Motion.div
                    key="dashboard"
                    initial={{ opacity: 0, x: 80 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -80 }}
                    transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                  >
                    <MagicBento
                      items={items}
                      columns={4}
                      rowHeight={168}
                      gap={14}
                      radius={22}
                      theme={theme}
                      glowColor="244, 152, 39"
                      enableBorderGlow
                      enableSpotlight
                      spotlightRadius={340}
                      enableTilt={false}
                      enableMagnetism={false}
                      clickEffect={false}
                    />
                  </Motion.div>
                ) : (
                  <Motion.div
                    key={page}
                    initial={{ opacity: 0, x: 80 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -80 }}
                    transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                    className="rounded-3xl border border-line bg-black/[0.02] p-4 dark:bg-white/[0.02] sm:p-6"
                  >
                    {page === "admins" ? (
                      <AdminAccountsPanel search={search} refreshKey={accountsRefresh} />
                    ) : page === "jasa-aktif" ? (
                      <JasaAktifPanel search={search} refreshKey={jasaRefresh} />
                    ) : page === "projects" ? (
                      <ProjectAktifPanel search={search} refreshKey={projectsRefresh} />
                    ) : page === "pesanan" ? (
                      <PesananPanel search={search} refreshKey={pesananRefresh} />
                    ) : (
                      <PelangganAccountsPanel search={search} refreshKey={accountsRefresh} />
                    )}
                  </Motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </main>
      </div>

      {/* Bottom nav mobile */}
      <nav className="fixed inset-x-0 bottom-0 z-40 flex items-stretch gap-1 overflow-x-auto border-t border-line bg-page px-2 py-2 backdrop-blur-lg lg:hidden">
        {NAV.map((n) => (
          <button
            key={n.id}
            onClick={() => goTo(n)}
            className={`font-poppins flex shrink-0 flex-col items-center gap-0.5 rounded-xl px-3 py-1.5 text-[9px] font-medium transition-colors ${
              active === n.id ? "text-[#f49827]" : "text-muted"
            }`}
          >
            <i className={`bx ${n.icon} text-lg`} />
            {n.label}
          </button>
        ))}
      </nav>

      <ConfirmLogout
        open={confirmLogout}
        onCancel={() => setConfirmLogout(false)}
        onConfirm={() => { setConfirmLogout(false); logout(); }}
      />
    </div>
  );
};

const Admin = () => {
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";

  return (
    <>
      <AdminDashboard />
      {!isAdmin && <AdminGate />}
    </>
  );
};

export default Admin;
