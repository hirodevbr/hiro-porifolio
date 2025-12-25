"use client";

import { useEffect, useMemo, useState } from "react";

export type LanyardSpotify = {
  track_id: string;
  timestamps: { start: number; end: number };
  song: string;
  artist: string;
  album_art_url: string;
  album: string;
};

export type LanyardData = {
  discord_user?: any;
  discord_status?: "online" | "idle" | "dnd" | "offline";
  activities?: any[];
  spotify?: LanyardSpotify;
  kv?: Record<string, any>;
};

type State = {
  loading: boolean;
  error: string | null;
  data: LanyardData | null;
  signature: string;
};

type Subscriber = (s: State) => void;

function makeSignature(d: LanyardData | null) {
  if (!d) return "";
  const sp = d.spotify;
  const spSig = sp
    ? `${sp.track_id}|${sp.timestamps?.start ?? ""}|${sp.timestamps?.end ?? ""}|${sp.song}|${sp.artist}`
    : "no-spotify";
  const status = d.discord_status ?? "offline";
  const activities = Array.isArray(d.activities)
    ? d.activities
        .map((a) => `${a?.type}|${a?.name}|${a?.details}|${a?.state}|${a?.timestamps?.start ?? ""}|${a?.timestamps?.end ?? ""}`)
        .join("~")
    : "";
  return `${status}::${spSig}::${activities.length}:${activities.slice(0, 800)}`;
}

class LanyardStore {
  private userId: string;
  private subscribers = new Set<Subscriber>();
  private state: State = { loading: true, error: null, data: null, signature: "" };
  private timer: number | null = null;
  private abort: AbortController | null = null;
  private refCount = 0;
  private ws: WebSocket | null = null;
  private wsHeartbeatTimer: number | null = null;
  private wsReconnectTimer: number | null = null;
  private wsBackoffMs = 1000;

  constructor(userId: string) {
    this.userId = userId;
  }

  getSnapshot() {
    return this.state;
  }

  subscribe(cb: Subscriber) {
    this.subscribers.add(cb);
    this.refCount++;
    if (this.refCount === 1) this.start();
    cb(this.state);
    return () => {
      this.subscribers.delete(cb);
      this.refCount = Math.max(0, this.refCount - 1);
      if (this.refCount === 0) this.stop();
    };
  }

  private emit(next: State) {
    this.state = next;
    for (const cb of this.subscribers) cb(this.state);
  }

  private stop() {
    if (this.timer) window.clearTimeout(this.timer);
    this.timer = null;
    if (this.abort) this.abort.abort();
    this.abort = null;
    this.stopWebSocket();
  }

  private start() {
    const onVis = () => {
      // ao voltar pro foreground, busca imediatamente
      if (document.visibilityState === "visible") {
        this.fetchNow(true);
        this.startWebSocket();
      } else {
        // Em background, fecha WS (iOS agradece) e volta pro polling lento
        this.stopWebSocket();
      }
    };
    window.addEventListener("visibilitychange", onVis);

    const originalStop = this.stop.bind(this);
    this.stop = () => {
      window.removeEventListener("visibilitychange", onVis);
      originalStop();
    };

    this.fetchNow(true);
    this.startWebSocket();
  }

  private schedule(ms: number) {
    if (this.timer) window.clearTimeout(this.timer);
    this.timer = window.setTimeout(() => this.fetchNow(false), ms);
  }

  private async fetchNow(force: boolean) {
    if (this.refCount === 0) return;

    const visible = document.visibilityState === "visible";
    // Visível: queremos reagir rápido quando a música muda.
    // 5s costuma ser um bom equilíbrio (e é bem melhor que 10–15s).
    const baseMsVisibleFast = 5000; // 5s (quando Spotify está ativo)
    const baseMsVisible = 15000; // 15s (quando Spotify não está ativo)
    const baseMsHidden = 60000; // 60s (bem mais leve no iOS)

    // evita ficar gastando bateria/memória quando a aba está em background
    const targetMs = visible ? baseMsVisible : baseMsHidden;

    // aborta request anterior (evita acumular em iOS)
    if (this.abort) this.abort.abort();
    this.abort = new AbortController();

    if (force && !this.state.loading) {
      this.emit({ ...this.state, loading: true, error: null });
    }

    try {
      const ts = Date.now();
      const res = await fetch(`https://api.lanyard.rest/v1/users/${this.userId}?_=${ts}`, {
        cache: "no-store",
        headers: { "Cache-Control": "no-cache" },
        signal: this.abort.signal,
      });
      const json = (await res.json()) as { data?: LanyardData };
      const data = json?.data ?? null;
      this.upsertData(data, null);

      // se não tem spotify tocando, dá pra ser ainda mais leve
      const hasSpotify = Boolean(data?.spotify?.track_id);
      if (visible) {
        this.schedule(hasSpotify ? baseMsVisibleFast : baseMsVisible);
      } else {
        this.schedule(hasSpotify ? baseMsHidden : baseMsHidden * 2);
      }
    } catch (e) {
      if ((e as any)?.name === "AbortError") return;
      this.emit({ ...this.state, loading: false, error: "Falha ao carregar presença do Discord." });
      this.schedule(targetMs * 2);
    }
  }

