"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { RefreshCw, X } from "lucide-react";
import { initCacheManager, checkAndClearCache } from "@/lib/cacheManager";
import { useLanguage } from "@/contexts/LanguageContext";

export default function RegisterSW() {
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const [registration, setRegistration] = useState<ServiceWorkerRegistration | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const { language } = useLanguage();

  // Textos multilíngue
  const texts = {
    pt_BR: {
      title: "Nova versão disponível!",
      message: "Uma nova versão do site está disponível. Deseja atualizar agora?",
      updateButton: "Atualizar Agora",
      laterButton: "Depois",
      updating: "Atualizando...",
    },
    en_US: {
      title: "New version available!",
      message: "A new version of the site is available. Would you like to update now?",
      updateButton: "Update Now",
      laterButton: "Later",
      updating: "Updating...",
    },
  };

  const t = texts[language] || texts.pt_BR;

  useEffect(() => {
    // Inicializa sistema de limpeza de cache
    initCacheManager();
    
    // Em desenvolvimento, service worker costuma quebrar HMR/cache do Next.
    // Então a gente desregistra e não registra novamente.
    if (process.env.NODE_ENV !== "production") {
      if (typeof window !== "undefined" && "serviceWorker" in navigator) {
        navigator.serviceWorker
          .getRegistrations()
          .then((regs) => Promise.all(regs.map((r) => r.unregister())))
          .catch(() => {});
      }
      return;
    }

    if (
      typeof window !== "undefined" &&
      "serviceWorker" in navigator
    ) {
      // Verificar se já existe um service worker esperando
      navigator.serviceWorker.ready.then((reg) => {
        if (reg.waiting) {
          setUpdateAvailable(true);
          setRegistration(reg);
        }
      });

      // Registrar service worker (somente em produção)
      navigator.serviceWorker
        .register("/sw.js", {
          scope: "/",
        })
        .then((reg) => {
          setRegistration(reg);
          console.log("Service Worker registrado com sucesso:", reg);

          // Verificar atualizações periodicamente
          const checkInterval = setInterval(() => {
            reg.update();
          }, 60000); // Verificar a cada minuto

          // Detectar quando uma nova versão está disponível
          reg.addEventListener("updatefound", () => {
            const newWorker = reg.installing;
            if (newWorker) {
              newWorker.addEventListener("statechange", () => {
                if (newWorker.state === "installed") {
                  // Se já existe um controller, significa que é uma atualização
                  if (navigator.serviceWorker.controller) {
                    setUpdateAvailable(true);
                  }
                }
              });
            }
          });

          // Verificar se há um service worker esperando
          if (reg.waiting) {
            setUpdateAvailable(true);
          }

          // Limpar intervalo quando componente desmontar
          return () => clearInterval(checkInterval);
        })
        .catch((error) => {
          console.error("Erro ao registrar Service Worker:", error);
        });

      // Detectar quando o service worker assume controle
      navigator.serviceWorker.addEventListener("controllerchange", () => {
        // Limpa cache antes de recarregar
        checkAndClearCache();
        window.location.reload();
      });

      // Escuta mensagens do Service Worker
      navigator.serviceWorker.addEventListener("message", (event) => {
        if (event.data) {
          if (event.data.type === "CLEAR_CACHE") {
            checkAndClearCache();
          }
          // Detecta quando uma nova versão está disponível via mensagem
          if (event.data.type === "NEW_VERSION_AVAILABLE") {
            setUpdateAvailable(true);
          }
        }
      });
    }
  }, []);

  const handleUpdate = () => {
    if (registration?.waiting) {
      setIsUpdating(true);
      registration.waiting.postMessage({ type: "SKIP_WAITING" });
      
      // Aguardar um pouco antes de recarregar para garantir que a mensagem foi processada
      setTimeout(() => {
        checkAndClearCache();
        window.location.reload();
      }, 100);
    }
  };

  const handleLater = () => {
    setUpdateAvailable(false);
    // Mostrar novamente após 5 minutos
    setTimeout(() => {
      if (registration?.waiting) {
        setUpdateAvailable(true);
      }
    }, 5 * 60 * 1000);
  };

  return (
    <AnimatePresence>
      {updateAvailable && (
        <motion.div
          initial={{ opacity: 0, y: 20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.95 }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
          className="fixed bottom-4 right-4 z-[10000] max-w-sm w-full mx-4"
        >
          <div className="bg-gray-900/95 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl overflow-hidden">
            {/* Header com gradiente */}
            <div className="bg-gradient-to-r from-indigo-600 to-purple-600 px-6 py-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                  >
                    <RefreshCw className="w-5 h-5 text-white" />
                  </motion.div>
                  <h3 className="text-white font-semibold text-lg">{t.title}</h3>
                </div>
                <button
                  onClick={handleLater}
                  className="text-white/80 hover:text-white transition-colors"
                  aria-label="Fechar"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Conteúdo */}
            <div className="px-6 py-4">
              <p className="text-gray-300 text-sm mb-4 leading-relaxed">
                {t.message}
              </p>

              {/* Botões */}
              <div className="flex gap-3">
                <button
                  onClick={handleUpdate}
                  disabled={isUpdating}
                  className="flex-1 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-600/50 disabled:cursor-not-allowed text-white font-semibold py-2.5 px-4 rounded-lg transition-all duration-200 flex items-center justify-center gap-2"
                >
                  {isUpdating ? (
                    <>
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                      >
                        <RefreshCw className="w-4 h-4" />
                      </motion.div>
                      <span>{t.updating}</span>
                    </>
                  ) : (
                    t.updateButton
                  )}
                </button>
                <button
                  onClick={handleLater}
                  disabled={isUpdating}
                  className="px-4 py-2.5 text-gray-400 hover:text-gray-300 font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {t.laterButton}
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

