import React, { useCallback, useEffect, useState } from 'react';
import 'boxicons/css/boxicons.min.css';
import { motion as Motion, AnimatePresence } from 'framer-motion';
import { adminApi } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { Pagination } from './AccountTable';

const emptyFeature = (id = '', en = '') => ({ id, en });

// ---------------- Form Modal ----------------
const emptyForm = {
  titleId: '',
  titleEn: '',
  slug: '',
  price: '',
  descriptionId: '',
  descriptionEn: '',
  features: [emptyFeature()],
  isActive: true,
};

const Input = ({ label, hint, ...props }) => (
  <label className="block">
    <span className="font-poppins mb-1 block text-[11px] font-semibold text-muted">{label}</span>
    <input
      {...props}
      className="font-poppins h-10 w-full rounded-xl border border-line bg-transparent px-3 text-sm text-fg outline-none transition-colors placeholder:text-muted/60 focus:border-[#f49827]"
    />
    {hint && <span className="font-poppins mt-1 block text-[9px] text-muted/70">{hint}</span>}
  </label>
);

const Textarea = ({ label, ...props }) => (
  <label className="block">
    <span className="font-poppins mb-1 block text-[11px] font-semibold text-muted">{label}</span>
    <textarea
      {...props}
      rows={3}
      className="font-poppins w-full resize-none rounded-xl border border-line bg-transparent px-3 py-2 text-sm text-fg outline-none transition-colors placeholder:text-muted/60 focus:border-[#f49827]"
    />
  </label>
);

