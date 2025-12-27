/**
 * Sistema de sincronização robusto baseado em detecção de navegador
 * Versão otimizada para iOS e outros navegadores mobile
 */

export type BrowserInfo = {
  name: string;
  version: string;
  engine: string;
  os: string;
  isMobile: boolean;
  isIOS: boolean;
  syncOffset: number;
  resyncInterval: number; // Intervalo de resync em ms
  driftThreshold: number; // Threshold de drift em segundos
};

/**
 * Detecta informações do navegador com foco em iOS
 */
export function detectBrowser(): BrowserInfo {
  if (typeof window === "undefined" || typeof navigator === "undefined") {
    return {
      name: "unknown",
      version: "0",
      engine: "unknown",
      os: "unknown",
      isMobile: false,
      isIOS: false,
      syncOffset: 0,
      resyncInterval: 500,
      driftThreshold: 0.05,
    };
  }

  const ua = navigator.userAgent;
  let name = "unknown";
  let version = "0";
  let engine = "unknown";
  let os = "unknown";
  let isMobile = /Mobile|Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(ua);
  const isIOS = /iPhone|iPad|iPod/i.test(ua);

  // Detecta OS
  if (/Windows NT 10.0/.test(ua)) os = "Windows 10/11";
  else if (/Windows NT 6.3/.test(ua)) os = "Windows 8.1";
  else if (/Windows NT 6.2/.test(ua)) os = "Windows 8";
  else if (/Windows NT 6.1/.test(ua)) os = "Windows 7";
  else if (/Mac OS X/.test(ua)) os = "macOS";
  else if (/Linux/.test(ua)) os = "Linux";
  else if (/Android/.test(ua)) os = "Android";
  else if (isIOS) os = "iOS";

  // Detecta engine
  if (/Chrome/.test(ua) && !/Edg|OPR/.test(ua)) engine = "Blink";
  else if (/Firefox/.test(ua)) engine = "Gecko";
  else if (/Safari/.test(ua) && !/Chrome/.test(ua)) engine = "WebKit";
  else if (/Edg/.test(ua)) engine = "Blink";
  else if (/OPR/.test(ua)) engine = "Blink";

  // Detecta navegador específico
  if (/Edg/.test(ua)) {
    name = "Edge";
    const match = ua.match(/Edg\/(\d+)/);
    version = match ? match[1] : "0";
  } else if (/OPR|Opera/.test(ua)) {
    name = "Opera";
    const match = ua.match(/(?:OPR|Opera)\/(\d+)/);
    version = match ? match[1] : "0";
  } else if (/Chrome/.test(ua) && !/Edg/.test(ua)) {
    name = "Chrome";
    const match = ua.match(/Chrome\/(\d+)/);
    version = match ? match[1] : "0";
  } else if (/Firefox/.test(ua)) {
    name = "Firefox";
    const match = ua.match(/Firefox\/(\d+)/);
    version = match ? match[1] : "0";
  } else if (/Safari/.test(ua) && !/Chrome/.test(ua)) {
    name = "Safari";
    const match = ua.match(/Version\/(\d+)/);
    version = match ? match[1] : "0";
  }

  // Configurações otimizadas para todos os navegadores
  // Sistema melhorado com resync mais frequente e threshold menor para todos
  let syncOffset = 0;
  let resyncInterval = 300; // ms - mais frequente para todos
  let driftThreshold = 0.03; // segundos (30ms) - mais sensível para todos

  if (isIOS) {
    // iOS tem problemas conhecidos com timers e performance.now()
    // Offset reduzido para evitar que música comece tarde
    syncOffset = -50; // Reduzido de -150 para -50
    resyncInterval = 200; // Resync a cada 200ms
    driftThreshold = 0.025; // Threshold ainda menor (25ms)
  } else if (name === "Safari" && !isMobile) {
    // Safari desktop - melhorado
    syncOffset = -80;
    resyncInterval = 250;
    driftThreshold = 0.03;
  } else if (name === "Chrome") {
    // Chrome - melhorado
    syncOffset = -50;
    resyncInterval = 300;
    driftThreshold = 0.03;
  } else if (name === "Firefox") {
    // Firefox - melhorado
    syncOffset = -40;
    resyncInterval = 300;
    driftThreshold = 0.03;
  } else if (name === "Edge") {
    // Edge - melhorado
    syncOffset = -50;
    resyncInterval = 300;
    driftThreshold = 0.03;
  } else if (name === "Opera") {
    // Opera - melhorado
    syncOffset = -50;
    resyncInterval = 300;
    driftThreshold = 0.03;
  } else if (isMobile) {
    // Outros mobile - melhorado
    syncOffset = -100;
    resyncInterval = 250;
    driftThreshold = 0.03;
  } else {
    // Desktop genérico - melhorado
    syncOffset = -50;
    resyncInterval = 300;
    driftThreshold = 0.03;
  }

  return {
    name,
    version,
    engine,
    os,
    isMobile,
    isIOS,
    syncOffset,
    resyncInterval,
    driftThreshold,
  };
}

