import { useEffect, useRef, useState } from "react";
import "boxicons/css/boxicons.min.css";
import { useAuth } from "../../context/AuthContext";

const Spinner = () => (
  <svg
    className="h-4 w-4 animate-spin [animation-duration:0.6s]"
    viewBox="0 0 24 24"
    fill="none"
    aria-hidden="true"
  >
    <circle cx="12" cy="12" r="9" stroke="currentColor" strokeOpacity="0.25" strokeWidth="3" />
    <path d="M21 12a9 9 0 0 0-9-9" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
  </svg>
);

const AdminGate = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [remember, setRemember] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [shake, setShake] = useState(false);
  const [entered, setEntered] = useState(false);

  const emailRef = useRef(null);
  const cardRef = useRef(null);

  const { login, logout } = useAuth();

  useEffect(() => {
    const id = requestAnimationFrame(() => setEntered(true));
    const t = setTimeout(() => emailRef.current?.focus(), 420);
    return () => {
      cancelAnimationFrame(id);
      clearTimeout(t);
    };
  }, []);

  const handlePointerMove = (e) => {
    const card = cardRef.current;
    if (!card) return;
    const rect = card.getBoundingClientRect();
    const px = (e.clientX - rect.left) / rect.width;
    const py = (e.clientY - rect.top) / rect.height;
    card.style.setProperty("--mx", `${px * 100}%`);
    card.style.setProperty("--my", `${py * 100}%`);
  };

  const handlePointerLeave = () => {
    const card = cardRef.current;
    if (!card) return;
    card.style.setProperty("--mx", "50%");
    card.style.setProperty("--my", "0%");
  };

  const triggerShake = () => {
    setShake(true);
    setTimeout(() => setShake(false), 500);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!email.trim() || !password) {
      setError("Email dan password wajib diisi.");
      triggerShake();
      return;
    }

    setLoading(true);

    try {
      const result = await login(email.trim(), password, { persist: remember, role: "admin" });

      if (!result.success) {
        setError(result.message || "Email atau password salah.");
        triggerShake();
        return;
      }

      if (result.user?.role !== "admin") {
        logout();
        setError("Akun ini bukan administrator.");
        triggerShake();
        return;
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div
        className="fixed inset-0 z-[9999] flex items-center justify-center overflow-y-auto bg-black/35 backdrop-blur-md p-4"
        role="dialog"
        aria-modal="true"
        aria-label="Login Administrator"
      >
      <div
        className={`w-full max-w-sm transition-all duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] ${
          shake ? "animate-[shake_0.45s_ease-in-out]" : ""
        } ${entered ? "translate-y-0 opacity-100" : "translate-y-6 opacity-0"}`}
      >
        <div
          ref={cardRef}
          onMouseMove={handlePointerMove}
          onMouseLeave={handlePointerLeave}
          className="admin-gate-card relative overflow-hidden rounded-[1.75rem] p-[1.5px] transition-transform duration-200 ease-out will-change-transform"
        >
          {/* Kartu (menutupi tengah gradient, sisakan tepi 1.5px sebagai border kilat) */}
          <div className="relative z-10 overflow-hidden rounded-[1.65rem] bg-[#0e0e10] p-7 shadow-[0_30px_90px_-20px_rgba(0,0,0,0.85)]">
            {/* spotlight mengikuti kursor */}
            <div
              className="pointer-events-none absolute inset-0 opacity-70"
              style={{
                background:
                  "radial-gradient(320px circle at var(--mx,50%) var(--my,0%), rgba(244,152,39,0.16), transparent 65%)",
              }}
            />
            <div className="pointer-events-none absolute -right-16 -top-20 h-44 w-44 rounded-full bg-[#f49827]/25 blur-3xl" />

            <div className="relative flex flex-col items-center">
                <img
                  src="/JasaHub.png"
                  alt="JasaHub"
                  className="h-14 w-14 rounded-2xl object-contain ring-1 ring-white/10"
                  onError={(e) => {
                    e.currentTarget.style.display = "none";
                  }}
                />
                <h2 className="font-poppins mt-4 text-lg font-semibold tracking-wide text-white">
                  Admin <span className="text-[#f49827]">Login</span>
                </h2>
                <p className="font-poppins mt-1 text-center text-[11px] leading-relaxed text-white/55">
                  Area terbatas. Masukkan kredensial untuk melanjutkan ke dashboard.
                </p>
              </div>

              {error && (
                <div className="relative mt-5 flex items-center gap-2 rounded-xl border border-red-500/30 bg-red-500/10 px-3 py-2.5">
                  <i className="bx bx-error-circle text-base text-red-400" />
                  <span className="font-poppins text-[11px] text-red-300">{error}</span>
                </div>
              )}

              <form
                onSubmit={handleSubmit}
                autoComplete="off"
                className="relative mt-5 flex flex-col gap-4"
              >
                <div className="flex flex-col gap-1.5">
                  <label className="font-poppins text-[11px] font-medium text-white/60">
                    Email
                  </label>
                  <div className="group flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.03] px-3 transition-colors focus-within:border-[#f49827]/60 focus-within:bg-white/[0.05]">
                    <i className="bx bx-envelope text-base text-white/40 transition-colors group-focus-within:text-[#f49827]" />
                    <input
                      ref={emailRef}
                      type="email"
                      name="jasahub-admin-email"
                      value={email}
                      onChange={(e) => {
                        setEmail(e.target.value);
                        if (error) setError("");
                      }}
                      placeholder="admin@jasahub.vercel.app"
                      autoComplete="email"
                      autoCapitalize="none"
                      autoCorrect="off"
                      spellCheck={false}
                      data-lpignore="true"
                      data-form-type="other"
                      disabled={loading}
                      className="font-poppins h-11 w-full bg-transparent text-sm text-white outline-none placeholder:text-white/25 disabled:opacity-60"
                    />
                  </div>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="font-poppins text-[11px] font-medium text-white/60">
                    Password
                  </label>
                  <div className="group flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.03] px-3 transition-colors focus-within:border-[#f49827]/60 focus-within:bg-white/[0.05]">
                    <i className="bx bx-lock-alt text-base text-white/40 transition-colors group-focus-within:text-[#f49827]" />
                    <input
                      type={showPassword ? "text" : "password"}
                      name="jasahub-admin-pass"
                      value={password}
                      onChange={(e) => {
                        setPassword(e.target.value);
                        if (error) setError("");
                      }}
                      placeholder="••••••••"
                      autoComplete="new-password"
                      data-lpignore="true"
                      data-form-type="other"
                      disabled={loading}
                      className="font-poppins h-11 w-full bg-transparent text-sm text-white outline-none placeholder:text-white/25 disabled:opacity-60"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((v) => !v)}
                      className="text-white/40 transition-colors hover:text-[#f49827]"
                      aria-label={showPassword ? "Sembunyikan password" : "Tampilkan password"}
                    >
                      <i className={`bx ${showPassword ? "bx-show" : "bx-hide"} text-base`} />
                    </button>
                  </div>
                </div>

                <label className="flex cursor-pointer items-center gap-2 select-none">
                  <input
                    type="checkbox"
                    checked={remember}
                    onChange={(e) => setRemember(e.target.checked)}
                    className="h-3.5 w-3.5 cursor-pointer appearance-none rounded border border-white/20 bg-white/5 transition-colors checked:border-[#f49827] checked:bg-[#f49827]"
                  />
                  <span className="font-poppins text-[11px] text-white/50">
                    Ingat sesi di perangkat ini
                  </span>
                </label>

                <button
                  type="submit"
                  disabled={loading}
                  className="mt-1 flex h-11 w-full cursor-pointer items-center justify-center gap-2 rounded-xl bg-[#f49827] font-poppins text-sm font-semibold text-black transition-all duration-200 hover:bg-[#ffab3d] active:scale-[0.985] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {loading ? (
                    <>
                      <Spinner />
                      Memverifikasi...
                    </>
                  ) : (
                    <>
                      <i className="bx bx-log-in-circle text-base" />
                      Masuk Dashboard
                    </>
                  )}
                </button>
              </form>

              <p className="font-poppins relative mt-5 text-center text-[10px] leading-relaxed text-white/25">
                Autentikasi aman melalui server JasaHub.
              </p>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          20% { transform: translateX(-8px); }
          40% { transform: translateX(8px); }
          60% { transform: translateX(-5px); }
          80% { transform: translateX(5px); }
        }

        /* Border kilat berjalan.
           CardRef membawa gradient conic sebagai BACKGROUND; kartu isi menutupi
           bagian tengah dan hanya menyisakan tepi p-1.5px yang terlihat sebagai
           border berkilat. Teknik ini stabil di semua browser dan tidak pernah
           menangkap klik (kartu isi ada di atasnya, z-10). */
        .admin-gate-card {
          background: conic-gradient(
            from var(--angle, 0deg),
            rgba(244, 152, 39, 0.15) 0deg,
            rgba(244, 152, 39, 0.9) 55deg,
            #ffd9a0 75deg,
            rgba(244, 152, 39, 0.9) 95deg,
            rgba(244, 152, 39, 0.15) 150deg,
            rgba(244, 152, 39, 0.15) 360deg
          );
          animation: gate-spin 4.5s linear infinite;
        }

        @property --angle {
          syntax: "<angle>";
          initial-value: 0deg;
          inherits: false;
        }

        @keyframes gate-spin {
          to { --angle: 360deg; }
        }

        /* Fallback bila @property tidak didukung: sapuan gradient linear */
        @supports not (background: conic-gradient(from var(--angle, 0deg), red, blue)) {
          .admin-gate-card {
            background: linear-gradient(
              120deg,
              rgba(244, 152, 39, 0.15),
              rgba(244, 152, 39, 0.9),
              rgba(244, 152, 39, 0.15)
            );
            background-size: 200% 200%;
            animation: gate-sweep 3.5s ease-in-out infinite;
          }
          @keyframes gate-sweep {
            0% { background-position: 0% 50%; }
            100% { background-position: 200% 50%; }
          }
        }
      `}</style>
    </>
  );
};

export default AdminGate;
