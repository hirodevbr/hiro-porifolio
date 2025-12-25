"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import { AnimatePresence, LayoutGroup, motion } from "framer-motion";
import { ChevronDown, ExternalLink, Music2, Play } from "lucide-react";
import { findActiveIndex, parseLrc, type LrcLine } from "@/lib/lrc";
import { getCachedLyrics, setCachedLyrics } from "@/lib/lyricsCache";
import { DISCORD_USER_ID } from "@/lib/config";
import { useLanyardUser, type LanyardSpotify } from "@/lib/lanyardClient";

type LrclibResponse = {
  syncedLyrics?: string | null;
  plainLyrics?: string | null;
  // outros campos podem existir; não precisamos tipar todos
};

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

// Ajuste fino de sincronização wave/lyrics. Valor positivo adianta a letra em relação ao áudio.
const WAVE_OFFSET_MS = -80; // iOS: pequeno atraso para compensar adiantamento percebido

function formatTime(seconds: number) {
  const s = Math.max(0, Math.floor(seconds));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const ss = s % 60;
  if (h > 0) return `${h}:${String(m).padStart(2, "0")}:${String(ss).padStart(2, "0")}`;
  return `${m}:${String(ss).padStart(2, "0")}`;
}

function usePrefersReducedMotion() {
  const [reduceMotion, setReduceMotion] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia?.("(prefers-reduced-motion: reduce)");
    if (!mq) return;
    const update = () => setReduceMotion(Boolean(mq.matches));
    update();
    // Safari legacy
    // eslint-disable-next-line deprecation/deprecation
    mq.addEventListener?.("change", update) ?? mq.addListener?.(update);
    return () => {
      // eslint-disable-next-line deprecation/deprecation
      mq.removeEventListener?.("change", update) ?? mq.removeListener?.(update);
    };
  }, []);
  return reduceMotion;
}

function AnimatedEllipsis() {
  const reduceMotion = usePrefersReducedMotion();

  if (reduceMotion) return <span>…</span>;

  return (
    <span className="inline-flex items-center gap-1" aria-label="Instrumental">
      {[0, 1, 2].map((i) => (
        <motion.span
          key={i}
          className="inline-block h-1.5 w-1.5 rounded-full bg-white/70"
          initial={{ opacity: 0.25, y: 0 }}
          animate={{ opacity: [0.25, 1, 0.25], y: [0, -2, 0] }}
          transition={{
            duration: 0.9,
            ease: "easeInOut",
            repeat: Infinity,
            delay: i * 0.15,
          }}
        />
      ))}
    </span>
  );
}

function ProgressWaveText({ text, progress }: { text: string; progress: number }) {
  const reduceMotion = usePrefersReducedMotion();
  const p = clamp(progress, 0, 1);
  if (reduceMotion) return <>{text}</>;

  const chars = Array.from(text);
  const n = Math.max(1, chars.length);
  const center = p * n; // "fronteira" do preenchimento (em índice de caractere)
  const waveRange = 18; // quão larga é a onda na borda do preenchimento
  const maxAmp = 7; // amplitude da wave (mais perceptível)

  return (
    <span className="inline-flex flex-wrap">
      {chars.map((ch, idx) => {
        const isSpace = ch === " ";
        const fill = clamp(center - idx, 0, 1); // 0..1 (parcial no caractere da borda)
        const dist = Math.abs(idx - center);
        const waveStrength = clamp(1 - dist / waveRange, 0, 1);
        const amp = maxAmp * waveStrength;

        const baseAlpha = 0.35; // cinza inicial
        const alpha = baseAlpha + (1 - baseAlpha) * fill; // vai ficando branco conforme preenche
        const color = `rgba(255,255,255,${alpha})`;

        // Para não "pesar", só anima perto da borda (onde a wave está passando)
        const shouldAnimate = waveStrength > 0.05;

        return (
          <motion.span
            key={`${idx}-${ch}`}
            className={isSpace ? "whitespace-pre" : "inline-block"}
            aria-hidden="true"
            style={{ color }}
            initial={false}
            animate={
              shouldAnimate
                ? { y: [0, -amp, 0], opacity: [alpha, Math.min(1, alpha + 0.25), alpha] }
                : { y: 0, opacity: alpha }
            }
            transition={
              shouldAnimate
                ? {
                    duration: 0.75,
                    ease: "easeInOut",
                    repeat: Infinity,
                    // fase por caractere pra parecer uma onda "andando"
                    delay: (idx % 24) * 0.02,
                  }
                : { duration: 0.12 }
            }
          >
            {isSpace ? "\u00A0" : ch}
          </motion.span>
        );
      })}
      <span className="sr-only">{text}</span>
    </span>
  );
}

