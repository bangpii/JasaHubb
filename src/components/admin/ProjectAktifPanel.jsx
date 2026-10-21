import React, { useCallback, useEffect, useState } from 'react';
import 'boxicons/css/boxicons.min.css';
import { motion as Motion, AnimatePresence } from 'framer-motion';
import { adminApi } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { Pagination } from './AccountTable';

const LANG_TONE = [
  'border-[#f49827]/30 bg-[#f49827]/10 text-[#f49827]',
  'border-sky-500/30 bg-sky-500/10 text-sky-400',
  'border-emerald-500/30 bg-emerald-500/10 text-emerald-400',
  'border-violet-500/30 bg-violet-500/10 text-violet-400',
  'border-rose-500/30 bg-rose-500/10 text-rose-400',
  'border-amber-500/30 bg-amber-500/10 text-amber-400',
];
const toneFor = (name) =>
  LANG_TONE[[...name].reduce((a, c) => a + c.charCodeAt(0), 0) % LANG_TONE.length];

// ---------------- Form Modal ----------------
const emptyForm = {
  name: '',
  slug: '',
  imageSrc: '',
  github: '',
  url: '',
  languages: '',
  roleId: '',
  roleEn: '',
  descriptionId: '',
  descriptionEn: '',
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

const ProjectFormModal = ({ open, title, initial, onClose, onSubmit, busy, error }) => {
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
            className="w-full max-w-lg overflow-hidden rounded-3xl border border-line bg-page shadow-[0_24px_60px_-12px_rgba(0,0,0,0.5)]"
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
              className="max-h-[72vh] space-y-3 overflow-y-auto px-5 py-4"
            >
              <Input
                label="Nama project *"
                placeholder="Contoh: Racik Kopi"
                value={v.name}
                onChange={set('name')}
                readOnly={!mountReady}
                required
              />
              <Input
                label="Gambar URL"
                placeholder="https://res.cloudinary.com/.../banner.png"
                value={v.imageSrc}
                onChange={set('imageSrc')}
                readOnly={!mountReady}
              />
              <Input
                label="Teknologi"
                hint="Pisahkan dengan koma. Contoh: React, Vite, Tailwind CSS"
                placeholder="React, Vite, Tailwind CSS"
                value={v.languages}
                onChange={set('languages')}
                readOnly={!mountReady}
              />
              <div className="grid grid-cols-2 gap-3">
                <Input
                  label="GitHub URL"
                  placeholder="https://github.com/..."
                  value={v.github}
                  onChange={set('github')}
                  readOnly={!mountReady}
                />
                <Input
                  label="Live URL"
                  placeholder="https://..."
                  value={v.url}
                  onChange={set('url')}
                  readOnly={!mountReady}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Input
                  label="Peran (ID)"
                  placeholder="Full-Stack Developer"
                  value={v.roleId}
                  onChange={set('roleId')}
                  readOnly={!mountReady}
                />
                <Input
                  label="Peran (EN)"
                  placeholder="Full-Stack Developer"
                  value={v.roleEn}
                  onChange={set('roleEn')}
                  readOnly={!mountReady}
                />
              </div>
              <Textarea
                label="Deskripsi (ID)"
                placeholder="Deskripsi singkat dalam bahasa Indonesia..."
                value={v.descriptionId}
                onChange={set('descriptionId')}
                readOnly={!mountReady}
              />
              <Textarea
                label="Deskripsi (EN)"
                placeholder="Short description in English..."
                value={v.descriptionEn}
                onChange={set('descriptionEn')}
                readOnly={!mountReady}
              />

              <label className="flex cursor-pointer items-center gap-2.5 rounded-xl border border-line px-3 py-2.5">
                <input
                  type="checkbox"
                  checked={v.isActive}
                  onChange={set('isActive')}
                  className="h-4 w-4 accent-[#f49827]"
                />
                <span className="font-poppins text-xs text-fg">
                  Tampilkan sebagai project aktif
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
          <h3 className="font-poppins mt-4 text-lg font-semibold text-fg">Hapus project ini?</h3>
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
const ProjectCard = ({ p, index, onEdit, onDelete }) => (
  <Motion.article
    initial={{ opacity: 0, y: 24 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.35, delay: Math.min(index * 0.05, 0.4), ease: [0.16, 1, 0.3, 1] }}
    className="group relative flex h-full flex-col overflow-hidden rounded-2xl border border-line bg-black/[0.02] transition-all duration-300 hover:-translate-y-1 hover:border-[#f49827]/40 hover:shadow-[0_20px_50px_-24px_rgba(244,152,39,0.5)] dark:bg-white/[0.02]"
  >
    <div className="relative aspect-[16/9] w-full overflow-hidden bg-black/10 dark:bg-white/5">
      {p.imageSrc ? (
        <img
          src={p.imageSrc}
          alt={p.name}
          loading="lazy"
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
      ) : (
        <div className="grid h-full w-full place-items-center text-3xl text-muted/40">
          <i className="bx bx-image" />
        </div>
      )}
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
      {!p.isActive && (
        <span className="font-poppins absolute right-2.5 top-2.5 rounded-full border border-amber-500/40 bg-black/60 px-2 py-0.5 text-[9px] font-semibold text-amber-300 backdrop-blur">
          Nonaktif
        </span>
      )}
      {p.role?.id && (
        <span className="font-poppins absolute left-2.5 top-2.5 rounded-full border border-[#f49827]/40 bg-black/60 px-2 py-0.5 text-[9px] font-semibold text-[#f49827] backdrop-blur">
          {p.role.id}
        </span>
      )}
      <h3 className="font-poppins absolute bottom-2.5 left-3 right-3 truncate text-sm font-semibold text-white drop-shadow">
        {p.name}
      </h3>
    </div>

    <div className="flex flex-1 flex-col gap-3 p-3.5">
      <p className="font-poppins line-clamp-2 text-[11px] leading-relaxed text-muted">
        {p.description?.id || p.description?.en || 'Belum ada deskripsi.'}
      </p>

      {p.languages.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {p.languages.slice(0, 4).map((l) => (
            <span
              key={l}
              className={`font-poppins rounded-md border px-1.5 py-0.5 text-[9px] font-medium ${toneFor(l)}`}
            >
              {l}
            </span>
          ))}
          {p.languages.length > 4 && (
            <span className="font-poppins rounded-md border border-line px-1.5 py-0.5 text-[9px] text-muted">
              +{p.languages.length - 4}
            </span>
          )}
        </div>
      )}

      <div className="mt-auto flex items-center gap-1.5 border-t border-line pt-3">
        {p.github && (
          <a
            href={p.github}
            target="_blank"
            rel="noreferrer"
            title="GitHub"
            className="grid h-8 w-8 place-items-center rounded-lg border border-line text-muted transition-colors hover:border-[#f49827] hover:text-[#f49827]"
          >
            <i className="bx bxl-github text-base" />
          </a>
        )}
        {p.url && (
          <a
            href={p.url}
            target="_blank"
            rel="noreferrer"
            title="Live"
            className="grid h-8 w-8 place-items-center rounded-lg border border-line text-muted transition-colors hover:border-[#f49827] hover:text-[#f49827]"
          >
            <i className="bx bx-link-external text-base" />
          </a>
        )}
        <div className="ml-auto flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => onEdit(p)}
            aria-label="Edit"
            title="Edit"
            className="grid h-8 w-8 cursor-pointer place-items-center rounded-lg border border-line text-muted transition-colors hover:border-[#f49827] hover:text-[#f49827]"
          >
            <i className="bx bx-pencil text-base" />
          </button>
          <button
            type="button"
            onClick={() => onDelete(p)}
            aria-label="Hapus"
            title="Hapus"
            className="grid h-8 w-8 cursor-pointer place-items-center rounded-lg border border-line text-muted transition-colors hover:border-red-500/50 hover:text-red-400"
          >
            <i className="bx bx-trash text-base" />
          </button>
        </div>
      </div>
    </div>
  </Motion.article>
);

const toForm = (p) => ({
  name: p.name,
  slug: p.slug,
  imageSrc: p.imageSrc || '',
  github: p.github || '',
  url: p.url || '',
  languages: (p.languages || []).join(', '),
  roleId: p.role?.id || '',
  roleEn: p.role?.en || '',
  descriptionId: p.description?.id || '',
  descriptionEn: p.description?.en || '',
  isActive: p.isActive,
});

const ProjectAktifPanel = ({ search = '', refreshKey = 0 }) => {
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
      const data = await adminApi.listProjects({ page, pageSize: 9, search });
      setRows(data.items);
      setMeta({ page: data.page, totalPages: data.totalPages, total: data.total });
    } catch (err) {
      setListError(err.message || 'Gagal memuat data project');
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
  const openEdit = (p) => {
    setEditing(p);
    setFormError('');
    setFormOpen(true);
  };

  const submit = async (v) => {
    setBusy(true);
    setFormError('');
    try {
      const payload = {
        name: v.name,
        slug: v.slug || undefined,
        imageSrc: v.imageSrc,
        github: v.github,
        url: v.url,
        languages: v.languages,
        role: { id: v.roleId, en: v.roleEn },
        description: { id: v.descriptionId, en: v.descriptionEn },
        isActive: v.isActive,
      };
      if (editing) await adminApi.updateProject(editing.id, payload);
      else await adminApi.createProject(payload);
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
      await adminApi.deleteProject(deleting.id);
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
          <h2 className="font-poppins text-lg font-semibold text-fg">Project Aktif</h2>
          <p className="font-poppins mt-1 text-xs text-muted">
            {meta.total} project terdaftar di katalog portofolio JasaHub.
          </p>
        </div>
        <button
          type="button"
          onClick={openCreate}
          className="font-poppins flex shrink-0 cursor-pointer items-center gap-1.5 rounded-xl bg-[#f49827] px-3.5 py-2 text-xs font-semibold text-black transition-colors hover:bg-[#d97f0f]"
        >
          <i className="bx bx-plus text-base" />
          Tambah Project
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
              Memuat project...
            </span>
          </div>
        ) : rows.length === 0 ? (
          <div className="grid h-full place-items-center py-16 text-xs text-muted">
            Belum ada project terdaftar
          </div>
        ) : (
          <div className="admin-scroll max-h-[72vh] overflow-y-auto pr-1.5 pb-2">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {rows.map((p, i) => (
                <ProjectCard
                  key={p.id}
                  p={p}
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

      <ProjectFormModal
        open={formOpen}
        title={editing ? 'Edit Project' : 'Tambah Project'}
        initial={editing ? toForm(editing) : null}
        onClose={() => setFormOpen(false)}
        onSubmit={submit}
        busy={busy}
        error={formError}
      />

      <ConfirmDelete
        open={!!deleting}
        name={deleting?.name}
        onClose={() => setDeleting(null)}
        onConfirm={confirmDelete}
        busy={busy}
      />
    </div>
  );
};

export default ProjectAktifPanel;
