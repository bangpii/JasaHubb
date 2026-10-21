import React, { useEffect } from "react";
import AOS from "aos";
import "aos/dist/aos.css";
import { useSettings } from "../context/SettingsContext";

const JasaHeader = () => {
    const { t } = useSettings();
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

  return (
    <main>
      <div
        className="flex flex-col items-center justify-center text-center px-6 py-10"
        data-aos={window.innerWidth > 768 ? "fade-up" : ""}
      >
        <h2
          className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl mt-[4rem] sm:mt-[4rem] md:mt-[2rem]"
          data-aos={window.innerWidth > 768 ? "fade-up" : ""}
          data-aos-delay="100"
        >
          {t("jasa.title")} <span className="text-[#f49827]">{t("jasa.accent")}</span>
        </h2>

        <p
          className="font-antonio sm:text-lg md:text-xl tracking-wider text-muted 
            text-center max-w-[45rem] md:max-w-[35rem] leading-relaxed mt-4"
          data-aos={window.innerWidth > 768 ? "fade-up" : ""}
          data-aos-delay="300"
        >
          {t("jasa.desc")}
        </p>
      </div>

      {/* <img src="/roboto.png" alt="Robot" /> */}
    </main>
  );
};

export default JasaHeader