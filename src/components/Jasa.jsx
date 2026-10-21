import React, { useCallback, useEffect, useState } from "react";
import Pesan from "./Pesan";
import { useSettings } from "../context/SettingsContext";
import { publicApi } from "../services/api";
import { subscribeJasa } from "../services/realtime";

const STATIC_SERVICES = [
  {
    title: { id: "Landing Page", en: "Landing Page" },
    price: "500000",
    desc: {
      id: "Website satu halaman yang modern untuk promosi bisnis, produk, atau personal branding",
      en: "A modern single-page website for business, product promotion, or personal branding",
    },
    features: [
      { id: "Desain modern, profesional, dan responsif", en: "Modern, professional, and responsive design" },
      { id: "Tampilan optimal di HP, tablet, dan desktop", en: "Optimized for mobile, tablet, and desktop" },
      { id: "Struktur halaman yang menarik", en: "Engaging page structure" },
      { id: "Bagian hero, layanan, keunggulan, dan kontak", en: "Hero, services, benefits, and contact sections" },
      { id: "Tombol WhatsApp untuk menghubungi bisnis", en: "WhatsApp contact button" },
      { id: "Animasi dan interaksi sederhana", en: "Simple animations and interactions" },
      { id: "Optimasi dasar SEO dan performa", en: "Basic SEO and performance optimization" },
      { id: "Revisi ringan GRATIS", en: "Free minor revisions" },
      { id: "Deploy website ke hosting yang tersedia", en: "Website deployment to available hosting" },
    ],
  },
  {
    title: { id: "Website Tugas Kampus", en: "College Project Website" },
    price: "1000000",
    desc: {
      id: "Website untuk proyek pembelajaran, tugas kuliah, dan demonstrasi sistem",
      en: "Websites for learning projects, college assignments, and system demonstrations",
    },
    features: [
      { id: "Desain sesuai tema dan kebutuhan proyek", en: "Design based on project requirements" },
      { id: "HTML, CSS, JavaScript, atau framework sesuai kebutuhan", en: "HTML, CSS, JavaScript, or a suitable framework" },
      { id: "Fitur CRUD sederhana jika diperlukan", en: "Basic CRUD functionality if needed" },
      { id: "Integrasi database untuk paket yang disepakati", en: "Database integration within the agreed scope" },
      { id: "Formulir dan validasi input", en: "Forms and input validation" },
      { id: "Tampilan responsif untuk berbagai perangkat", en: "Responsive layout across devices" },
      { id: "Source code dan petunjuk instalasi", en: "Source code and setup instructions" },
      { id: "Bantuan penjelasan alur kode dasar", en: "Basic code walkthrough and explanation" },
      { id: "Revisi ringan GRATIS", en: "Free minor revisions" },
    ],
  },
  {
    title: { id: "Website Kompleks", en: "Complex Web Application" },
    price: "2000000",
    desc: {
      id: "Website dinamis dengan backend, database, autentikasi, dan dashboard sesuai kebutuhan bisnis",
      en: "A dynamic website with backend, database, authentication, and dashboards tailored to business needs",
    },
    features: [
      { id: "UI/UX modern dan responsif", en: "Modern and responsive UI/UX" },
      { id: "Frontend dan backend terintegrasi", en: "Integrated frontend and backend" },
      { id: "Database relasional atau NoSQL", en: "Relational or NoSQL database" },
      { id: "Login, registrasi, dan hak akses pengguna", en: "Login, registration, and user roles" },
      { id: "Dashboard admin dan manajemen data", en: "Admin dashboard and data management" },
      { id: "REST API sesuai kebutuhan", en: "REST API tailored to requirements" },
      { id: "Fitur pencarian, filter, dan CRUD", en: "Search, filtering, and CRUD features" },
      { id: "Keamanan dasar dan validasi data", en: "Basic security and data validation" },
      { id: "Deployment dan konfigurasi lingkungan", en: "Deployment and environment configuration" },
      { id: "Dokumentasi serta support awal", en: "Documentation and initial support" },
    ],
  },
  {
    title: { id: "Aplikasi Mobile", en: "Mobile Application" },
    price: "3000000",
    desc: {
      id: "Aplikasi mobile modern untuk Android dengan fitur sesuai kebutuhan pengguna",
      en: "A modern Android mobile application with features tailored to user needs",
    },
    features: [
      { id: "Desain UI/UX modern dan responsif", en: "Modern mobile UI/UX design" },
      { id: "Pengembangan menggunakan Flutter atau teknologi yang disepakati", en: "Development using Flutter or an agreed technology" },
      { id: "Navigasi dan beberapa layar aplikasi", en: "App navigation and multiple screens" },
      { id: "Integrasi REST API dan backend jika diperlukan", en: "REST API and backend integration if needed" },
      { id: "Integrasi database sesuai kebutuhan", en: "Database integration as required" },
      { id: "Login dan autentikasi pengguna sesuai scope", en: "User login and authentication within scope" },
      { id: "Formulir, validasi, dan pengelolaan data", en: "Forms, validation, and data management" },
      { id: "Pengujian fungsi dasar aplikasi", en: "Basic application functionality testing" },
      { id: "Source code dan panduan instalasi", en: "Source code and installation guide" },
      { id: "Support awal setelah penyerahan", en: "Initial support after delivery" },
    ],
  },
];

