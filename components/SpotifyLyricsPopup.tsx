"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import { AnimatePresence, LayoutGroup, motion } from "framer-motion";
import { ChevronDown, ExternalLink, Loader2, Maximize2, Minimize2, Music2, Play } from "lucide-react";
import { findActiveIndex, parseLrc, type LrcLine } from "@/lib/lrc";
import { getCachedLyrics, setCachedLyrics } from "@/lib/lyricsCache";
import { DISCORD_USER_ID } from "@/lib/config";
import { useLanyardUser, type LanyardSpotify } from "@/lib/lanyardClient";
import { useLanguage } from "@/contexts/LanguageContext";
import {
  getSyncOffset,
  recordDriftMeasurement,
  getBrowserInfo,
  getResyncInterval,
  getDriftThreshold,
} from "@/lib/browserSync";
import {
  recordLatencyMeasurement,
  getCompensatedTime,
  getLatency,
} from "@/lib/latencyCompensator";

type LrclibResponse = {
  syncedLyrics?: string | null;
  plainLyrics?: string | null;
};

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

function formatTime(seconds: number) {
  const s = Math.max(0, Math.floor(seconds));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const ss = s % 60;
  if (h > 0) return `${h}:${String(m).padStart(2, "0")}:${String(ss).padStart(2, "0")}`;
  return `${m}:${String(ss).padStart(2, "0")}`;
}

function safeKey(s: string) {
  return s.trim().toLowerCase();
}

