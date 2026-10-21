import React, { useEffect, useRef, useState } from "react";
import LazySpline from "./LazySpline";
import AOS from "aos";
import "aos/dist/aos.css";
import { projects as fallbackProjects } from "../data/projects";
import { publicApi } from "../services/api";
import { subscribeProjects } from "../services/realtime";
import { useSettings } from "../context/SettingsContext";
import ProjectModal from "./ProjectModal";

// Geometri cincin proyek di atas kepala robot (elips: lebih lebar ke kiri-kanan)
const RING_RADIUS_X = 645; // jarak horizontal poros kiri-kanan (px)
const RING_RADIUS_Z = 540; // jarak kedalaman poros depan-belakang (px)
const RING_TILT = 32; // kemiringan cincin ke depan (derajat) — seperti mahkota/halo
const RING_SPEED = 0.1; // derajat per frame @60fps
const CARD_W = 206; // lebar kartu project (px)
const CARD_H = 156; // tinggi kartu project (px)

const About = () => {
  const { t } = useSettings();

  // Sumber data: API (dikelola dari CMS admin) dengan fallback statis lokal.
  const [items, setItems] = useState(() =>
    fallbackProjects.map((p) => ({
      id: p.id,
      src: p.imageSrc,
      name: p.name,
      github: p.github ?? null,
      url: p.url ?? null,
      languages: p.languages ?? [],
      role: p.role ?? null,
      description: p.description ?? null,
    })),
  );
  const [selected, setSelected] = useState(null);

  const loadProjects = React.useCallback(async () => {
    try {
      const res = await publicApi.listProjects({ all: 'true' });
      const list = res?.items ?? [];
      if (list.length > 0) {
        setItems(
          list.map((p) => ({
            id: p.slug,
            src: p.imageSrc,
            name: p.name,
            github: p.github ?? null,
            url: p.url ?? null,
            languages: p.languages ?? [],
            role: p.role ?? null,
            description: p.description ?? null,
          })),
        );
      }
    } catch {
      // Biarkan data fallback statis bila API belum tersedia.
    }
  }, []);

  useEffect(() => {
    loadProjects();
  }, [loadProjects]);

  // Realtime: refetch saat admin menambah/mengubah/menghapus project.
  useEffect(() => {
    return subscribeProjects(() => loadProjects());
  }, [loadProjects]);

  const orbitItems = items;

  const orbitRef = useRef(null);
  const orbitWrapperRef = useRef(null);
  const aboutSectionRef = useRef(null);
  const [isMobile, setIsMobile] = useState(
    () => typeof window !== "undefined" && window.innerWidth <= 640
  );

  // Deteksi ukuran layar
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth <= 640);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  // Inisialisasi AOS (fade-up ketika muncul)
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
    return () => window.removeEventListener("resize", initAOS);
  }, []);

  // Fade-out ketika keluar dari viewport
  useEffect(() => {
    const section = aboutSectionRef.current;
    if (!section) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          section.style.opacity = entry.isIntersecting ? "1" : "0";
        });
      },
      { threshold: 0.3, rootMargin: "0px" }
    );

    observer.observe(section);
    return () => observer.disconnect();
  }, []);

  // Orbit 3D desktop: kecepatan konsisten (time-based), kedalaman, bobbing, slowdown saat hover
  useEffect(() => {
    if (isMobile) return;
    const wrapper = orbitWrapperRef.current;
    const orbit = orbitRef.current;
    if (!wrapper || !orbit) return;

    const items = orbit.children;
    const total = items.length;
    if (!total) return;

    const ringRadius = { x: RING_RADIUS_X, z: RING_RADIUS_Z };
    const radiusX = ringRadius.x;
    const radiusZ = ringRadius.z;

    const baseSpeed = RING_SPEED; // putaran penuh ±60 detik
    const tiltRad = (RING_TILT * Math.PI) / 180;
    const sinT = Math.sin(tiltRad);
    const cosT = Math.cos(tiltRad);
    const maxZ = radiusZ * cosT;
    const reduceMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;

    let angle = 0;
    let speedFactor = reduceMotion ? 0 : 1;
    let hovering = false;
    let raf;
    let last = performance.now();

    const onEnter = () => {
      hovering = true;
    };
    const onLeave = () => {
      hovering = false;
    };
    // Berhenti hanya ketika hover di atas kartu project, bukan area cincin lain
    for (const el of items) {
      el.addEventListener("pointerenter", onEnter);
      el.addEventListener("pointerleave", onLeave);
    }

    const animate = (now) => {
      const dt = Math.min((now - last) / 16.667, 4);
      last = now;

      // Perlambatan halus saat hover (atau saat user minta reduced motion)
      const targetSpeed = hovering || reduceMotion ? 0 : 1;
      speedFactor += (targetSpeed - speedFactor) * 0.05;

      angle += speedFactor * baseSpeed * dt;
      if (angle >= 360) angle -= 360;

      for (let i = 0; i < total; i++) {
        const a = (360 / total) * i + angle;
        const rad = (a * Math.PI) / 180;
        // Posisi di elips miring (lebar ke kiri-kanan), kartu tetap tegak
        const ringX = Math.sin(rad) * radiusX;
        const ringZ = Math.cos(rad) * radiusZ;
        const y = ringZ * sinT; // sisi depan cincin turun (miring ke depan)
        const z = ringZ * cosT; // kedalaman menuju kamera
        const depth = (z / maxZ + 1) / 2; // 0 = belakang, 1 = depan

        const scale = 0.65 + depth * 0.35;
        const bob = Math.sin(angle * 0.03 + i * 1.7) * 4;
        const blur = (1 - depth) * 2;
        const opacity = 0.3 + depth * 0.7;

        const el = items[i];
        el.style.transform = `translate3d(${ringX}px, ${y + bob}px, ${z}px) rotateY(${a}deg) scale(${scale})`;
        el.style.filter = `blur(${blur.toFixed(2)}px)`;
        el.style.opacity = opacity.toFixed(3);
        el.style.zIndex = Math.round(z + radiusZ);
      }

      raf = requestAnimationFrame(animate);
    };

    raf = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(raf);
      for (const el of items) {
        el.removeEventListener("pointerenter", onEnter);
        el.removeEventListener("pointerleave", onLeave);
      }
    };
  }, [isMobile, orbitItems.length]);

  return (
    <main
      ref={aboutSectionRef}
      className="relative flex flex-col items-center justify-center min-h-[100dvh] bg-page overflow-hidden transition-opacity duration-700"
      style={{ transition: "opacity 0.7s ease-in-out", opacity: 1 }}
      data-aos={window.innerWidth > 768 ? "fade-up" : ""}
      data-aos-delay="100"
    >
      {/* Spline di tengah — hanya desktop (mobile diringankan, tanpa 3D) */}
      {!isMobile && (
        <div className="absolute inset-0 z-10 flex items-center justify-center">
          <div className="w-[130%] h-[130%] md:w-[120%] md:h-[120%] sm:w-[110%] sm:h-[110%]">
            <LazySpline
              className="relative h-full w-full"
              rootMargin="600px"
              scene="https://prod.spline.design/OgGcVgPFvhwzueEz/scene.splinecode"
              placeholder={
                <div className="h-full w-full bg-[radial-gradient(45%_40%_at_50%_45%,rgba(244,152,39,0.18),transparent_72%)] animate-pulse" />
              }
            />
          </div>
        </div>
      )}

      {/* Mobile: latar gradasi CSS ringan (tanpa WebGL) */}
      {isMobile && (
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(70%_45%_at_50%_20%,rgba(244,152,39,0.18),transparent_70%)]" />
      )}

      {/* Desktop / Tablet: Cincin proyek melingkari kepala robot */}
      {!isMobile && (
        <div
          ref={orbitWrapperRef}
          className="absolute left-1/2 -translate-x-1/2 top-[-10%] z-20 w-[1640px] h-[960px] [perspective:1800px]"
        >
          <div
            ref={orbitRef}
            className="absolute left-1/2 top-1/2 w-0 h-0 [transform-style:preserve-3d]"
          >
            {orbitItems.map((item, i) => (
              <div
                key={item.id}
                role="button"
                tabIndex={0}
                aria-label={`${item.name} — ${t("projectModal.hint")}`}
                onClick={() => setSelected(item)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    setSelected(item);
                  }
                }}
                className="group absolute cursor-pointer overflow-hidden rounded-xl border border-orange-400/60 shadow-[0_0_20px_rgba(244,152,39,0.4)] outline-none will-change-[transform,filter,opacity] focus-visible:ring-2 focus-visible:ring-orange-400"
                style={{
                  width: CARD_W,
                  height: CARD_H,
                  marginLeft: -CARD_W / 2,
                  marginTop: -CARD_H / 2,
                }}
              >
                <img
                  src={item.src}
                  alt={item.name}
                  loading={i < 6 ? "eager" : "lazy"}
                  className="w-full h-full object-cover"
                />
                <span className="pointer-events-none absolute inset-0 flex items-center justify-center bg-black/45 opacity-0 transition-opacity duration-300 group-hover:opacity-100 group-focus-visible:opacity-100">
                  <span className="rounded-full bg-[#f49827] px-3 py-1 text-[11px] font-semibold text-black">
                    {t("projectModal.hint")}
                  </span>
                </span>
                <span className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/85 via-black/40 to-transparent text-[13px] leading-tight text-white text-center pt-4 pb-1.5 px-1 font-antonio tracking-wide truncate">
                  {item.name}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Deskripsi Why JasaHub — overlay di desktop, mengalir di mobile */}
      <div className="pointer-events-none relative sm:absolute sm:bottom-10 z-50 w-full px-6 sm:px-10 pt-8 sm:pt-0 flex flex-col items-center text-fg">
        <div
          className="relative z-30 flex flex-col sm:flex-row justify-between items-start 
          w-full max-w-4xl mx-auto gap-8 sm:gap-6 sm:mt-20"
        >
          {/* Kiri — Why JasaHub */}
          <div className="relative w-full sm:w-1/2">
            <div className="fade-part absolute -top-1 left-0 w-[11rem] sm:w-52 h-9 bg-gradient-to-r from-[#656565] to-[#f49827] shadow-[0_0_15px_rgba(255,255,255,0.4)] rounded-full">
              <div className="font-antonio absolute inset-[3px] bg-black text-white rounded-full flex items-center justify-center gap-1 text-sm sm:text-base">
                <i className="bx bx-globe"></i>
                {t("about.why")}
              </div>
            </div>

            <p
              className="font-antonio sm:text-lg md:text-xl tracking-wider text-muted 
              text-left max-w-[45rem] md:max-w-[35rem] leading-relaxed mt-8 sm:mt-12"
            >
              {t("about.p1")}
            </p>
          </div>

          {/* Kanan — Projects Me */}
          <div className="relative w-full sm:w-1/2">
            <div className="fade-part absolute -top-1 right-0 w-[11rem] sm:w-52 h-9 bg-gradient-to-r from-[#f49827] to-[#656565] shadow-[0_0_15px_rgba(255,255,255,0.4)] rounded-full">
              <div className="font-antonio absolute inset-[3px] bg-black text-white rounded-full flex items-center justify-center gap-1 text-sm sm:text-base">
                <i className="bx bx-globe"></i>
                {t("about.projects")}
              </div>
            </div>

            <p
              className="font-antonio sm:text-lg md:text-xl tracking-wider text-muted 
              text-left sm:text-right max-w-[45rem] md:max-w-[35rem] leading-relaxed mt-8 sm:mt-12"
            >
              {t("about.p2")}
            </p>
          </div>
        </div>
      </div>

      {/* Mobile: galeri proyek statis (tanpa animasi, ringan) */}
      {isMobile && (
        <div className="relative z-20 w-full max-w-xl px-5 pb-20 grid grid-cols-2 gap-3">
          {orbitItems.map((item) => (
            <div
              key={item.id}
              role="button"
              tabIndex={0}
              aria-label={`${item.name} — ${t("projectModal.hint")}`}
              onClick={() => setSelected(item)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  setSelected(item);
                }
              }}
              className="relative cursor-pointer overflow-hidden rounded-2xl border border-orange-400/25 bg-white/5 outline-none focus-visible:ring-2 focus-visible:ring-orange-400"
            >
              <img
                src={item.src}
                alt={item.name}
                loading="lazy"
                className="w-full aspect-[4/3] object-cover"
              />
              <span className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 via-black/45 to-transparent text-[11px] text-white text-center pt-4 pb-1.5 px-1 font-antonio tracking-wide truncate">
                {item.name}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Modal detail project — dibuka saat kartu project diklik */}
      <ProjectModal project={selected} onClose={() => setSelected(null)} />
    </main>
  );
};

export default About;