  private upsertData(data: LanyardData | null, error: string | null) {
    const signature = makeSignature(data);
    const next: State = {
      loading: false,
      error,
      data,
      signature,
    };

    // Só notifica se mudou algo relevante (reduz re-render e pressão de memória)
    if (signature !== this.state.signature || this.state.loading || this.state.error !== error) {
      this.emit(next);
    }
  }

  private stopWebSocket() {
    if (this.wsHeartbeatTimer) window.clearInterval(this.wsHeartbeatTimer);
    this.wsHeartbeatTimer = null;
    if (this.wsReconnectTimer) window.clearTimeout(this.wsReconnectTimer);
    this.wsReconnectTimer = null;
    if (this.ws) {
      try {
        this.ws.onopen = null;
        this.ws.onmessage = null;
        this.ws.onerror = null;
        this.ws.onclose = null;
        this.ws.close();
      } catch {
        // ignore
      }
    }
    this.ws = null;
  }

  private scheduleWsReconnect() {
    if (this.refCount === 0) return;
    if (document.visibilityState !== "visible") return;
    if (this.wsReconnectTimer) return;

    const delay = this.wsBackoffMs;
    this.wsBackoffMs = Math.min(this.wsBackoffMs * 2, 30000);
    this.wsReconnectTimer = window.setTimeout(() => {
      this.wsReconnectTimer = null;
      this.startWebSocket();
    }, delay);
  }

  private startWebSocket() {
    if (this.refCount === 0) return;
    if (document.visibilityState !== "visible") return;
    if (this.ws) return;
    if (typeof WebSocket === "undefined") return;

    try {
      const ws = new WebSocket("wss://api.lanyard.rest/socket");
      this.ws = ws;

      ws.onopen = () => {
        // reset backoff quando conecta
        this.wsBackoffMs = 1000;
        // subscribe
        ws.send(
          JSON.stringify({
            op: 2,
            d: { subscribe_to_id: this.userId },
          }),
        );
      };

      ws.onmessage = (ev) => {
        try {
          const msg = JSON.parse(String(ev.data));
          const op = msg?.op;
          const d = msg?.d;

          // HELLO => inicia heartbeat
          if (op === 1 && d?.heartbeat_interval) {
            if (this.wsHeartbeatTimer) window.clearInterval(this.wsHeartbeatTimer);
            this.wsHeartbeatTimer = window.setInterval(() => {
              try {
                ws.send(JSON.stringify({ op: 3 }));
              } catch {
                // ignore
              }
            }, Number(d.heartbeat_interval));
            return;
          }

          // Evento: INIT_STATE / PRESENCE_UPDATE
          if (op === 0 && d) {
            const data = (d as any)?.spotify || (d as any)?.discord_user || (d as any)?.activities ? (d as any) : (d as any)?.data;
            // A API costuma mandar o payload de presença em d (root). Mantemos fallback.
            if (data) this.upsertData(data as LanyardData, null);
          }
        } catch {
          // ignore parse errors
        }
      };

      ws.onerror = () => {
        // WS é best-effort; continua com polling
      };

      ws.onclose = () => {
        this.stopWebSocket();
        this.scheduleWsReconnect();
      };
    } catch {
      this.stopWebSocket();
    }
  }
}

const stores = new Map<string, LanyardStore>();
function getStore(userId: string) {
  const id = userId.trim();
  if (!stores.has(id)) stores.set(id, new LanyardStore(id));
  return stores.get(id)!;
}

export function useLanyardUser(userId: string) {
  const store = useMemo(() => getStore(userId), [userId]);
  const [state, setState] = useState<State>(store.getSnapshot());

  useEffect(() => store.subscribe(setState), [store]);

  return state; // {loading, error, data}
}


