import React, { useState } from "react";
import "boxicons/css/boxicons.min.css";
import { useAuth } from "../context/AuthContext";
import { useSettings } from "../context/SettingsContext";

const Login = ({ onClose }) => {
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    email: "",
    password: ""
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  
  const { login } = useAuth();
  const { t } = useSettings();

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    if (error) setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    if (!formData.email || !formData.password) {
      setError(t("login.err"));
      setLoading(false);
      return;
    }

    try {
      const result = await login(formData.email, formData.password, { role: "pelanggan" });
      
      if (result.success) {
        onClose?.();
      } else {
        setError(result.message);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      data-aos="fade-down"
      data-aos-easing="linear"
      data-aos-duration="1500"
      className="fixed inset-0 bg-black/40 backdrop-blur-sm flex justify-center items-center z-[9999] p-4 overflow-auto"
      onClick={onClose}
    >
      {/* Card Login */}
      <div
        className="bg-black text-white rounded-2xl shadow-2xl w-full max-w-sm md:max-w-3xl flex flex-col md:flex-row overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Kiri - Form Login */}
        <div className="w-full md:w-1/2 p-6 md:p-12 flex flex-col justify-center">
          <h2 className="font-anton text-3xl md:text-4xl mb-3 text-white">
            {t("login.t1")}<span className="text-[#f49827]">{t("login.t2")}</span>
          </h2>
          <p className="font-antonio text-white mb-6 md:mb-8 text-sm md:text-base">
            {t("login.desc")}
          </p>

          {error && (
            <div className="bg-red-500/20 border border-red-500 text-red-300 px-4 py-3 rounded-lg mb-4">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="flex flex-col gap-4 md:gap-6">
            <div className="flex flex-col">
              <label className="mb-1 font-antonio text-sm md:text-base">{t("login.user")}</label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                placeholder={t("login.userPh")}
                autoComplete="email"
                autoCapitalize="none"
                autoCorrect="off"
                spellCheck={false}
                className="p-3 rounded-lg text-black focus:outline-none focus:ring-2 focus:ring-[#f49827]"
                disabled={loading}
              />
            </div>

            <div className="relative flex flex-col">
              <label className="mb-1 font-antonio text-sm md:text-base">{t("login.pass")}</label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  placeholder={t("login.passPh")}
                  className="p-3 rounded-lg text-black pr-10 w-full focus:outline-none focus:ring-2 focus:ring-[#f49827]"
                  disabled={loading}
                />
                <span
                  className="absolute inset-y-0 right-3 flex items-center cursor-pointer text-xl text-black"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  <i className={`bx ${showPassword ? "bx-show" : "bx-hide"}`}></i>
                </span>
              </div>
            </div>

            <button 
              type="submit"
              disabled={loading}
              className="bg-[#f49827] text-black py-3 rounded-lg font-antonio hover:bg-[#8b581c] transition font-extrabold disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? t("login.loading") : t("login.btn")}
            </button>
          </form>
        </div>

        {/* Kanan - Video, hidden di mobile */}
        <div className="hidden md:block w-full md:w-1/2 h-48 md:h-auto">
          <video
            src="/login.mp4"
            loop
            muted
            autoPlay
            className="w-full h-full object-cover rounded-b-2xl md:rounded-none"
          ></video>
        </div>
      </div>
    </div>
  );
};

export default Login;