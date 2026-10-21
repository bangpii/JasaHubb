import { useCallback, useEffect, useRef, useState } from "react";
import "./MagicBento.css";

const DEFAULT_PARTICLE_COUNT = 12;
const DEFAULT_SPOTLIGHT_RADIUS = 300;
const DEFAULT_GLOW_COLOR = "244, 152, 39";
const MOBILE_BREAKPOINT = 768;

const cardData = [
  { label: "Analytics", content: null },
  { label: "Dashboard", content: null },
];

const createParticleElement = (x, y, color = DEFAULT_GLOW_COLOR) => {
  const el = document.createElement("div");
  el.className = "particle";
  el.style.cssText = `
    position: absolute;
    width: 4px;
    height: 4px;
    border-radius: 50%;
    background: rgba(${color}, 1);
    box-shadow: 0 0 6px rgba(${color}, 0.6);
    pointer-events: none;
    z-index: 100;
    left: ${x}px;
    top: ${y}px;
  `;
  return el;
};

const updateCardGlowProperties = (card, mouseX, mouseY, glow, radius) => {
  const rect = card.getBoundingClientRect();
  const relativeX = ((mouseX - rect.left) / rect.width) * 100;
  const relativeY = ((mouseY - rect.top) / rect.height) * 100;

  card.style.setProperty("--glow-x", `${relativeX}%`);
  card.style.setProperty("--glow-y", `${relativeY}%`);
  card.style.setProperty("--glow-intensity", glow.toString());
  card.style.setProperty("--glow-radius", `${radius}px`);
};

