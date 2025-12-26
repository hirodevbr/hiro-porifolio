/**
 * Sistema de gerenciamento de cache automático
 * Limpa caches antigos quando detecta nova versão do app
 */

const APP_VERSION_KEY = "app_version";
const CURRENT_VERSION = Date.now().toString(); // Versão baseada em timestamp

/**
 * Limpa todos os caches do localStorage (exceto dados importantes)
 */
export function clearOldCaches() {
  if (typeof window === "undefined") return;

  try {
    const keysToKeep = [
      // Manter preferências do usuário
      "language_preference",
      // Não limpar cache de letras (pode ser útil)
      // "spotifyLyricsCache:v1",
    ];

    const keysToRemove: string[] = [];

    // Coleta todas as chaves do localStorage
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && !keysToKeep.includes(key)) {
        // Remove apenas caches antigos (que começam com padrões conhecidos)
        if (
          key.startsWith("github_") ||
          key.startsWith("cache_") ||
          key.startsWith("temp_") ||
          key.includes("_cache") ||
          key.includes("_Cache")
        ) {
          keysToRemove.push(key);
        }
      }
    }

    // Remove caches antigos
    keysToRemove.forEach((key) => {
      try {
        localStorage.removeItem(key);
      } catch {
        // Ignora erros
      }
    });

    console.log(`Cache limpo: ${keysToRemove.length} itens removidos`);
  } catch (error) {
    console.error("Erro ao limpar cache:", error);
  }
}

/**
 * Verifica se há nova versão e limpa cache se necessário
 */
export function checkAndClearCache() {
  if (typeof window === "undefined") return;

  try {
    const storedVersion = localStorage.getItem(APP_VERSION_KEY);

    // Se não tem versão armazenada ou versão mudou, limpa cache
    if (!storedVersion || storedVersion !== CURRENT_VERSION) {
      console.log("Nova versão detectada, limpando cache...");
      clearOldCaches();
      localStorage.setItem(APP_VERSION_KEY, CURRENT_VERSION);
    }
  } catch (error) {
    console.error("Erro ao verificar versão:", error);
  }
}

/**
 * Limpa cache do Service Worker
 */
export async function clearServiceWorkerCache() {
  if (typeof window === "undefined" || !("caches" in window)) return;

  try {
    const cacheNames = await caches.keys();
    const currentCaches = ["portfolio-cache-v3", "portfolio-runtime-v3"];

    // Remove caches antigos (que não são os atuais)
    const oldCaches = cacheNames.filter(
      (name) => !currentCaches.includes(name)
    );

    await Promise.all(oldCaches.map((name) => caches.delete(name)));

    if (oldCaches.length > 0) {
      console.log(`Service Worker cache limpo: ${oldCaches.length} caches removidos`);
    }
  } catch (error) {
    console.error("Erro ao limpar Service Worker cache:", error);
  }
}

/**
 * Inicializa o sistema de limpeza de cache
 */
export function initCacheManager() {
  if (typeof window === "undefined") return;

  // Verifica e limpa na inicialização
  checkAndClearCache();
  clearServiceWorkerCache();

  // Limpa cache periodicamente (a cada 24h)
  setInterval(() => {
    checkAndClearCache();
    clearServiceWorkerCache();
  }, 24 * 60 * 60 * 1000);
}