const Jasa = () => {
  const [selectedService, setSelectedService] = useState(null);
  const [page, setPage] = useState(0);
  const { lang, t } = useSettings();
  const [services, setServices] = useState(STATIC_SERVICES);

  const loadJasa = useCallback(async () => {
    try {
      const res = await publicApi.listJasa({ all: "true" });
      const list = res?.items ?? [];
      if (list.length > 0) {
        setServices(
          list.map((j) => ({
            title: j.title,
            price: j.price,
            desc: j.description,
            features: j.features,
          })),
        );
      }
    } catch {
      // Biarkan data fallback statis bila API belum tersedia.
    }
  }, []);

  useEffect(() => {
    loadJasa();
  }, [loadJasa]);

  // Realtime: refetch saat admin menambah/mengubah/menghapus jasa.
  useEffect(() => {
    return subscribeJasa(() => loadJasa());
  }, [loadJasa]);


  const PER_PAGE = 4;
  const totalPages = Math.max(1, Math.ceil(services.length / PER_PAGE));
  const showArrows = services.length > PER_PAGE;
  const current = Math.min(page, totalPages - 1);
  const visible = services.slice(current * PER_PAGE, current * PER_PAGE + PER_PAGE);

  const prev = () => setPage((p) => (p - 1 + totalPages) % totalPages);
  const next = () => setPage((p) => (p + 1) % totalPages);

  return (
    <div className="-mt-15 min-h-[100dvh] font-[Antonio] flex flex-col items-center py-12">
      <div className="relative w-[90%] max-w-7xl">
        {showArrows && (
          <button
            type="button"
            onClick={prev}
            aria-label="Sebelumnya"
            className="absolute left-0 top-1/2 z-10 -translate-y-1/2 -translate-x-1/2 grid h-11 w-11 place-items-center rounded-full border border-[#f49827] bg-[#FFF] text-[#f49827] shadow-lg transition-all duration-300 hover:scale-110 hover:bg-[#f49827] hover:text-black"
          >
            <i className="bx bx-chevron-left text-2xl" />
          </button>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {visible.map((service, index) => (
            <div
              key={index}
              data-aos="fade-up"
              data-aos-anchor-placement="top-bottom"
              className="border border-[#FFF] text-black bg-[#FFF] rounded-2xl p-6 shadow-md hover:shadow-xl transition-all duration-300"
            >
              <h2 className="text-2xl font-anton mb-2 text-center font-bold text-[#f49827]">
                <span className="text-black">{t("jasa.design")}</span> {service.title[lang]}
              </h2>
              <p className="text-center text-lg font-semibold mb-3">
                Rp. {service.price}
              </p>
              <p className="text-sm text-center mb-4">{service.desc[lang]}</p>
              <ul className="text-sm mb-4 space-y-1">
                {service.features.map((f, i) => (
                  <li key={i} className="flex gap-2">
                    <span className="shrink-0 text-[#f49827]">•</span>
                    <span>{f[lang]}</span>
                  </li>
                ))}
              </ul>
              <button
                className="w-full border border-black bg-black text-white rounded-xl py-2 hover:bg-[#f49827] hover:text-black transition-all"
                onClick={() => setSelectedService(service)} // buka modal + kirim data
              >
                {t("jasa.order")}
              </button>
            </div>
          ))}
        </div>

        {showArrows && (
          <button
            type="button"
            onClick={next}
            aria-label="Berikutnya"
            className="absolute right-0 top-1/2 z-10 -translate-y-1/2 translate-x-1/2 grid h-11 w-11 place-items-center rounded-full border border-[#f49827] bg-[#FFF] text-[#f49827] shadow-lg transition-all duration-300 hover:scale-110 hover:bg-[#f49827] hover:text-black"
          >
            <i className="bx bx-chevron-right text-2xl" />
          </button>
        )}
      </div>

      {showArrows && (
        <div className="mt-6 flex items-center gap-2">
          {Array.from({ length: totalPages }).map((_, i) => (
            <button
              key={i}
              type="button"
              aria-label={`Halaman ${i + 1}`}
              onClick={() => setPage(i)}
              className={`h-2 rounded-full transition-all duration-300 ${
                i === current ? "w-6 bg-[#f49827]" : "w-2 bg-black/20 hover:bg-black/40"
              }`}
            />
          ))}
        </div>
      )}

      {/* Jika ada service yang dipilih, tampilkan form Pesan */}
      {selectedService && (
        <Pesan
          selectedService={selectedService}
          onClose={() => setSelectedService(null)}
        />
      )}
    </div>
  );
};

export default Jasa;
