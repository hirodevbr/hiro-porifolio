"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowUp } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

export default function ScrollToTop() {
  const { t } = useLanguage();
  const [isVisible, setIsVisible] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const toggleVisibility = () => {
      // Limpar timeout anterior se existir
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      // Usar debounce para evitar atualizações muito frequentes
      timeoutRef.current = setTimeout(() => {
        const shouldShow = window.pageYOffset > 300;
        
        // Só atualizar o estado se realmente mudou
        setIsVisible((prev) => {
          if (prev !== shouldShow) {
            return shouldShow;
          }
          return prev;
        });
      }, 100); // Debounce de 100ms
    };

    // Verificar visibilidade inicial
    toggleVisibility();

    window.addEventListener("scroll", toggleVisibility, { passive: true });

    return () => {
      window.removeEventListener("scroll", toggleVisibility);
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  return (
    <AnimatePresence mode="wait">
      {isVisible && (
        <motion.button
          initial={{ opacity: 0, scale: 0 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0 }}
          transition={{ duration: 0.2 }}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={scrollToTop}
          className="fixed bottom-8 right-8 z-50 p-4 bg-primary-600 rounded-full shadow-lg shadow-primary-500/50 hover:shadow-xl hover:shadow-primary-500/50 transition-all focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 focus:ring-offset-gray-900"
          aria-label={t("scroll_to_top")}
        >
          <ArrowUp className="w-6 h-6 text-white" aria-hidden="true" />
        </motion.button>
      )}
    </AnimatePresence>
  );
}






