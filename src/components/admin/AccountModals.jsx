import React, { useEffect, useState } from 'react';
import 'boxicons/css/boxicons.min.css';
import { motion as Motion, AnimatePresence } from 'framer-motion';

const overlay = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0 },
};
const card = {
  initial: { opacity: 0, scale: 0.94, y: 18 },
  animate: { opacity: 1, scale: 1, y: 0 },
  exit: { opacity: 0, scale: 0.94, y: 18 },
};
const transition = { duration: 0.22, ease: [0.16, 1, 0.3, 1] };

export const Field = ({ label, ...props }) => (
  <label className="block">
    <span className="font-poppins mb-1 block text-[11px] font-semibold text-muted">{label}</span>
    <input
      {...props}
      className="font-poppins h-10 w-full rounded-xl border border-line bg-transparent px-3 text-sm text-fg outline-none transition-colors placeholder:text-muted/60 focus:border-[#f49827]"
    />
  </label>
);

// ---------------- Modal Form (tambah/edit akun) ----------------
export const AccountFormModal = ({ open, title, fields, initial, onClose, onSubmit, busy, error }) => {
  const [values, setValues] = useState({});
  const [mountReady, setMountReady] = useState(false);

  useEffect(() => {
    if (open) {
      setValues(initial ? { ...initial } : {});
      setMountReady(false);
      const t = setTimeout(() => setMountReady(true), 80);
      return () => clearTimeout(t);
    }
  }, [open, initial]);

  const set = (name) => (e) => setValues((v) => ({ ...v, [name]: e.target.value }));

  return (
    <AnimatePresence>
      {open && (
        <Motion.div
          {...overlay}
          transition={transition}
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
          onClick={onClose}
        >
          <Motion.div
            {...card}
            transition={transition}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md overflow-hidden rounded-3xl border border-line bg-page shadow-[0_24px_60px_-12px_rgba(0,0,0,0.5)]"
          >
            <div className="flex items-center justify-between border-b border-line px-5 py-4">
              <h3 className="font-poppins text-sm font-semibold text-fg">{title}</h3>
              <button
                type="button"
                onClick={onClose}
                aria-label="Tutup"
                className="grid h-8 w-8 place-items-center rounded-lg text-muted transition-colors hover:text-[#f49827]"
              >
                <i className="bx bx-x text-xl" />
              </button>
            </div>

            <form
              autoComplete="off"
              onSubmit={(e) => {
                e.preventDefault();
                onSubmit(values);
              }}
              className="max-h-[70vh] space-y-3 overflow-y-auto px-5 py-4"
            >
              {fields.map((f) => (
                <Field
                  key={f.name}
                  label={f.label}
                  name={f.fieldName || f.name}
                  type={f.type || 'text'}
                  placeholder={f.placeholder}
                  value={values[f.name] ?? ''}
                  onChange={set(f.name)}
                  required={f.required}
                  autoComplete={f.autoComplete || 'off'}
                  readOnly={!mountReady}
                  data-lpignore="true"
                />
              ))}

              {error && (
                <p className="font-poppins rounded-xl border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs text-red-400">
                  {error}
                </p>
              )}

              <div className="flex gap-3 pt-1">
                <button
                  type="button"
                  onClick={onClose}
                  className="font-poppins flex-1 cursor-pointer rounded-xl border border-line py-2.5 text-sm font-semibold text-fg transition-colors hover:border-[#f49827] hover:text-[#f49827]"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={busy}
                  className="font-poppins flex-1 cursor-pointer rounded-xl bg-[#f49827] py-2.5 text-sm font-semibold text-black transition-colors hover:bg-[#d97f0f] disabled:opacity-50"
                >
                  {busy ? 'Menyimpan...' : 'Simpan'}
                </button>
              </div>
            </form>
          </Motion.div>
        </Motion.div>
      )}
    </AnimatePresence>
  );
};

