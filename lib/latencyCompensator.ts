/**
 * Sistema de compensação de latência dinâmica
 * Detecta e compensa o delay real entre quando o timestamp foi gerado e quando chegou ao cliente
 */

export type LatencyMeasurement = {
  timestamp: number; // Quando recebemos os dados
  spotifyStart: number; // Timestamp do Spotify
  calculatedDelay: number; // Delay calculado
};

class LatencyCompensator {
  private static instance: LatencyCompensator;
  private measurements: LatencyMeasurement[] = [];
  private readonly maxMeasurements = 30;
  private currentLatency = 0; // Latência atual em ms
  private lastUpdateTime = 0;
  private readonly updateInterval = 5000; // Atualiza a cada 5 segundos

  private constructor() {
    this.loadLatency();
  }

  static getInstance(): LatencyCompensator {
    if (!LatencyCompensator.instance) {
      LatencyCompensator.instance = new LatencyCompensator();
    }
    return LatencyCompensator.instance;
  }

  /**
   * Registra uma medição de latência quando recebemos dados do Spotify
   * @param spotifyStartTimestamp - Timestamp do início da música do Spotify
   */
  recordMeasurement(spotifyStartTimestamp: number) {
    const now = Date.now();
    
    // Calcula o delay: se o timestamp do Spotify é do passado, há delay
    // Se é do futuro (impossível), ignora
    const delay = Math.max(0, now - spotifyStartTimestamp);
    
    // Ignora delays muito grandes (provavelmente erro ou música antiga)
    if (delay > 30000) return; // Mais de 30 segundos é suspeito
    
    this.measurements.push({
      timestamp: now,
      spotifyStart: spotifyStartTimestamp,
      calculatedDelay: delay,
    });

    // Mantém apenas as últimas N medições
    if (this.measurements.length > this.maxMeasurements) {
      this.measurements.shift();
    }

    // Atualiza latência calculada periodicamente
    if (now - this.lastUpdateTime >= this.updateInterval) {
      this.updateLatency();
      this.lastUpdateTime = now;
    }
  }

  /**
   * Atualiza a latência calculada baseada nas medições
   */
  private updateLatency() {
    if (this.measurements.length < 3) return;

    // Remove medições muito antigas (mais de 1 minuto)
    const oneMinuteAgo = Date.now() - 60000;
    this.measurements = this.measurements.filter(
      (m) => m.timestamp > oneMinuteAgo
    );

    if (this.measurements.length < 3) return;

    // Calcula mediana dos delays (mais robusto que média)
    const delays = this.measurements
      .map((m) => m.calculatedDelay)
      .sort((a, b) => a - b);
    
    const median = delays[Math.floor(delays.length / 2)];
    
    // Remove outliers (valores muito diferentes da mediana)
    const q1 = delays[Math.floor(delays.length * 0.25)];
    const q3 = delays[Math.floor(delays.length * 0.75)];
    const iqr = q3 - q1;
    const lowerBound = q1 - 1.5 * iqr;
    const upperBound = q3 + 1.5 * iqr;

    const filteredDelays = delays.filter(
      (d) => d >= lowerBound && d <= upperBound
    );

    if (filteredDelays.length >= 3) {
      // Usa média dos valores filtrados com suavização exponencial
      const avgDelay =
        filteredDelays.reduce((a, b) => a + b, 0) / filteredDelays.length;
      
      // Suavização: 70% do valor anterior, 30% do novo
      const alpha = 0.3;
      this.currentLatency =
        alpha * avgDelay + (1 - alpha) * this.currentLatency;
      
      this.saveLatency();
    }
  }

  /**
   * Retorna a latência atual compensada
   */
  getLatency(): number {
    // Força atualização se passou muito tempo
    const now = Date.now();
    if (now - this.lastUpdateTime >= this.updateInterval) {
      this.updateLatency();
      this.lastUpdateTime = now;
    }
    
    return Math.max(0, Math.round(this.currentLatency));
  }

  /**
   * Calcula o tempo compensado baseado no timestamp do Spotify
   * @param spotifyStartTimestamp - Timestamp do início da música
   * @param now - Tempo atual (opcional, usa Date.now() se não fornecido)
   */
  getCompensatedTime(spotifyStartTimestamp: number, now?: number): number {
    const currentTime = now ?? Date.now();
    const latency = this.getLatency();
    
    // Compensa o delay: subtrai a latência do tempo atual
    // Isso faz com que o tempo calculado seja baseado no momento real da música
    return currentTime - latency;
  }

  /**
   * Salva latência no localStorage
   */
  private saveLatency() {
    if (typeof window === "undefined") return;
    try {
      const key = "spotify_latency_compensation";
      localStorage.setItem(
        key,
        JSON.stringify({
          latency: this.currentLatency,
          timestamp: Date.now(),
          measurements: this.measurements.length,
        })
      );
    } catch {
      // Ignora erros
    }
  }

  /**
   * Carrega latência do localStorage
   */
  private loadLatency() {
    if (typeof window === "undefined") return;
    try {
      const key = "spotify_latency_compensation";
      const stored = localStorage.getItem(key);
      if (stored) {
        const data = JSON.parse(stored);
        // Usa latência se tiver menos de 1 hora
        if (Date.now() - data.timestamp < 60 * 60 * 1000) {
          this.currentLatency = data.latency || 0;
          this.lastUpdateTime = data.timestamp || 0;
        }
      }
    } catch {
      // Ignora erros
    }
  }

  /**
   * Reseta todas as medições
   */
  reset() {
    this.measurements = [];
    this.currentLatency = 0;
    this.lastUpdateTime = 0;
    if (typeof window !== "undefined") {
      localStorage.removeItem("spotify_latency_compensation");
    }
  }

  /**
   * Retorna estatísticas para debug
   */
  getStats() {
    return {
      currentLatency: this.currentLatency,
      measurements: this.measurements.length,
      recentDelays: this.measurements
        .slice(-10)
        .map((m) => m.calculatedDelay),
    };
  }
}

export const latencyCompensator = LatencyCompensator.getInstance();

/**
 * Função helper para registrar medição de latência
 */
export function recordLatencyMeasurement(spotifyStartTimestamp: number) {
  latencyCompensator.recordMeasurement(spotifyStartTimestamp);
}

/**
 * Função helper para obter latência atual
 */
export function getLatency(): number {
  return latencyCompensator.getLatency();
}

/**
 * Função helper para obter tempo compensado
 */
export function getCompensatedTime(
  spotifyStartTimestamp: number,
  now?: number
): number {
  return latencyCompensator.getCompensatedTime(spotifyStartTimestamp, now);
}

