/**
 * Sistema de sincronização baseado em detecção de navegador
 * Compensa diferenças de performance e clock entre navegadores
 */

export type BrowserInfo = {
  name: string;
  version: string;
  engine: string;
  os: string;
  isMobile: boolean;
  syncOffset: number; // Offset em milissegundos para compensar diferenças
};

/**
 * Detecta informações do navegador
 */
export function detectBrowser(): BrowserInfo {
  if (typeof window === "undefined" || typeof navigator === "undefined") {
    return {
      name: "unknown",
      version: "0",
      engine: "unknown",
      os: "unknown",
      isMobile: false,
      syncOffset: 0,
    };
  }

  const ua = navigator.userAgent;
  let name = "unknown";
  let version = "0";
  let engine = "unknown";
  let os = "unknown";
  let isMobile = /Mobile|Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(ua);

  // Detecta OS
  if (/Windows NT 10.0/.test(ua)) os = "Windows 10/11";
  else if (/Windows NT 6.3/.test(ua)) os = "Windows 8.1";
  else if (/Windows NT 6.2/.test(ua)) os = "Windows 8";
  else if (/Windows NT 6.1/.test(ua)) os = "Windows 7";
  else if (/Mac OS X/.test(ua)) os = "macOS";
  else if (/Linux/.test(ua)) os = "Linux";
  else if (/Android/.test(ua)) os = "Android";
  else if (/iOS|iPhone|iPad|iPod/.test(ua)) os = "iOS";

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

  // Calcula offset baseado em navegador conhecido
  // Valores baseados em testes empíricos de diferenças de clock/performance
  let syncOffset = 0;

  if (name === "Chrome") {
    // Chrome geralmente tem clock mais preciso, mas pode ter pequeno delay
    syncOffset = -50; // Compensa 50ms de delay típico
  } else if (name === "Firefox") {
    // Firefox pode ter diferenças sutis no performance.now()
    syncOffset = -30;
  } else if (name === "Safari") {
    // Safari pode ter diferenças maiores, especialmente em iOS
    syncOffset = isMobile ? -100 : -60;
  } else if (name === "Edge") {
    // Edge usa Blink mas pode ter diferenças
    syncOffset = -40;
  } else if (name === "Opera") {
    syncOffset = -50;
  }

  // Ajusta para mobile (geralmente tem mais latência)
  if (isMobile) {
    syncOffset -= 30;
  }

  return {
    name,
    version,
    engine,
    os,
    isMobile,
    syncOffset,
  };
}

/**
 * Sistema de calibração automática baseado em histórico
 */
class BrowserCalibration {
  private static instance: BrowserCalibration;
  private measurements: number[] = [];
  private readonly maxMeasurements = 10;
  private calibratedOffset = 0;

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
    this.measurements.push(drift);
    if (this.measurements.length > this.maxMeasurements) {
      this.measurements.shift();
    }

    // Calcula média dos últimos drift measurements
    if (this.measurements.length >= 3) {
      const avg = this.measurements.reduce((a, b) => a + b, 0) / this.measurements.length;
      this.calibratedOffset = avg;
      this.saveCalibration();
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
      const key = `browser_sync_${browser.name}_${browser.version}`;
      localStorage.setItem(key, JSON.stringify({
        offset: this.calibratedOffset,
        timestamp: Date.now(),
      }));
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
      const key = `browser_sync_${browser.name}_${browser.version}`;
      const stored = localStorage.getItem(key);
      if (stored) {
        const data = JSON.parse(stored);
        // Usa calibração se tiver menos de 7 dias
        if (Date.now() - data.timestamp < 7 * 24 * 60 * 60 * 1000) {
          this.calibratedOffset = data.offset || 0;
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
    if (typeof window !== "undefined") {
      const browser = detectBrowser();
      const key = `browser_sync_${browser.name}_${browser.version}`;
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