function safeKey(s: string) {
  return s.trim().toLowerCase();
}

export default function SpotifyLyricsPopup() {
  const { data } = useLanyardUser(DISCORD_USER_ID);
  const spotify = (data?.spotify ?? null) as LanyardSpotify | null;
  const [collapsed, setCollapsed] = useState(false);
  const [playerOpen, setPlayerOpen] = useState(false);

  const [lyricsRaw, setLyricsRaw] = useState<string | null>(null);
  const [lyricsError, setLyricsError] = useState<string | null>(null);
  const [loadingLyrics, setLoadingLyrics] = useState(false);
  const [fromCache, setFromCache] = useState(false);
  const inflightKeyRef = useRef<string>("");

  const [tSeconds, setTSeconds] = useState(0);

  const activeLineRef = useRef<HTMLButtonElement | null>(null);
  const listRef = useRef<HTMLDivElement | null>(null);
  const plainRef = useRef<HTMLDivElement | null>(null);
  const lastUserScrollAtRef = useRef<number>(0);
  const programmaticScrollRef = useRef(false);
  const prevTrackKeyRef = useRef<string>("");

  const trackKey = useMemo(() => {
    if (!spotify) return "";
    return `${spotify.track_id}:${safeKey(spotify.artist)}:${safeKey(spotify.song)}`;
  }, [spotify]);

  const cacheKey = useMemo(() => {
    if (!spotify) return "";
    // preferir track_id (mais estável); fallback para trackKey
    return spotify.track_id?.trim() ? `track:${spotify.track_id}` : `name:${trackKey}`;
  }, [spotify, trackKey]);

  const lines: LrcLine[] = useMemo(() => {
    if (!lyricsRaw) return [];
    // LRCLIB normalmente retorna LRC em syncedLyrics; se vier como texto sem tags, não haverá linhas.
    return parseLrc(lyricsRaw);
  }, [lyricsRaw]);

  const hasSynced = lines.length > 0;
  const activeIndex = useMemo(
    () => findActiveIndex(lines, Math.max(0, tSeconds * 1000 + WAVE_OFFSET_MS)),
    [lines, tSeconds],
  );
  const showInstrumental = useMemo(() => {
    if (!hasSynced) return false;
    const tMs = Math.max(0, tSeconds * 1000 + WAVE_OFFSET_MS);
    if (!Number.isFinite(tMs)) return false;

    const GAP_MS = 6000; // só mostrar "solo" quando o buraco é grande (evita flicker)
    const EDGE_MS = 1200; // margem pra não ficar piscando perto do verso

    // Antes do primeiro verso (intro)
    const first = lines[0];
    if (first && tMs + EDGE_MS < first.timeMs) return true;

    // Entre versos com gap grande (solo/instrumental)
    const cur = lines[activeIndex];
    const next = lines[activeIndex + 1];
    if (cur && next) {
      const gap = next.timeMs - cur.timeMs;
      if (gap >= GAP_MS && tMs > cur.timeMs + EDGE_MS && tMs < next.timeMs - EDGE_MS) return true;
    }

    return false;
  }, [activeIndex, hasSynced, lines, tSeconds]);

  const autoCenterActiveLine = () => {
    // Evita depender de refs do Framer Motion; usa query DOM no popup (mais confiável)
    const popup = document.querySelector('[data-spotify-lyrics-popup="1"]');
    const container = popup?.querySelector('[data-lyrics-scroll="synced"]') as HTMLDivElement | null;
    const activeEl = popup?.querySelector('[aria-current="true"]') as HTMLElement | null;
    if (!container || !activeEl) return;
    if (Date.now() - lastUserScrollAtRef.current < 2500) return;

    // Centralizar a linha ativa dentro do container (mais confiável que scrollIntoView com layout animado)
    const containerRect = container.getBoundingClientRect();
    const activeRect = activeEl.getBoundingClientRect();
    const currentTop = container.scrollTop;

    const offsetWithin = (activeRect.top - containerRect.top) + currentTop;
    const targetTop = offsetWithin - container.clientHeight / 2 + activeEl.clientHeight / 2;
    const clamped = Math.max(0, Math.min(targetTop, container.scrollHeight - container.clientHeight));

    const prefersReducedMotion = window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches;
    programmaticScrollRef.current = true;
    container.scrollTo({ top: clamped, behavior: prefersReducedMotion ? "auto" : "smooth" });
    window.setTimeout(() => {
      programmaticScrollRef.current = false;
    }, 250);
  };

  // Atualiza tempo atual baseado nos timestamps do Spotify (start/end).
  useEffect(() => {
    if (!spotify) return;

    const start = spotify.timestamps.start;
    const end = spotify.timestamps.end;
    const total = Math.max(1, (end - start) / 1000);
    const lastProgressRef = { current: 0 };

    // Base: pegamos o tempo decorrido no "wall clock" agora, e depois avançamos usando um clock monotônico
    // (`performance.now`) para evitar drift/jumps do `Date.now()` e deixar a UI mais fluida (wave/progress).
    let raf = 0;
    let interval: number | null = null;
    // Emitir estado em frequência limitada para evitar re-render 60fps (o que pode quebrar/jitter a barra e a UI)
    // Mantém boa sensação de sync, mas reduz custo e “briga” com transições CSS.
    // Frequência de emissão: 45fps para suavidade suficiente sem jitter excessivo.
    const EMIT_HZ = 45;
    const EMIT_STEP = 1 / EMIT_HZ;
    let lastEmitted = -Infinity;

    const baseElapsed = clamp((Date.now() - start) / 1000, 0, total);
    let basePerf = performance.now();
    let base = baseElapsed;

    const setFromNow = (nowPerf: number) => {
      const elapsed = base + (nowPerf - basePerf) / 1000;
      const clamped = clamp(elapsed, 0, total);
      if (!Number.isFinite(clamped)) return;
      // Evita “voltar” no tempo em caso de drift ou data inconsistência do Lanyard.
      const monotonic = Math.min(total, Math.max(lastProgressRef.current, clamped));
      lastProgressRef.current = monotonic;
      // throttle: só seta state quando avançou o suficiente (ou quando resync fizer “pulo”)
      if (Math.abs(monotonic - lastEmitted) >= EMIT_STEP) {
        lastEmitted = monotonic;
        setTSeconds(monotonic);
      }
    };

    const resync = () => {
      // Reancora de tempos em tempos para acompanhar possíveis correções do Lanyard e evitar drift longo.
      base = clamp((Date.now() - start) / 1000, 0, total);
      basePerf = performance.now();
      // força emissão após resync (corrige UI imediatamente)
      lastEmitted = -Infinity;
    };

    const loop = (nowPerf: number) => {
      // Se a aba estiver oculta, RAF vira “suspenso”; nessa situação, deixamos o interval assumir.
      if (!document.hidden) setFromNow(nowPerf);
      raf = window.requestAnimationFrame(loop);
    };

    // Primeira atualização imediata
    setFromNow(performance.now());

    // RAF para suavidade (principalmente na borda do highlight/wave)
    raf = window.requestAnimationFrame(loop);

    // Resync leve (corrige deriva e saltos do relógio)
    // Resync mais frequente para reduzir drift perceptível (ex.: atraso leve da wave)
    interval = window.setInterval(resync, 1000);

    const onVisibility = () => {
      // Ao voltar para a aba, ressincroniza na hora pra não “pular” atrasado.
      if (!document.hidden) resync();
    };
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      if (raf) window.cancelAnimationFrame(raf);
      if (interval) window.clearInterval(interval);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [spotify]);

  // Quando a música muda, reabrir o popup (se estava escondido) e buscar nova letra.
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
      setCollapsed(false);
      setLyricsRaw(null);
      setLyricsError(null);
      setFromCache(false);
      setPlayerOpen(false);
    }
  }, [spotify, trackKey]);

  // Carregar instantaneamente do cache/histórico (se existir)
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

  // Buscar lyrics via nosso proxy (LRCLIB).
  useEffect(() => {
    if (!spotify) return;
    if (!cacheKey) return;

    const cached = cacheKey ? getCachedLyrics(cacheKey) : { entry: null, stale: false };
    // Se já temos letra no estado e não está stale, não buscar de novo.
    if (lyricsRaw && !cached.stale) return;
    // Se não temos letra mas existe cache e não está stale, não buscar.
    if (!lyricsRaw && cached.entry && !cached.stale) return;
    // Evitar múltiplas buscas concorrentes para a mesma música
    if (inflightKeyRef.current === cacheKey) return;

    let cancelled = false;
    const controller = new AbortController();

    (async () => {
      inflightKeyRef.current = cacheKey;
      setLoadingLyrics(true);
      // Fail-safe: nunca ficar preso em loading (iOS é sensível)
      const safety = window.setTimeout(() => {
        if (!cancelled && inflightKeyRef.current === cacheKey) {
          setLoadingLyrics(false);
          inflightKeyRef.current = "";
        }
      }, 12000);
      try {
        const res = await fetch(
          `/api/lyrics?artist_name=${encodeURIComponent(spotify.artist)}&track_name=${encodeURIComponent(spotify.song)}`,
          { signal: controller.signal },
        );
        if (!res.ok) throw new Error(String(res.status));
        const data = (await res.json()) as LrclibResponse;

        // Preferir sincronizada. Se não houver, cair para plain (sem highlight).
        const synced = data.syncedLyrics?.trim() ?? null;
        const plain = data.plainLyrics?.trim() ?? null;
        const chosen = synced || plain || null;

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
              syncedLyrics: synced,
              plainLyrics: plain,
            });
          }
        }
      } catch {
        if (!cancelled) setLyricsError("Não consegui buscar a letra agora.");
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

  // Scroll suave para manter a linha ativa visível
  useEffect(() => {
    if (collapsed) return;
    autoCenterActiveLine();
  }, [activeIndex, collapsed]);

  // Reforço: durante a música, re-centraliza periodicamente (tipo Spotify),
  // mesmo se o índice não mudar por alguns segundos.
  useEffect(() => {
    if (collapsed) return;
    if (!spotify) return;
    if (!hasSynced) return;
    autoCenterActiveLine();
    // roda em baixa frequência para não pesar (especialmente no iOS)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [Math.floor(tSeconds), collapsed, hasSynced, spotify?.track_id]);

  // Auto-scroll para letra NÃO sincronizada: faz a letra "subir" pelo progresso da música
  useEffect(() => {
    if (collapsed) return;
    if (!spotify) return;
    if (hasSynced) return;
    const container = plainRef.current;
    if (!container) return;
    if (Date.now() - lastUserScrollAtRef.current < 2500) return;

    const total = Math.max(1, (spotify.timestamps.end - spotify.timestamps.start) / 1000);
    const progress = clamp(Math.max(0, tSeconds + WAVE_OFFSET_MS / 1000) / total, 0, 1);
    const maxTop = Math.max(0, container.scrollHeight - container.clientHeight);
    const targetTop = maxTop * progress;

    const prefersReducedMotion = window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches;
    programmaticScrollRef.current = true;
    container.scrollTo({ top: targetTop, behavior: prefersReducedMotion ? "auto" : "smooth" });
    window.setTimeout(() => {
      programmaticScrollRef.current = false;
    }, 250);
  }, [spotify, tSeconds, hasSynced, collapsed]);

  const title = spotify?.song ?? "";
  const subtitle = spotify?.artist ?? "";
  const spotifyEmbedUrl = spotify?.track_id ? `https://open.spotify.com/embed/track/${spotify.track_id}` : null;
  const spotifyOpenUrl = spotify?.track_id ? `https://open.spotify.com/track/${spotify.track_id}` : null;
  const totalSeconds = useMemo(() => {
    if (!spotify) return 0;
    return Math.max(1, (spotify.timestamps.end - spotify.timestamps.start) / 1000);
  }, [spotify]);
  const remainingSeconds = Math.max(0, totalSeconds - tSeconds);
  const sp = spotify;
  const hasSpotify = Boolean(sp);

  return (
    <div className="pointer-events-none fixed bottom-4 right-4 z-[9998]">
      <AnimatePresence>
        {hasSpotify && sp && (
          <motion.div
            className="pointer-events-auto w-[360px] overflow-hidden rounded-2xl border border-white/10 bg-gray-900/70 shadow-2xl backdrop-blur-xl"
            initial={{ opacity: 0, y: 18, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 18, scale: 0.98 }}
            transition={{ type: "spring", stiffness: 260, damping: 28 }}
            data-spotify-lyrics-popup="1"
            role="dialog"
            aria-label="Letra sincronizada do Spotify"
          >
            {/* Header */}
            <div className="flex items-start gap-3 border-b border-white/10 px-4 py-3">
              <div className="relative h-12 w-12 flex-shrink-0 overflow-hidden rounded-xl border border-white/10 bg-black/20">
                {sp.album_art_url ? (
                  <Image
                    src={sp.album_art_url}
                    alt={sp.album}
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
                <>
                  <p className="truncate text-sm font-semibold text-white">{title}</p>
                  <p className="truncate text-xs text-white/60">{subtitle}</p>
                  <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-white/10">
                    <div
                      className="h-full rounded-full bg-green-500"
                      style={{
                        width: `${clamp((tSeconds / Math.max(1, totalSeconds)) * 100, 0, 100)}%`,
                      }}
                    />
                  </div>
                  <div className="mt-1 flex items-center justify-between text-[11px] tabular-nums text-white/50">
                    <span aria-label={`Tempo atual ${formatTime(tSeconds)}`}>{formatTime(tSeconds)}</span>
                    <span aria-label={`Tempo restante ${formatTime(remainingSeconds)}`}>
                      -{formatTime(remainingSeconds)}
                    </span>
                  </div>
                </>
              </div>

              <div className="flex items-center gap-1">
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
                {hasSpotify && (
                  <button
                    type="button"
                    onClick={() => setCollapsed((v) => !v)}
                    className="rounded-full p-2 text-white/70 hover:bg-white/10 hover:text-white"
                    aria-label={collapsed ? "Expandir" : "Recolher"}
                  >
                    <ChevronDown className={collapsed ? "h-4 w-4 rotate-180" : "h-4 w-4"} />
                  </button>
                )}
              </div>
            </div>

            {/* Body */}
            {hasSpotify && !collapsed && (
              <div className="px-4 py-3">
                {/* Player (lazy) */}
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
                  <p className="text-sm text-white/60">Buscando letra…</p>
                )}

                {lyricsError && !loadingLyrics && (
                  <p className="text-sm text-amber-200">{lyricsError}</p>
                )}

                {!loadingLyrics && !lyricsError && lyricsRaw && (
                  <>
                    {hasSynced ? (
                      <LayoutGroup>
                        <motion.div
                          ref={listRef}
                          className="max-h-[260px] overflow-y-auto pr-1"
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
                            {showInstrumental && (
                              <motion.button
                                key="__instrumental__"
                                type="button"
                                layout
                                variants={{
                                  hidden: { opacity: 0, y: 6, filter: "blur(2px)" },
                                  show: { opacity: 1, y: 0, filter: "blur(0px)" },
                                }}
                                transition={{ type: "spring", stiffness: 420, damping: 34, mass: 0.7 }}
                                className={[
                                  "relative block w-full overflow-hidden rounded-lg px-2 py-1.5 text-left",
                                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400/40",
                                  "text-white",
                                ].join(" ")}
                                aria-current="true"
                                onClick={() => {}}
                              >
                                <motion.div
                                  layoutId="lyricHighlight"
                                  className="absolute inset-0 rounded-lg bg-white/10"
                                  transition={{ type: "spring", stiffness: 520, damping: 40 }}
                                />
                                <motion.div
                                  layoutId="lyricGlow"
                                  className="absolute -inset-6 rounded-2xl bg-gradient-to-r from-green-500/0 via-green-400/10 to-green-500/0 blur-xl"
                                  transition={{ type: "spring", stiffness: 380, damping: 34 }}
                                />
                                <motion.span
                                  className="relative text-base font-semibold"
                                  animate={{ opacity: 1, scale: 1.02 }}
                                  transition={{ type: "spring", stiffness: 420, damping: 28 }}
                                >
                                  <AnimatedEllipsis />
                                </motion.span>
                              </motion.button>
                            )}
                            {lines.map((l, idx) => {
                              const active = !showInstrumental && idx === activeIndex;
                              const progress = (() => {
                                if (!active) return 0;
                                const tMs = Math.max(0, tSeconds * 1000 + WAVE_OFFSET_MS);
                                const startMs = l.timeMs;
                                const endMs =
                                  lines[idx + 1]?.timeMs ??
                                  (spotify ? (spotify.timestamps.end - spotify.timestamps.start) : startMs + 4000);
                                const denom = Math.max(400, endMs - startMs);
                                return clamp((tMs - startMs) / denom, 0, 1);
                              })();
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
                                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400/40",
                                    active ? "text-white" : "text-white/55 hover:text-white/80",
                                  ].join(" ")}
                                  aria-current={active ? "true" : "false"}
                                  // Sem seek: não controlamos o Spotify. Clique só “foca”.
                                  onClick={() => {}}
                                >
                                  {active && (
                                    <motion.div
                                      layoutId="lyricHighlight"
                                      className="absolute inset-0 rounded-lg bg-white/10"
                                      transition={{ type: "spring", stiffness: 520, damping: 40 }}
                                    />
                                  )}

                                  {/* Glow suave */}
                                  {active && (
                                    <motion.div
                                      layoutId="lyricGlow"
                                      className="absolute -inset-6 rounded-2xl bg-gradient-to-r from-green-500/0 via-green-400/10 to-green-500/0 blur-xl"
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
                                    {active ? (
                                      <ProgressWaveText text={l.text || "…"} progress={progress} />
                                    ) : (
                                      l.text || "…"
                                    )}
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
                        className="max-h-[260px] overflow-y-auto whitespace-pre-wrap text-sm text-white/70"
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
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}


