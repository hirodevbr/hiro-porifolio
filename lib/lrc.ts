export type LrcLine = {
  timeMs: number;
  text: string;
};

function fractionToMs(fraction: string | undefined) {
  if (!fraction) return 0;
  // "1" => 100ms, "12" => 120ms, "123" => 123ms
  if (fraction.length === 1) return Number(fraction) * 100;
  if (fraction.length === 2) return Number(fraction) * 10;
  return Number(fraction.slice(0, 3));
}

/**
 * Parse simples de LRC.
 * Suporta múltiplos timestamps por linha, ex:
 * [00:12.00][00:14.00]Refrão
 */
export function parseLrc(lrc: string): LrcLine[] {
  const lines = lrc.replace(/\r\n/g, "\n").split("\n");
  const out: LrcLine[] = [];

  const timeTag = /\[(\d{1,2}):(\d{2})(?:\.(\d{1,3}))?\]/g;

  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line) continue;

    // ignora metadados comuns ([ar:], [ti:], etc)
    if (/^\[[a-z]{2,}:.+\]$/i.test(line) && !/^\[\d{1,2}:\d{2}/.test(line)) continue;

    const times: number[] = [];
    let match: RegExpExecArray | null;

    timeTag.lastIndex = 0;
    while ((match = timeTag.exec(line))) {
      const mm = Number(match[1]);
      const ss = Number(match[2]);
      const ms = fractionToMs(match[3]);
      const total = (mm * 60 + ss) * 1000 + ms;
      if (Number.isFinite(total)) times.push(total);
    }

    if (times.length === 0) continue;

    const text = line.replace(timeTag, "").trim();
    for (const t of times) out.push({ timeMs: t, text });
  }

  out.sort((a, b) => a.timeMs - b.timeMs);
  return out;
}

export function findActiveIndex(lines: LrcLine[], tMs: number) {
  if (lines.length === 0) return -1;
  let lo = 0;
  let hi = lines.length - 1;
  while (lo <= hi) {
    const mid = (lo + hi) >> 1;
    if (lines[mid].timeMs <= tMs) lo = mid + 1;
    else hi = mid - 1;
  }
  return Math.max(0, Math.min(hi, lines.length - 1));
}