export default function SpotifyLyricsPopup() {
  const { language } = useLanguage();
  const { data } = useLanyardUser(DISCORD_USER_ID);
  const spotify = (data?.spotify ?? null) as LanyardSpotify | null;
  const [collapsed, setCollapsed] = useState(false);
  const [playerOpen, setPlayerOpen] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  const [lyricsRaw, setLyricsRaw] = useState<string | null>(null);
  const [lyricsError, setLyricsError] = useState<string | null>(null);
  const [loadingLyrics, setLoadingLyrics] = useState(false);
  const [fromCache, setFromCache] = useState(false);
  const inflightKeyRef = useRef<string>("");

  const [currentTime, setCurrentTime] = useState(0);

  const activeLineRef = useRef<HTMLButtonElement | null>(null);
  const listRef = useRef<HTMLDivElement | null>(null);
  const plainRef = useRef<HTMLDivElement | null>(null);
  const lastUserScrollAtRef = useRef<number>(0);
  const programmaticScrollRef = useRef(false);
  const prevTrackKeyRef = useRef<string>("");
  const animationFrameRef = useRef<number | null>(null);
  const lastSyncTimeRef = useRef<number>(0);
  const browserInfoRef = useRef<ReturnType<typeof getBrowserInfo> | null>(null);

  const trackKey = useMemo(() => {
    if (!spotify) return "";
    return `${spotify.track_id}:${safeKey(spotify.artist)}:${safeKey(spotify.song)}`;
  }, [spotify]);

  const cacheKey = useMemo(() => {
    if (!spotify) return "";
    return spotify.track_id?.trim() ? `track:${spotify.track_id}` : `name:${trackKey}`;
  }, [spotify, trackKey]);

  const lines: LrcLine[] = useMemo(() => {
    if (!lyricsRaw) return [];
    return parseLrc(lyricsRaw);
  }, [lyricsRaw]);

  const hasSynced = lines.length > 0;

  // Sistema de sincronização robusto refeito do zero
  useEffect(() => {
    if (!spotify) {
      setCurrentTime(0);
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
      return;
    }

    // Detecta navegador e obtém configurações
    if (!browserInfoRef.current) {
      browserInfoRef.current = getBrowserInfo();
      const latency = getLatency();
      console.log("🌐 Navegador detectado:", {
        name: browserInfoRef.current.name,
        version: browserInfoRef.current.version,
        os: browserInfoRef.current.os,
        isMobile: browserInfoRef.current.isMobile,
        isIOS: browserInfoRef.current.isIOS,
        detectedLatency: latency,
        resyncInterval: browserInfoRef.current.resyncInterval,
        driftThreshold: browserInfoRef.current.driftThreshold,
      });
    }

    const start = spotify.timestamps.start;
    const end = spotify.timestamps.end;
    const duration = Math.max(1, (end - start) / 1000);
    const resyncIntervalMs = getResyncInterval();
    const driftThreshold = getDriftThreshold();

    // Registra medição de latência quando recebe dados do Spotify
    recordLatencyMeasurement(start);

    // Usa múltiplas fontes de tempo para maior precisão
    let lastDateNow = Date.now();
    let lastPerformanceNow = performance.now();
    let timeCorrection = 0; // Correção acumulada de tempo
    const isIOS = browserInfoRef.current?.isIOS ?? false;

    // Calcula tempo baseado no timestamp do Spotify com compensação de latência
    // Usa sistema de compensação de latência dinâmica para corrigir delay da API
    const calculateElapsed = () => {
      // Obtém tempo compensado (subtrai latência detectada)
      const compensatedNow = getCompensatedTime(start, Date.now());
      
      // No iOS, usa APENAS Date.now() para evitar problemas de suspensão
      if (isIOS) {
        // Aplica apenas correção acumulada (offset já está na compensação de latência)
        const adjustedNow = compensatedNow + timeCorrection;
        const elapsed = (adjustedNow - start) / 1000;
        
        // Janela pequena para evitar flicker quando a presença chega levemente antes/depois
        const windowStart = 0.5;
        if (elapsed < 2 && elapsed >= windowStart) {
          if (elapsed < 0.5) return 0;
          return elapsed;
        }
        
        return clamp(elapsed, 0, duration);
      }
      
      // Para outros navegadores, usa combinação de Date.now() e performance.now()
      const perfNow = performance.now();
      const perfDelta = perfNow - lastPerformanceNow;
      const dateDelta = compensatedNow - lastDateNow;
      
      let adjustedNow = compensatedNow;
      
      // Se a diferença entre as duas fontes for muito grande, confia mais em Date.now()
      if (Math.abs(perfDelta - dateDelta) > 100) {
        adjustedNow = compensatedNow;
      } else {
        // Média ponderada: 60% Date.now compensado, 40% performance.now
        const dateWeight = 0.6;
        const perfWeight = 0.4;
        adjustedNow = compensatedNow * dateWeight + (lastDateNow + perfDelta) * perfWeight;
      }
      
      // Aplica apenas correção acumulada (latência já compensada)
      adjustedNow = adjustedNow + timeCorrection;
      const elapsed = (adjustedNow - start) / 1000;

      // Janela pequena para evitar flicker quando a presença chega levemente antes/depois
      const windowStart = -1;
      if (elapsed < 2 && elapsed >= windowStart) {
        if (elapsed < 0.5) return 0;
        return elapsed;
      }

      // Limita à duração (sem redução de 99% para manter sincronia com letra)
      return clamp(elapsed, 0, duration);
    };

    // Inicializa com o tempo atual
    let baseElapsed = calculateElapsed();
    let baseTimestamp = isIOS ? Date.now() : performance.now();
    let baseDateTimestamp = Date.now();
    let lastUpdateTime = baseElapsed;
    let lastResyncTime = Date.now();
    let consecutiveDrifts = 0; // Contador de drifts consecutivos

    // Função de atualização usando RAF para suavidade
    const updateTime = () => {
      if (!spotify) return;

      // No iOS, usa apenas Date.now() para evitar problemas de suspensão
      if (isIOS) {
        const dateNow = Date.now();
        const deltaSeconds = (dateNow - baseDateTimestamp) / 1000;
        const calculatedTime = baseElapsed + deltaSeconds;
        const clampedTime = clamp(calculatedTime, 0, duration);

        const updateThreshold = 0.02;
        if (Math.abs(clampedTime - lastUpdateTime) >= updateThreshold) {
          setCurrentTime(clampedTime);
          lastUpdateTime = clampedTime;
        }
      } else {
        const perfNow = performance.now();
        const dateNow = Date.now();
        const deltaSeconds = (perfNow - baseTimestamp) / 1000;
        const calculatedTime = baseElapsed + deltaSeconds;
        const clampedTime = clamp(calculatedTime, 0, duration);

        const updateThreshold = 0.025;
        if (Math.abs(clampedTime - lastUpdateTime) >= updateThreshold) {
          setCurrentTime(clampedTime);
          lastUpdateTime = clampedTime;
        }
      }

      animationFrameRef.current = requestAnimationFrame(updateTime);
    };

    // Resync periódico melhorado com suavização
    const resync = () => {
      if (!spotify) return;

      const actualElapsed = calculateElapsed();
      const dateNow = Date.now();
      
      // No iOS, usa apenas Date.now() para calcular o tempo esperado
      if (isIOS) {
        const dateDelta = (dateNow - baseDateTimestamp) / 1000;
        const expectedElapsed = baseElapsed + dateDelta;
        const drift = actualElapsed - expectedElapsed;
        const driftAbs = Math.abs(drift);

        if (driftAbs > driftThreshold) {
          const correctionFactor = 0.8;
          const smoothCorrection = drift * (1 - correctionFactor);
          timeCorrection += smoothCorrection * 1000;
          
          baseElapsed = actualElapsed * correctionFactor + expectedElapsed * (1 - correctionFactor);
          baseDateTimestamp = dateNow;
          setCurrentTime(clamp(actualElapsed, 0, duration));
          lastUpdateTime = actualElapsed;
          lastDateNow = dateNow;

          consecutiveDrifts++;
          
          const minDriftForCalibration = 0.08;
          if (driftAbs > minDriftForCalibration) {
            const driftMs = drift * 1000;
            recordDriftMeasurement(driftMs);
            // Latência é compensada automaticamente pelo sistema de compensação
            console.log("🔧 Drift detectado e compensado:", driftMs, "ms");
          }
        } else {
          consecutiveDrifts = 0;
          timeCorrection *= 0.95;
        }

        if (consecutiveDrifts > 5) {
          baseElapsed = calculateElapsed();
          baseDateTimestamp = Date.now();
          timeCorrection = 0;
          consecutiveDrifts = 0;
          console.log("🔄 Resync forçado devido a múltiplos drifts");
        }
      } else {
        // Para outros navegadores, usa ambas as fontes
        const perfNow = performance.now();
        const perfDelta = (perfNow - baseTimestamp) / 1000;
        const dateDelta = (dateNow - baseDateTimestamp) / 1000;
        
        const dateWeight = 0.6;
        const perfWeight = 0.4;
        const expectedElapsed = baseElapsed + dateDelta * dateWeight + perfDelta * perfWeight;
        
        const drift = actualElapsed - expectedElapsed;
        const driftAbs = Math.abs(drift);

        if (driftAbs > driftThreshold) {
          const correctionFactor = 0.85;
          const smoothCorrection = drift * (1 - correctionFactor);
          timeCorrection += smoothCorrection * 1000;
          
          baseElapsed = actualElapsed * correctionFactor + expectedElapsed * (1 - correctionFactor);
          baseTimestamp = perfNow;
          baseDateTimestamp = dateNow;
          setCurrentTime(clamp(actualElapsed, 0, duration));
          lastUpdateTime = actualElapsed;
          lastDateNow = dateNow;
          lastPerformanceNow = perfNow;

          consecutiveDrifts++;
          
          const minDriftForCalibration = 0.15;
          if (driftAbs > minDriftForCalibration) {
            const driftMs = drift * 1000;
            recordDriftMeasurement(driftMs);
            // Latência é compensada automaticamente pelo sistema de compensação
            console.log("🔧 Drift detectado e compensado:", driftMs, "ms");
          }
        } else {
          consecutiveDrifts = 0;
          timeCorrection *= 0.95;
        }

        if (consecutiveDrifts > 5) {
          baseElapsed = calculateElapsed();
          baseTimestamp = performance.now();
          baseDateTimestamp = Date.now();
          timeCorrection = 0;
          consecutiveDrifts = 0;
          console.log("🔄 Resync forçado devido a múltiplos drifts");
        }
      }
    };

    // Inicia loop de atualização
    updateTime();

    // Resync com intervalo dinâmico baseado no navegador
    const resyncIntervalId = setInterval(resync, resyncIntervalMs);

    // Resync inicial - zera timeCorrection e recalcula do zero
    const initialDelay = isIOS ? 100 : 150;
    const initialResyncTimeout = setTimeout(() => {
      // Zera correção e recalcula do zero para garantir início correto
      timeCorrection = 0;
      // Registra nova medição de latência
      recordLatencyMeasurement(start);
      lastDateNow = Date.now();
      if (!isIOS) {
        lastPerformanceNow = performance.now();
      }
      
      // Recalcula elapsed sem correções acumuladas, usando compensação de latência
      const compensatedNow = getCompensatedTime(start, Date.now());
      const actualElapsed = Math.max(0, (compensatedNow - start) / 1000);
      
      baseElapsed = Math.min(actualElapsed, duration);
      baseTimestamp = isIOS ? Date.now() : performance.now();
      baseDateTimestamp = Date.now();
      setCurrentTime(clamp(baseElapsed, 0, duration));
      lastUpdateTime = baseElapsed;
    }, initialDelay);

    // Resync quando a página volta ao foreground (crítico para iOS)
    const handleVisibilityChange = () => {
      if (!document.hidden && spotify) {
        // Força resync completo quando volta ao foreground
        // No iOS, recalcula baseado apenas em Date.now() porque performance.now() foi suspenso
        const actualElapsed = calculateElapsed();
        baseElapsed = actualElapsed;
        baseTimestamp = isIOS ? Date.now() : performance.now();
        baseDateTimestamp = Date.now();
        lastDateNow = Date.now();
        if (!isIOS) {
          lastPerformanceNow = performance.now();
        }
        setCurrentTime(clamp(actualElapsed, 0, duration));
        lastUpdateTime = actualElapsed;
        timeCorrection = 0;
        consecutiveDrifts = 0;
        console.log("👁️ Resync após voltar ao foreground", isIOS ? "(iOS - usando apenas Date.now())" : "");
      }
    };

    // Resync quando a página ganha foco (importante para mobile)
    const handleFocus = () => {
      if (spotify && !document.hidden) {
        const actualElapsed = calculateElapsed();
        baseElapsed = actualElapsed;
        baseTimestamp = isIOS ? Date.now() : performance.now();
        baseDateTimestamp = Date.now();
        setCurrentTime(clamp(actualElapsed, 0, duration));
        lastUpdateTime = actualElapsed;
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("focus", handleFocus);

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
      clearInterval(resyncIntervalId);
      clearTimeout(initialResyncTimeout);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("focus", handleFocus);
    };
  }, [spotify]);

  // Calcula índice ativo baseado no tempo atual
  const activeIndex = useMemo(() => {
    if (lines.length === 0) return -1;
    return findActiveIndex(lines, currentTime * 1000);
  }, [lines, currentTime]);

  const autoCenterActiveLine = () => {
    const popup = document.querySelector('[data-spotify-lyrics-popup="1"]');
    const container = popup?.querySelector('[data-lyrics-scroll="synced"]') as HTMLDivElement | null;
    const activeEl = popup?.querySelector('[aria-current="true"]') as HTMLElement | null;
    
    if (!container || !activeEl) return;
    if (Date.now() - lastUserScrollAtRef.current < 2500) return;

    const containerRect = container.getBoundingClientRect();
    const activeRect = activeEl.getBoundingClientRect();
    const currentTop = container.scrollTop;

    const offsetWithin = (activeRect.top - containerRect.top) + currentTop;
    const targetTop = offsetWithin - container.clientHeight / 2 + activeEl.clientHeight / 2;
    const clamped = Math.max(0, Math.min(targetTop, container.scrollHeight - container.clientHeight));

    const prefersReducedMotion = window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches;
    programmaticScrollRef.current = true;
    container.scrollTo({ top: clamped, behavior: prefersReducedMotion ? "auto" : "smooth" });
    
    setTimeout(() => {
      programmaticScrollRef.current = false;
    }, 250);
  };

  // Quando a música muda, reseta estado
  useEffect(() => {
    if (!spotify) {
      setLyricsRaw(null);
      setLyricsError(null);
      setLoadingLyrics(false);
      setFromCache(false);
      setPlayerOpen(false);
      return;
    }

    if (prevTrackKeyRef.current !== trackKey) {
      prevTrackKeyRef.current = trackKey;
      setCollapsed(isMobile ? true : false);
      setLyricsRaw(null);
      setLyricsError(null);
      setFromCache(false);
      setPlayerOpen(false);
    }
  }, [spotify, trackKey, isMobile]);

  // Detecta mobile
  useEffect(() => {
    const update = () => setIsMobile(window.innerWidth <= 768);
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  // Carrega do cache
  useEffect(() => {
    if (!spotify) return;
    if (!cacheKey) return;
    if (lyricsRaw) return;

    const { entry } = getCachedLyrics(cacheKey);
    if (!entry) return;

    const chosen = entry.syncedLyrics?.trim() || entry.plainLyrics?.trim() || null;
    if (chosen) {
      setLyricsRaw(chosen);
      setLyricsError(null);
      setFromCache(true);
    }
  }, [spotify, cacheKey, lyricsRaw]);

  // Busca letras
  useEffect(() => {
    if (!spotify) return;
    if (!cacheKey) return;

    const cached = getCachedLyrics(cacheKey);
    if (lyricsRaw && !cached.stale) return;
    if (!lyricsRaw && cached.entry && !cached.stale) return;
    if (inflightKeyRef.current === cacheKey) return;

    let cancelled = false;
    const controller = new AbortController();

    (async () => {
      inflightKeyRef.current = cacheKey;
      setLoadingLyrics(true);
      
      const safety = window.setTimeout(() => {
        if (!cancelled && inflightKeyRef.current === cacheKey) {
          setLoadingLyrics(false);
          inflightKeyRef.current = "";
        }
      }, 12000);
      
      try {
        const existing = getCachedLyrics(cacheKey).entry;
        const existingSynced = existing?.syncedLyrics?.trim() || null;
        const existingPlain = existing?.plainLyrics?.trim() || null;

        const res = await fetch(
          `/api/lyrics?artist_name=${encodeURIComponent(spotify.artist)}&track_name=${encodeURIComponent(
            spotify.song,
          )}&_=${Date.now()}`,
          { signal: controller.signal, cache: "no-store" },
        );
        
        if (!res.ok) throw new Error(String(res.status));
        
        const data = (await res.json()) as LrclibResponse;
        const synced = data.syncedLyrics?.trim() ?? null;
        const plain = data.plainLyrics?.trim() ?? null;
        const chosen = synced || existingSynced || plain || existingPlain || null;

        if (!cancelled) {
          setLyricsRaw(chosen);
          if (!chosen) setLyricsError("Sem letra disponível para esta música.");
          setFromCache(false);
          
          if (cacheKey) {
            setCachedLyrics({
              key: cacheKey,
              artist: spotify.artist,
              track: spotify.song,
              fetchedAt: Date.now(),
              // nunca apaga uma letra sincronizada já existente
              syncedLyrics: synced || existingSynced,
              plainLyrics: plain || existingPlain,
            });
          }
        }
      } catch {
        if (!cancelled) {
          setLyricsError("Não consegui buscar a letra ou não há letra disponível para esta música.");
        }
      } finally {
        window.clearTimeout(safety);
        if (!cancelled && inflightKeyRef.current === cacheKey) {
          setLoadingLyrics(false);
          inflightKeyRef.current = "";
        }
      }
    })();

    return () => {
      cancelled = true;
      controller.abort();
      if (inflightKeyRef.current === cacheKey) inflightKeyRef.current = "";
    };
  }, [spotify?.artist, spotify?.song, cacheKey, lyricsRaw]);

  // Scroll automático para linha ativa
  useEffect(() => {
    if (collapsed) return;
    if (!hasSynced) return;
    autoCenterActiveLine();
  }, [activeIndex, collapsed, hasSynced]);

  // Scroll periódico para manter sincronizado
  useEffect(() => {
    if (collapsed) return;
    if (!spotify) return;
    if (!hasSynced) return;
    
    const interval = setInterval(() => {
      autoCenterActiveLine();
    }, 1000);
    
    return () => clearInterval(interval);
  }, [collapsed, hasSynced, spotify?.track_id]);

  // Auto-scroll para letra não sincronizada
  useEffect(() => {
    if (collapsed) return;
    if (!spotify) return;
    if (hasSynced) return;
    
    const container = plainRef.current;
    if (!container) return;
    if (Date.now() - lastUserScrollAtRef.current < 2500) return;

    const total = Math.max(1, (spotify.timestamps.end - spotify.timestamps.start) / 1000);
    const progress = clamp(currentTime / total, 0, 1);
    const maxTop = Math.max(0, container.scrollHeight - container.clientHeight);
    const targetTop = maxTop * progress;

    const prefersReducedMotion = window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches;
    programmaticScrollRef.current = true;
    container.scrollTo({ top: targetTop, behavior: prefersReducedMotion ? "auto" : "smooth" });
    
    setTimeout(() => {
      programmaticScrollRef.current = false;
    }, 250);
  }, [spotify, currentTime, hasSynced, collapsed]);

  const title = spotify?.song ?? "";
  const subtitle = spotify?.artist ?? "";
  const spotifyEmbedUrl = spotify?.track_id ? `https://open.spotify.com/embed/track/${spotify.track_id}` : null;
  const spotifyOpenUrl = spotify?.track_id ? `https://open.spotify.com/track/${spotify.track_id}` : null;
  const totalSeconds = useMemo(() => {
    if (!spotify) return 0;
    return Math.max(1, Math.floor((spotify.timestamps.end - spotify.timestamps.start) / 1000));
  }, [spotify]);
  
  // Usa currentTime real para manter sincronia com a letra
  // Limita apenas para exibição e cálculo de remaining
  const displayTime = Math.max(0, Math.min(currentTime || 0, totalSeconds));
  const remainingSeconds = Math.max(0, Math.floor(totalSeconds - displayTime));

  const loadingLabel = useMemo(() => {
    const lang = (language ?? "").toLowerCase();
    if (lang.startsWith("en")) return "Fetching lyrics...";
    if (lang.startsWith("pt")) return "Buscando letra…";
    if (lang.startsWith("es")) return "Buscando letra...";
    return "Fetching lyrics...";
  }, [language]);

  const strings = useMemo(() => {
    const lang = (language ?? "").toLowerCase();
    const isEn = lang.startsWith("en");
    const isEs = lang.startsWith("es");
    return {
      errorNoLyrics: isEn
        ? "Couldn't fetch lyrics or none available for this track."
        : isEs
          ? "No se pudo obtener la letra o no hay letra disponible para esta canción."
          : "Não consegui buscar a letra ou não há letra disponível para esta música.",
      openSpotify: isEn ? "Open on Spotify (new tab)" : isEs ? "Abrir en Spotify (nueva pestaña)" : "Abrir no Spotify (nova aba)",
      fullscreen: isEn ? "Fullscreen" : isEs ? "Pantalla completa" : "Tela cheia",
      exitFullscreen: isEn ? "Exit fullscreen" : isEs ? "Salir de pantalla completa" : "Sair da tela cheia",
      expand: isEn ? "Expand" : isEs ? "Expandir" : "Expandir",
      collapse: isEn ? "Collapse" : isEs ? "Recolher" : "Recolher",
      openPlayer: isEn ? "Open player" : isEs ? "Abrir reproductor" : "Abrir player",
      closePlayer: isEn ? "Close player" : isEs ? "Cerrar reproductor" : "Fechar player",
    };
  }, [language]);

  const containerClass = isFullscreen
    ? "pointer-events-none fixed inset-0 z-[9998] flex items-center justify-center p-4"
    : "pointer-events-none fixed bottom-4 right-4 z-[9998]";

  const popupClass = isFullscreen
    ? "pointer-events-auto w-full max-w-5xl min-h-[70vh] max-h-[90vh] overflow-hidden rounded-2xl border border-white/10 bg-gray-900/80 shadow-2xl backdrop-blur-2xl flex flex-col"
    : "pointer-events-auto w-[360px] overflow-hidden rounded-2xl border border-white/10 bg-gray-900/70 shadow-2xl backdrop-blur-xl";

  const listHeightClass = isFullscreen ? "max-h-[60vh]" : "max-h-[260px]";

  const showInstrumental = false;

  return (
    <div className={containerClass}>
      <AnimatePresence>
        {spotify && (
          <motion.div
            className={popupClass}
            initial={{ opacity: 0, y: 18, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 18, scale: 0.98 }}
            transition={{ type: "spring", stiffness: 260, damping: 28 }}
            data-spotify-lyrics-popup="1"
            role="dialog"
            aria-label="Letra sincronizada do Spotify"
          >
            {!isFullscreen && (
              <div className="flex items-center gap-3 border-b border-white/10 px-4 py-3">
                <div className="relative h-12 w-12 flex-shrink-0 overflow-hidden rounded-xl border border-white/10 bg-black/20">
                  {spotify.album_art_url ? (
                    <Image
                      src={spotify.album_art_url}
                      alt={spotify.album}
                      fill
                      className="object-cover"
                      unoptimized
                      sizes="48px"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-white/60">
                      <Music2 className="h-5 w-5" />
                    </div>
                  )}
                </div>

                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-white">{title}</p>
                  <p className="truncate text-xs text-white/60">{subtitle}</p>
                  <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-white/10">
                    <div
                      className="h-full rounded-full bg-white/40"
                      style={{
                        width: `${clamp((displayTime / Math.max(1, totalSeconds)) * 100, 0, 100)}%`,
                      }}
                    />
                  </div>
                  <div className="mt-1 flex items-center justify-between text-[11px] tabular-nums text-white/50">
                    <span aria-label={`Tempo atual ${formatTime(displayTime)}`}>{formatTime(displayTime)}</span>
                    <span aria-label={`Tempo restante ${formatTime(remainingSeconds)}`}>
                      -{formatTime(remainingSeconds)}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  {spotifyEmbedUrl && (
                    <button
                      type="button"
                      onClick={() => setPlayerOpen((v) => !v)}
                      className="rounded-full p-2 text-white/70 hover:bg-white/10 hover:text-white"
                      aria-label={playerOpen ? strings.exitFullscreen : strings.openPlayer}
                      title={playerOpen ? strings.exitFullscreen : strings.openPlayer}
                    >
                      <Play className={playerOpen ? "h-4 w-4 opacity-100" : "h-4 w-4"} />
                    </button>
                  )}
                  {spotifyOpenUrl && (
                    <a
                      href={spotifyOpenUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="rounded-full p-2 text-white/70 hover:bg-white/10 hover:text-white"
                      aria-label={strings.openSpotify}
                      title={strings.openSpotify}
                    >
                      <ExternalLink className="h-4 w-4" />
                    </a>
                  )}
                  <button
                    type="button"
                    onClick={() => setIsFullscreen((v) => !v)}
                    className="rounded-full p-2 text-white/70 hover:bg-white/10 hover:text-white"
                    aria-label={isFullscreen ? strings.exitFullscreen : strings.fullscreen}
                    title={isFullscreen ? strings.exitFullscreen : strings.fullscreen}
                  >
                    {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
                  </button>
                  <button
                    type="button"
                    onClick={() => setCollapsed((v) => !v)}
                    className="rounded-full p-2 text-white/70 hover:bg-white/10 hover:text-white"
                    aria-label={collapsed ? strings.expand : strings.collapse}
                  >
                    <ChevronDown className={collapsed ? "h-4 w-4 rotate-180" : "h-4 w-4"} />
                  </button>
                </div>
              </div>
            )}

            {spotify && !collapsed && (
              <div className="px-4 py-3">
                <AnimatePresence initial={false}>
                  {playerOpen && spotifyEmbedUrl && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.25, ease: "easeOut" }}
                      className="mb-3 overflow-hidden rounded-xl border border-white/10 bg-black/20"
                    >
                      <iframe
                        src={spotifyEmbedUrl}
                        width="100%"
                        height="152"
                        allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
                        loading="lazy"
                        className="block w-full"
                        title="Spotify player"
                      />
                    </motion.div>
                  )}
                </AnimatePresence>

                {loadingLyrics && (
                  <p className="flex items-center gap-2 text-sm text-white/70">
                    <Loader2 className="h-4 w-4 animate-spin text-white/70" aria-hidden="true" />
                    <span>{loadingLabel}</span>
                  </p>
                )}

                {!isFullscreen && lyricsError && !loadingLyrics && (
                  <p className="text-sm text-amber-200">{strings.errorNoLyrics}</p>
                )}

                {isFullscreen && !loadingLyrics && (!lyricsRaw || lyricsError) && (
                  <div className="px-2 py-4 flex-1 flex flex-col items-center justify-center gap-6">
                    <div className="w-full max-w-md space-y-4 text-center">
                      <div className="relative w-full aspect-square rounded-2xl overflow-hidden border border-white/10 mx-auto">
                        <Image
                          src={spotify.album_art_url ?? "/profile/profile.avif"}
                          alt={spotify.album}
                          fill
                          className="object-cover"
                          sizes="360px"
                          unoptimized
                        />
                      </div>
                      <div className="space-y-1">
                        <p className="text-2xl font-semibold text-white truncate">{title}</p>
                        <p className="text-sm text-white/70 truncate">{subtitle}</p>
                        {lyricsError && (
                          <p className="text-sm text-amber-200">{strings.errorNoLyrics}</p>
                        )}
                        {!lyricsError && !lyricsRaw && (
                          <p className="text-sm text-white/60">{strings.errorNoLyrics}</p>
                        )}
                      </div>
                      <div className="h-2 w-full overflow-hidden rounded-full bg-white/10">
                        <div
                          className="h-full rounded-full bg-white/40"
                          style={{
                            width: `${clamp((displayTime / Math.max(1, totalSeconds)) * 100, 0, 100)}%`,
                          }}
                        />
                      </div>
                      <div className="flex items-center justify-between text-xs text-white/60 tabular-nums">
                        <span>{formatTime(displayTime)}</span>
                        <span>-{formatTime(remainingSeconds)}</span>
                      </div>
                      <div className="flex items-center justify-center gap-2 flex-wrap">
                        {spotifyEmbedUrl && (
                          <button
                            type="button"
                            onClick={() => setPlayerOpen((v) => !v)}
                            className="rounded-full p-2 text-white/70 hover:bg-white/10 hover:text-white"
                            aria-label={playerOpen ? "Fechar player" : "Abrir player"}
                            title={playerOpen ? "Fechar player" : "Abrir player"}
                          >
                            <Play className={playerOpen ? "h-4 w-4 opacity-100" : "h-4 w-4"} />
                          </button>
                        )}
                        {spotifyOpenUrl && (
                          <a
                            href={spotifyOpenUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="rounded-full p-2 text-white/70 hover:bg-white/10 hover:text-white"
                            aria-label="Abrir no Spotify (nova aba)"
                            title="Abrir no Spotify"
                          >
                            <ExternalLink className="h-4 w-4" />
                          </a>
                        )}
                        <button
                          type="button"
                          onClick={() => setIsFullscreen((v) => !v)}
                          className="rounded-full p-2 text-white/70 hover:bg-white/10 hover:text-white"
                          aria-label={isFullscreen ? "Sair da tela cheia" : "Tela cheia"}
                          title={isFullscreen ? "Sair da tela cheia" : "Tela cheia"}
                        >
                          {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
                        </button>
                        <button
                          type="button"
                          onClick={() => setCollapsed((v) => !v)}
                          className="rounded-full p-2 text-white/70 hover:bg-white/10 hover:text-white"
                          aria-label={collapsed ? "Expandir" : "Recolher"}
                        >
                          <ChevronDown className={collapsed ? "h-4 w-4 rotate-180" : "h-4 w-4"} />
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {!loadingLyrics && !lyricsError && lyricsRaw && (
                  <>
                    {isFullscreen ? (
                      <div className="flex flex-col lg:flex-row gap-6">
                        <div className="w-full lg:w-2/5 space-y-4">
                          <div className="relative w-full max-w-[360px] aspect-square rounded-2xl overflow-hidden border border-white/10">
                            <Image
                              src={spotify.album_art_url ?? "/profile/profile.avif"}
                              alt={spotify.album}
                              fill
                              className="object-cover"
                              sizes="360px"
                              unoptimized
                            />
                          </div>
                          <div className="text-center space-y-2">
                            <p className="text-xl font-semibold text-white truncate">{title}</p>
                            <p className="text-sm text-white/70 truncate">{subtitle}</p>
                            <div className="flex items-center justify-center gap-2 flex-wrap">
                              {spotifyEmbedUrl && (
                                <button
                                  type="button"
                                  onClick={() => setPlayerOpen((v) => !v)}
                                  className="rounded-full p-2 text-white/70 hover:bg-white/10 hover:text-white"
                                  aria-label={playerOpen ? strings.closePlayer : strings.openPlayer}
                                  title={playerOpen ? strings.closePlayer : strings.openPlayer}
                                >
                                  <Play className={playerOpen ? "h-4 w-4 opacity-100" : "h-4 w-4"} />
                                </button>
                              )}
                              {spotifyOpenUrl && (
                                <a
                                  href={spotifyOpenUrl}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="rounded-full p-2 text-white/70 hover:bg-white/10 hover:text-white"
                                  aria-label={strings.openSpotify}
                                  title={strings.openSpotify}
                                >
                                  <ExternalLink className="h-4 w-4" />
                                </a>
                              )}
                              <button
                                type="button"
                                onClick={() => setIsFullscreen((v) => !v)}
                                className="rounded-full p-2 text-white/70 hover:bg-white/10 hover:text-white"
                                aria-label={isFullscreen ? strings.exitFullscreen : strings.fullscreen}
                                title={isFullscreen ? strings.exitFullscreen : strings.fullscreen}
                              >
                                {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
                              </button>
                              <button
                                type="button"
                                onClick={() => setCollapsed((v) => !v)}
                                className="rounded-full p-2 text-white/70 hover:bg-white/10 hover:text-white"
                                aria-label={collapsed ? strings.expand : strings.collapse}
                              >
                                <ChevronDown className={collapsed ? "h-4 w-4 rotate-180" : "h-4 w-4"} />
                              </button>
                            </div>
                          </div>
                          <div className="h-2 w-full overflow-hidden rounded-full bg-white/10">
                            <div
                              className="h-full rounded-full bg-white/40"
                              style={{
                                width: `${clamp((displayTime / Math.max(1, totalSeconds)) * 100, 0, 100)}%`,
                              }}
                            />
                          </div>
                          <div className="flex items-center justify-between text-xs text-white/60 tabular-nums">
                            <span>{formatTime(currentTime)}</span>
                            <span>-{formatTime(remainingSeconds)}</span>
                          </div>
                        </div>

                        {hasSynced ? (
                          <LayoutGroup>
                            <motion.div
                              ref={listRef}
                              className={`${listHeightClass} flex-1 overflow-y-auto pr-1`}
                              data-lyrics-scroll="synced"
                              onPointerDown={() => {
                                lastUserScrollAtRef.current = Date.now();
                              }}
                              onTouchStart={() => {
                                lastUserScrollAtRef.current = Date.now();
                              }}
                              onWheel={() => {
                                lastUserScrollAtRef.current = Date.now();
                              }}
                              initial="hidden"
                              animate="show"
                              variants={{
                                hidden: { opacity: 0 },
                                show: {
                                  opacity: 1,
                                  transition: { staggerChildren: 0.012, delayChildren: 0.02 },
                                },
                              }}
                            >
                              <div className="space-y-1">
                                {lines.map((l, idx) => {
                                  const active = idx === activeIndex;
                                  return (
                                    <motion.button
                                      key={`${l.timeMs}-${idx}`}
                                      type="button"
                                      ref={active ? activeLineRef : null}
                                      layout
                                      variants={{
                                        hidden: { opacity: 0, y: 6, filter: "blur(2px)" },
                                        show: { opacity: 1, y: 0, filter: "blur(0px)" },
                                      }}
                                      transition={{ type: "spring", stiffness: 420, damping: 34, mass: 0.7 }}
                                      className={[
                                        "relative block w-full overflow-hidden rounded-lg px-2 py-1.5 text-left",
                                        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/20",
                                        active ? "text-white" : "text-white/55 hover:text-white/80",
                                      ].join(" ")}
                                      aria-current={active ? "true" : "false"}
                                      onClick={() => {}}
                                    >
                                      {active && (
                                        <motion.div
                                          layoutId="lyricHighlight"
                                          className="absolute inset-0 rounded-lg bg-white/10"
                                          transition={{ type: "spring", stiffness: 520, damping: 40 }}
                                        />
                                      )}
                                      {active && (
                                        <motion.div
                                          layoutId="lyricGlow"
                                          className="absolute -inset-6 rounded-2xl"
                                          transition={{ type: "spring", stiffness: 380, damping: 34 }}
                                        />
                                      )}
                                      <motion.span
                                        className={active ? "relative text-lg font-semibold" : "relative text-base"}
                                        animate={{
                                          opacity: active ? 1 : 0.78,
                                          scale: active ? 1.02 : 1,
                                        }}
                                        transition={{ type: "spring", stiffness: 420, damping: 28 }}
                                      >
                                        {l.text || "…"}
                                      </motion.span>
                                    </motion.button>
                                  );
                                })}
                              </div>
                            </motion.div>
                          </LayoutGroup>
                        ) : (
                          <motion.div
                            ref={plainRef}
                            className={`${listHeightClass} flex-1 overflow-y-auto whitespace-pre-wrap text-base text-white/70`}
                            data-lyrics-scroll="plain"
                            onPointerDown={() => {
                              lastUserScrollAtRef.current = Date.now();
                            }}
                            onTouchStart={() => {
                              lastUserScrollAtRef.current = Date.now();
                            }}
                            onWheel={() => {
                              lastUserScrollAtRef.current = Date.now();
                            }}
                            initial={{ opacity: 0, y: 6 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.25, ease: "easeOut" }}
                          >
                            {lyricsRaw}
                          </motion.div>
                        )}
                      </div>
                    ) : (
                      <>
                        {hasSynced ? (
                          <LayoutGroup>
                            <motion.div
                              ref={listRef}
                              className={`${listHeightClass} overflow-y-auto pr-1`}
                              data-lyrics-scroll="synced"
                              onPointerDown={() => {
                                lastUserScrollAtRef.current = Date.now();
                              }}
                              onTouchStart={() => {
                                lastUserScrollAtRef.current = Date.now();
                              }}
                              onWheel={() => {
                                lastUserScrollAtRef.current = Date.now();
                              }}
                              initial="hidden"
                              animate="show"
                              variants={{
                                hidden: { opacity: 0 },
                                show: {
                                  opacity: 1,
                                  transition: { staggerChildren: 0.012, delayChildren: 0.02 },
                                },
                              }}
                            >
                              <div className="space-y-1">
                                {lines.map((l, idx) => {
                                  const active = idx === activeIndex;
                                  return (
                                    <motion.button
                                      key={`${l.timeMs}-${idx}`}
                                      type="button"
                                      ref={active ? activeLineRef : null}
                                      layout
                                      variants={{
                                        hidden: { opacity: 0, y: 6, filter: "blur(2px)" },
                                        show: { opacity: 1, y: 0, filter: "blur(0px)" },
                                      }}
                                      transition={{ type: "spring", stiffness: 420, damping: 34, mass: 0.7 }}
                                      className={[
                                        "relative block w-full overflow-hidden rounded-lg px-2 py-1.5 text-left",
                                        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/20",
                                        active ? "text-white" : "text-white/55 hover:text-white/80",
                                      ].join(" ")}
                                      aria-current={active ? "true" : "false"}
                                      onClick={() => {}}
                                    >
                                      {active && (
                                        <motion.div
                                          layoutId="lyricHighlight"
                                          className="absolute inset-0 rounded-lg bg-white/10"
                                          transition={{ type: "spring", stiffness: 520, damping: 40 }}
                                        />
                                      )}
                                      {active && (
                                        <motion.div
                                          layoutId="lyricGlow"
                                          className="absolute -inset-6 rounded-2xl"
                                          transition={{ type: "spring", stiffness: 380, damping: 34 }}
                                        />
                                      )}
                                      <motion.span
                                        className={active ? "relative text-base font-semibold" : "relative text-sm"}
                                        animate={{
                                          opacity: active ? 1 : 0.78,
                                          scale: active ? 1.02 : 1,
                                        }}
                                        transition={{ type: "spring", stiffness: 420, damping: 28 }}
                                      >
                                        {l.text || "…"}
                                      </motion.span>
                                    </motion.button>
                                  );
                                })}
                              </div>
                            </motion.div>
                          </LayoutGroup>
                        ) : (
                          <motion.div
                            ref={plainRef}
                            className={`${listHeightClass} overflow-y-auto whitespace-pre-wrap text-sm text-white/70`}
                            data-lyrics-scroll="plain"
                            onPointerDown={() => {
                              lastUserScrollAtRef.current = Date.now();
                            }}
                            onTouchStart={() => {
                              lastUserScrollAtRef.current = Date.now();
                            }}
                            onWheel={() => {
                              lastUserScrollAtRef.current = Date.now();
                            }}
                            initial={{ opacity: 0, y: 6 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.25, ease: "easeOut" }}
                          >
                            {lyricsRaw}
                          </motion.div>
                        )}
                      </>
                    )}
                  </>
                )}
              </div>
            )}

            {spotify && isFullscreen && collapsed && (
              <div className="px-4 py-6 flex-1 flex flex-col items-center justify-center gap-6">
                <div className="w-full max-w-md space-y-4 text-center">
                  <div className="relative w-full aspect-square rounded-2xl overflow-hidden border border-white/10 mx-auto">
                    <Image
                      src={spotify.album_art_url ?? "/profile/profile.avif"}
                      alt={spotify.album}
                      fill
                      className="object-cover"
                      sizes="360px"
                      unoptimized
                    />
                  </div>
                  <div className="space-y-1">
                    <p className="text-2xl font-semibold text-white truncate">{title}</p>
                    <p className="text-sm text-white/70 truncate">{subtitle}</p>
                  </div>
                  <div className="h-2 w-full overflow-hidden rounded-full bg-white/10">
                    <div
                      className="h-full rounded-full bg-white/40"
                      style={{
                        width: `${clamp((displayTime / Math.max(1, totalSeconds)) * 100, 0, 100)}%`,
                      }}
                    />
                  </div>
                  <div className="flex items-center justify-between text-xs text-white/60 tabular-nums">
                    <span>{formatTime(currentTime)}</span>
                    <span>-{formatTime(remainingSeconds)}</span>
                  </div>
                  <div className="flex items-center justify-center gap-2 flex-wrap">
                    {spotifyOpenUrl && (
                      <a
                        href={spotifyOpenUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="rounded-full p-2 text-white/70 hover:bg-white/10 hover:text-white"
                        aria-label={strings.openSpotify}
                        title={strings.openSpotify}
                      >
                        <ExternalLink className="h-4 w-4" />
                      </a>
                    )}
                    <button
                      type="button"
                      onClick={() => setIsFullscreen((v) => !v)}
                      className="rounded-full p-2 text-white/70 hover:bg-white/10 hover:text-white"
                      aria-label={isFullscreen ? strings.exitFullscreen : strings.fullscreen}
                      title={isFullscreen ? strings.exitFullscreen : strings.fullscreen}
                    >
                      {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
                    </button>
                    <button
                      type="button"
                      onClick={() => setCollapsed((v) => !v)}
                      className="rounded-full p-2 text-white/70 hover:bg-white/10 hover:text-white"
                      aria-label={collapsed ? strings.expand : strings.collapse}
                    >
                      <ChevronDown className={collapsed ? "h-4 w-4 rotate-180" : "h-4 w-4"} />
                    </button>
                  </div>
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
