import React, { useEffect, useRef, useState } from 'react';
import 'boxicons/css/boxicons.min.css';
import Login from './Login';
import ConfirmLogout from './ConfirmLogout';
import ProsesModal from './ProsesModal';
import AOS from 'aos';
import 'aos/dist/aos.css';
import { AnimatePresence, motion as Motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { useSettings } from '../context/SettingsContext';

const ThemeLangControls = ({ divider = false, onOpenProses }) => {
    const { theme, toggleTheme, lang, setLang, t } = useSettings();
    const { user } = useAuth();
    const isPelanggan = user?.role === 'pelanggan';

    return (
        <div className={`flex items-center ${divider ? 'mt-5 pt-5 border-t border-line' : ''}`}>
            {isPelanggan && (
                <button
                    onClick={onOpenProses}
                    aria-label={t('proses.title')}
                    className="mr-3 flex h-10 cursor-pointer items-center gap-2 rounded-full border border-line px-4 text-fg
                     transition-all duration-300 hover:border-[#f49827] hover:text-[#f49827]"
                >
                    <i className="bx bx-loader-circle animate-spin text-base [animation-duration:4s]" />
                    <span className="font-poppins text-[11px] font-semibold tracking-[0.18em]">
                        {t('nav.proses')}
                    </span>
                </button>
            )}
            <button
                onClick={toggleTheme}
                aria-label={t('theme.toggle')}
                className="grid h-10 w-10 place-items-center rounded-full border border-line text-lg text-fg
                 transition-all duration-300 hover:border-[#f49827] hover:text-[#f49827] hover:rotate-180 cursor-pointer"
            >
                <i className={`bx ${theme === 'dark' ? 'bx-sun' : 'bx-moon'} transition-transform duration-500`} />
            </button>

            <div className="ml-3 flex items-center rounded-full border border-line p-1 font-poppins text-[11px] font-semibold tracking-[0.2em]">
                <button
                    onClick={() => setLang('id')}
                    className={`px-2.5 py-1 rounded-full transition-all duration-300 cursor-pointer ${
                        lang === 'id' ? 'bg-[#f49827] text-black' : 'text-muted hover:text-[#f49827]'
                    }`}
                >
                    ID
                </button>
                <button
                    onClick={() => setLang('en')}
                    className={`px-2.5 py-1 rounded-full transition-all duration-300 cursor-pointer ${
                        lang === 'en' ? 'bg-[#f49827] text-black' : 'text-muted hover:text-[#f49827]'
                    }`}
                >
                    EN
                </button>
            </div>
        </div>
    );
};

const ProfileAvatar = ({ user, className = '' }) => {
    const [failed, setFailed] = useState(false);
    const initials = (user?.nama || user?.email || '?')
        .trim()
        .charAt(0)
        .toUpperCase();

    if (user?.foto && !failed) {
        return (
            <img
                src={user.foto}
                alt={user?.nama || 'Profile'}
                onError={() => setFailed(true)}
                className={`object-cover ${className}`}
            />
        );
    }

    return (
        <span
            className={`grid place-items-center bg-gradient-to-br from-[#f49827] to-[#b76a12] font-antonio font-bold text-black ${className}`}
            aria-hidden="true"
        >
            {initials}
        </span>
    );
};

const InfoRow = ({ icon, label, value }) =>
    value ? (
        <div className="flex items-center gap-3 px-5 py-2.5">
            <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-[#f49827]/10 text-sm text-[#f49827]">
                <i className={`bx ${icon}`} />
            </span>
            <div className="min-w-0">
                <p className="font-poppins text-[10px] uppercase tracking-[0.16em] text-muted">{label}</p>
                <p className="font-poppins truncate text-[13px] font-medium text-fg">{value}</p>
            </div>
        </div>
    ) : null;

const ProfileDropdown = ({ user, onClose, onRequestLogout, className = '' }) => {
    const { t } = useSettings();
    const ref = useRef(null);

    useEffect(() => {
        const handlePointerDown = (e) => {
            if (e.target.closest?.('[data-profile-toggle]')) return;
            if (ref.current && !ref.current.contains(e.target)) onClose();
        };
        const handleKey = (e) => {
            if (e.key === 'Escape') onClose();
        };
        document.addEventListener('mousedown', handlePointerDown);
        document.addEventListener('keydown', handleKey);
        return () => {
            document.removeEventListener('mousedown', handlePointerDown);
            document.removeEventListener('keydown', handleKey);
        };
    }, [onClose]);

    const handleLogout = () => {
        onClose();
        onRequestLogout?.();
    };

    return (
        <Motion.div
            ref={ref}
            initial={{ opacity: 0, y: -10, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.96 }}
            transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className={`z-50 overflow-hidden rounded-2xl border border-line bg-page/95 shadow-[0_24px_60px_-12px_rgba(0,0,0,0.35)] backdrop-blur-xl origin-top-right ${className}`}
        >
            {/* Kepala: avatar + nama + email */}
            <div className="flex items-center gap-3 border-b border-line bg-[#f49827]/10 px-5 py-4">
                <ProfileAvatar
                    user={user}
                    className="h-12 w-12 shrink-0 rounded-full ring-2 ring-[#f49827]/40"
                />
                <div className="min-w-0">
                    <p className="font-poppins truncate text-sm font-semibold text-fg">
                        {user?.nama || t('profile.title')}
                    </p>
                    <p className="font-poppins truncate text-xs text-muted">{user?.email}</p>
                </div>
            </div>

            {/* Data pelanggan */}
            <div className="py-2">
                <InfoRow icon="bx-phone" label={t('profile.telepon')} value={user?.telepon} />
                <InfoRow icon="bx-map" label={t('profile.kota')} value={user?.kota} />
                <InfoRow icon="bx-home" label={t('profile.alamat')} value={user?.alamat} />
            </div>

            {/* Logout di paling bawah */}
            <div className="border-t border-line p-3">
                <button
                    onClick={handleLogout}
                    className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl border border-red-500/30 bg-red-500/10 py-2.5 font-poppins text-sm font-semibold text-red-400 transition-all duration-300 hover:bg-red-500 hover:text-white"
                >
                    <i className="bx bx-log-out" />
                    {t('nav.logout')}
                </button>
            </div>
        </Motion.div>
    );
};

const Header = () => {
    const [openLogin, setOpenLogin] = useState(false);
    const [openProses, setOpenProses] = useState(false);
    const [profileOpen, setProfileOpen] = useState(false);
    const [confirmLogout, setConfirmLogout] = useState(false);
    const { isAuthenticated, user, logout } = useAuth();
    const { t } = useSettings();

    const toggleMobileMenu = () => {
        const mobileMenu = document.getElementById('mobileMenu');
        if(mobileMenu.classList.contains('hidden')){
            mobileMenu.classList.remove('hidden');
        } else {
            mobileMenu.classList.add('hidden');
        }
    }

    return (
        <header className="relative flex justify-between items-center py-4 px-4 lg:px-20" >

            <h1 data-aos="fade-down"
                data-aos-easing="linear"
                data-aos-duration="1500"
                className='text-3xl md:text-4xl lg:text-5xl font-light m-0'>
                JASA<span className='text-[#f49827]'>HUB</span>
            </h1>

            <nav className="hidden md:flex items-center gap-12">
                <a data-aos="fade-down" data-aos-easing="linear" data-aos-duration="1000"
                   className="font-poppins text-base tracking-wider transition-colors hover:text-[#f49827] z-50"
                   href="#home">{t('nav.home')}</a>

                <a data-aos="fade-down" data-aos-easing="linear" data-aos-duration="1100"
                   className="font-poppins text-base tracking-wider transition-colors hover:text-[#f49827] z-50"
                   href="#about">{t('nav.about')}</a>

                <a data-aos="fade-down" data-aos-easing="linear" data-aos-duration="1200"
                   className="font-poppins text-base tracking-wider transition-colors hover:text-[#f49827] z-50"
                   href="#jasa">{t('nav.jasa')}</a>

                <a data-aos="fade-down" data-aos-easing="linear" data-aos-duration="1300"
                   className="font-poppins text-base tracking-wider transition-colors hover:text-[#f49827] z-50"
                   href="#contact">{t('nav.contact')}</a>
            </nav>

            {/* Group: theme + lang + signin/profile */}
            <div className="hidden md:flex items-center gap-4 z-50">
                <ThemeLangControls onOpenProses={() => setOpenProses(true)} />

                {isAuthenticated ? (
                    /* Sudah login: tombol avatar → dropdown data pelanggan + logout */
                    <button
                        data-profile-toggle
                        onClick={() => setProfileOpen((v) => !v)}
                        aria-label={t('profile.title')}
                        aria-expanded={profileOpen}
                        className={`group flex cursor-pointer items-center gap-2.5 rounded-full border py-1.5 pl-1.5 pr-4
                         transition-all duration-300 ${
                            profileOpen
                                ? 'border-[#f49827] bg-[#f49827]/10'
                                : 'border-line hover:border-[#f49827] hover:bg-[#f49827]/10'
                         }`}
                    >
                        <ProfileAvatar
                            user={user}
                            className="h-9 w-9 rounded-full ring-2 ring-[#f49827]/35 transition-shadow group-hover:ring-[#f49827]"
                        />
                        <span className="font-poppins max-w-[120px] truncate text-sm font-semibold text-fg">
                            {user?.nama || user?.email}
                        </span>
                        <i className={`bx bx-chevron-down text-base text-muted transition-transform duration-300 ${
                            profileOpen ? 'rotate-180 text-[#f49827]' : 'group-hover:text-[#f49827]'
                        }`} />
                    </button>
                ) : (
                    /* Belum login: tombol MASUK */
                    <button data-aos="fade-left"
                        data-aos-anchor="#example-anchor"
                        data-aos-offset="600"
                        data-aos-duration="600"
                        onClick={() => setOpenLogin(true)}
                        className="bg-[#f49827] text-[#010101] py-3 px-8 rounded-full border-none
                         transition-all duration-500 hover:bg-white cursor-pointer z-50 font-antonio font-extrabold">
                        {t('nav.signin')}
                    </button>
                )}
            </div>

            {/* Mobile Button */}
            <div className="flex items-center gap-3 md:hidden z-50">
                {isAuthenticated && (
                    <button
                        data-profile-toggle
                        onClick={() => setProfileOpen((v) => !v)}
                        aria-label={t('profile.title')}
                        className="rounded-full border border-line p-1 transition-all duration-300 cursor-pointer"
                    >
                        <ProfileAvatar
                            user={user}
                            className="h-9 w-9 rounded-full ring-2 ring-[#f49827]/35"
                        />
                    </button>
                )}
                <button onClick={toggleMobileMenu} className='text-3xl p-2'>
                    <i className="bx bx-menu"></i>
                </button>
            </div>

            {/* Mobile Menu */}
            <div id='mobileMenu' className='fixed top-[5rem] bottom-0 right-0 left-0 p-5 md:hidden z-40 bg-black bg-opacity-70 backdrop-blur-md hidden overflow-y-auto'>
                <nav className='flex flex-col gap-6 items-left'>
                    <a className="font-poppins w-fit text-base tracking-wider transition-colors hover:text-[#f49827] z-50 cursor-pointer"
                     href="#home">{t('nav.home')}</a>

                    <a className="font-poppins w-fit text-base tracking-wider transition-colors hover:text-[#f49827] z-50 cursor-pointer"
                     href="#about">{t('nav.about')}</a>

                    <a className="font-poppins w-fit text-base tracking-wider transition-colors hover:text-[#f49827] z-50 cursor-pointer"
                     href="#jasa">{t('nav.jasa')}</a>

                    <a className="font-poppins w-fit text-base tracking-wider transition-colors hover:text-[#f49827] z-50 cursor-pointer"
                     href="#contact">{t('nav.contact')}</a>

                    {isAuthenticated ? (
                        <div className="rounded-2xl border border-line bg-black/40 p-4 flex flex-col gap-3">
                            <div className="flex items-center gap-3">
                                <ProfileAvatar
                                    user={user}
                                    className="h-11 w-11 shrink-0 rounded-full ring-2 ring-[#f49827]/35"
                                />
                                <div className="min-w-0">
                                    <p className="font-poppins truncate text-sm font-semibold text-white">
                                        {user?.nama || user?.email}
                                    </p>
                                    <p className="font-poppins truncate text-xs text-white/60">{user?.email}</p>
                                </div>
                            </div>
                            <button
                                onClick={() => { toggleMobileMenu(); setConfirmLogout(true); }}
                                className="flex items-center justify-center gap-2 rounded-xl border border-red-500/30 bg-red-500/10 py-2.5 font-poppins text-sm font-semibold text-red-400 transition-colors hover:bg-red-500 hover:text-white"
                            >
                                <i className="bx bx-log-out" />
                                {t('nav.logout')}
                            </button>
                        </div>
                    ) : (
                        <button
                          onClick={() => { toggleMobileMenu(); setOpenLogin(true); }}
                          className="font-poppins w-fit text-base tracking-wider transition-colors hover:text-[#f49827] z-50 cursor-pointer text-left"
                        >
                          {t('nav.signin')}
                        </button>
                    )}

                    <ThemeLangControls
                        divider
                        onOpenProses={() => {
                            toggleMobileMenu();
                            setOpenProses(true);
                        }}
                    />
                </nav>
            </div>

            {/* Dropdown profile (desktop & mobile) */}
            {profileOpen && (
                <div className="fixed inset-0 z-40 md:hidden" onClick={() => setProfileOpen(false)} />
            )}
            <AnimatePresence>
                {profileOpen && (
                    <ProfileDropdown
                        user={user}
                        onClose={() => setProfileOpen(false)}
                        onRequestLogout={() => setConfirmLogout(true)}
                        className="absolute right-4 top-full mt-3 w-[calc(100%-2rem)] max-w-sm md:w-72 lg:right-20"
                    />
                )}
            </AnimatePresence>

            {/* Modal Login */}
            {openLogin && <Login onClose={() => setOpenLogin(false)} />}

            {/* Modal Proses Pesanan (pelanggan login) */}
            <AnimatePresence>
                {openProses && <ProsesModal onClose={() => setOpenProses(false)} />}
            </AnimatePresence>

            {/* Konfirmasi Logout */}
            <ConfirmLogout
                open={confirmLogout}
                onCancel={() => setConfirmLogout(false)}
                onConfirm={() => { setConfirmLogout(false); logout(); }}
            />
        </header>
    )
}

export default Header;
