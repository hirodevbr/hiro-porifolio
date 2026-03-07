"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import { AnimatePresence, LayoutGroup, motion } from "framer-motion";
import { ChevronDown, ExternalLink, Loader2, Maximize2, Minimize2, Music2, Play } from "lucide-react";
import { findActiveIndex, parseLrc, type LrcLine } from "@/lib/lrc";
import { getCachedLyrics, setCachedLyrics } from "@/lib/lyricsCache";
import { DISCORD_USER_ID } from "@/lib/config";
import { useLanyardUser, type LanyardSpotify } from "@/lib/lanyardClient";
import { useLanguage } from "@/contexts/LanguageContext";

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
  /** Tamanho da letra no fullscreen: 0 = base, 1 = maior, 2 = ainda maior (e negativos para menor) */
  const [lyricsFontSizeStep, setLyricsFontSizeStep] = useState(0);

  const fullscreenTriggerRef = useRef<HTMLButtonElement | null>(null);
  const fullscreenModalRef = useRef<HTMLDivElement | null>(null);

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
  const prevSpotifyRef = useRef<LanyardSpotify | null>(null);
  const [lastPlayed, setLastPlayed] = useState<LanyardSpotify | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const syncOffsetRef = useRef<number>(0); // Offset de sincronização inicial
  const hasSyncedInitialRef = useRef<boolean>(false); // Flag para sincronização inicial

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

  // Função de sincronização reutilizável
  const syncInitial = useRef<(() => Promise<void>) | null>(null);

  // Sincronização inicial: quando recebe dados do Spotify pela primeira vez ou quando volta do background
  useEffect(() => {
    if (!spotify) {
      hasSyncedInitialRef.current = false;
      syncOffsetRef.current = 0;
      return;
    }

    // Cria função de sincronização
    syncInitial.current = async () => {
      try {
        const clientTimeBefore = Date.now();
        const response = await fetch('/api/time', { 
          cache: 'no-store',
          headers: { 'Cache-Control': 'no-cache' }
        });
        const clientTimeAfter = Date.now();
        
        if (!response.ok) return;
        
        const data = await response.json();
        const serverTime = data.now;
        
        // Calcula latência da requisição (tempo de ida e volta / 2)
        const roundTripTime = clientTimeAfter - clientTimeBefore;
        const estimatedLatency = roundTripTime / 2;
        
        // Tempo estimado do servidor quando recebemos a resposta
        const estimatedServerTime = serverTime + estimatedLatency;
        
        // Calcula offset: diferença entre o tempo estimado do servidor e o start_timestamp
        // Se o start_timestamp está no passado em relação ao servidor, precisamos compensar
        const spotifyStart = spotify.timestamps.start;
        const offset = estimatedServerTime - spotifyStart;
        
        // Só aplica offset se for razoável (entre -5 e 10 segundos)
        // Valores muito grandes podem indicar erro ou música antiga
        if (Math.abs(offset) <= 10000 && Math.abs(offset) >= -5000) {
          syncOffsetRef.current = offset;
        } else {
          syncOffsetRef.current = 0;
        }
        
        const currentTrackKey = `${spotify.track_id}:${spotify.timestamps.start}`;
        hasSyncedInitialRef.current = true;
        prevTrackKeyRef.current = currentTrackKey;
      } catch (error) {
        console.error('Erro na sincronização inicial:', error);
        syncOffsetRef.current = 0;
        const currentTrackKey = `${spotify.track_id}:${spotify.timestamps.start}`;
        hasSyncedInitialRef.current = true;
        prevTrackKeyRef.current = currentTrackKey;
      }
    };

    // Se já sincronizou para esta música, não precisa sincronizar novamente
    const currentTrackKey = `${spotify.track_id}:${spotify.timestamps.start}`;
    if (hasSyncedInitialRef.current && prevTrackKeyRef.current === currentTrackKey) {
      return;
    }

    // Executa sincronização inicial
    syncInitial.current();
  }, [spotify]);

  // Listener para quando a página volta do background (especialmente mobile)
  useEffect(() => {
    const handleVisibilityChange = () => {
      // Quando a página volta do background, força nova sincronização
      if (document.visibilityState === 'visible' && spotify && syncInitial.current) {
        // Reseta flag para forçar nova sincronização
        const currentTrackKey = `${spotify.track_id}:${spotify.timestamps.start}`;
        if (prevTrackKeyRef.current === currentTrackKey) {
          // Força nova sincronização mesmo se já sincronizou antes
          hasSyncedInitialRef.current = false;
          syncInitial.current();
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [spotify]);

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

    // Calcula tempo: Date.now() - start_timestamp + offset de sincronização
    const updateTime = () => {
      if (!spotify) return;
      
      const start = spotify.timestamps.start;
      const now = Date.now();
      // Aplica offset de sincronização inicial
      const adjustedStart = start + syncOffsetRef.current;
      const elapsed = (now - adjustedStart) / 1000;
      
      setCurrentTime(Math.max(0, elapsed));
      
      animationFrameRef.current = requestAnimationFrame(updateTime);
    };

    // Inicia loop de atualização
    updateTime();

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
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
      if (prevSpotifyRef.current && prevTrackKeyRef.current) {
        setLastPlayed(prevSpotifyRef.current);
      }
      prevSpotifyRef.current = spotify;
      prevTrackKeyRef.current = trackKey;
      setCollapsed(isMobile ? true : false);
      setLyricsRaw(null);
      setLyricsError(null);
      setFromCache(false);
      setPlayerOpen(false);
    } else if (spotify) {
      prevSpotifyRef.current = spotify;
    }
  }, [spotify, trackKey, isMobile]);

  // Detecta mobile
  useEffect(() => {
    const update = () => setIsMobile(window.innerWidth <= 768);
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  // Escape sai do fullscreen
  useEffect(() => {
    if (!spotify || !isFullscreen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      e.preventDefault();
      setIsFullscreen(false);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [spotify, isFullscreen]);

  // Focus trap no fullscreen: mantém Tab dentro do modal
  useEffect(() => {
    if (!isFullscreen || !fullscreenModalRef.current) return;
    const el = fullscreenModalRef.current;
    const focusable = "button, [href], input, select, textarea, [tabindex]:not([tabindex=\"-1\"])";
    const getFocusable = () => Array.from(el.querySelectorAll<HTMLElement>(focusable)).filter((n) => !n.hasAttribute("disabled") && n.offsetParent !== null);
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key !== "Tab") return;
      const nodes = getFocusable();
      if (nodes.length === 0) return;
      const first = nodes[0];
      const last = nodes[nodes.length - 1];
      if (e.shiftKey) {
        if (document.activeElement === first) {
          e.preventDefault();
          last.focus();
        }
      } else {
        if (document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };
    el.addEventListener("keydown", onKeyDown);
    return () => el.removeEventListener("keydown", onKeyDown);
  }, [isFullscreen]);

  // Restaurar foco no botão que abriu o fullscreen ao sair
  useEffect(() => {
    if (!isFullscreen && spotify) {
      const id = requestAnimationFrame(() => {
        fullscreenTriggerRef.current?.focus({ preventScroll: true });
      });
      return () => cancelAnimationFrame(id);
    }
  }, [isFullscreen, spotify]);

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
      nowListening: isEn
        ? "What I'm listening to now on Spotify"
        : isEs
          ? "Lo que estoy escuchando ahora en Spotify"
          : "O que estou ouvindo agora no Spotify",
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
      fontSizeDown: isEn ? "Decrease lyrics font size" : isEs ? "Reducir tamaño de letra" : "Diminuir tamanho da letra",
      fontSizeUp: isEn ? "Increase lyrics font size" : isEs ? "Aumentar tamaño de letra" : "Aumentar tamanho da letra",
      lastPlayed: isEn ? "Last played" : isEs ? "Última reproducida" : "Última tocada",
    };
  }, [language]);

  const containerClass = isFullscreen
    ? "fixed inset-0 z-[9998] flex items-center justify-center p-4 pointer-events-auto"
    : "pointer-events-none fixed bottom-4 right-4 z-[9998]";

  const popupClass = isFullscreen
    ? "pointer-events-auto w-full max-w-5xl min-h-[70vh] max-h-[90vh] overflow-hidden rounded-2xl border border-white/10 bg-gray-900/80 shadow-2xl backdrop-blur-2xl flex flex-col relative z-10"
    : "pointer-events-auto w-[400px] overflow-hidden rounded-2xl border border-white/10 bg-gray-900/70 shadow-2xl backdrop-blur-xl";

  const listHeightClass = isFullscreen ? "max-h-[60vh]" : "max-h-[260px]";

  const lyricsTextSizeClass = useMemo(() => {
    const steps: Record<number, string> = {
      [-2]: "text-xs",
      [-1]: "text-sm",
      0: "text-base",
      1: "text-lg",
      2: "text-xl",
    };
    return steps[lyricsFontSizeStep] ?? "text-base";
  }, [lyricsFontSizeStep]);

  const handleExitFullscreen = useCallback(() => {
    fullscreenTriggerRef.current?.focus({ preventScroll: true });
    setIsFullscreen(false);
  }, []);

  const handleBackdropClick = useCallback(
    (e: React.MouseEvent) => {
      if (e.target !== e.currentTarget) return;
      handleExitFullscreen();
    },
    [handleExitFullscreen],
  );

  const showInstrumental = false;

  return (
    <div className={containerClass}>
      {isFullscreen && spotify && (
        <div
          role="presentation"
          aria-hidden
          className="absolute inset-0 z-0 bg-black/70"
          onClick={handleBackdropClick}
        />
      )}
      <AnimatePresence>
        {spotify && (
          <motion.div
            ref={isFullscreen ? fullscreenModalRef : null}
            className={popupClass}
            initial={{ opacity: 0, y: 18, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 18, scale: 0.98 }}
            transition={{ type: "spring", stiffness: 300, damping: 26 }}
            data-spotify-lyrics-popup="1"
            role="dialog"
            aria-modal={isFullscreen}
            aria-label="Letra sincronizada do Spotify"
          >
            {!isFullscreen && (
              <div className="border-b border-white/10 px-4 py-3">
                <div className="mb-3 flex items-center gap-2">
                  <span className="flex h-5 w-5 flex-shrink-0" aria-hidden>
                    <svg viewBox="0 0 24 24" className="h-5 w-5 text-[#1DB954]" fill="currentColor" role="img" aria-label="Spotify">
                      <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z" />
                    </svg>
                  </span>
                  <span className="text-xs font-medium text-white/80">{strings.nowListening}</span>
                </div>
                <div className="flex items-center gap-3">
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
                  {spotify.album && (
                    <p className="truncate text-[11px] text-white/45">{spotify.album}</p>
                  )}
                  <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-white/20">
                    <div
                      className="h-full rounded-full bg-[#1DB954]/90"
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
                    ref={fullscreenTriggerRef}
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
                {lastPlayed && (
                  <div className="mt-3 flex items-center gap-2 border-t border-white/10 pt-3">
                    <p className="flex-shrink-0 text-[10px] font-medium uppercase tracking-wider text-white/50">
                      {strings.lastPlayed}
                    </p>
                    <div className="flex min-w-0 flex-1 items-center gap-2">
                      <div className="relative h-9 w-9 flex-shrink-0 overflow-hidden rounded-lg border border-white/10 bg-black/20">
                        {lastPlayed.album_art_url ? (
                          <Image
                            src={lastPlayed.album_art_url}
                            alt={lastPlayed.album}
                            fill
                            className="object-cover"
                            unoptimized
                            sizes="36px"
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center text-white/50">
                            <Music2 className="h-4 w-4" />
                          </div>
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-xs text-white/70">{lastPlayed.song}</p>
                        <p className="truncate text-[11px] text-white/50">{lastPlayed.artist}</p>
                      </div>
                    </div>
                  </div>
                )}
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
                      <div className="h-2 w-full overflow-hidden rounded-full bg-white/20">
                        <div
                          className="h-full rounded-full bg-[#1DB954]/90"
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
                          onClick={handleExitFullscreen}
                          className="rounded-full p-2 text-white/70 hover:bg-white/10 hover:text-white"
                          aria-label={strings.exitFullscreen}
                          title={strings.exitFullscreen}
                        >
                          <Minimize2 className="h-4 w-4" />
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

                {!loadingLyrics && !lyricsError && lyricsRaw && (
                  <div className="contents">
                    {isFullscreen ? (
                      <div className="flex flex-col flex-1 min-h-0 overflow-hidden">
                        <div className="flex flex-shrink-0 items-center justify-between gap-3 border-b border-white/10 px-4 py-3">
                          <div className="flex min-w-0 items-center gap-2">
                            <span className="flex h-5 w-5 flex-shrink-0" aria-hidden>
                              <svg viewBox="0 0 24 24" className="h-5 w-5 text-[#1DB954]" fill="currentColor" role="img" aria-label="Spotify">
                                <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z" />
                              </svg>
                            </span>
                            <span className="truncate text-sm font-medium text-white/80">{strings.nowListening}</span>
                          </div>
                          <div className="flex flex-shrink-0 items-center gap-1">
                            <button
                              type="button"
                              onClick={() => setLyricsFontSizeStep((s) => Math.max(-2, s - 1))}
                              className="rounded px-2 py-1 text-sm font-medium text-white/70 hover:bg-white/10 hover:text-white"
                              aria-label={strings.fontSizeDown}
                              title={strings.fontSizeDown}
                            >
                              A−
                            </button>
                            <button
                              type="button"
                              onClick={() => setLyricsFontSizeStep((s) => Math.min(2, s + 1))}
                              className="rounded px-2 py-1 text-sm font-medium text-white/70 hover:bg-white/10 hover:text-white"
                              aria-label={strings.fontSizeUp}
                              title={strings.fontSizeUp}
                            >
                              A+
                            </button>
                          </div>
                        </div>
                        <div className="flex min-h-0 flex-1 flex-col overflow-hidden lg:flex-row lg:gap-6 lg:overflow-auto lg:px-4 lg:py-3">
                          <div className="flex-shrink-0 space-y-4 px-4 py-3 lg:py-3 lg:w-2/5">
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
                          <div className="space-y-2 text-center">
                            <p className="truncate text-xl font-semibold text-white">{title}</p>
                            <p className="truncate text-sm text-white/70">{subtitle}</p>
                            {spotify.album && (
                              <p className="truncate text-xs text-white/50">{spotify.album}</p>
                            )}
                            <div className="flex flex-wrap justify-center gap-2">
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
                                onClick={handleExitFullscreen}
                                className="rounded-full p-2 text-white/70 hover:bg-white/10 hover:text-white"
                                aria-label={strings.exitFullscreen}
                                title={strings.exitFullscreen}
                              >
                                <Minimize2 className="h-4 w-4" />
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
                          <div className="h-2.5 w-full overflow-hidden rounded-full bg-white/20">
                            <div
                              className="h-full rounded-full bg-[#1DB954]/90"
                              style={{
                                width: `${clamp((displayTime / Math.max(1, totalSeconds)) * 100, 0, 100)}%`,
                              }}
                            />
                          </div>
                          <div className="flex items-center justify-between text-xs text-white/60 tabular-nums">
                            <span>{formatTime(currentTime)}</span>
                            <span>-{formatTime(remainingSeconds)}</span>
                          </div>
                          {lastPlayed && (
                            <div className="rounded-xl border border-white/10 bg-white/5 p-3">
                              <p className="mb-2 text-[10px] font-medium uppercase tracking-wider text-white/50">
                                {strings.lastPlayed}
                              </p>
                              <div className="flex items-center gap-3">
                                <div className="relative h-12 w-12 flex-shrink-0 overflow-hidden rounded-lg border border-white/10">
                                  {lastPlayed.album_art_url ? (
                                    <Image
                                      src={lastPlayed.album_art_url}
                                      alt={lastPlayed.album}
                                      fill
                                      className="object-cover"
                                      unoptimized
                                      sizes="48px"
                                    />
                                  ) : (
                                    <div className="flex h-full w-full items-center justify-center text-white/50">
                                      <Music2 className="h-6 w-6" />
                                    </div>
                                  )}
                                </div>
                                <div className="min-w-0 flex-1">
                                  <p className="truncate text-sm font-medium text-white/80">{lastPlayed.song}</p>
                                  <p className="truncate text-xs text-white/55">{lastPlayed.artist}</p>
                                  {lastPlayed.album && (
                                    <p className="truncate text-[11px] text-white/40">{lastPlayed.album}</p>
                                  )}
                                </div>
                              </div>
                            </div>
                          )}
                        </div>

                        {hasSynced ? (
                          <LayoutGroup>
                            <motion.div
                              ref={listRef}
                              className={`${listHeightClass} flex-1 overflow-y-auto pr-1 scroll-smooth ${lyricsTextSizeClass}`}
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
                                        className={active ? "relative font-semibold" : "relative opacity-90"}
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
                            className={`${listHeightClass} flex-1 overflow-y-auto whitespace-pre-wrap text-white/70 scroll-smooth ${lyricsTextSizeClass}`}
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
                      </div>
                    ) : (
                      <div className="flex-1 min-h-0 overflow-hidden flex flex-col">
                        {hasSynced ? (
                          <LayoutGroup>
                            <motion.div
                              ref={listRef}
                              className={`${listHeightClass} overflow-y-auto pr-1 scroll-smooth`}
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
                            className={`${listHeightClass} overflow-y-auto whitespace-pre-wrap text-sm text-white/70 scroll-smooth`}
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
                    )}
                  </div>
                )}
              </div>
            )}

            {spotify && isFullscreen && collapsed && (
              <div className="flex flex-1 flex-col overflow-hidden">
                <div className="flex flex-shrink-0 items-center gap-2 border-b border-white/10 px-4 py-3">
                  <span className="flex h-5 w-5 flex-shrink-0" aria-hidden>
                    <svg viewBox="0 0 24 24" className="h-5 w-5 text-[#1DB954]" fill="currentColor" role="img" aria-label="Spotify">
                      <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z" />
                    </svg>
                  </span>
                  <span className="text-sm font-medium text-white/80">{strings.nowListening}</span>
                </div>
                <div className="flex flex-1 flex-col items-center justify-center gap-6 px-4 py-6">
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
                    {spotify.album && (
                      <p className="text-xs text-white/50 truncate">{spotify.album}</p>
                    )}
                  </div>
                  <div className="h-2.5 w-full overflow-hidden rounded-full bg-white/20">
                    <div
                      className="h-full rounded-full bg-[#1DB954]/90"
                      style={{
                        width: `${clamp((displayTime / Math.max(1, totalSeconds)) * 100, 0, 100)}%`,
                      }}
                    />
                  </div>
                  <div className="flex items-center justify-between text-xs text-white/60 tabular-nums">
                    <span>{formatTime(currentTime)}</span>
                    <span>-{formatTime(remainingSeconds)}</span>
                  </div>
                  <div className="flex flex-wrap justify-center gap-2">
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
                      onClick={handleExitFullscreen}
                      className="rounded-full p-2 text-white/70 hover:bg-white/10 hover:text-white"
                      aria-label={strings.exitFullscreen}
                      title={strings.exitFullscreen}
                    >
                      <Minimize2 className="h-4 w-4" />
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
                  {lastPlayed && (
                    <div className="mt-4 flex items-center gap-3 rounded-xl border border-white/10 bg-white/5 p-3">
                      <div className="relative h-10 w-10 flex-shrink-0 overflow-hidden rounded-lg border border-white/10">
                        {lastPlayed.album_art_url ? (
                          <Image
                            src={lastPlayed.album_art_url}
                            alt={lastPlayed.album}
                            fill
                            className="object-cover"
                            unoptimized
                            sizes="40px"
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center text-white/50">
                            <Music2 className="h-5 w-5" />
                          </div>
                        )}
                      </div>
                      <div className="min-w-0 flex-1 text-left">
                        <p className="text-[10px] font-medium uppercase tracking-wider text-white/50">
                          {strings.lastPlayed}
                        </p>
                        <p className="truncate text-sm text-white/80">{lastPlayed.song}</p>
                        <p className="truncate text-xs text-white/55">{lastPlayed.artist}</p>
                      </div>
                    </div>
                  )}
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
