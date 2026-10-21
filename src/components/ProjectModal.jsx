import React, { useEffect } from "react";
import { useSettings } from "../context/SettingsContext";

/**
 * Modal detail project yang dibuka dari cincin proyek di halaman About.
 * Menampilkan bagian detail: gambar besar, judul, deskripsi (bilingual),
 * tools/teknologi, peran, serta tautan website / kode sumber.
 */
const ProjectModal = ({ project, onClose }) => {
  const { t, lang } = useSettings();
  const open = Boolean(project);

  // Tutup dengan tombol Esc + kunci scroll body selama modal terbuka.
  useEffect(() => {
    if (!open) return;

    const onKey = (e) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);

    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [open, onClose]);

  if (!open) return null;

  const description =
    project.description?.[lang] || project.description?.id || "";
  const role = project.role?.[lang] || project.role?.id || "";
  const languages = Array.isArray(project.languages) ? project.languages : [];

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6"
      role="dialog"
      aria-modal="true"
      aria-label={project.name}
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Kartu modal */}
      <div className="relative z-10 flex max-h-[90dvh] w-full max-w-3xl flex-col overflow-hidden rounded-3xl border border-orange-400/30 bg-[#12100d] text-white shadow-[0_20px_60px_rgba(0,0,0,0.6)]">
        {/* Gambar detail */}
        <div className="relative w-full shrink-0 bg-black/40">
          <img
            src={project.src}
            alt={project.name}
            className="mx-auto max-h-[46vh] w-full object-contain"
          />
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#12100d] via-transparent to-transparent" />
          <button
            type="button"
            onClick={onClose}
            aria-label={t("projectModal.close")}
            className="absolute right-3 top-3 grid h-9 w-9 place-items-center rounded-full bg-black/60 text-xl text-white transition-colors hover:bg-[#f49827] hover:text-black"
          >
            <i className="bx bx-x" />
          </button>
        </div>

        {/* Konten */}
        <div className="overflow-y-auto px-6 py-5 sm:px-8 sm:py-6">
          <h3 className="font-anton text-2xl sm:text-3xl">
            {project.name}
          </h3>

          {role && (
            <p className="mt-1 font-antonio text-sm tracking-wide text-[#f49827]">
              {role}
            </p>
          )}

          {description && (
            <p className="mt-4 font-antonio text-sm leading-relaxed text-white/80 sm:text-base">
              {description}
            </p>
          )}

          {languages.length > 0 && (
            <div className="mt-5">
              <p className="font-poppins text-[10px] uppercase tracking-[0.28em] text-[#f49827]">
                {t("projectModal.tools")}
              </p>
              <div className="mt-2 flex flex-wrap gap-2">
                {languages.map((tool) => (
                  <span
                    key={tool}
                    className="rounded-full border border-orange-400/30 bg-[#f49827]/10 px-3 py-1 font-antonio text-xs tracking-wide text-[#ffc370]"
                  >
                    {tool}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Tautan */}
          {(project.url || project.github) && (
            <div className="mt-6 flex flex-wrap gap-3">
              {project.url && (
                <a
                  href={project.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 rounded-xl bg-[#f49827] px-4 py-2 font-antonio text-sm font-semibold text-black transition-transform hover:scale-[1.03]"
                >
                  <i className="bx bx-link-external text-base" />
                  {t("projectModal.preview")}
                </a>
              )}
              {project.github && (
                <a
                  href={project.github}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 rounded-xl border border-white/20 px-4 py-2 font-antonio text-sm font-semibold text-white transition-colors hover:border-[#f49827] hover:text-[#f49827]"
                >
                  <i className="bx bxl-github text-base" />
                  {t("projectModal.source")}
                </a>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProjectModal;
