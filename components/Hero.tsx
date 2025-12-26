"use client";

import { motion, useMotionValue, useSpring, useTransform, useScroll } from "framer-motion";
import { ArrowDown, Code, Sparkles } from "lucide-react";
import Image from "next/image";
import { useEffect, useRef } from "react";
import { useLanguage } from "@/contexts/LanguageContext";

export default function Hero() {
  const { t } = useLanguage();
  const sectionRef = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start start", "end start"],
  });
  
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  
  // Valores de movimento suave para os círculos principais
  const circle1XSpring = useSpring(0, { stiffness: 50, damping: 20 });
  const circle1YSpring = useSpring(0, { stiffness: 50, damping: 20 });
  const circle2XSpring = useSpring(0, { stiffness: 50, damping: 20 });
  const circle2YSpring = useSpring(0, { stiffness: 50, damping: 20 });

  // Valores para movimento automático
  const autoMove1X = useMotionValue(0);
  const autoMove1Y = useMotionValue(0);
  const autoMove2X = useMotionValue(0);
  const autoMove2Y = useMotionValue(0);

  // Combinar movimento automático com movimento do mouse
  const circle1X = useTransform([autoMove1X, circle1XSpring], ([auto, mouse]: number[]) => auto + mouse);
  const circle1Y = useTransform([autoMove1Y, circle1YSpring], ([auto, mouse]: number[]) => auto + mouse);
  const circle2X = useTransform([autoMove2X, circle2XSpring], ([auto, mouse]: number[]) => auto + mouse);
  const circle2Y = useTransform([autoMove2Y, circle2YSpring], ([auto, mouse]: number[]) => auto + mouse);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      const x = (e.clientX / window.innerWidth - 0.5) * 20;
      const y = (e.clientY / window.innerHeight - 0.5) * 20;
      
      mouseX.set(x);
      mouseY.set(y);
      
      // Atualizar valores de movimento suave do mouse
      circle1XSpring.set(x * 0.3);
      circle1YSpring.set(y * 0.3);
      circle2XSpring.set(-x * 0.3);
      circle2YSpring.set(-y * 0.3);
    };

    // Animar movimento automático
    const interval1X = setInterval(() => {
      autoMove1X.set(Math.sin(Date.now() / 20000) * 50);
    }, 16);
    const interval1Y = setInterval(() => {
      autoMove1Y.set(Math.cos(Date.now() / 15000) * -40);
    }, 16);
    const interval2X = setInterval(() => {
      autoMove2X.set(Math.sin(Date.now() / 18000) * -60);
    }, 16);
    const interval2Y = setInterval(() => {
      autoMove2Y.set(Math.cos(Date.now() / 22000) * 50);
    }, 16);

    window.addEventListener("mousemove", handleMouseMove);
    
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      clearInterval(interval1X);
      clearInterval(interval1Y);
      clearInterval(interval2X);
      clearInterval(interval2Y);
    };
  }, [mouseX, mouseY, circle1XSpring, circle1YSpring, circle2XSpring, circle2YSpring, autoMove1X, autoMove1Y, autoMove2X, autoMove2Y]);

  const handleSmoothScroll = (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    e.preventDefault();
    const targetId = href.replace("#", "");
    const targetElement = document.getElementById(targetId);
    
    if (targetElement) {
      const offset = 80; // Altura da navbar
      const targetPosition = targetElement.offsetTop - offset;
      
      window.scrollTo({
        top: targetPosition,
        behavior: "smooth",
      });
    }
  };

  // Efeito parallax para os círculos de fundo
  const parallaxY1 = useTransform(scrollYProgress, [0, 1], [0, -100]);
  const parallaxY2 = useTransform(scrollYProgress, [0, 1], [0, 100]);
  const parallaxY3 = useTransform(scrollYProgress, [0, 1], [0, -80]);
  const parallaxY4 = useTransform(scrollYProgress, [0, 1], [0, 80]);

  return (
    <section
      id="home"
      ref={sectionRef}
      className="min-h-screen flex items-center justify-center relative overflow-hidden pt-16"
    >
      {/* Background Effects */}
      <div className="absolute inset-0 overflow-hidden">
        {/* Círculo principal azul - movimento flutuante com parallax */}
        <motion.div
          className="absolute top-1/4 left-1/4 w-96 h-96 bg-white/6 rounded-full blur-3xl parallax-container"
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{
            opacity: [0.3, 0.5, 0.3],
            scale: [1, 1.2, 1],
          }}
          transition={{
            opacity: { duration: 4, repeat: Infinity, ease: "easeInOut" },
            scale: { duration: 6, repeat: Infinity, ease: "easeInOut" },
          }}
          style={{
            x: circle1X,
            y: useTransform([circle1Y, parallaxY1], ([circle, parallax]: number[]) => circle + parallax),
          }}
        />
        
        {/* Círculo roxo - movimento flutuante com parallax */}
        <motion.div
          className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-white/5 rounded-full blur-3xl parallax-container"
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{
            opacity: [0.3, 0.5, 0.3],
            scale: [1, 1.3, 1],
          }}
          transition={{
            opacity: { duration: 5, repeat: Infinity, ease: "easeInOut" },
            scale: { duration: 7, repeat: Infinity, ease: "easeInOut" },
          }}
          style={{
            x: circle2X,
            y: useTransform([circle2Y, parallaxY2], ([circle, parallax]: number[]) => circle + parallax),
          }}
        />
        
        {/* Círculo secundário azul - movimento mais lento com parallax */}
        <motion.div
          className="absolute top-1/2 right-1/3 w-72 h-72 bg-white/4 rounded-full blur-3xl parallax-container"
          initial={{ opacity: 0, scale: 0 }}
          animate={{
            opacity: [0.2, 0.4, 0.2],
            scale: [0.8, 1.1, 0.8],
            x: [0, 30, -20, 0],
          }}
          transition={{
            opacity: { duration: 6, repeat: Infinity, ease: "easeInOut" },
            scale: { duration: 8, repeat: Infinity, ease: "easeInOut" },
            x: {
              duration: 25,
              repeat: Infinity,
              ease: "easeInOut",
            },
          }}
          style={{
            y: useTransform([parallaxY3], ([parallax]) => parallax),
          }}
        />
        
        {/* Círculo secundário roxo - movimento mais lento com parallax */}
        <motion.div
          className="absolute bottom-1/3 left-1/3 w-80 h-80 bg-white/4 rounded-full blur-3xl parallax-container"
          initial={{ opacity: 0, scale: 0 }}
          animate={{
            opacity: [0.2, 0.35, 0.2],
            scale: [0.9, 1.15, 0.9],
            x: [0, -40, 25, 0],
          }}
          transition={{
            opacity: { duration: 7, repeat: Infinity, ease: "easeInOut" },
            scale: { duration: 9, repeat: Infinity, ease: "easeInOut" },
            x: {
              duration: 23,
              repeat: Infinity,
              ease: "easeInOut",
            },
          }}
          style={{
            y: useTransform([parallaxY4], ([parallax]) => parallax),
          }}
        />
        
        {/* Círculo pequeno decorativo */}
        <motion.div
          className="absolute top-1/3 right-1/4 w-48 h-48 bg-white/3 rounded-full blur-2xl"
          initial={{ opacity: 0 }}
          animate={{
            opacity: [0.1, 0.3, 0.1],
            scale: [1, 1.2, 1],
            rotate: [0, 180, 360],
          }}
          transition={{
            opacity: { duration: 4, repeat: Infinity, ease: "easeInOut" },
            scale: { duration: 5, repeat: Infinity, ease: "easeInOut" },
            rotate: { duration: 30, repeat: Infinity, ease: "linear" },
          }}
        />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="text-center">
          {/* Avatar circular */}
          <motion.div
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, type: "spring", stiffness: 200 }}
            className="mb-8 flex justify-center"
          >
            {/* Foto de perfil em: public/profile/profile.avif */}
            <Image
              src="/profile/profile.avif"
              alt="Foto de perfil"
              width={176}
              height={176}
              priority
              unoptimized
              className="rounded-full w-36 h-36 md:w-44 md:h-44 object-cover object-[50%_25%]"
            />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="mb-6"
          >
            <motion.div
              className="inline-block"
              animate={{ rotate: [0, 10, -10, 0] }}
              transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
            >
              <Sparkles className="w-12 h-12 text-gray-200 mb-4" aria-hidden="true" />
            </motion.div>
            <h2 className="text-gray-200 font-semibold text-lg mb-2">
              {t("hero_greeting")}
            </h2>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="text-5xl md:text-7xl font-bold mb-6 text-white"
          >
              {t("hero_name")}
          </motion.h1>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="flex items-center justify-center gap-2 mb-4"
          >
            <Code className="w-6 h-6 text-gray-200" aria-hidden="true" />
            <h2 className="text-2xl md:text-4xl font-semibold text-gray-300">
              {t("hero_role")}
            </h2>
          </motion.div>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.6 }}
            className="text-lg md:text-xl text-gray-400 max-w-2xl mx-auto mb-8"
          >
            {t("hero_description")}
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.8 }}
            className="flex flex-col sm:flex-row gap-4 justify-center"
          >
            <motion.a
              href="#projects"
              onClick={(e) => handleSmoothScroll(e, "#projects")}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  handleSmoothScroll(e as any, "#projects");
                }
              }}
              className="px-8 py-4 bg-white text-black rounded-lg font-semibold shadow-lg shadow-white/10 hover:shadow-xl hover:shadow-white/15 transition-all cursor-pointer focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-black hover-lift"
              whileHover={{ scale: 1.05, y: -4 }}
              whileTap={{ scale: 0.95 }}
              aria-label={`Navegar para ${t("hero_projects")}`}
            >
              {t("hero_projects")}
            </motion.a>
            <motion.a
              href="#contact"
              onClick={(e) => handleSmoothScroll(e, "#contact")}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  handleSmoothScroll(e as any, "#contact");
                }
              }}
              className="px-8 py-4 border-2 border-white/25 rounded-lg font-semibold text-white hover:bg-white/10 hover:border-white/40 transition-all cursor-pointer focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-black hover-lift"
              whileHover={{ scale: 1.05, y: -4 }}
              whileTap={{ scale: 0.95 }}
              aria-label={`Navegar para ${t("hero_contact")}`}
            >
              {t("hero_contact")}
            </motion.a>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 1 }}
            className="mt-16"
          >
            <motion.a
              href="#about"
              onClick={(e) => handleSmoothScroll(e, "#about")}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  handleSmoothScroll(e as any, "#about");
                }
              }}
              animate={{ y: [0, 10, 0] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="inline-block cursor-pointer focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-black rounded-full"
              aria-label={`Navegar para ${t("about_title")}`}
            >
              <ArrowDown className="w-8 h-8 text-gray-400 hover:text-white transition-colors cursor-pointer" aria-hidden="true" />
            </motion.a>
          </motion.div>
        </div>
      </div>
    </section>
  );
}

