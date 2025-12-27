export type LrcLine = {
  timeMs: number;
  text: string;
};

/**
 * Parse robusto de LRC baseado em implementação testada.
 * Suporta múltiplos timestamps por linha, ex:
 * [00:12.00][00:14.00]Refrão
 */
export function parseLrc(lrcText: string): LrcLine[] {
  try {
    // Remove tags de metadados (como [ar:], [ti:], etc) e limpa o texto
    const cleanedText = lrcText
      .replace(/\[ar:.+?\]/gi, "")
      .replace(/\[ti:.+?\]/gi, "")
      .replace(/\[al:.+?\]/gi, "")
      .replace(/\[by:.+?\]/gi, "")
      .replace(/\[offset:.+?\]/gi, "")
      .trim();

    const lines = cleanedText.replace(/\r\n/g, "\n").split("\n");
    const lyricsLines: LrcLine[] = [];

    for (const line of lines) {
      const trimmedLine = line.trim();
      if (!trimmedLine) continue;

      // Formato LRC robusto: [mm:ss.xx] ou [mm:ss]
      // O regex torna os centésimos opcionais
      const timestampRegex = /\[(\d{2}):(\d{2})(?:\.(\d{2}))?\]/g;
      const timestampMatches = Array.from(trimmedLine.matchAll(timestampRegex));

      // Remove os timestamps para sobrar só o texto da letra
      const text = trimmedLine.replace(/\[\d{2}:\d{2}(?:\.\d{2})?\]/g, "").trim();

      if (text.length > 0) {
        // Se houver múltiplos timestamps na mesma linha (ex: refrão repetido), cria uma linha para cada
        let hasTimestamp = false;
        for (const match of timestampMatches) {
          const minutes = parseInt(match[1], 10);
          const seconds = parseInt(match[2], 10);
          const centiseconds = match[3] ? parseInt(match[3], 10) : 0;

          // Converte tudo para milissegundos (mantendo compatibilidade com LrcLine.timeMs)
          const timeInSeconds = minutes * 60 + seconds + centiseconds / 100;
          const timeMs = Math.round(timeInSeconds * 1000);

          lyricsLines.push({
            timeMs,
            text,
          });
          hasTimestamp = true;
        }

        // Se a linha tem texto mas não tem timestamp, ela é ignorada (lixo ou título solto)
        if (!hasTimestamp) {
          continue;
        }
      }
    }

    if (lyricsLines.length === 0) {
      return [];
    }

    // Ordena as linhas pelo tempo (caso os timestamps repetidos tenham ficado fora de ordem)
    const sorted = lyricsLines.sort((a, b) => a.timeMs - b.timeMs);

    return sorted;
  } catch (err) {
    console.error("Error parsing LRC:", err);
    return [];
  }
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












