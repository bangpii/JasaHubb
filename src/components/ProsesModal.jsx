import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion as Motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { useSettings } from '../context/SettingsContext';
import { publicApi } from '../services/api';
import { subscribePesanan } from '../services/realtime';

const STAGE_META = [
    { key: 'stage1', short: 'short1', icon: 'bx bx-receipt' },
    { key: 'stage2', short: 'short2', icon: 'bx bxl-whatsapp' },
    { key: 'stage3', short: 'short3', icon: 'bx bx-cog' },
    { key: 'stage4', short: 'short4', icon: 'bx bx-check-circle' },
];

const fill = (template, vars) =>
    String(template ?? '').replace(/\{(\w+)\}/g, (_, key) => vars[key] ?? '');

const formatDate = (value, lang) => {
    if (!value) return '-';
    try {
        return new Intl.DateTimeFormat(lang === 'en' ? 'en-US' : 'id-ID', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        }).format(new Date(value));
    } catch {
        return '-';
    }
};

const getStageStates = (order) => {
    const status = order?.status ?? 'baru';
    const cancelled = status === 'batal';
    const done = [
        true,
        Boolean(order?.waSent) || status !== 'baru',
        status === 'selesai',
        status === 'selesai',
    ];
    const activeIndex = cancelled ? -1 : done.findIndex((value) => !value);
    return { done, activeIndex, cancelled };
};

const nodeState = ({ done, activeIndex, cancelled }, index) => {
    if (cancelled) return done[index] ? 'completed' : 'pending';
    if (done[index] && (activeIndex === -1 || index < activeIndex)) return 'completed';
    if (index === activeIndex) return 'in-progress';
    return 'pending';
};

const nodeEnergy = (state) =>
    state === 'completed' ? 100 : state === 'in-progress' ? 55 : 12;

const badgeClass = (state, cancelled) => {
    if (cancelled) return 'border-red-500/40 bg-red-500/10 text-red-500 dark:text-red-400';
    if (state === 'completed')
        return 'border-emerald-500/40 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400';
    if (state === 'in-progress') return 'border-[#f49827]/50 bg-[#f49827]/15 text-[#b76a12] dark:text-[#f49827]';
    return 'border-line bg-black/[0.03] text-muted dark:bg-white/[0.03]';
};

const badgeLabel = (state, cancelled, t) => {
    if (cancelled) return t('proses.badgeCancel');
    if (state === 'completed') return t('proses.badgeDone');
    if (state === 'in-progress') return t('proses.badgeActive');
    return t('proses.badgePending');
};

