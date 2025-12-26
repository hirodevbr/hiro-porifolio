"use client";

import { useEffect, useState } from "react";
import { initCacheManager, checkAndClearCache } from "@/lib/cacheManager";

export default function RegisterSW() {
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const [registration, setRegistration] = useState<ServiceWorkerRegistration | null>(null);

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
      // Registrar service worker (somente em produção)
      navigator.serviceWorker
        .register("/sw.js", {
          scope: "/",
        })
        .then((reg) => {
          setRegistration(reg);
          console.log("Service Worker registrado com sucesso:", reg);

          // Verificar atualizações periodicamente
          setInterval(() => {
            reg.update();
          }, 60000); // Verificar a cada minuto

          // Detectar quando uma nova versão está disponível
          reg.addEventListener("updatefound", () => {
            const newWorker = reg.installing;
            if (newWorker) {
              newWorker.addEventListener("statechange", () => {
                if (newWorker.state === "installed" && navigator.serviceWorker.controller) {
                  // Nova versão disponível
                  setUpdateAvailable(true);
                }
              });
            }
          });
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

      // Escuta mensagens do Service Worker para limpar cache
      navigator.serviceWorker.addEventListener("message", (event) => {
        if (event.data && event.data.type === "CLEAR_CACHE") {
          checkAndClearCache();
        }
      });
    }
  }, []);

  const handleUpdate = () => {
    if (registration?.waiting) {
      registration.waiting.postMessage({ type: "SKIP_WAITING" });
      setUpdateAvailable(false);
      window.location.reload();
    }
  };

  return (
    <>
      {updateAvailable && (
        <div
          style={{
            position: "fixed",
            bottom: "20px",
            right: "20px",
            background: "#6366f1",
            color: "white",
            padding: "16px 24px",
            borderRadius: "8px",
            boxShadow: "0 4px 6px rgba(0, 0, 0, 0.3)",
            zIndex: 10000,
            maxWidth: "300px",
          }}
        >
          <p style={{ marginBottom: "12px", fontSize: "14px" }}>
            Nova versão disponível!
          </p>
          <button
            onClick={handleUpdate}
            style={{
              background: "white",
              color: "#6366f1",
              border: "none",
              padding: "8px 16px",
              borderRadius: "4px",
              cursor: "pointer",
              fontWeight: "600",
              width: "100%",
            }}
          >
            Atualizar Agora
          </button>
        </div>
      )}
    </>
  );
}

