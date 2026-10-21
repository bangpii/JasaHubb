import { useEffect, useState } from 'react';
import LazySpline from './LazySpline';
import { useSettings } from '../context/SettingsContext';

const Hero = () => {
  const { t } = useSettings();
  const [isMobile, setIsMobile] = useState(
    () => typeof window !== 'undefined' && window.innerWidth <= 640
  );

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth <= 640);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    const hero = document.querySelector('main');
    const elements = hero.querySelectorAll('.fade-part'); // elemen yang akan fade
    const fadeEnd = 600; // makin besar makin lambat hilangnya

    const handleScroll = () => {
      if (window.innerWidth < 768) {
        elements.forEach(el => el.style.opacity = 1);
        return;
      }

      const scrollTop = window.scrollY;

      elements.forEach((el, index) => {
        const delay = index * 50; // jarak antar elemen
        let opacity = 1 - (scrollTop - delay) / fadeEnd;
        opacity = Math.max(Math.min(opacity, 1), 0);
        el.style.opacity = opacity;
        el.style.transition = 'opacity 0.4s ease-out';
      });
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <main className='flex lg:mt-20 flex-col lg:flex-row items-center justify-between pb-12 sm:pb-0 sm:min-h-[calc(90vh-6rem)]'>

      <div className='max-w-xl ml-[5%] z-10 mt-12 sm:mt-[60%] lg:mt-0'>

        {/* Gradient Model */}
        <div className='fade-part relative w-[95%] sm:w-48 h-10 bg-gradient-to-r from-[#656565] to-[#f49827] shadow-[0_0_15px_rgba(255,255,255,0.4)] rounded-full'>
          <div className='font-antonio absolute inset-[3px] bg-black text-white rounded-full flex items-center justify-center gap-1'>
            <i className='bx bx-globe'></i>
            {t('hero.introducing')}
          </div>
        </div>

        {/* Main Heading */}
        <h1 className='fade-part text-3xl sm:text-4xl md:text-5xl lg:text-6xl tracking-wider my-8'>
          {t('hero.welcome')}
          <br />
          <span className="text-[#f49827]">JASAHUB</span>
        </h1>

        {/* Description */}
        <p className="fade-part font-antonio text-base sm:text-lg tracking-wider text-muted max-w-[40rem] lg:max-[30rem]">
          {t('hero.desc')}
        </p>

        {/* Buttons */}
        <div className='fade-part flex gap-4 mt-5'>
          <a href="#" className="font-antonio border border-line py-2 sm:py-3 px-4 sm:px-5 rounded-full sm-text-lg text-sm font-semibold tracking-wider transition-all duration-300 hover:bg-[#f49827] hover:text-[#010101]" >
            {t('hero.docs')} <i className='bx bx-link-external'></i>
          </a>

          <a href="#" className="font-antonio border border-line py-2 sm:py-3 px-4 sm:px-5 rounded-full sm-text-lg text-sm font-semibold tracking-wider transition-all duration-300 bg-black text-white hover:bg-[#f49827] hover:text-[#010101]" >
            {t('hero.create')} <i className='bx bx-link-external'></i>
          </a>
        </div>
      </div>

      {/* 3D Animation — hanya desktop (mobile pakai orb CSS agar ringan) */}
      {!isMobile && (
        <div className="absolute inset-x-0 top-0 h-[100dvh]">
          <LazySpline
            className="absolute top-[-20%] bottom-0 sm:left-[-2%] lg:top-0 lg:left-[25%] h-full w-screen"
            scene="https://prod.spline.design/ov9z4hT74xrtQhSg/scene.splinecode"
            placeholder={
              <div className="flex h-full w-full items-center justify-center">
                <div className="h-[22rem] w-[22rem] rounded-full bg-[radial-gradient(circle_at_40%_35%,rgba(244,152,39,0.35),rgba(244,152,39,0.08)_45%,transparent_72%)] blur-2xl animate-pulse" />
              </div>
            }
          />
        </div>
      )}
    </main>
  );
};

export default Hero;
