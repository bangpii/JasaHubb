import React, { useEffect, useState } from "react";
import AOS from "aos";
import "aos/dist/aos.css";
import { useSettings } from "../context/SettingsContext";
import { contactApi } from "../services/api";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const Contact = () => {
    const { t } = useSettings();
    const [form, setForm] = useState({
        nama: "",
        telepon: "",
        email: "",
        pesan: "",
    });
    const [loading, setLoading] = useState(false);
    const [status, setStatus] = useState(null); // { type: "success" | "error", message: string }

    useEffect(() => {
        const initAOS = () => {
            if (window.innerWidth > 768) {
                AOS.init({
                    duration: 1200,
                    easing: "ease-out-cubic",
                    once: false,
                    offset: 100,
                });
            } else {
                AOS.refreshHard();
            }
        };

        initAOS();
        window.addEventListener("resize", initAOS);

        return () => {
            window.removeEventListener("resize", initAOS);
        };
    }, []);

    const handleChange = (field) => (e) => {
        setForm((prev) => ({ ...prev, [field]: e.target.value }));
        if (status) setStatus(null);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (loading) return;

        const nama = form.nama.trim();
        const telepon = form.telepon.trim();
        const email = form.email.trim();
        const pesan = form.pesan.trim();

        if (!nama || !telepon || !email || !pesan) {
            setStatus({ type: "error", message: t("contact.required") });
            return;
        }
        if (!EMAIL_RE.test(email)) {
            setStatus({ type: "error", message: t("contact.invalidEmail") });
            return;
        }

        setLoading(true);
        setStatus(null);
        try {
            await contactApi.sendMessage({ nama, telepon, email, pesan });
            setStatus({ type: "success", message: t("contact.success") });
            setForm({ nama: "", telepon: "", email: "", pesan: "" });
        } catch (err) {
            setStatus({
                type: "error",
                message: err?.message || t("contact.error"),
            });
        } finally {
            setLoading(false);
        }
    };

  return (
    <div
    className="min-h-[100dvh] bg-page text-fg font-[Antonio] flex flex-col items-center py-2"
        data-aos={window.innerWidth > 768 ? "fade-up" : ""}
        data-aos-delay="300"
    >

      {/* Grid utama */}
      <div
        className="grid grid-cols-1 md:grid-cols-2 gap-10 w-[90%] max-w-6xl bg-white text-black rounded-2xl shadow-lg overflow-hidden"
        data-aos="fade-up"
      >
        {/* Peta */}
        <div className="w-full h-[400px] md:h-auto">
          <iframe
            src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3982.1063036736423!2d98.65297457497299!3d3.5629934964112073!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x303131d6e3d2b367%3A0xc5edba7e577329d2!2sPoliteknik%20Negeri%20Medan!5e0!3m2!1sid!2sid!4v1759989565857!5m2!1sid!2sid"
            allowFullScreen=""
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            className="w-full h-full border-black"
          ></iframe>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex flex-col justify-center p-8 space-y-5">
          <h2 className="text-3xl font-anton text-black mb-2 text-center">
            {t("contact.kirim")} <span className="text-[#f49827]">{t("contact.pesan")} </span>
          </h2>

          <input
            type="text"
            value={form.nama}
            onChange={handleChange("nama")}
            placeholder={t("contact.name")}
            className="p-3  border border-black rounded-xl focus:outline-[#f49827] transition-all shadow-[0_5px_20px_rgba(0,0,0,0.2)]"
          />
          <input
            type="number"
            value={form.telepon}
            onChange={handleChange("telepon")}
            placeholder={t("contact.phone")}
            className="p-3 border border-black rounded-xl focus:outline-[#f49827] transition-all shadow-[0_5px_20px_rgba(0,0,0,0.2)]"
          />
          <input
            type="email"
            value={form.email}
            onChange={handleChange("email")}
            placeholder={t("contact.email")}
            className="p-3 border border-black rounded-xl focus:outline-[#f49827] transition-all shadow-[0_5px_20px_rgba(0,0,0,0.2)]"
          />
          <textarea
            value={form.pesan}
            onChange={handleChange("pesan")}
            placeholder={t("contact.msgPh")}
            rows="4"
            className="p-3 border border-black rounded-xl focus:outline-[#f49827] transition-all shadow-[0_5px_20px_rgba(0,0,0,0.2)]"
          ></textarea>

          {status && (
            <div
              className={`flex items-center gap-2 rounded-xl px-4 py-2 text-sm ${
                status.type === "success"
                  ? "bg-green-50 text-green-700"
                  : "bg-red-50 text-red-600"
              }`}
            >
              <i
                className={`bx ${
                  status.type === "success"
                    ? "bx-check-circle"
                    : "bx-error-circle"
                } text-base`}
              ></i>
              {status.message}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="mt-3 w-full border border-black bg-black text-white rounded-xl py-2 hover:bg-[#f49827] hover:text-black transition-all shadow-[0_5px_20px_rgba(0,0,0,0.2)] disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {loading ? t("contact.sending") : t("contact.send")}
          </button>
        </form>
      </div>
    </div>
  );
};

export default Contact;
