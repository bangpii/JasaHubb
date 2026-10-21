import React, { useState } from "react";
import { motion as Motion, AnimatePresence } from "framer-motion";
import { useSettings } from "../context/SettingsContext";
import { publicApi } from "../services/api";

const inputClass =
  "w-full rounded-xl border border-stone-200 bg-white/90 px-3.5 py-2.5 text-sm text-stone-800 shadow-sm outline-none transition-all placeholder:text-stone-400 focus:border-[#f49827] focus:bg-white focus:ring-4 focus:ring-[#f49827]/15";

const Field = ({ icon, label, children }) => (
  <label className="block">
    <span className="mb-1.5 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-stone-500">
      <i className={`bx ${icon} text-sm text-[#f49827]`} />
      {label}
    </span>
    {children}
  </label>
);

// Normalisasi nomor WA Indonesia: 08xx / +628xx / 628xx -> 628xx
const normalizeWa = (raw) => {
  const digits = String(raw).replace(/[^\d]/g, "");
  if (digits.startsWith("62")) return digits;
  if (digits.startsWith("0")) return `62${digits.slice(1)}`;
  if (digits.startsWith("8")) return `62${digits}`;
  return digits;
};

// Validasi sederhana: nomor WA Indonesia (62 + 8xx, panjang 10-15 digit)
const isValidWa = (raw) => /^628\d{6,12}$/.test(normalizeWa(raw));

const CheckIcon = ({ checked }) => (
  <span
    className={`mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-md border-2 transition-all duration-200 ${
      checked
        ? "border-[#f49827] bg-[#f49827] text-black"
        : "border-stone-300 bg-white text-transparent"
    }`}
  >
    <i className="bx bx-check text-sm font-bold" />
  </span>
);

// Ikon centang animasi path untuk status sukses
const SuccessCheck = () => (
  <Motion.span
    initial={{ scale: 0.4, opacity: 0 }}
    animate={{ scale: 1, opacity: 1 }}
    transition={{ type: "spring", stiffness: 260, damping: 18 }}
    className="relative grid h-24 w-24 place-items-center"
  >
    <Motion.span
      initial={{ scale: 0 }}
      animate={{ scale: [0, 1.15, 1] }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className="absolute inset-0 rounded-full bg-emerald-500/15"
    />
    <span className="relative grid h-20 w-20 place-items-center rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 shadow-[0_16px_40px_-12px_rgba(16,185,129,0.8)]">
      <svg viewBox="0 0 52 52" className="h-10 w-10">
        <Motion.path
          d="M14 27 L23 36 L39 18"
          fill="none"
          stroke="#fff"
          strokeWidth="5"
          strokeLinecap="round"
          strokeLinejoin="round"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 0.4, delay: 0.25, ease: "easeOut" }}
        />
      </svg>
    </span>
  </Motion.span>
);

