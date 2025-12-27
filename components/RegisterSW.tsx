"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { RefreshCw, X, Clock } from "lucide-react";
import { initCacheManager, checkAndClearCache } from "@/lib/cacheManager";
import { useLanguage } from "@/contexts/LanguageContext";

export default function RegisterSW() {
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const [registration, setRegistration] = useState<ServiceWorkerRegistration | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const [countdown, setCountdown] = useState(10);
  const [autoUpdateEnabled, setAutoUpdateEnabled] = useState(true);
  const countdownIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const { language } = useLanguage();

  // Textos multilíngue
  const texts = {
    pt_BR: {
      title: "Nova versão disponível!",
      message: "Uma nova versão do site está disponível. O site será atualizado automaticamente em",
      updateButton: "Atualizar Agora",
      laterButton: "Cancelar",
      updating: "Atualizando...",
      seconds: "segundos",
      second: "segundo",
    },
    en_US: {
      title: "New version available!",
      message: "A new version of the site is available. The site will be updated automatically in",
      updateButton: "Update Now",
      laterButton: "Cancel",
      updating: "Updating...",
      seconds: "seconds",
      second: "second",
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

  const handleUpdate = useCallback(() => {
    if (registration?.waiting) {
      setIsUpdating(true);
      setAutoUpdateEnabled(false);
      
      // Limpa o countdown
      if (countdownIntervalRef.current) {
        clearInterval(countdownIntervalRef.current);
        countdownIntervalRef.current = null;
      }
      
      registration.waiting.postMessage({ type: "SKIP_WAITING" });
      
      // Aguardar um pouco antes de recarregar para garantir que a mensagem foi processada
      setTimeout(() => {
        checkAndClearCache();
        window.location.reload();
      }, 100);
    }
  }, [registration]);

  // Inicia countdown quando updateAvailable muda para true
  useEffect(() => {
    if (updateAvailable && autoUpdateEnabled) {
      setCountdown(10);
      
      countdownIntervalRef.current = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            // Atualiza automaticamente quando chega a 0
            handleUpdate();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (countdownIntervalRef.current) {
        clearInterval(countdownIntervalRef.current);
        countdownIntervalRef.current = null;
      }
    }

    return () => {
      if (countdownIntervalRef.current) {
        clearInterval(countdownIntervalRef.current);
        countdownIntervalRef.current = null;
      }
    };
  }, [updateAvailable, autoUpdateEnabled, handleUpdate]);

  const handleCancel = () => {
    setUpdateAvailable(false);
    setAutoUpdateEnabled(false);
    
    // Limpa o countdown
    if (countdownIntervalRef.current) {
      clearInterval(countdownIntervalRef.current);
      countdownIntervalRef.current = null;
    }
    
    // Mostrar novamente após 5 minutos
    setTimeout(() => {
      if (registration?.waiting) {
        setUpdateAvailable(true);
        setAutoUpdateEnabled(true);
      }
    }, 5 * 60 * 1000);
  };

  return (
    <AnimatePresence>
      {updateAvailable && (
        <>
          {/* Overlay escuro com blur */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[10000]"
            onClick={handleCancel}
          />

          {/* Modal centralizado */}
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="fixed inset-0 z-[10001] flex items-center justify-center p-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="bg-gray-900/98 backdrop-blur-xl border border-white/20 rounded-3xl shadow-2xl overflow-hidden max-w-md w-full">
              {/* Header com gradiente animado */}
              <div className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 px-6 py-5 relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-r from-indigo-600/50 via-purple-600/50 to-pink-600/50 animate-pulse" />
                <div className="relative flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                      className="bg-white/20 p-2 rounded-full"
                    >
                      <RefreshCw className="w-6 h-6 text-white" />
                    </motion.div>
                    <h3 className="text-white font-bold text-xl">{t.title}</h3>
                  </div>
                  <button
                    onClick={handleCancel}
                    className="text-white/80 hover:text-white transition-colors bg-white/10 hover:bg-white/20 p-1.5 rounded-full"
                    aria-label="Fechar"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Conteúdo */}
              <div className="px-6 py-6">
                <p className="text-gray-200 text-base mb-6 leading-relaxed">
                  {t.message}{" "}
                  <span className="inline-flex items-center gap-1.5 font-semibold text-indigo-400">
                    <Clock className="w-4 h-4" />
                    <motion.span
                      key={countdown}
                      initial={{ scale: 1.2, color: "#818cf8" }}
                      animate={{ scale: 1, color: "#818cf8" }}
                      transition={{ duration: 0.3 }}
                      className="tabular-nums"
                    >
                      {countdown}
                    </motion.span>
                    {countdown === 1 ? ` ${t.second}` : ` ${t.seconds}`}
                  </span>
                </p>

                {/* Barra de progresso do countdown */}
                <div className="mb-6 h-2 bg-gray-800/50 rounded-full overflow-hidden">
                  <motion.div
                    className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full"
                    initial={{ width: "100%" }}
                    animate={{ width: `${(countdown / 10) * 100}%` }}
                    transition={{ duration: 1, ease: "linear", repeat: Infinity }}
                  />
                </div>

                {/* Botões */}
                <div className="flex gap-3">
                  <button
                    onClick={handleUpdate}
                    disabled={isUpdating}
                    className="flex-1 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 disabled:from-indigo-600/50 disabled:to-purple-600/50 disabled:cursor-not-allowed text-white font-semibold py-3 px-6 rounded-xl transition-all duration-200 flex items-center justify-center gap-2 shadow-lg shadow-indigo-500/30 hover:shadow-indigo-500/50"
                  >
                    {isUpdating ? (
                      <>
                        <motion.div
                          animate={{ rotate: 360 }}
                          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                        >
                          <RefreshCw className="w-5 h-5" />
                        </motion.div>
                        <span>{t.updating}</span>
                      </>
                    ) : (
                      <>
                        <RefreshCw className="w-5 h-5" />
                        <span>{t.updateButton}</span>
                      </>
                    )}
                  </button>
                  <button
                    onClick={handleCancel}
                    disabled={isUpdating}
                    className="px-6 py-3 text-gray-400 hover:text-gray-200 font-medium rounded-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed bg-gray-800/50 hover:bg-gray-800 border border-gray-700/50"
                  >
                    {t.laterButton}
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