const ParticleCard = ({
  children,
  className = "",
  disableAnimations = false,
  style,
  particleCount = DEFAULT_PARTICLE_COUNT,
  glowColor = DEFAULT_GLOW_COLOR,
  enableTilt = true,
  clickEffect = false,
  enableMagnetism = false,
}) => {
  const cardRef = useRef(null);
  const particlesRef = useRef([]);
  const timeoutsRef = useRef([]);
  const isHoveredRef = useRef(false);
  const memoizedParticles = useRef([]);
  const particlesInitialized = useRef(false);
  const magnetismAnimationRef = useRef(null);

  const initializeParticles = useCallback(() => {
    if (particlesInitialized.current || !cardRef.current) return;

    const { width, height } = cardRef.current.getBoundingClientRect();
    memoizedParticles.current = Array.from({ length: particleCount }, () =>
      createParticleElement(Math.random() * width, Math.random() * height, glowColor),
    );
    particlesInitialized.current = true;
  }, [particleCount, glowColor]);

  const clearAllParticles = useCallback(() => {
    timeoutsRef.current.forEach(clearTimeout);
    timeoutsRef.current = [];
    if (magnetismAnimationRef.current) {
      cancelAnimationFrame(magnetismAnimationRef.current);
      magnetismAnimationRef.current = null;
    }
    particlesRef.current.forEach((particle) => {
      particle.animate(
        [
          { opacity: 1, transform: "scale(1)" },
          { opacity: 0, transform: "scale(0)" },
        ],
        { duration: 300, easing: "ease-out", fill: "forwards" },
      ).onfinish = () => {
        particle.remove();
      };
    });
    particlesRef.current = [];
  }, []);

  const animateParticles = useCallback(() => {
    if (!cardRef.current || !isHoveredRef.current) return;

    if (!particlesInitialized.current) {
      initializeParticles();
    }

    memoizedParticles.current.forEach((particle, index) => {
      const timeoutId = setTimeout(() => {
        if (!isHoveredRef.current || !cardRef.current) return;

        const clone = particle.cloneNode(true);
        cardRef.current.appendChild(clone);
        particlesRef.current.push(clone);

        clone.animate(
          [
            { transform: "scale(0) translate(0, 0)", opacity: 0 },
            { transform: "scale(1) translate(0, 0)", opacity: 1 },
          ],
          { duration: 300, easing: "ease-out", fill: "forwards" },
        );

        clone.animate(
          [
            { transform: "translate(0, 0)" },
            {
              transform: `translate(${(Math.random() - 0.5) * 100}px, ${
                (Math.random() - 0.5) * 100
              }px)`,
            },
          ],
          { duration: 2000 + Math.random() * 1000, easing: "ease-out", fill: "forwards" },
        );

        setTimeout(() => {
          clone.animate(
            [
              { opacity: 1, transform: "scale(1)" },
              { opacity: 0, transform: "scale(0)" },
            ],
            { duration: 300, easing: "ease-out", fill: "forwards" },
          ).onfinish = () => {
            clone.remove();
          };
        }, 1500);
      }, index * 50);

      timeoutsRef.current.push(timeoutId);
    });
  }, [initializeParticles]);

  useEffect(() => {
    if (disableAnimations || !cardRef.current) return;

    const element = cardRef.current;

    const handleMouseEnter = () => {
      isHoveredRef.current = true;
      animateParticles();

      if (enableTilt) {
        element.animate(
          [
            { transform: "rotateX(0deg) rotateY(0deg)" },
            { transform: "rotateX(5deg) rotateY(5deg)" },
          ],
          { duration: 300, easing: "ease-out", fill: "forwards" },
        );
      }
    };

    const handleMouseLeave = () => {
      isHoveredRef.current = false;
      clearAllParticles();

      if (enableTilt) {
        element.animate(
          [
            { transform: "rotateX(5deg) rotateY(5deg)" },
            { transform: "rotateX(0deg) rotateY(0deg)" },
          ],
          { duration: 300, easing: "ease-out", fill: "forwards" },
        );
      }

      if (enableMagnetism) {
        element.animate(
          [{ transform: "translate(0, 0)" }, { transform: "translate(0, 0)" }],
          { duration: 300, easing: "ease-out", fill: "forwards" },
        );
      }
    };

    const handleMouseMove = (e) => {
      if (!enableTilt && !enableMagnetism) return;

      const rect = element.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const centerX = rect.width / 2;
      const centerY = rect.height / 2;

      if (enableTilt) {
        const rotateX = ((y - centerY) / centerY) * -5;
        const rotateY = ((x - centerX) / centerX) * 5;
        element.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg)`;
      }

      if (enableMagnetism) {
        const magnetX = (x - centerX) * 0.05;
        const magnetY = (y - centerY) * 0.05;
        element.style.transform = `perspective(1000px) translate(${magnetX}px, ${magnetY}px)`;
      }
    };

    const handleClick = (e) => {
      if (!clickEffect) return;

      const rect = element.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const maxDistance = Math.max(
        Math.hypot(x, y),
        Math.hypot(x - rect.width, y),
        Math.hypot(x, y - rect.height),
        Math.hypot(x - rect.width, y - rect.height),
      );

      const ripple = document.createElement("div");
      ripple.style.cssText = `
        position: absolute;
        width: ${maxDistance * 2}px;
        height: ${maxDistance * 2}px;
        border-radius: 50%;
        background: radial-gradient(circle, rgba(${glowColor}, 0.4) 0%, rgba(${glowColor}, 0.2) 30%, transparent 70%);
        left: ${x - maxDistance}px;
        top: ${y - maxDistance}px;
        pointer-events: none;
        z-index: 1000;
      `;

      element.appendChild(ripple);

      ripple.animate(
        [
          { transform: "scale(0)", opacity: 1 },
          { transform: "scale(1)", opacity: 0 },
        ],
        { duration: 800, easing: "ease-out", fill: "forwards" },
      ).onfinish = () => {
        ripple.remove();
      };
    };

    element.addEventListener("mouseenter", handleMouseEnter);
    element.addEventListener("mouseleave", handleMouseLeave);
    element.addEventListener("mousemove", handleMouseMove);
    element.addEventListener("click", handleClick);

    return () => {
      isHoveredRef.current = false;
      element.removeEventListener("mouseenter", handleMouseEnter);
      element.removeEventListener("mouseleave", handleMouseLeave);
      element.removeEventListener("mousemove", handleMouseMove);
      element.removeEventListener("click", handleClick);
      clearAllParticles();
    };
  }, [
    animateParticles,
    clearAllParticles,
    disableAnimations,
    enableTilt,
    enableMagnetism,
    clickEffect,
    glowColor,
  ]);

  return (
    <div
      ref={cardRef}
      className={`${className} particle-container`}
      style={{ ...style, position: "relative", overflow: "hidden" }}
    >
      {children}
    </div>
  );
};

const GlobalSpotlight = ({
  gridRef,
  disableAnimations = false,
  enabled = true,
  spotlightRadius = DEFAULT_SPOTLIGHT_RADIUS,
  glowColor = DEFAULT_GLOW_COLOR,
}) => {
  const spotlightRef = useRef(null);

  useEffect(() => {
    if (disableAnimations || !gridRef?.current || !enabled) return;

    const spotlight = document.createElement("div");
    spotlight.className = "global-spotlight";
    spotlight.style.cssText = `
      position: fixed;
      width: 800px;
      height: 800px;
      border-radius: 50%;
      pointer-events: none;
      background: radial-gradient(circle,
        rgba(${glowColor}, 0.15) 0%,
        rgba(${glowColor}, 0.08) 15%,
        rgba(${glowColor}, 0.04) 25%,
        rgba(${glowColor}, 0.02) 40%,
        rgba(${glowColor}, 0.01) 65%,
        transparent 70%
      );
      z-index: 200;
      opacity: 0;
      transform: translate(-50%, -50%);
      mix-blend-mode: screen;
    `;
    document.body.appendChild(spotlight);
    spotlightRef.current = spotlight;

    const handleMouseMove = (e) => {
      if (!spotlightRef.current || !gridRef.current) return;

      const section = gridRef.current.closest(".bento-section");
      const rect = section?.getBoundingClientRect();
      const mouseInside =
        rect &&
        e.clientX >= rect.left &&
        e.clientX <= rect.right &&
        e.clientY >= rect.top &&
        e.clientY <= rect.bottom;

      const cards = gridRef.current.querySelectorAll(".magic-bento-card");

      if (!mouseInside) {
        spotlightRef.current.style.opacity = "0";
        cards.forEach((card) => card.style.setProperty("--glow-intensity", "0"));
        return;
      }

      const proximity = spotlightRadius * 0.5;
      const fadeDistance = spotlightRadius * 0.75;
      let maxGlow = 0;

      cards.forEach((card) => {
        const cardRect = card.getBoundingClientRect();
        const cardCenterX = cardRect.left + cardRect.width / 2;
        const cardCenterY = cardRect.top + cardRect.height / 2;
        const distance = Math.hypot(e.clientX - cardCenterX, e.clientY - cardCenterY);
        const effectiveDistance = Math.max(0, distance - Math.min(cardRect.width, cardRect.height) / 2);

        let glowIntensity = 0;
        if (effectiveDistance <= proximity) {
          glowIntensity = 1;
        } else if (effectiveDistance <= fadeDistance) {
          glowIntensity = (fadeDistance - effectiveDistance) / (fadeDistance - proximity);
        }

        updateCardGlowProperties(card, e.clientX, e.clientY, glowIntensity, spotlightRadius);

        if (glowIntensity > maxGlow) maxGlow = glowIntensity;
      });

      spotlightRef.current.style.left = `${e.clientX}px`;
      spotlightRef.current.style.top = `${e.clientY}px`;
      spotlightRef.current.style.opacity = Math.min(maxGlow * 0.6, 0.6).toString();
    };

    let rafId = 0;
    const throttledMouseMove = (e) => {
      cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(() => handleMouseMove(e));
    };

    document.addEventListener("mousemove", throttledMouseMove);

    return () => {
      document.removeEventListener("mousemove", throttledMouseMove);
      cancelAnimationFrame(rafId);
      spotlight.remove();
    };
  }, [gridRef, disableAnimations, enabled, spotlightRadius, glowColor]);

  return null;
};

const useMobileDetection = () => {
  const [isMobile, setIsMobile] = useState(true);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth <= MOBILE_BREAKPOINT);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  return isMobile;
};

const MagicBento = ({
  items = cardData,
  columns = 4,
  rowHeight = 190,
  gap = 14,
  radius = 22,
  theme = "dark",
  glowColor = DEFAULT_GLOW_COLOR,
  enableBorderGlow = true,
  enableSpotlight = true,
  spotlightRadius = DEFAULT_SPOTLIGHT_RADIUS,
  clickEffect = false,
  enableTilt = true,
  enableMagnetism = false,
  onItemClick,
  className = "",
}) => {
  const gridRef = useRef(null);
  const isMobile = useMobileDetection();
  const shouldDisableAnimations = isMobile;
  const glow = glowColor;

  return (
    <>
      {enableSpotlight && (
        <GlobalSpotlight
          gridRef={gridRef}
          disableAnimations={shouldDisableAnimations}
          enabled={enableSpotlight}
          spotlightRadius={spotlightRadius}
          glowColor={glow}
        />
      )}

      <div
        className={`bento-section grid relative select-none ${theme} ${className}`}
        style={{
          gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))`,
          gridAutoRows: `${rowHeight}px`,
          gap: `${gap}px`,
          borderRadius: `${radius}px`,
        }}
        ref={gridRef}
      >
        {items.map((item, index) => (
          <ParticleCard
            key={item.key ?? index}
            className={`magic-bento-card magic-bento-card--border-glow ${item.className ?? ""}`}
            style={{
              "--glow-color": glow,
              "--glow-radius": `${spotlightRadius}px`,
              "--border-glow": enableBorderGlow ? 1 : 0,
                gridColumn:
                  !isMobile && item.colSpan ? `span ${item.colSpan}` : undefined,
                gridRow:
                  !isMobile && item.rowSpan ? `span ${item.rowSpan}` : undefined,
            }}
            disableAnimations={shouldDisableAnimations}
            particleCount={item.particleCount ?? DEFAULT_PARTICLE_COUNT}
            glowColor={glow}
            enableTilt={enableTilt}
            clickEffect={clickEffect}
            enableMagnetism={enableMagnetism}
          >
            <div
              className="magic-bento-card__inner"
              onClick={() => onItemClick?.(item, index)}
            >
              {item.content ?? (
                <div className="magic-bento-card__header">
                  <span className="magic-bento-card__label">{item.label}</span>
                  {item.icon}
                </div>
              )}
            </div>
          </ParticleCard>
        ))}
      </div>
    </>
  );
};

export default MagicBento;