/**
 * Sistema de calibração automática melhorado
 */
class BrowserCalibration {
  private static instance: BrowserCalibration;
  private measurements: number[] = [];
  private readonly maxMeasurements = 20; // Mais medições para iOS
  private calibratedOffset = 0;
  private lastCalibrationTime = 0;

  private constructor() {
    this.loadCalibration();
  }

  static getInstance(): BrowserCalibration {
    if (!BrowserCalibration.instance) {
      BrowserCalibration.instance = new BrowserCalibration();
    }
    return BrowserCalibration.instance;
  }

  /**
   * Adiciona uma medição de drift para calibração
   */
  addMeasurement(drift: number) {
    // Filtra medições muito extremas (outliers)
    if (Math.abs(drift) > 2000) return; // Ignora drifts maiores que 2 segundos

    this.measurements.push(drift);
    if (this.measurements.length > this.maxMeasurements) {
      this.measurements.shift();
    }

    // Para iOS, calibra mais rapidamente (após 5 medições)
    // Para outros, após 10 medições
    const browser = detectBrowser();
    const minMeasurements = browser.isIOS ? 5 : 10;

    if (this.measurements.length >= minMeasurements) {
      // Remove outliers (valores muito diferentes da média)
      const sorted = [...this.measurements].sort((a, b) => a - b);
      const q1 = sorted[Math.floor(sorted.length * 0.25)];
      const q3 = sorted[Math.floor(sorted.length * 0.75)];
      const iqr = q3 - q1;
      const lowerBound = q1 - 1.5 * iqr;
      const upperBound = q3 + 1.5 * iqr;

      const filtered = this.measurements.filter(
        (m) => m >= lowerBound && m <= upperBound
      );

      if (filtered.length >= 3) {
        // Usa mediana para ser mais robusto a outliers
        const sortedFiltered = [...filtered].sort((a, b) => a - b);
        const median = sortedFiltered[Math.floor(sortedFiltered.length / 2)];
        
        // Aplica suavização (exponential moving average)
        const alpha = browser.isIOS ? 0.3 : 0.2; // Mais agressivo para iOS
        this.calibratedOffset = alpha * median + (1 - alpha) * this.calibratedOffset;
        
        this.lastCalibrationTime = Date.now();
        this.saveCalibration();
      }
    }
  }

  /**
   * Retorna offset calibrado
   */
  getCalibratedOffset(): number {
    return this.calibratedOffset;
  }

  /**
   * Salva calibração no localStorage
   */
  private saveCalibration() {
    if (typeof window === "undefined") return;
    try {
      const browser = detectBrowser();
      const key = `browser_sync_v2_${browser.name}_${browser.version}_${browser.os}`;
      localStorage.setItem(
        key,
        JSON.stringify({
          offset: this.calibratedOffset,
          timestamp: Date.now(),
          measurements: this.measurements.length,
        })
      );
    } catch {
      // Ignora erros
    }
  }

  /**
   * Carrega calibração do localStorage
   */
  private loadCalibration() {
    if (typeof window === "undefined") return;
    try {
      const browser = detectBrowser();
      const key = `browser_sync_v2_${browser.name}_${browser.version}_${browser.os}`;
      const stored = localStorage.getItem(key);
      if (stored) {
        const data = JSON.parse(stored);
        // Usa calibração se tiver menos de 3 dias (mais curto para recalibrar)
        if (Date.now() - data.timestamp < 3 * 24 * 60 * 60 * 1000) {
          this.calibratedOffset = data.offset || 0;
          this.lastCalibrationTime = data.timestamp || 0;
        }
      }
    } catch {
      // Ignora erros
    }
  }

  /**
   * Reseta calibração
   */
  reset() {
    this.measurements = [];
    this.calibratedOffset = 0;
    this.lastCalibrationTime = 0;
    if (typeof window !== "undefined") {
      const browser = detectBrowser();
      const key = `browser_sync_v2_${browser.name}_${browser.version}_${browser.os}`;
      localStorage.removeItem(key);
    }
  }
}

/**
 * Obtém offset total de sincronização (base + calibrado)
 */
export function getSyncOffset(): number {
  const browser = detectBrowser();
  const calibration = BrowserCalibration.getInstance();
  const baseOffset = browser.syncOffset;
  const calibratedOffset = calibration.getCalibratedOffset();

  // Combina offset base do navegador com calibração aprendida
  return baseOffset + calibratedOffset;
}

/**
 * Registra uma medição de drift para calibração
 */
export function recordDriftMeasurement(drift: number) {
  const calibration = BrowserCalibration.getInstance();
  calibration.addMeasurement(drift);
}

/**
 * Obtém informações do navegador para debug
 */
export function getBrowserInfo(): BrowserInfo {
  return detectBrowser();
}

/**
 * Obtém intervalo de resync recomendado para o navegador
 */
export function getResyncInterval(): number {
  return detectBrowser().resyncInterval;
}

/**
 * Obtém threshold de drift recomendado para o navegador
 */
export function getDriftThreshold(): number {
  return detectBrowser().driftThreshold;
}
