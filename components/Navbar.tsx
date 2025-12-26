"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X, Github, Instagram, Twitter, Globe } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { trackEvent, trackSocialClick } from "@/lib/analytics";

export default function Navbar() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isLanguageMenuOpen, setIsLanguageMenuOpen] = useState(false);
  const { language, setLanguage, t } = useLanguage();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    // Fechar menu de idioma ao clicar fora
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest('.language-selector')) {
        setIsLanguageMenuOpen(false);
      }
    };

    if (isLanguageMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isLanguageMenuOpen]);

  const navItems = [
    { key: "nav_home", href: "#home" },
    { key: "nav_about", href: "#about" },
    { key: "nav_skills", href: "#skills" },
    { key: "nav_projects", href: "#projects" },
    { key: "nav_discord", href: "#discord" },
    { key: "nav_contact", href: "#contact" },
  ];

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
      
      // Tracking de navegação
      trackEvent({
        action: "navigate_section",
        category: "navigation",
        label: targetId,
      });
      
      // Fechar menu mobile se estiver aberto
      setIsMobileMenuOpen(false);
    }
  };

  return (
    <motion.nav
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled
          ? "bg-black/60 backdrop-blur-xl border-b border-white/10 shadow-lg"
          : "bg-transparent"
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <motion.a
            href="#home"
            onClick={(e) => handleSmoothScroll(e, "#home")}
            className="text-2xl font-bold text-white cursor-pointer focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-black rounded"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            aria-label="Ir para o início"
          >
            Samuel.dev
          </motion.a>

          {/* Desktop Menu */}
          <div className="hidden md:flex items-center space-x-8">
            {navItems.map((item) => (
              <motion.a
                key={item.key}
                href={item.href}
                onClick={(e) => handleSmoothScroll(e, item.href)}
                className="text-gray-300 hover:text-white transition-all cursor-pointer focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-black rounded px-2 py-1 relative group"
                whileHover={{ y: -2 }}
                whileTap={{ y: 0 }}
                aria-label={`Navegar para ${t(item.key)}`}
              >
                {t(item.key)}
                <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-white transition-all duration-300 group-hover:w-full"></span>
              </motion.a>
            ))}
            {/* Language Selector */}
            <div className="relative language-selector">
              <motion.button
                onClick={() => setIsLanguageMenuOpen(!isLanguageMenuOpen)}
                onKeyDown={(e) => {
                  if (e.key === "Escape") {
                    setIsLanguageMenuOpen(false);
                  }
                }}
                className="flex items-center gap-2 text-gray-300 hover:text-white transition-all focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-black rounded px-2 py-1 hover-lift"
                whileHover={{ scale: 1.1, rotate: 5 }}
                whileTap={{ scale: 0.95 }}
                aria-label="Selecionar idioma"
                aria-expanded={isLanguageMenuOpen}
                aria-haspopup="true"
              >
                <Globe className="w-5 h-5" />
                <span className="text-sm font-medium">{language === "pt_BR" ? "PT" : "EN"}</span>
              </motion.button>
              <AnimatePresence>
                {isLanguageMenuOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="absolute right-0 mt-2 w-32 bg-black/70 backdrop-blur-xl rounded-lg shadow-lg border border-white/10 overflow-hidden z-50"
                    role="menu"
                    aria-label="Menu de seleção de idioma"
                  >
                    <button
                      onClick={() => {
                        setLanguage("pt_BR");
                        setIsLanguageMenuOpen(false);
                      }}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault();
                          setLanguage("pt_BR");
                          setIsLanguageMenuOpen(false);
                        }
                      }}
                      className={`w-full px-4 py-2 text-left text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-white focus:ring-inset ${
                        language === "pt_BR"
                          ? "bg-white/10 text-white"
                          : "text-gray-300 hover:bg-white/10"
                      }`}
                      role="menuitem"
                      aria-label="Selecionar Português (BR)"
                    >
                      Português (BR)
                    </button>
                    <button
                      onClick={() => {
                        setLanguage("en_US");
                        setIsLanguageMenuOpen(false);
                      }}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault();
                          setLanguage("en_US");
                          setIsLanguageMenuOpen(false);
                        }
                      }}
                      className={`w-full px-4 py-2 text-left text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-white focus:ring-inset ${
                        language === "en_US"
                          ? "bg-white/10 text-white"
                          : "text-gray-300 hover:bg-white/10"
                      }`}
                      role="menuitem"
                      aria-label="Selecionar English (US)"
                    >
                      English (US)
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
            <div className="flex items-center space-x-4">
              <motion.a
                href="https://github.com/hirodevbr"
                target="_blank"
                rel="noopener noreferrer"
                whileHover={{ scale: 1.15, rotate: 5, y: -2 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => trackSocialClick("GitHub", "https://github.com/hirodevbr")}
                className="focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-black rounded hover-lift"
                aria-label="Visitar perfil no GitHub (abre em nova aba)"
              >
                <Github className="w-5 h-5 text-gray-300 hover:text-white transition-all" />
              </motion.a>
              <motion.a
                href="https://instagram.com/sxmu.slv"
                target="_blank"
                rel="noopener noreferrer"
                whileHover={{ scale: 1.15, rotate: -5, y: -2 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => trackSocialClick("Instagram", "https://instagram.com/sxmu.slv")}
                className="focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-black rounded hover-lift"
                aria-label="Visitar perfil no Instagram (abre em nova aba)"
              >
                <Instagram className="w-5 h-5 text-gray-300 hover:text-white transition-all" />
              </motion.a>
              <motion.a
                href="https://twitter.com/virtualhiro"
                target="_blank"
                rel="noopener noreferrer"
                whileHover={{ scale: 1.15, rotate: 5, y: -2 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => trackSocialClick("Twitter", "https://twitter.com/virtualhiro")}
                className="focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-black rounded hover-lift"
                aria-label="Visitar perfil no Twitter (abre em nova aba)"
              >
                <Twitter className="w-5 h-5 text-gray-300 hover:text-white transition-all" />
              </motion.a>
            </div>
          </div>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden text-gray-300 hover:text-white transition-colors"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            aria-label={isMobileMenuOpen ? "Fechar menu" : "Abrir menu"}
            aria-expanded={isMobileMenuOpen}
            aria-controls="mobile-menu"
          >
            {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            id="mobile-menu"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden bg-black/70 backdrop-blur-xl border-t border-white/10"
            role="menu"
            aria-label="Menu de navegação mobile"
          >
            <div className="px-4 pt-2 pb-4 space-y-2">
              {navItems.map((item) => (
                <a
                  key={item.key}
                  href={item.href}
                  onClick={(e) => {
                    handleSmoothScroll(e, item.href);
                    setIsMobileMenuOpen(false);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      const targetId = item.href.replace("#", "");
                      const targetElement = document.getElementById(targetId);
                      if (targetElement) {
                        const offset = 80;
                        const targetPosition = targetElement.offsetTop - offset;
                        window.scrollTo({
                          top: targetPosition,
                          behavior: "smooth",
                        });
                        setIsMobileMenuOpen(false);
                      }
                    }
                  }}
                  className="block px-3 py-2 text-gray-300 hover:text-white hover:bg-white/10 rounded-md transition-colors cursor-pointer focus:outline-none focus:ring-2 focus:ring-white focus:ring-inset"
                  role="menuitem"
                  aria-label={`Navegar para ${t(item.key)}`}
                >
                  {t(item.key)}
                </a>
              ))}
              {/* Mobile Language Selector */}
              <div className="px-3 py-2 flex items-center gap-2">
                <Globe className="w-4 h-4 text-gray-400" aria-hidden="true" />
                <button
                  onClick={() => setLanguage("pt_BR")}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      setLanguage("pt_BR");
                    }
                  }}
                  className={`text-sm px-2 py-1 rounded focus:outline-none focus:ring-2 focus:ring-white focus:ring-inset ${
                    language === "pt_BR"
                      ? "bg-white/10 text-white"
                      : "text-gray-400 hover:text-gray-300"
                  }`}
                  aria-label="Selecionar Português (BR)"
                >
                  PT
                </button>
                <span className="text-gray-600" aria-hidden="true">|</span>
                <button
                  onClick={() => setLanguage("en_US")}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      setLanguage("en_US");
                    }
                  }}
                  className={`text-sm px-2 py-1 rounded focus:outline-none focus:ring-2 focus:ring-white focus:ring-inset ${
                    language === "en_US"
                      ? "bg-white/10 text-white"
                      : "text-gray-400 hover:text-gray-300"
                  }`}
                  aria-label="Selecionar English (US)"
                >
                  EN
                </button>
              </div>
              <div className="flex items-center space-x-4 pt-4 px-3">
                <a
                  href="https://github.com/hirodevbr"
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => trackSocialClick("GitHub", "https://github.com/hirodevbr")}
                  className="focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-black rounded"
                  aria-label="Visitar perfil no GitHub (abre em nova aba)"
                >
                  <Github className="w-5 h-5 text-gray-300 hover:text-white" />
                </a>
                <a
                  href="https://instagram.com/sxmu.slv"
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => trackSocialClick("Instagram", "https://instagram.com/sxmu.slv")}
                  className="focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-black rounded"
                  aria-label="Visitar perfil no Instagram (abre em nova aba)"
                >
                  <Instagram className="w-5 h-5 text-gray-300 hover:text-white" />
                </a>
                <a
                  href="https://twitter.com/virtualhiro"
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => trackSocialClick("Twitter", "https://twitter.com/virtualhiro")}
                  className="focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-black rounded"
                  aria-label="Visitar perfil no Twitter (abre em nova aba)"
                >
                  <Twitter className="w-5 h-5 text-gray-300 hover:text-white" />
                </a>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.nav>
  );
}

