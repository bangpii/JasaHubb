import "boxicons/css/boxicons.min.css";
import { useSettings } from "../context/SettingsContext";

const layanan = [
  { labelKey: "footer.flyer", href: "#jasa" },
  { labelKey: "footer.poster", href: "#jasa" },
  { labelKey: "footer.spanduk", href: "#jasa" },
  { labelKey: "footer.website", href: "#jasa" },
];

const navigasi = [
  { labelKey: "nav.home", href: "#home" },
  { labelKey: "nav.about", href: "#about" },
  { labelKey: "nav.jasa", href: "#jasa" },
  { labelKey: "nav.contact", href: "#contact" },
];

const bantuan = [
  { labelKey: "footer.konsultasi", href: "#contact" },
  { labelKey: "footer.caraPesan", href: "#jasa" },
  { labelKey: "footer.estimasi", href: "#jasa" },
  { labelKey: "footer.hasilRevisi", href: "#jasa" },
];

const socials = [
  { icon: "bxl-tiktok", href: "#", label: "TikTok" },
  { icon: "bxl-instagram", href: "#", label: "Instagram" },
  { icon: "bxl-whatsapp", href: "#", label: "WhatsApp" },
  { icon: "bx-envelope", href: "#", label: "Email" },
  {
    icon: "bxl-linkedin",
    href: "https://www.linkedin.com/in/baihaqie-arrafi-26311b2a8/?isSelfProfile=true",
    label: "LinkedIn",
  },
  {
    icon: "bx-link-external",
    href: "https://baihaqiearrafi.netlify.app/",
    label: "Portfolio",
  },
];

const KolomLink = ({ judul, items }) => {
  const { t } = useSettings();

  return (
    <div>
      <h3 className="font-anton text-sm font-bold uppercase tracking-[0.18em] text-[#f49827]">
        {t(judul)}
      </h3>
      <ul className="mt-5 space-y-3 text-sm">
        {items.map((it) => (
          <li key={it.labelKey}>
            <a
              href={it.href}
              className="group inline-flex items-center gap-2 text-gray-400 transition-colors duration-300 hover:text-white"
            >
              <span className="h-px w-0 bg-[#f49827] transition-all duration-300 group-hover:w-4" />
              {t(it.labelKey)}
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
};

const Footer = () => {
  const { t } = useSettings();

  return (
    <footer className="relative overflow-hidden bg-[#0a0a0a] font-poppins text-white">
      <div className="h-px w-full bg-gradient-to-r from-transparent via-[#f49827]/70 to-transparent" />
      <div className="pointer-events-none absolute -top-32 left-1/2 h-56 w-[32rem] -translate-x-1/2 rounded-full bg-[#f49827]/10 blur-3xl" />

      <div className="relative container mx-auto px-6 pt-14 pb-8 md:px-10">
        <div className="grid grid-cols-1 gap-12 sm:grid-cols-2 lg:grid-cols-[1.5fr_1fr_1fr_1fr] lg:gap-10">
          {/* Brand */}
          <div className="lg:pr-8">
            <h2 className="text-2xl font-anton tracking-wide sm:text-3xl">
              JASA<span className="text-[#f49827]">HUB</span>
            </h2>
            <p className="mt-4 max-w-xs text-sm leading-relaxed text-gray-400">
              {t("footer.tagline")}
            </p>

            <div className="mt-6 flex gap-3">
              {socials.map((s) => (
                <a
                  key={s.label}
                  href={s.href}
                  aria-label={s.label}
                  target={s.href.startsWith("http") ? "_blank" : undefined}
                  rel={s.href.startsWith("http") ? "noopener noreferrer" : undefined}
                  className="flex h-10 w-10 items-center justify-center rounded-full border border-white/15 text-xl text-gray-300 transition-all duration-300 hover:-translate-y-0.5 hover:border-[#f49827] hover:bg-[#f49827] hover:text-black"
                >
                  <i className={`bx ${s.icon}`}></i>
                </a>
              ))}
            </div>

            <a
              href="#contact"
              className="mt-6 inline-flex items-center gap-2 rounded-full bg-[#f49827] px-6 py-2.5 font-antonio font-semibold tracking-wide text-black transition-colors duration-300 hover:bg-white"
            >
              <i className="bx bx-chat text-lg"></i>
              {t("footer.cta")}
            </a>
          </div>

          <KolomLink judul="footer.layanan" items={layanan} />
          <KolomLink judul="footer.navigasi" items={navigasi} />
          <KolomLink judul="footer.bantuan" items={bantuan} />
        </div>

        <div className="mt-14 border-t border-white/10" />

        <div className="mt-6 flex flex-col items-center justify-between gap-4 text-sm text-gray-400 sm:flex-row">
          <p className="text-center sm:text-left">
            {t("footer.createdBy")} <span className="font-semibold text-white">Baihaqie Ar Rafi</span>{" "}
            &copy;2026
          </p>

          <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2">
            <a href="#" className="transition-colors duration-300 hover:text-[#f49827]">
              {t("footer.privacy")}
            </a>
            <a href="#" className="transition-colors duration-300 hover:text-[#f49827]">
              {t("footer.terms")}
            </a>
            <a
              href="#home"
              className="inline-flex items-center gap-1 transition-colors duration-300 hover:text-[#f49827]"
            >
              <i className="bx bx-up-arrow-alt text-base"></i>
              {t("footer.backTop")}
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