const FeatureEditor = ({ features, onChange }) => {
  const set = (i, key) => (e) =>
    onChange(features.map((f, idx) => (idx === i ? { ...f, [key]: e.target.value } : f)));
  const add = () => onChange([...features, emptyFeature()]);
  const remove = (i) => onChange(features.filter((_, idx) => idx !== i));

  return (
    <div>
      <div className="mb-1 flex items-center justify-between">
        <span className="font-poppins text-[11px] font-semibold text-muted">Fitur / Poin jasa</span>
        <button
          type="button"
          onClick={add}
          className="font-poppins flex cursor-pointer items-center gap-1 rounded-lg border border-line px-2 py-1 text-[10px] font-semibold text-fg transition-colors hover:border-[#f49827] hover:text-[#f49827]"
        >
          <i className="bx bx-plus text-sm" />
          Fitur
        </button>
      </div>
      <div className="space-y-2">
        {features.map((f, i) => (
          <div key={i} className="flex items-start gap-2">
            <div className="flex-1 space-y-1.5">
              <input
                value={f.id}
                onChange={set(i, 'id')}
                placeholder={`Fitur ${i + 1} (ID)`}
                className="font-poppins h-9 w-full rounded-lg border border-line bg-transparent px-2.5 text-xs text-fg outline-none transition-colors placeholder:text-muted/60 focus:border-[#f49827]"
              />
              <input
                value={f.en}
                onChange={set(i, 'en')}
                placeholder={`Feature ${i + 1} (EN)`}
                className="font-poppins h-9 w-full rounded-lg border border-line bg-transparent px-2.5 text-xs text-fg outline-none transition-colors placeholder:text-muted/60 focus:border-[#f49827]"
              />
            </div>
            <button
              type="button"
              onClick={() => remove(i)}
              disabled={features.length === 1}
              aria-label="Hapus fitur"
              className="mt-0.5 grid h-9 w-9 shrink-0 cursor-pointer place-items-center rounded-lg border border-line text-muted transition-colors hover:border-red-500/50 hover:text-red-400 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <i className="bx bx-trash text-base" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

const JasaFormModal = ({ open, title, initial, onClose, onSubmit, busy, error }) => {
  const [v, setV] = useState(emptyForm);
  const [mountReady, setMountReady] = useState(false);

  useEffect(() => {
    if (open) {
      setV({ ...emptyForm, ...(initial || {}) });
      setMountReady(false);
      const t = setTimeout(() => setMountReady(true), 80);
      return () => clearTimeout(t);
    }
  }, [open, initial]);

  const set = (k) => (e) =>
    setV((s) => ({ ...s, [k]: e.target.type === 'checkbox' ? e.target.checked : e.target.value }));

  return (
    <AnimatePresence>
      {open && (
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
            className="w-full max-w-2xl overflow-hidden rounded-3xl border border-line bg-page shadow-[0_24px_60px_-12px_rgba(0,0,0,0.5)]"
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
                onSubmit(v);
              }}
              className="max-h-[74vh] space-y-3 overflow-y-auto px-5 py-4"
            >
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <Input
                  label="Judul jasa (ID) *"
                  placeholder="Contoh: Landing Page"
                  value={v.titleId}
                  onChange={set('titleId')}
                  readOnly={!mountReady}
                  required
                />
                <Input
                  label="Judul jasa (EN)"
                  placeholder="Example: Landing Page"
                  value={v.titleEn}
                  onChange={set('titleEn')}
                  readOnly={!mountReady}
                />
              </div>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <Input
                  label="Harga (Rp) *"
                  hint="Angka saja. Contoh: 500000"
                  placeholder="500000"
                  value={v.price}
                  onChange={set('price')}
                  readOnly={!mountReady}
                  required
                />
                <Input
                  label="Slug (opsional)"
                  hint="Dibuat otomatis dari judul jika dikosongkan"
                  placeholder="landing-page"
                  value={v.slug}
                  onChange={set('slug')}
                  readOnly={!mountReady}
                />
              </div>
              <Textarea
                label="Deskripsi (ID)"
                placeholder="Deskripsi singkat paket jasa dalam bahasa Indonesia..."
                value={v.descriptionId}
                onChange={set('descriptionId')}
                readOnly={!mountReady}
              />
              <Textarea
                label="Deskripsi (EN)"
                placeholder="Short service description in English..."
                value={v.descriptionEn}
                onChange={set('descriptionEn')}
                readOnly={!mountReady}
              />

              <FeatureEditor
                features={v.features}
                onChange={(features) => setV((s) => ({ ...s, features }))}
              />

              <label className="flex cursor-pointer items-center gap-2.5 rounded-xl border border-line px-3 py-2.5">
                <input
                  type="checkbox"
                  checked={v.isActive}
                  onChange={set('isActive')}
                  className="h-4 w-4 accent-[#f49827]"
                />
                <span className="font-poppins text-xs text-fg">
                  Tampilkan sebagai jasa aktif
                </span>
              </label>

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
          <h3 className="font-poppins mt-4 text-lg font-semibold text-fg">Hapus jasa ini?</h3>
          <p className="font-poppins mt-1.5 text-sm text-muted">
            <span className="font-semibold text-fg">{name}</span> akan dihapus permanen.
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

// ---------------- Card ----------------
const formatRupiah = (value) => {
  const digits = String(value ?? '').replace(/[^\d]/g, '');
  if (!digits) return 'Rp 0';
  return `Rp ${Number(digits).toLocaleString('id-ID')}`;
};

const JasaCard = ({ j, index, onEdit, onDelete }) => {
  const title = j.title?.id || j.title?.en || '(Tanpa judul)';
  const activeFeatures = j.features?.filter((f) => f.id || f.en) ?? [];

  return (
    <Motion.article
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: Math.min(index * 0.05, 0.4), ease: [0.16, 1, 0.3, 1] }}
      className="group relative flex h-full flex-col overflow-hidden rounded-2xl border border-line bg-black/[0.02] transition-all duration-300 hover:-translate-y-1 hover:border-[#f49827]/40 hover:shadow-[0_20px_50px_-24px_rgba(244,152,39,0.5)] dark:bg-white/[0.02]"
    >
      <div className="flex items-start justify-between gap-2 border-b border-line bg-gradient-to-br from-[#f49827]/10 to-transparent px-4 py-3.5">
        <div className="min-w-0">
          <p className="font-poppins text-[10px] uppercase tracking-[0.22em] text-[#f49827]">
            Paket Jasa
          </p>
          <h3 className="font-poppins truncate text-base font-semibold text-fg">{title}</h3>
        </div>
        {!j.isActive && (
          <span className="font-poppins shrink-0 rounded-full border border-amber-500/40 bg-amber-500/15 px-2 py-0.5 text-[9px] font-semibold text-amber-400">
            Nonaktif
          </span>
        )}
      </div>

      <div className="flex flex-1 flex-col gap-3 p-4">
        <p className="font-poppins text-xl font-bold text-[#f49827]">{formatRupiah(j.price)}</p>
        <p className="font-poppins line-clamp-2 text-[11px] leading-relaxed text-muted">
          {j.description?.id || j.description?.en || 'Belum ada deskripsi.'}
        </p>

        {activeFeatures.length > 0 && (
          <ul className="space-y-1 text-[11px] text-muted">
            {activeFeatures.slice(0, 4).map((f, i) => (
              <li key={i} className="flex gap-2">
                <i className="bx bx-check mt-0.5 shrink-0 text-sm text-[#f49827]" />
                <span className="line-clamp-1">{f.id || f.en}</span>
              </li>
            ))}
            {activeFeatures.length > 4 && (
              <li className="font-poppins pl-6 text-[10px] text-muted/70">
                +{activeFeatures.length - 4} fitur lainnya
              </li>
            )}
          </ul>
        )}

        <div className="mt-auto flex items-center justify-end gap-1.5 border-t border-line pt-3">
          <button
            type="button"
            onClick={() => onEdit(j)}
            aria-label="Edit"
            title="Edit"
            className="grid h-8 w-8 cursor-pointer place-items-center rounded-lg border border-line text-muted transition-colors hover:border-[#f49827] hover:text-[#f49827]"
          >
            <i className="bx bx-pencil text-base" />
          </button>
          <button
            type="button"
            onClick={() => onDelete(j)}
            aria-label="Hapus"
            title="Hapus"
            className="grid h-8 w-8 cursor-pointer place-items-center rounded-lg border border-line text-muted transition-colors hover:border-red-500/50 hover:text-red-400"
          >
            <i className="bx bx-trash text-base" />
          </button>
        </div>
      </div>
    </Motion.article>
  );
};

const toForm = (j) => {
  const features = (j.features ?? []).map((f) => ({ id: f.id || '', en: f.en || '' }));
  return {
    titleId: j.title?.id || '',
    titleEn: j.title?.en || '',
    slug: j.slug || '',
    price: j.price || '',
    descriptionId: j.description?.id || '',
    descriptionEn: j.description?.en || '',
    features: features.length ? features : [emptyFeature()],
    isActive: j.isActive,
  };
};

const JasaAktifPanel = ({ search = '', refreshKey = 0 }) => {
  const { user } = useAuth();
  const ready = user?.role === 'admin';

  const [rows, setRows] = useState([]);
  const [meta, setMeta] = useState({ page: 1, totalPages: 1, total: 0 });
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [listError, setListError] = useState('');

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [formError, setFormError] = useState('');
  const [busy, setBusy] = useState(false);
  const [deleting, setDeleting] = useState(null);

  const load = useCallback(async () => {
    if (!ready) return;
    setLoading(true);
    setListError('');
    try {
      const data = await adminApi.listJasa({ page, pageSize: 9, search });
      setRows(data.items);
      setMeta({ page: data.page, totalPages: data.totalPages, total: data.total });
    } catch (err) {
      setListError(err.message || 'Gagal memuat data jasa');
    } finally {
      setLoading(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps -- refreshKey memicu refetch realtime
  }, [page, search, ready, refreshKey]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    setPage(1);
  }, [search]);

  const openCreate = () => {
    setEditing(null);
    setFormError('');
    setFormOpen(true);
  };
  const openEdit = (j) => {
    setEditing(j);
    setFormError('');
    setFormOpen(true);
  };

  const submit = async (v) => {
    setBusy(true);
    setFormError('');
    try {
      const payload = {
        title: { id: v.titleId, en: v.titleEn },
        slug: v.slug || undefined,
        price: v.price,
        description: { id: v.descriptionId, en: v.descriptionEn },
        features: v.features.filter((f) => f.id.trim() || f.en.trim()),
        isActive: v.isActive,
      };
      if (editing) await adminApi.updateJasa(editing.id, payload);
      else await adminApi.createJasa(payload);
      setFormOpen(false);
      await load();
    } catch (err) {
      setFormError(err.message || 'Gagal menyimpan data');
    } finally {
      setBusy(false);
    }
  };

  const confirmDelete = async () => {
    setBusy(true);
    try {
      await adminApi.deleteJasa(deleting.id);
      setDeleting(null);
      await load();
    } catch (err) {
      setListError(err.message || 'Gagal menghapus data');
      setDeleting(null);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex h-full flex-col">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <p className="font-poppins text-[10px] uppercase tracking-[0.28em] text-[#f49827]">
            Katalog
          </p>
          <h2 className="font-poppins text-lg font-semibold text-fg">Jasa Aktif</h2>
          <p className="font-poppins mt-1 text-xs text-muted">
            {meta.total} paket jasa terdaftar di katalog JasaHub.
          </p>
        </div>
        <button
          type="button"
          onClick={openCreate}
          className="font-poppins flex shrink-0 cursor-pointer items-center gap-1.5 rounded-xl bg-[#f49827] px-3.5 py-2 text-xs font-semibold text-black transition-colors hover:bg-[#d97f0f]"
        >
          <i className="bx bx-plus text-base" />
          Tambah Jasa
        </button>
      </div>

      {listError && (
        <p className="font-poppins mb-3 rounded-xl border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs text-red-400">
          {listError}
        </p>
      )}

      <div className="min-h-0 flex-1">
        {loading ? (
          <div className="grid h-full place-items-center py-16 text-xs text-muted">
            <span>
              <i className="bx bx-loader-alt bx-spin mr-2 text-base" />
              Memuat jasa...
            </span>
          </div>
        ) : rows.length === 0 ? (
          <div className="grid h-full place-items-center py-16 text-xs text-muted">
            Belum ada jasa terdaftar
          </div>
        ) : (
          <div className="admin-scroll max-h-[72vh] overflow-y-auto pr-1.5 pb-2">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {rows.map((j, i) => (
                <JasaCard
                  key={j.id}
                  j={j}
                  index={i}
                  onEdit={openEdit}
                  onDelete={(row) => setDeleting(row)}
                />
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="mt-3">
        <Pagination page={meta.page} totalPages={meta.totalPages} total={meta.total} onPage={setPage} />
      </div>

      <JasaFormModal
        open={formOpen}
        title={editing ? 'Edit Jasa' : 'Tambah Jasa'}
        initial={editing ? toForm(editing) : null}
        onClose={() => setFormOpen(false)}
        onSubmit={submit}
        busy={busy}
        error={formError}
      />

      <ConfirmDelete
        open={!!deleting}
        name={deleting?.title?.id || deleting?.title?.en}
        onClose={() => setDeleting(null)}
        onConfirm={confirmDelete}
        busy={busy}
      />
    </div>
  );
};

export default JasaAktifPanel;
