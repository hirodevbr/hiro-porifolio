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
};

type Subscriber = (s: State) => void;

// Gera uma assinatura simples para detectar mudanças relevantes
function makeSignature(d: LanyardData | null): string {
  if (!d) return "";
  const sp = d.spotify;
  if (!sp) return `status:${d.discord_status ?? "offline"}`;
  
  // Assinatura baseada em dados críticos do Spotify
  return `spotify:${sp.track_id}:${sp.timestamps?.start ?? 0}:${sp.timestamps?.end ?? 0}:${sp.song}:${sp.artist}`;
}

class LanyardStore {
  private userId: string;
  private subscribers = new Set<Subscriber>();
  private state: State = { loading: true, error: null, data: null };
  private lastSignature = "";
  
  // Controle de conexão
  private ws: WebSocket | null = null;
  private wsHeartbeatInterval: number | null = null;
  private reconnectTimeout: number | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 10;
  private reconnectDelay = 1000; // Começa com 1s
  
  // Controle de polling (fallback)
  private pollingInterval: number | null = null;
  private pollingDelay = 5000; // 5 segundos quando Spotify ativo
  private pollingDelaySlow = 15000; // 15 segundos quando inativo
  
  // Controle de refs
  private refCount = 0;
  private abortController: AbortController | null = null;

  constructor(userId: string) {
    this.userId = userId.trim();
  }

  getSnapshot(): State {
    return this.state;
  }

  subscribe(cb: Subscriber) {
    this.subscribers.add(cb);
    this.refCount++;
    
    if (this.refCount === 1) {
      this.start();
    }
    
    // Notifica imediatamente com o estado atual
    cb(this.state);
    
    return () => {
      this.subscribers.delete(cb);
      this.refCount = Math.max(0, this.refCount - 1);
      
      if (this.refCount === 0) {
        this.stop();
      }
    };
  }

  private emit(next: State) {
    const signature = makeSignature(next.data);
    
    // Só emite se realmente mudou algo relevante
    if (signature !== this.lastSignature || next.loading !== this.state.loading || next.error !== this.state.error) {
      this.state = next;
      this.lastSignature = signature;
      
      for (const cb of this.subscribers) {
        cb(this.state);
      }
    }
  }

  private stop() {
    // Limpa WebSocket
    this.stopWebSocket();
    
    // Limpa polling
    if (this.pollingInterval) {
      clearInterval(this.pollingInterval);
      this.pollingInterval = null;
    }
    
    // Limpa reconexão
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }
    
