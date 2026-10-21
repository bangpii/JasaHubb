import React, { useCallback, useEffect, useState } from 'react';
import 'boxicons/css/boxicons.min.css';
import { adminApi } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import AccountTable, { InitialAvatar, Pagination, StatusBadge } from './AccountTable';
import {
  AccountFormModal,
  ConfirmDeleteModal,
  VerifyPasswordModal,
  RevealResultModal,
} from './AccountModals';

const emptyForm = {
  nama: '',
  email: '',
  password: '',
  telepon: '',
  alamat: '',
  kota: '',
  provinsi: '',
  kodePos: '',
};

const Masked = ({ onReveal }) => (
  <button
    type="button"
    onClick={onReveal}
    title="Klik untuk membuka (perlu password admin)"
    className="font-poppins inline-flex cursor-pointer items-center gap-1.5 text-muted transition-colors hover:text-[#f49827]"
  >
    <span className="tracking-widest">••••••</span>
    <i className="bx bx-lock-alt text-sm" />
  </button>
);

const PelangganAccountsPanel = ({ search = '', refreshKey = 0 }) => {
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

  const [revealRow, setRevealRow] = useState(null);
  const [revealData, setRevealData] = useState(null);
  const [revealError, setRevealError] = useState('');
  const [revealBusy, setRevealBusy] = useState(false);

  const load = useCallback(async () => {
    if (!ready) return;
    setLoading(true);
    setListError('');
    try {
      const data = await adminApi.listPelanggan({ page, pageSize: 8, search });
      setRows(data.items);
      setMeta({ page: data.page, totalPages: data.totalPages, total: data.total });
    } catch (err) {
      setListError(err.message || 'Gagal memuat data pelanggan');
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
  const openEdit = (row) => {
    setEditing(row);
    setFormError('');
    setFormOpen(true);
  };

  const submit = async (values) => {
    setBusy(true);
    setFormError('');
    try {
      const payload = { ...values };
      if (editing && !payload.password) delete payload.password;
      if (editing) await adminApi.updatePelanggan(editing.id, payload);
      else await adminApi.createPelanggan(payload);
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
      await adminApi.deletePelanggan(deleting.id);
      setDeleting(null);
      await load();
    } catch (err) {
      setListError(err.message || 'Gagal menghapus data');
      setDeleting(null);
    } finally {
      setBusy(false);
    }
  };

  const verifyReveal = async (password) => {
    setRevealBusy(true);
    setRevealError('');
    try {
      const res = await adminApi.revealPelanggan(revealRow.id, password);
      setRevealRow(null);
      setRevealData({ data: res.data, nama: revealRow.nama });
    } catch (err) {
      setRevealError(err.message || 'Password salah');
    } finally {
      setRevealBusy(false);
    }
  };

  const columns = [
    { key: 'no', label: 'No', className: 'w-12', render: (r) => <span className="text-muted">{r.no}</span> },
    {
      key: 'nama',
      label: 'Nama',
      render: (r) => (
        <div className="flex items-center gap-2">
          <InitialAvatar name={r.nama} />
          <div className="min-w-0">
            <p className="font-semibold text-fg">{r.nama}</p>
            <p className="truncate text-[10px] text-muted">{r.email}</p>
          </div>
        </div>
      ),
    },
    {
      key: 'telepon',
      label: 'Nomor Telepon',
      render: (r) => <Masked onReveal={() => setRevealRow(r)} />,
    },
    {
      key: 'alamat',
      label: 'Alamat',
      render: (r) => <Masked onReveal={() => setRevealRow(r)} />,
    },
    {
      key: 'password',
      label: 'Password',
      render: (r) => <Masked onReveal={() => setRevealRow(r)} />,
    },
    { key: 'status', label: 'Status', render: (r) => <StatusBadge active={r.isActive} /> },
  ];

  const fields = [
    { name: 'nama', label: 'Nama lengkap', required: true, placeholder: 'Nama pelanggan' },
    {
      name: 'email',
      fieldName: 'pelanggan-email',
      label: 'Email',
      type: 'email',
      required: true,
      placeholder: 'Masukkan email dengan akhiran @jasahub.vercel.app',
      autoComplete: 'off',
    },
    {
      name: 'password',
      fieldName: 'pelanggan-new-password',
      label: editing ? 'Password (kosongkan bila tidak diganti)' : 'Password',
      type: 'password',
      required: !editing,
      placeholder: editing ? 'Biarkan kosong' : 'Buat password baru',
      autoComplete: 'new-password',
    },
    { name: 'telepon', label: 'Nomor telepon', placeholder: '08xx (AES)' },
    { name: 'alamat', label: 'Alamat', placeholder: 'Jl. ...' },
    { name: 'kota', label: 'Kota', placeholder: 'Bandung' },
    { name: 'provinsi', label: 'Provinsi', placeholder: 'Jawa Barat' },
    { name: 'kodePos', label: 'Kode pos', placeholder: '40xxx' },
  ];

  return (
    <div className="flex h-full flex-col">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <p className="font-poppins text-[10px] uppercase tracking-[0.28em] text-[#f49827]">Akun</p>
          <h2 className="font-poppins text-lg font-semibold text-fg">Akun Pelanggan</h2>
          <p className="font-poppins mt-1 text-xs text-muted">
            Data sensitif (telepon, alamat, password) terenkripsi AES-256. Klik ikon kunci untuk
            membuka dengan password admin Anda.
          </p>
        </div>
        <button
          type="button"
          onClick={openCreate}
          className="font-poppins flex shrink-0 cursor-pointer items-center gap-1.5 rounded-xl bg-[#f49827] px-3.5 py-2 text-xs font-semibold text-black transition-colors hover:bg-[#d97f0f]"
        >
          <i className="bx bx-plus text-base" />
          Tambah Pelanggan
        </button>
      </div>

      {listError && (
        <p className="font-poppins mb-3 rounded-xl border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs text-red-400">
          {listError}
        </p>
      )}

      <div className="flex-1">
        <AccountTable
          columns={columns}
          rows={rows}
          loading={loading}
          onEdit={openEdit}
          onDelete={(row) => setDeleting(row)}
          emptyText="Belum ada akun pelanggan"
        />
        <Pagination page={meta.page} totalPages={meta.totalPages} total={meta.total} onPage={setPage} />
      </div>

      <AccountFormModal
        open={formOpen}
        title={editing ? 'Edit Pelanggan' : 'Tambah Pelanggan'}
        fields={fields}
        initial={editing || emptyForm}
        onClose={() => setFormOpen(false)}
        onSubmit={submit}
        busy={busy}
        error={formError}
      />

      <ConfirmDeleteModal
        open={!!deleting}
        name={deleting?.nama}
        onClose={() => setDeleting(null)}
        onConfirm={confirmDelete}
        busy={busy}
      />

      <VerifyPasswordModal
        open={!!revealRow}
        title={
          revealRow
            ? `Buka data sensitif milik "${revealRow.nama}". Masukkan password akun admin Anda.`
            : ''
        }
        onClose={() => {
          setRevealRow(null);
          setRevealError('');
        }}
        onVerify={verifyReveal}
        busy={revealBusy}
        error={revealError}
      />

      <RevealResultModal
        open={!!revealData}
        title={revealData ? `Data Akun — ${revealData.nama}` : ''}
        data={revealData?.data}
        onClose={() => setRevealData(null)}
      />
    </div>
  );
};

export default PelangganAccountsPanel;