const Pesan = ({ onClose, selectedService }) => {
  const { lang, t } = useSettings();
  const [agree, setAgree] = useState(false);
  const [wa, setWa] = useState("");
  const [nama, setNama] = useState("");
  const [alamat, setAlamat] = useState("");
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);
  const [account, setAccount] = useState(null);
  const [copied, setCopied] = useState("");
  const [error, setError] = useState("");
  const waTouched = wa.length > 0;
  const waOk = isValidWa(wa);

  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) onClose();
  };

  const serviceTitle = selectedService?.title?.[lang] || "";

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (busy || !agree || !waOk || !nama.trim()) return;
    setBusy(true);
    setError("");
    try {
      const result = await publicApi.createPesanan({
        namaLengkap: nama.trim(),
        alamat: alamat.trim() || null,
        nomorWa: wa,
        jenisJasa: serviceTitle || "Konsultasi",
        jasaId: selectedService?.id ?? null,
        jasaSlug: selectedService?.slug ?? null,
      });
      setAccount(result?.account ?? null);
      setSent(true);
    } catch (err) {
      setError(err.message || t("order.error"));
    } finally {
      setBusy(false);
    }
  };

  const copyValue = async (key, value) => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(key);
      window.setTimeout(() => setCopied(""), 1800);
    } catch {
      setCopied("");
    }
  };

  return (
    <AnimatePresence>
      <Motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
        className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/55 p-4 backdrop-blur-md"
        onClick={handleOverlayClick}
      >
        <Motion.div
          initial={{ opacity: 0, scale: 0.94, y: 24 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.94, y: 24 }}
          transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
          onClick={(e) => e.stopPropagation()}
          className="relative w-full max-w-md overflow-hidden rounded-[28px] border border-white/60 bg-[#FFFCF8] shadow-[0_40px_90px_-24px_rgba(120,72,10,0.55)] ring-1 ring-black/5"
        >
          {/* Header */}
          <div className="relative overflow-hidden bg-gradient-to-br from-[#f49827] via-[#f49827] to-[#d97f0f] px-6 pb-6 pt-7">
            <div className="pointer-events-none absolute -right-10 -top-12 h-36 w-36 rounded-full bg-white/15 blur-2xl" />
            <div className="pointer-events-none absolute -bottom-16 -left-6 h-32 w-32 rounded-full bg-black/10 blur-2xl" />

            <div className="relative flex items-center gap-3">
              <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-black/15 text-2xl text-white backdrop-blur-sm">
                <i className="bx bx-receipt" />
              </span>
              <div className="min-w-0">
                <p className="font-anton text-xl leading-tight text-white">
                  {t("order.title")}
                </p>
                <p className="mt-0.5 text-[11px] font-medium text-white/85">
                  {t("order.subtitle")}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              aria-label="Tutup"
              className="absolute right-4 top-4 grid h-9 w-9 cursor-pointer place-items-center rounded-full bg-black/15 text-white transition-all hover:rotate-90 hover:bg-black/30"
            >
              <i className="bx bx-x text-xl" />
            </button>
          </div>

          {/* Body */}
          <div className="modal-scroll max-h-[64vh] overflow-y-auto px-6 py-5">
            {sent ? (
              <div className="flex flex-col items-center px-2 py-6 text-center">
                <SuccessCheck />
                <h3 className="mt-5 font-anton text-2xl text-stone-800">
                  {t("order.successTitle")}
                </h3>
                <p className="mt-2 max-w-xs text-sm leading-relaxed text-stone-500">
                  {t("order.successDesc")}
                </p>
                <div className="mt-4 flex w-full items-center gap-2 rounded-2xl border border-emerald-400/40 bg-emerald-50/70 px-3.5 py-3 text-left">
                  <i className="bx bx-time-five text-lg text-emerald-600" />
                  <p className="text-[11px] font-medium text-emerald-700">
                    {t("order.successDesc")}
                  </p>
                </div>

                {account && (
                  <div className="mt-4 w-full rounded-2xl border border-[#f49827]/40 bg-[#f49827]/[0.08] p-4 text-left">
                    <div className="flex items-center gap-2.5">
                      <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-[#f49827] text-lg text-black">
                        <i className="bx bx-user-check" />
                      </span>
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-stone-800">
                          {t("order.accountTitle")}
                        </p>
                        <p className="text-[11px] leading-relaxed text-stone-500">
                          {t("order.accountDesc")}
                        </p>
                      </div>
                    </div>

                    <div className="mt-3 space-y-2">
                      {[
                        { key: "email", label: t("order.accountEmail"), value: account.email },
                        { key: "password", label: t("order.accountPassword"), value: account.password },
                      ].map((item) => (
                        <div
                          key={item.key}
                          className="flex items-center justify-between gap-2 rounded-xl border border-stone-200 bg-white px-3 py-2"
                        >
                          <div className="min-w-0">
                            <p className="text-[9px] font-semibold uppercase tracking-wider text-stone-400">
                              {item.label}
                            </p>
                            <p className="truncate font-mono text-[13px] font-semibold text-stone-800">
                              {item.value}
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={() => copyValue(item.key, item.value)}
                            className="flex shrink-0 cursor-pointer items-center gap-1 rounded-lg border border-stone-200 px-2 py-1 text-[10px] font-semibold text-stone-600 transition-colors hover:border-[#f49827] hover:text-[#b9761a]"
                          >
                            <i className={`bx ${copied === item.key ? "bx-check" : "bx-copy"} text-sm`} />
                            {copied === item.key ? t("order.accountCopied") : t("order.accountCopy")}
                          </button>
                        </div>
                      ))}
                    </div>

                    <p className="mt-3 flex items-start gap-1.5 text-[11px] leading-relaxed text-[#b9761a]">
                      <i className="bx bx-info-circle mt-0.5 text-sm" />
                      <span>{t("order.loginHint")}</span>
                    </p>
                  </div>
                )}

                <button
                  type="button"
                  onClick={onClose}
                  className="mt-6 w-full cursor-pointer rounded-2xl bg-gradient-to-r from-[#f49827] to-[#e88a12] py-3.5 text-sm font-bold text-black shadow-[0_10px_24px_-12px_rgba(244,152,39,0.9)] transition-all duration-300 hover:-translate-y-0.5"
                >
                  {t("order.successClose")}
                </button>
              </div>
            ) : (
              <>
                {serviceTitle && (
                  <div className="mb-4 flex items-center gap-3 rounded-2xl border border-[#f49827]/25 bg-gradient-to-r from-[#f49827]/12 to-transparent px-3.5 py-3">
                    <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-[#f49827] text-lg text-black">
                      <i className="bx bx-purchase-tag-alt" />
                    </span>
                    <div className="min-w-0">
                      <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#b9761a]">
                        {t("order.service")}
                      </p>
                      <p className="truncate text-sm font-semibold text-stone-800">{serviceTitle}</p>
                    </div>
                  </div>
                )}

                <form className="space-y-4" onSubmit={handleSubmit}>
                  <Field icon="bx-user" label={t("order.name")}>
                    <input
                      type="text"
                      autoComplete="off"
                      value={nama}
                      onChange={(e) => setNama(e.target.value)}
                      placeholder={t("order.namePh")}
                      className={inputClass}
                      required
                    />
                  </Field>

                  <Field icon="bx-map" label={t("order.addr")}>
                    <textarea
                      rows={2}
                      autoComplete="off"
                      value={alamat}
                      onChange={(e) => setAlamat(e.target.value)}
                      placeholder={t("order.addrPh")}
                      className={`${inputClass} resize-none`}
                    />
                  </Field>

                  <Field icon="bxl-whatsapp" label={t("order.wa")}>
                    <input
                      type="tel"
                      inputMode="numeric"
                      autoComplete="off"
                      value={wa}
                      onChange={(e) => setWa(e.target.value)}
                      placeholder={t("order.waPh")}
                      className={`${inputClass} ${
                        waTouched && !waOk
                          ? "border-red-400 bg-red-50/50 focus:border-red-400 focus:ring-red-400/15"
                          : waOk
                            ? "border-emerald-400/70 focus:border-emerald-500 focus:ring-emerald-500/15"
                            : ""
                      }`}
                    />
                    {waTouched && !waOk ? (
                      <span className="mt-1.5 flex items-center gap-1.5 text-[11px] font-medium text-red-500">
                        <i className="bx bx-error-circle text-sm" />
                        {t("order.waInvalid")}
                      </span>
                    ) : waOk ? (
                      <span className="mt-1.5 flex items-center gap-1.5 text-[11px] font-medium text-emerald-600">
                        <i className="bx bxl-whatsapp text-sm" />
                        {t("order.waOk")} · +{normalizeWa(wa)}
                      </span>
                    ) : (
                      <span className="mt-1.5 block text-[11px] text-stone-500">
                        {t("order.waHint")}
                      </span>
                    )}
                  </Field>

                  {/* Syarat & Ketentuan */}
                  <div
                    className={`rounded-2xl border p-4 transition-colors ${
                      agree
                        ? "border-[#f49827]/40 bg-[#f49827]/[0.07]"
                        : "border-stone-200 bg-stone-50/70"
                    }`}
                  >
                    <label className="flex cursor-pointer items-start gap-3">
                      <input
                        type="checkbox"
                        checked={agree}
                        onChange={(e) => setAgree(e.target.checked)}
                        className="sr-only"
                      />
                      <CheckIcon checked={agree} />
                      <span className="text-sm font-semibold text-stone-800">{t("order.terms")}</span>
                    </label>
                    <p className="mt-2.5 pl-8 text-[11px] leading-relaxed text-stone-500">
                      {t("order.termsDesc")}
                    </p>
                    <p className="mt-2 flex items-start gap-1.5 pl-8 text-[11px] leading-relaxed text-[#b9761a]">
                      <i className="bx bxl-whatsapp mt-0.5 text-sm" />
                      <span>{t("order.waTerms")}</span>
                    </p>
                  </div>

                  {error && (
                    <p className="flex items-center gap-1.5 rounded-xl border border-red-300/60 bg-red-50 px-3 py-2 text-[11px] font-medium text-red-600">
                      <i className="bx bx-error-circle text-sm" />
                      {error}
                    </p>
                  )}

                  {/* Tombol Kirim */}
                  <button
                    type="submit"
                    disabled={busy || !agree || !waOk}
                    className="group flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-[#f49827] to-[#e88a12] py-3.5 text-sm font-bold text-black shadow-[0_10px_24px_-12px_rgba(244,152,39,0.9)] transition-all duration-300 enabled:cursor-pointer enabled:hover:-translate-y-0.5 enabled:hover:shadow-[0_16px_30px_-12px_rgba(244,152,39,1)] disabled:cursor-not-allowed disabled:bg-none disabled:bg-stone-200 disabled:text-stone-400 disabled:shadow-none"
                  >
                    {busy ? (
                      <i className="bx bx-loader-alt bx-spin text-base" />
                    ) : (
                      <i className="bx bx-send text-base transition-transform group-enabled:group-hover:translate-x-0.5" />
                    )}
                    {busy ? t("order.busy") : t("order.send")}
                  </button>
                </form>
              </>
            )}
          </div>
        </Motion.div>
      </Motion.div>
    </AnimatePresence>
  );
};

export default Pesan;