    // Cancela requisições pendentes
    if (this.abortController) {
      this.abortController.abort();
      this.abortController = null;
    }
  }

  private start() {
    // Listener para visibilidade da página
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        // Quando volta ao foreground, busca imediatamente
        this.fetchData(true);
        this.startWebSocket();
      } else {
        // Em background, fecha WebSocket e reduz polling
        this.stopWebSocket();
      }
    };
    
    document.addEventListener("visibilitychange", handleVisibilityChange);
    
    // Override do stop para remover listener
    const originalStop = this.stop.bind(this);
    this.stop = () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      originalStop();
    };
    
    // Inicia conexões
    this.fetchData(true);
    this.startWebSocket();
    this.startPolling();
  }

  private startPolling() {
    // Polling como fallback caso WebSocket falhe
    if (this.pollingInterval) return;
    
    const poll = async () => {
      if (this.refCount === 0) return;
      if (document.visibilityState !== "visible") return;
      
      await this.fetchData(false);
      
      // Ajusta intervalo baseado em se tem Spotify ativo
      const hasSpotify = Boolean(this.state.data?.spotify?.track_id);
      const delay = hasSpotify ? this.pollingDelay : this.pollingDelaySlow;
      
      this.pollingInterval = window.setTimeout(poll, delay);
    };
    
    poll();
  }

  private async fetchData(forceLoading: boolean) {
    if (this.refCount === 0) return;
    
    // Cancela requisição anterior
    if (this.abortController) {
      this.abortController.abort();
    }
    
    this.abortController = new AbortController();
    
    if (forceLoading && !this.state.loading) {
      this.emit({ ...this.state, loading: true, error: null });
    }
    
    try {
      const timestamp = Date.now();
      const response = await fetch(
        `https://api.lanyard.rest/v1/users/${this.userId}?_=${timestamp}`,
        {
          cache: "no-store",
          headers: {
            "Cache-Control": "no-cache, no-store, must-revalidate",
            "Pragma": "no-cache",
          },
          signal: this.abortController.signal,
        }
      );
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      
      const json = await response.json();
      const data = json?.data ?? null;
      
      this.emit({
        loading: false,
        error: null,
        data: data as LanyardData,
      });
      
      this.reconnectAttempts = 0; // Reset em caso de sucesso
    } catch (error: any) {
      if (error.name === "AbortError") return;
      
      this.emit({
        ...this.state,
        loading: false,
        error: "Falha ao carregar presença do Discord.",
      });
      
      // Incrementa tentativas de reconexão
      this.reconnectAttempts++;
    }
  }

  private stopWebSocket() {
    // Limpa heartbeat
    if (this.wsHeartbeatInterval) {
      clearInterval(this.wsHeartbeatInterval);
      this.wsHeartbeatInterval = null;
    }
    
    // Limpa timeout de reconexão
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }
    
    // Fecha WebSocket
    if (this.ws) {
      try {
        this.ws.onopen = null;
        this.ws.onmessage = null;
        this.ws.onerror = null;
        this.ws.onclose = null;
        this.ws.close();
      } catch {
        // Ignora erros ao fechar
      }
      this.ws = null;
    }
  }

  private scheduleReconnect() {
    if (this.refCount === 0) return;
    if (document.visibilityState !== "visible") return;
    if (this.reconnectTimeout) return;
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      // Para de tentar reconectar após muitas tentativas
      return;
    }
    
    // Backoff exponencial com limite
    const delay = Math.min(this.reconnectDelay * Math.pow(2, this.reconnectAttempts), 30000);
    
    this.reconnectTimeout = window.setTimeout(() => {
      this.reconnectTimeout = null;
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
        // Reset de tentativas e delay em caso de sucesso
        this.reconnectAttempts = 0;
        this.reconnectDelay = 1000;
        
        // Subscribe para o usuário
        try {
          ws.send(
            JSON.stringify({
              op: 2,
              d: { subscribe_to_id: this.userId },
            })
          );
        } catch {
          // Ignora erros ao enviar
        }
      };
      
      ws.onmessage = (event) => {
        try {
          const message = JSON.parse(String(event.data));
          const op = message?.op;
          const data = message?.d;
          
          // OP 1 = HELLO - Configura heartbeat
          if (op === 1 && data?.heartbeat_interval) {
            const interval = Number(data.heartbeat_interval);
            
            if (this.wsHeartbeatInterval) {
              clearInterval(this.wsHeartbeatInterval);
            }
            
            this.wsHeartbeatInterval = window.setInterval(() => {
              if (ws.readyState === WebSocket.OPEN) {
                try {
                  ws.send(JSON.stringify({ op: 3 }));
                } catch {
                  // Ignora erros no heartbeat
                }
              }
            }, interval);
            
            return;
          }
          
          // OP 0 = EVENT - Atualiza dados
          if (op === 0 && data) {
            // A API pode retornar dados em diferentes formatos
            let lanyardData: LanyardData | null = null;
            
            if (data.spotify || data.discord_user || data.activities) {
              lanyardData = data as LanyardData;
            } else if (data.data) {
              lanyardData = data.data as LanyardData;
            }
            
            if (lanyardData) {
              this.emit({
                loading: false,
                error: null,
                data: lanyardData,
              });
            }
          }
        } catch {
          // Ignora erros de parsing
        }
      };
      
      ws.onerror = () => {
        // WebSocket é best-effort, continua com polling
      };
      
      ws.onclose = () => {
        this.stopWebSocket();
        
        // Agenda reconexão se ainda há subscribers
        if (this.refCount > 0) {
          this.reconnectAttempts++;
          this.scheduleReconnect();
        }
      };
    } catch {
      this.stopWebSocket();
    }
  }
}

// Cache global de stores por userId
const stores = new Map<string, LanyardStore>();

function getStore(userId: string): LanyardStore {
  const id = userId.trim();
  if (!stores.has(id)) {
    stores.set(id, new LanyardStore(id));
  }
  return stores.get(id)!;
}

export function useLanyardUser(userId: string) {
  const store = useMemo(() => getStore(userId), [userId]);
  const [state, setState] = useState<State>(store.getSnapshot());

  useEffect(() => {
    return store.subscribe(setState);
  }, [store]);

  return state;
}