// ---------------- Modal Konfirmasi Hapus ----------------
export const ConfirmDeleteModal = ({ open, name, onClose, onConfirm, busy }) => (
  <AnimatePresence>
    {open && (
      <Motion.div
        {...overlay}
        transition={transition}
        className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
        onClick={onClose}
      >
        <Motion.div
          {...card}
          transition={transition}
          onClick={(e) => e.stopPropagation()}
          className="w-full max-w-sm rounded-3xl border border-line bg-page p-7 text-center shadow-[0_24px_60px_-12px_rgba(0,0,0,0.5)]"
        >
          <span className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-red-500/15 text-4xl text-red-400">
            <i className="bx bx-trash" />
          </span>
          <h3 className="font-poppins mt-4 text-lg font-semibold text-fg">Hapus akun ini?</h3>
          <p className="font-poppins mt-1.5 text-sm text-muted">
            <span className="font-semibold text-fg">{name}</span> akan dihapus permanen. Tindakan ini
            tidak bisa dibatalkan.
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

// ---------------- Modal Verifikasi Password Admin ----------------
export const VerifyPasswordModal = ({ open, title, onClose, onVerify, busy, error }) => {
  const [password, setPassword] = useState('');

  useEffect(() => {
    if (open) setPassword('');
  }, [open]);

  return (
    <AnimatePresence>
      {open && (
        <Motion.div
          {...overlay}
          transition={transition}
          className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
          onClick={onClose}
        >
          <Motion.div
            {...card}
            transition={transition}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-sm rounded-3xl border border-line bg-page p-7 shadow-[0_24px_60px_-12px_rgba(0,0,0,0.5)]"
          >
            <div className="text-center">
              <span className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-[#f49827]/15 text-4xl text-[#f49827]">
                <i className="bx bx-lock-alt" />
              </span>
              <h3 className="font-poppins mt-4 text-lg font-semibold text-fg">Verifikasi Identitas</h3>
              <p className="font-poppins mt-1.5 text-sm text-muted">
                {title || 'Masukkan password akun admin Anda yang sedang login untuk membuka data.'}
              </p>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                onVerify(password);
              }}
              className="mt-5 space-y-3"
            >
              <Field
                label="Password admin"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoFocus
              />
              {error && (
                <p className="font-poppins rounded-xl border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs text-red-400">
                  {error}
                </p>
              )}
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="font-poppins flex-1 cursor-pointer rounded-xl border border-line py-2.5 text-sm font-semibold text-fg transition-colors hover:border-[#f49827] hover:text-[#f49827]"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={busy || !password}
                  className="font-poppins flex-1 cursor-pointer rounded-xl bg-[#f49827] py-2.5 text-sm font-semibold text-black transition-colors hover:bg-[#d97f0f] disabled:opacity-50"
                >
                  {busy ? 'Memeriksa...' : 'Buka'}
                </button>
              </div>
            </form>
          </Motion.div>
        </Motion.div>
      )}
    </AnimatePresence>
  );
};

// ---------------- Modal Hasil Reveal (biodata + password) ----------------
const Row = ({ label, value, secret }) => (
  <div className="flex items-start justify-between gap-4 border-b border-line/60 py-2.5 last:border-0">
    <span className="font-poppins shrink-0 text-[11px] text-muted">{label}</span>
    <span className="font-poppins break-all text-right text-xs font-medium text-fg">
      {value ? (
        secret ? (
          <span className="rounded-md bg-[#f49827]/15 px-1.5 py-0.5 font-mono text-[#f49827]">
            {value}
          </span>
        ) : (
          value
        )
      ) : (
        <span className="text-muted">— (tidak tersedia)</span>
      )}
    </span>
  </div>
);

export const RevealResultModal = ({ open, title, data, onClose }) => (
  <AnimatePresence>
    {open && data && (
      <Motion.div
        {...overlay}
        transition={transition}
        className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
        onClick={onClose}
      >
        <Motion.div
          {...card}
          transition={transition}
          onClick={(e) => e.stopPropagation()}
          className="w-full max-w-md overflow-hidden rounded-3xl border border-line bg-page shadow-[0_24px_60px_-12px_rgba(0,0,0,0.5)]"
        >
          <div className="flex items-center justify-between border-b border-line px-5 py-4">
            <div className="flex items-center gap-2">
              <span className="grid h-8 w-8 place-items-center rounded-lg bg-emerald-500/15 text-emerald-400">
                <i className="bx bx-lock-open-alt" />
              </span>
              <div>
                <h3 className="font-poppins text-sm font-semibold text-fg">{title}</h3>
                <p className="font-poppins text-[10px] text-muted">Data berhasil dibuka</p>
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
          <div className="max-h-[70vh] overflow-y-auto px-5 py-3">
            {Object.entries(data).map(([k, v]) => (
              <Row key={k} label={LABELS[k] || k} value={v} secret={k === 'password'} />
            ))}
          </div>
        </Motion.div>
      </Motion.div>
    )}
  </AnimatePresence>
);

const LABELS = {
  nama: 'Nama',
  email: 'Email',
  jabatan: 'Jabatan',
  telepon: 'Nomor telepon',
  alamat: 'Alamat',
  kota: 'Kota',
  provinsi: 'Provinsi',
  kodePos: 'Kode pos',
  password: 'Password akun',
};
