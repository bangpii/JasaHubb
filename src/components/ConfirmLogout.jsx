import React, { useEffect, useRef } from 'react';
import 'boxicons/css/boxicons.min.css';
import { motion as Motion, AnimatePresence } from 'framer-motion';
import { useSettings } from '../context/SettingsContext';

const ConfirmLogout = ({ open, onCancel, onConfirm }) => {
    const { t } = useSettings();
    const cancelRef = useRef(null);

    useEffect(() => {
        if (!open) return;
        const handleKey = (e) => {
            if (e.key === 'Escape') onCancel();
        };
        document.addEventListener('keydown', handleKey);
        cancelRef.current?.focus();
        return () => document.removeEventListener('keydown', handleKey);
    }, [open, onCancel]);

    return (
        <AnimatePresence>
            {open && (
                <div
                    role="dialog"
                    aria-modal="true"
                    aria-label={t('logout.question')}
                    className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
                    onClick={onCancel}
                >
                    <Motion.div
                        initial={{ opacity: 0, scale: 0.92, y: 16 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.92, y: 16 }}
                        transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
                        onClick={(e) => e.stopPropagation()}
                        className="w-full max-w-sm rounded-3xl border border-line bg-page p-7 text-center shadow-[0_24px_60px_-12px_rgba(0,0,0,0.5)]"
                    >
                        <span className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-[#f49827]/15 text-4xl text-[#f49827]">
                            <i className="bx bx-log-out-circle" />
                        </span>

                        <h3 className="mt-4 font-poppins text-lg font-semibold text-fg">
                            {t('logout.title')}
                        </h3>
                        <p className="mt-1.5 font-poppins text-sm text-muted">
                            {t('logout.question')}
                        </p>

                        <div className="mt-6 flex gap-3">
                            <button
                                ref={cancelRef}
                                type="button"
                                onClick={onCancel}
                                className="flex-1 cursor-pointer rounded-xl border border-line py-2.5 font-poppins text-sm font-semibold text-fg transition-all duration-300 hover:border-[#f49827] hover:text-[#f49827]"
                            >
                                {t('logout.no')}
                            </button>
                            <button
                                type="button"
                                onClick={onConfirm}
                                className="flex-1 cursor-pointer rounded-xl bg-red-500 py-2.5 font-poppins text-sm font-semibold text-white transition-all duration-300 hover:bg-red-600"
                            >
                                {t('logout.yes')}
                            </button>
                        </div>
                    </Motion.div>
                </div>
            )}
        </AnimatePresence>
    );
};

export default ConfirmLogout;
