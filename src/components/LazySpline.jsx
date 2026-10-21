import React, { Suspense, lazy, useEffect, useRef, useState } from "react";

const Spline = lazy(() => import("@splinetool/react-spline"));

const LazySpline = ({ scene, className = "", rootMargin = "500px", placeholder }) => {
  const holderRef = useRef(null);
  const [inView, setInView] = useState(false);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const el = holderRef.current;
    if (!el || typeof IntersectionObserver === "undefined") {
      setInView(true);
      return;
    }

    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setInView(true);
          io.disconnect();
        }
      },
      { rootMargin }
    );

    io.observe(el);
    return () => io.disconnect();
  }, [rootMargin]);

  return (
    <div ref={holderRef} className={className}>
      {!loaded && placeholder && (
        <div className="absolute inset-0 overflow-hidden">{placeholder}</div>
      )}

      {inView && (
        <Suspense fallback={null}>
          <Spline
            scene={scene}
            onLoad={() => setLoaded(true)}
            className="w-full h-full"
          />
        </Suspense>
      )}
    </div>
  );
};

export default LazySpline;
