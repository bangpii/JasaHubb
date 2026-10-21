import React from 'react';
import 'boxicons/css/boxicons.min.css';

const Cell = ({ children, className = '' }) => (
  <td className={`font-poppins px-3 py-2.5 align-middle text-xs ${className}`}>{children}</td>
);

const InitialAvatar = ({ name, tone = 'text-[#f49827]' }) => (
  <span
    className={`grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-[#f49827]/15 text-[11px] font-bold ${tone}`}
  >
    {(name || '?').charAt(0).toUpperCase()}
  </span>
);

const StatusBadge = ({ active }) => (
  <span
    className={`font-poppins inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-[10px] font-medium ${
      active
        ? 'border-emerald-500/30 bg-emerald-500/15 text-emerald-400'
        : 'border-line bg-black/5 text-muted dark:bg-white/5'
    }`}
  >
    <span className={`h-1.5 w-1.5 rounded-full ${active ? 'bg-emerald-400' : 'bg-muted'}`} />
    {active ? 'Aktif' : 'Nonaktif'}
  </span>
);

/*
 * AccountTable
 * columns: [{ key, label, className?, render?(row) }]
 * rows, actions: { onEdit, onDelete, isProtected(row) }
 * revealed: Set of "rowId:field" yang boleh ditampilkan (hasil verifikasi)
 * masked: Set of field key yang perlu di-mask (password & biodata)
 */
const AccountTable = ({
  columns,
  rows,
  loading,
  emptyText = 'Belum ada data',
  onEdit,
  onDelete,
  isProtected = () => false,
  protectedTip,
}) => {
  return (
    <div className="overflow-x-auto rounded-2xl border border-line">
      <table className="w-full min-w-[640px] border-collapse">
        <thead>
          <tr className="border-b border-line bg-black/5 dark:bg-white/5">
            {columns.map((c) => (
              <th
                key={c.key}
                className={`font-poppins px-3 py-2.5 text-left text-[10px] font-semibold uppercase tracking-wider text-muted ${
                  c.className || ''
                }`}
              >
                {c.label}
              </th>
            ))}
            <th className="font-poppins px-3 py-2.5 text-right text-[10px] font-semibold uppercase tracking-wider text-muted">
              Aksi
            </th>
          </tr>
        </thead>
        <tbody>
          {loading ? (
            <tr>
              <td colSpan={columns.length + 1} className="font-poppins px-3 py-10 text-center text-xs text-muted">
                <i className="bx bx-loader-alt bx-spin mr-2 text-base" />
                Memuat data...
              </td>
            </tr>
          ) : rows.length === 0 ? (
            <tr>
              <td colSpan={columns.length + 1} className="font-poppins px-3 py-10 text-center text-xs text-muted">
                {emptyText}
              </td>
            </tr>
          ) : (
            rows.map((row) => {
              const locked = isProtected(row);
              return (
                <tr
                  key={row.id}
                  className="border-b border-line/60 transition-colors last:border-0 hover:bg-black/[0.03] dark:hover:bg-white/[0.03]"
                >
                  {columns.map((c) => (
                    <Cell key={c.key} className={c.className || ''}>
                      {c.render ? c.render(row) : row[c.key]}
                    </Cell>
                  ))}
                  <Cell className="text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        type="button"
                        onClick={() => !locked && onEdit(row)}
                        disabled={locked}
                        aria-label="Edit"
                        title={locked ? protectedTip : 'Edit'}
                        className={`grid h-8 w-8 place-items-center rounded-lg border border-line transition-colors ${
                          locked
                            ? 'cursor-not-allowed opacity-35'
                            : 'cursor-pointer hover:border-[#f49827] hover:text-[#f49827]'
                        } text-muted`}
                      >
                        <i className="bx bx-pencil text-base" />
                      </button>
                      <button
                        type="button"
                        onClick={() => !locked && onDelete(row)}
                        disabled={locked}
                        aria-label="Hapus"
                        title={locked ? protectedTip : 'Hapus'}
                        className={`grid h-8 w-8 place-items-center rounded-lg border border-line transition-colors ${
                          locked
                            ? 'cursor-not-allowed opacity-35'
                            : 'cursor-pointer hover:border-red-500/50 hover:text-red-400'
                        } text-muted`}
                      >
                        <i className="bx bx-trash text-base" />
                      </button>
                    </div>
                  </Cell>
                </tr>
              );
            })
          )}
        </tbody>
      </table>
    </div>
  );
};

export const Pagination = ({ page, totalPages, total, onPage }) => {
  if (totalPages <= 1) return null;
  const pages = Array.from({ length: totalPages }, (_, i) => i + 1);

  return (
    <div className="mt-3 flex items-center justify-between gap-3">
      <p className="font-poppins text-[11px] text-muted">
        Halaman <span className="font-semibold text-fg">{page}</span> dari {totalPages} · {total}{' '}
        data
      </p>
      <div className="flex items-center gap-1.5">
        <button
          type="button"
          onClick={() => onPage(page - 1)}
          disabled={page <= 1}
          aria-label="Sebelumnya"
          className="grid h-8 w-8 place-items-center rounded-lg border border-line text-muted transition-colors enabled:cursor-pointer enabled:hover:border-[#f49827] enabled:hover:text-[#f49827] disabled:opacity-35"
        >
          <i className="bx bx-chevron-left text-lg" />
        </button>
        {pages.map((p) => (
          <button
            key={p}
            type="button"
            onClick={() => onPage(p)}
            className={`font-poppins h-8 min-w-8 cursor-pointer rounded-lg border px-2 text-xs font-semibold transition-colors ${
              p === page
                ? 'border-[#f49827] bg-[#f49827] text-black'
                : 'border-line text-muted hover:border-[#f49827] hover:text-[#f49827]'
            }`}
          >
            {p}
          </button>
        ))}
        <button
          type="button"
          onClick={() => onPage(page + 1)}
          disabled={page >= totalPages}
          aria-label="Berikutnya"
          className="grid h-8 w-8 place-items-center rounded-lg border border-line text-muted transition-colors enabled:cursor-pointer enabled:hover:border-[#f49827] enabled:hover:text-[#f49827] disabled:opacity-35"
        >
          <i className="bx bx-chevron-right text-lg" />
        </button>
      </div>
    </div>
  );
};

export { InitialAvatar, StatusBadge, Cell };
export default AccountTable;
