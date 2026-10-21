import React from 'react';
import "../css/index.css";
import Header from "../components/Header";
import Hero from '../components/Hero';
import AboutHeader from '../components/AboutHeader';
import About from '../components/About';
import JasaHeader from '../components/JasaHeader';
import Jasa from '../components/Jasa';
import ContactHeader from '../components/ContactHeader';
import Contact from '../components/Contact';
import Footer from '../components/Footer';
import Login from '../components/Login';
import RoomChat from '../components/RoomChat';
import AOS from 'aos';
import 'aos/dist/aos.css';
import { useEffect, useState } from 'react';
import LazySpline from '../components/LazySpline';
import PaperBackground from '../components/PaperBackground';
import { useSettings } from '../context/SettingsContext';

const User = () => {
  const { theme } = useSettings();
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
    AOS.init({
      duration: 1500,
      once: true,
    })
  })

  return (
    <div>
      {theme === 'light' && <PaperBackground />}
      <img className='absolute top-0 right-0 opacity-60 -z-10'
      src="/gradient.png" alt="Background" />

      {/* Aura */}
      <div className='h-0 w-[40rem] absolute top-[20vh] right-[-5%] shadow-[0_0_900px_20px_#e99b63] -rotate-[30deg] -z-10'></div>
      

      <Header/>
      <RoomChat/>
      {/* Section Home */}
      <section id="home">
        <Hero />
      </section>

      {/* Section About */}
      <section id="about">
        <AboutHeader />
        <About />
      </section>

      {/* Section Jasa */}
      <section id="jasa">
        <JasaHeader />
        <Jasa />
      </section>

    {/* Spline dekoratif — hanya desktop (mobile tanpa 3D agar ringan) */}
    {!isMobile && (
      <div className="spline-stage relative w-full h-[100dvh] overflow-hidden">
        {/* Latar dekoratif — glow oranye + grid halus + vignette */}
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-[radial-gradient(60%_55%_at_50%_45%,rgba(244,152,39,0.14),transparent_72%)]" />
          <div className="absolute inset-0 opacity-[0.05] bg-[linear-gradient(to_right,#f49827_1px,transparent_1px),linear-gradient(to_bottom,#f49827_1px,transparent_1px)] bg-[length:72px_72px]" />
          <div className="spline-vignette absolute inset-0 bg-[radial-gradient(120%_80%_at_50%_50%,transparent_45%,var(--c-page)_100%)]" />
          <div className="spline-vignette absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-page to-transparent" />
          <div className="spline-vignette absolute inset-x-0 bottom-0 h-44 bg-gradient-to-t from-page to-transparent" />
        </div>

        <LazySpline
          className="spline-canvas relative h-full w-full"
          scene="https://prod.spline.design/8ufRTCPYeGa0xO1S/scene.splinecode"
          placeholder={
            <div className="h-full w-full bg-[radial-gradient(50%_50%_at_50%_50%,rgba(244,152,39,0.12),transparent_70%)]" />
          }
        />
        <div className="spline-bottom-bar absolute bottom-0 left-0 w-full h-[3.5rem] bg-page z-[90]"></div>
      </div>
    )}

      <section id='contact'>
        <ContactHeader/>
        <Contact/>
      </section>

      <Footer/>
    </div>
  );
};

export default User;