export default function ProsesModal({ onClose }) {
    const { user } = useAuth();
    const { t, lang } = useSettings();

    const [orders, setOrders] = useState([]);
    const [selectedId, setSelectedId] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [activeNode, setActiveNode] = useState(null);
    const [rotationAngle, setRotationAngle] = useState(0);
    const [autoRotate, setAutoRotate] = useState(true);
    const [radius, setRadius] = useState(140);

    const requestRef = useRef(0);
    const orbitRef = useRef(null);

    const tRef = useRef(t);
    tRef.current = t;

    const load = useCallback(async () => {
        const seq = ++requestRef.current;
        setLoading(true);
        setError('');
        try {
            const result = await publicApi.myPesanan();
            if (seq !== requestRef.current) return;
            const items = Array.isArray(result?.items) ? result.items : [];
            setOrders(items);
            setSelectedId((prev) => (items.some((item) => item.id === prev) ? prev : items[0]?.id ?? null));
        } catch (err) {
            if (seq !== requestRef.current) return;
            setError(err?.message || tRef.current('proses.error'));
        } finally {
            if (seq === requestRef.current) setLoading(false);
        }
    }, []);

    useEffect(() => {
        load();
        return () => {
            requestRef.current += 1;
        };
    }, [load]);

    useEffect(() => {
        const unsubscribe = subscribePesanan(() => load(), { scope: 'public' });
        return unsubscribe;
    }, [load]);

    useEffect(() => {
        const previous = document.body.style.overflow;
        document.body.style.overflow = 'hidden';
        const handleKey = (event) => {
            if (event.key === 'Escape') onClose?.();
        };
        document.addEventListener('keydown', handleKey);
        return () => {
            document.body.style.overflow = previous;
            document.removeEventListener('keydown', handleKey);
        };
    }, [onClose]);

    useEffect(() => {
        const updateRadius = () => {
            const width = orbitRef.current?.clientWidth ?? 0;
            setRadius(Math.max(102, Math.min(158, width / 2 - 76)));
        };
        updateRadius();
        window.addEventListener('resize', updateRadius);
        return () => window.removeEventListener('resize', updateRadius);
    }, []);

    useEffect(() => {
        if (!autoRotate || activeNode !== null) return;
        const reduceMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
        if (reduceMotion) return;
        const timer = window.setInterval(() => {
            setRotationAngle((prev) => Number(((prev + 0.25) % 360).toFixed(3)));
        }, 60);
        return () => window.clearInterval(timer);
    }, [autoRotate, activeNode]);

    const activeOrder = useMemo(
        () => orders.find((order) => order.id === selectedId) ?? null,
        [orders, selectedId],
    );

    const stages = useMemo(
        () => (activeOrder ? getStageStates(activeOrder) : null),
        [activeOrder],
    );

    const progress = useMemo(() => {
        if (!stages) return 0;
        if (stages.cancelled) return 0;
        return Math.round((stages.done.filter(Boolean).length / STAGE_META.length) * 100);
    }, [stages]);

    const orderId = activeOrder?.id;
    const orderStatus = activeOrder?.status;
    const orderWaSent = activeOrder?.waSent;

    useEffect(() => {
        if (orderId == null) {
            setActiveNode(null);
            return;
        }
        const next = getStageStates({ status: orderStatus, waSent: orderWaSent });
        const target = next.cancelled
            ? 0
            : next.activeIndex === -1
              ? STAGE_META.length - 1
              : next.activeIndex;
        setActiveNode(target);
        setAutoRotate(false);
        setRotationAngle(270 - (target / STAGE_META.length) * 360);
    }, [orderId, orderStatus, orderWaSent]);

    const selectNode = (index) => {
        if (activeNode === index) {
            setActiveNode(null);
            setAutoRotate(true);
            return;
        }
        setActiveNode(index);
        setAutoRotate(false);
        setRotationAngle(270 - (index / STAGE_META.length) * 360);
    };

    const resetView = () => {
        setActiveNode(null);
        setAutoRotate(true);
    };

    const stageDescription = (index) => {
        if (!activeOrder) return '';
        if (activeOrder.status === 'batal') return t('proses.descCancel');
        const vars = {
            id: activeOrder.id,
            date: formatDate(activeOrder.createdAt, lang),
            wa: activeOrder.nomorWa,
            updated: formatDate(activeOrder.updatedAt, lang),
        };
        if (index === 0) return fill(t('proses.desc1'), vars);
        if (index === 1) {
            return activeOrder.waSent || activeOrder.status !== 'baru'
                ? fill(t('proses.desc2done'), vars)
                : t('proses.desc2wait');
        }
        if (index === 2) {
            if (activeOrder.status === 'selesai') return t('proses.desc3done');
            if (activeOrder.status === 'diproses') return t('proses.desc3active');
            return t('proses.desc3wait');
        }
        return activeOrder.status === 'selesai' ? t('proses.desc4done') : t('proses.desc4wait');
    };

    const stageDate = (index) => {
        if (!activeOrder) return '';
        if (index === 0) return `${t('proses.created')} · ${formatDate(activeOrder.createdAt, lang)}`;
        return `${t('proses.updated')} · ${formatDate(activeOrder.updatedAt, lang)}`;
    };

    const renderOrbit = () => {
        const states = stages ?? getStageStates(null);
        const visualNodes = STAGE_META.map((meta, index) => {
            const state = nodeState(states, index);
            const angle = ((index / STAGE_META.length) * 360 + rotationAngle) % 360;
            const radian = (angle * Math.PI) / 180;
            const x = radius * Math.cos(radian);
            const y = radius * Math.sin(radian);
            const zIndex = Math.round(20 + 20 * Math.cos(radian));
            const opacity = Math.max(0.45, Math.min(1, 0.45 + 0.55 * ((1 + Math.sin(radian)) / 2)));
            return { meta, index, state, x, y, zIndex, opacity };
        });

        return (
            <div className="relative mx-3 mb-1 overflow-hidden rounded-2xl border border-line bg-black/[0.02] dark:bg-white/[0.02]">
                <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(244,152,39,0.08),transparent_65%)]" />
                <div
                    ref={orbitRef}
                    className="relative flex h-[300px] w-full items-center justify-center sm:h-[340px]"
                    onClick={(event) => {
                        if (event.target === event.currentTarget) resetView();
                    }}
                >
                    <div
                        className="pointer-events-none absolute rounded-full border border-dashed border-line"
                        style={{ width: radius * 2, height: radius * 2 }}
                    />

                    <div className="absolute z-10 flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-[#f49827] via-[#b76a12] to-[#8a5a1f] shadow-[0_0_42px_-8px_rgba(244,152,39,0.8)]">
                        <span className="absolute h-20 w-20 animate-ping rounded-full border border-[#f49827]/35" />
                        <span
                            className="absolute h-24 w-24 animate-ping rounded-full border border-[#f49827]/20"
                            style={{ animationDelay: '0.6s' }}
                        />
                        {stages?.cancelled ? (
                            <span className="relative z-10 font-antonio text-[11px] font-bold tracking-widest text-black">
                                X
                            </span>
                        ) : (
                            <span className="relative z-10 font-antonio text-sm font-bold tracking-wide text-black">
                                {progress}%
                            </span>
                        )}
                    </div>

                    {visualNodes.map(({ meta, index, state, x, y, zIndex, opacity }) => {
                        const isSelected = activeNode === index;
                        const isActive = state === 'in-progress';
                        return (
                            <div
                                key={meta.key}
                                className="absolute left-1/2 top-1/2 transition-transform duration-500 ease-out"
                                style={{
                                    transform: `translate(-50%, -50%) translate(${x}px, ${y}px)`,
                                    zIndex: isSelected ? 40 : zIndex,
                                    opacity: isSelected ? 1 : opacity,
                                }}
                            >
                                {isActive && (
                                    <span className="pointer-events-none absolute -inset-3 animate-pulse rounded-full bg-[#f49827]/20 blur-md" />
                                )}
                                <button
                                    type="button"
                                    onClick={() => selectNode(index)}
                                    aria-label={t(`proses.${meta.key}`)}
                                    className={`relative grid h-11 w-11 cursor-pointer place-items-center rounded-full border-2 text-lg transition-all duration-300 ${
                                        state === 'completed'
                                            ? 'border-[#f49827] bg-[#f49827] text-black'
                                            : state === 'in-progress'
                                              ? 'border-[#f49827] bg-page text-[#f49827] shadow-[0_0_20px_-2px_rgba(244,152,39,0.55)]'
                                              : 'border-line bg-page text-muted'
                                    } ${isSelected ? 'scale-110 ring-2 ring-[#f49827] ring-offset-2 ring-offset-page' : 'hover:scale-105 hover:border-[#f49827] hover:text-[#f49827]'}`}
                                >
                                    <i className={meta.icon} />
                                </button>
                                <span
                                    className={`absolute left-1/2 top-full mt-2 w-24 -translate-x-1/2 text-center font-poppins text-[10px] font-semibold uppercase tracking-wider transition-colors ${
                                        isSelected ? 'text-[#f49827]' : 'text-muted'
                                    }`}
                                >
                                    {t(`proses.${meta.short}`)}
                                </span>
                            </div>
                        );
                    })}
                </div>
            </div>
        );
    };

    const renderBody = () => {
        if (loading && orders.length === 0) {
            return (
                <div className="flex h-[380px] flex-col items-center justify-center gap-3 text-muted">
                    <i className="bx bx-loader-alt animate-spin text-3xl text-[#f49827]" />
                    <p className="font-poppins text-sm">{t('proses.loading')}</p>
                </div>
            );
        }

        if (error && orders.length === 0) {
            return (
                <div className="flex h-[380px] flex-col items-center justify-center gap-3 px-6 text-center">
                    <span className="grid h-12 w-12 place-items-center rounded-full border border-red-500/30 bg-red-500/10 text-2xl text-red-500 dark:text-red-400">
                        <i className="bx bx-error-circle" />
                    </span>
                    <p className="font-poppins text-sm text-muted">{error}</p>
                    <button
                        type="button"
                        onClick={() => load()}
                        className="rounded-full border border-line px-5 py-2 font-poppins text-xs font-semibold tracking-wider text-fg transition-colors hover:border-[#f49827] hover:text-[#f49827]"
                    >
                        {t('proses.retry')}
                    </button>
                </div>
            );
        }

        if (orders.length === 0) {
            return (
                <div className="flex h-[380px] flex-col items-center justify-center gap-3 px-8 text-center">
                    <span className="grid h-14 w-14 place-items-center rounded-full border border-line bg-[#f49827]/10 text-2xl text-[#f49827]">
                        <i className="bx bx-package" />
                    </span>
                    <p className="font-poppins text-sm leading-relaxed text-muted">{t('proses.empty')}</p>
                </div>
            );
        }

        const currentStageIndex = stages
            ? stages.cancelled
                ? 0
                : stages.activeIndex === -1
                  ? STAGE_META.length - 1
                  : stages.activeIndex
            : 0;
        const currentState = nodeState(stages ?? getStageStates(null), currentStageIndex);
        const selectedState =
            activeNode !== null && stages ? nodeState(stages, activeNode) : 'pending';

        return (
            <div className="flex flex-col overflow-y-auto">
                {orders.length > 1 && (
                    <div className="flex gap-2 overflow-x-auto px-4 pb-3">
                        {orders.map((order) => (
                            <button
                                key={order.id}
                                type="button"
                                onClick={() => setSelectedId(order.id)}
                                className={`shrink-0 rounded-full border px-3 py-1.5 font-poppins text-[11px] font-semibold transition-colors ${
                                    order.id === selectedId
                                        ? 'border-[#f49827] bg-[#f49827]/15 text-[#f49827]'
                                        : 'border-line text-muted hover:border-[#f49827]/60 hover:text-[#f49827]'
                                }`}
                            >
                                #{order.id} · {order.jenisJasa}
                            </button>
                        ))}
                    </div>
                )}

                {activeOrder && (
                    <>
                        <div className="flex items-center justify-between gap-3 px-4 pb-2">
                            <div className="min-w-0">
                                <p className="truncate font-poppins text-sm font-semibold text-fg">
                                    {activeOrder.jenisJasa}
                                </p>
                                <p className="truncate font-poppins text-[11px] text-muted">
                                    #{activeOrder.id} · {formatDate(activeOrder.createdAt, lang)}
                                </p>
                            </div>
                            <span
                                className={`shrink-0 rounded-full border px-2.5 py-1 font-poppins text-[10px] font-semibold tracking-wider ${badgeClass(
                                    stages?.cancelled ? 'pending' : currentState,
                                    stages?.cancelled,
                                )}`}
                            >
                                {badgeLabel(currentState, Boolean(stages?.cancelled), t)}
                            </span>
                        </div>

                        {renderOrbit()}

                        <AnimatePresence mode="wait" initial={false}>
                            {activeNode !== null && (
                                <Motion.div
                                    key={`${activeOrder.id}-${activeNode}`}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -6 }}
                                    transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
                                    className="mx-3 mb-3 rounded-2xl border border-line bg-page p-4"
                                >
                                    <div className="flex items-start justify-between gap-3">
                                        <div className="flex items-center gap-2.5">
                                            <span className="grid h-8 w-8 place-items-center rounded-lg bg-[#f49827]/10 text-base text-[#f49827]">
                                                <i className={STAGE_META[activeNode].icon} />
                                            </span>
                                            <p className="font-poppins text-sm font-semibold text-fg">
                                                {t(`proses.${STAGE_META[activeNode].key}`)}
                                            </p>
                                        </div>
                                        <span
                                            className={`shrink-0 rounded-full border px-2 py-0.5 font-poppins text-[9px] font-semibold tracking-wider ${badgeClass(
                                                selectedState,
                                                Boolean(stages?.cancelled),
                                            )}`}
                                        >
                                            {badgeLabel(selectedState, Boolean(stages?.cancelled), t)}
                                        </span>
                                    </div>

                                    <p className="mt-2 font-poppins text-xs leading-relaxed text-muted">
                                        {stageDescription(activeNode)}
                                    </p>

                                    <div className="mt-3 flex items-center justify-between font-poppins text-[10px] uppercase tracking-wider text-muted">
                                        <span>{stageDate(activeNode)}</span>
                                        <span>{nodeEnergy(selectedState)}%</span>
                                    </div>
                                    <div className="mt-1.5 h-1 w-full overflow-hidden rounded-full bg-black/[0.06] dark:bg-white/10">
                                        <div
                                            className="h-full rounded-full bg-gradient-to-r from-[#b76a12] to-[#f49827] transition-all duration-500"
                                            style={{ width: `${nodeEnergy(selectedState)}%` }}
                                        />
                                    </div>
                                </Motion.div>
                            )}
                        </AnimatePresence>

                        <p className="px-4 pb-4 text-center font-poppins text-[10px] tracking-wide text-muted">
                            {t('proses.hint')}
                        </p>
                    </>
                )}
            </div>
        );
    };

    return (
        <Motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/70 p-3 backdrop-blur-md sm:p-6"
            onClick={(event) => {
                if (event.target === event.currentTarget) onClose?.();
            }}
        >
            <Motion.div
                initial={{ opacity: 0, scale: 0.94, y: 18 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.94, y: 18 }}
                transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
                role="dialog"
                aria-modal="true"
                aria-label={t('proses.title')}
                className="relative flex max-h-[92vh] w-full max-w-2xl flex-col overflow-hidden rounded-3xl border border-line bg-page text-fg shadow-[0_30px_80px_-20px_rgba(0,0,0,0.65)]"
            >
                <div className="flex items-start justify-between gap-3 border-b border-line px-5 py-4">
                    <div className="flex items-center gap-3">
                        <span className="grid h-10 w-10 place-items-center rounded-full bg-gradient-to-br from-[#f49827] to-[#b76a12] text-lg text-black">
                            <i className="bx bx-loader-circle animate-spin [animation-duration:4s]" />
                        </span>
                        <div>
                            <h3 className="font-poppins text-sm font-semibold text-fg">{t('proses.title')}</h3>
                            <p className="font-poppins text-[11px] text-muted">
                                {user?.nama ? `${t('proses.greeting')}, ${user.nama}` : t('proses.subtitle')}
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <span className="hidden items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-1 font-poppins text-[9px] font-semibold uppercase tracking-wider text-emerald-600 sm:flex dark:text-emerald-400">
                            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-500" />
                            {t('proses.live')}
                        </span>
                        <button
                            type="button"
                            onClick={onClose}
                            aria-label={t('proses.close')}
                            className="grid h-8 w-8 cursor-pointer place-items-center rounded-full border border-line text-lg text-muted transition-colors hover:border-[#f49827] hover:text-[#f49827]"
                        >
                            <i className="bx bx-x" />
                        </button>
                    </div>
                </div>

                {renderBody()}
            </Motion.div>
        </Motion.div>
    );
}
