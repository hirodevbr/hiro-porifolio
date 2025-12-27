"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Smartphone, Monitor } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

export default function MobileSyncWarning() {
  const [show, setShow] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const { language } = useLanguage();

  // Textos multilíngue
  const texts = {
    pt_BR: {
      title: "Aviso de Sincronização",
      message: "Em dispositivos móveis, a sincronização do relógio e do Spotify pode não funcionar corretamente. Para a melhor experiência, recomendamos usar o desktop.",
      button: "Entendi",
    },
    en_US: {
      title: "Sync Warning",
      message: "On mobile devices, clock and Spotify synchronization may not work correctly. For the best experience, we recommend using desktop.",
      button: "Got it",
    },
  };

  const t = texts[language] || texts.pt_BR;

  useEffect(() => {
    // Detecta se é mobile
    const checkMobile = () => {
      const ua = navigator.userAgent;
      const mobile = /Mobile|Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(ua);
      setIsMobile(mobile);
      
      if (mobile) {
        // Sempre mostra em mobile
        setShow(true);
      }
    };

    checkMobile();
  }, []);

  const handleDismiss = () => {
    setShow(false);
    // Não salva no localStorage - aparece toda vez que abrir o site
  };

  if (!isMobile || !show) return null;

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0, y: 20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.95 }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
          className="fixed bottom-4 left-4 right-4 z-[10001] max-w-md mx-auto"
        >
          <div className="bg-amber-900/95 backdrop-blur-xl border border-amber-700/50 rounded-2xl shadow-2xl overflow-hidden">
            {/* Header */}
            <div className="bg-gradient-to-r from-amber-800 to-orange-800 px-4 py-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Smartphone className="w-5 h-5 text-white" />
                  <h3 className="text-white font-semibold text-base">{t.title}</h3>
                </div>
                <button
                  onClick={handleDismiss}
                  className="text-white/80 hover:text-white transition-colors"
                  aria-label="Fechar"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Conteúdo */}
            <div className="px-4 py-4">
              <div className="flex items-start gap-3 mb-4">
                <div className="flex-shrink-0 mt-0.5">
                  <Monitor className="w-5 h-5 text-amber-400" />
                </div>
                <p className="text-amber-100 text-sm leading-relaxed flex-1">
                  {t.message}
                </p>
              </div>

              {/* Botão */}
              <button
                onClick={handleDismiss}
                className="w-full bg-amber-700 hover:bg-amber-600 text-white font-semibold py-2.5 px-4 rounded-lg transition-all duration-200 flex items-center justify-center gap-2"
              >
                <span>{t.button}</span>
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

