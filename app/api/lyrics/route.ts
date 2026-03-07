import { NextResponse } from "next/server";

export const runtime = "nodejs";

const FETCH_TIMEOUT_MS = 12_000;

async function fetchJson(url: string) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  try {
    const res = await fetch(url, {
      headers: {
        "User-Agent": "portfolio/1.0 (Next.js)",
        Accept: "application/json",
      },
      signal: controller.signal,
      next: { revalidate: 60 * 60 * 24 },
    });
    const json = await res.json().catch(() => null);
    return { res, json };
  } finally {
    clearTimeout(timeout);
  }
}

function normalizeSpaces(s: string) {
  return s.replace(/\s+/g, " ").trim();
}

/** Usa o primeiro artista quando o nome vem como "Artista1; Artista2; ..." (ex.: Spotify) */
function primaryArtist(artist: string): string {
  const first = artist.split(/;\s*/)[0];
  return normalizeSpaces(first || artist);
}

function stripFeaturing(s: string) {
  // remove "(feat. X)", "(ft X)", "feat. X", "ft. X" etc
  return normalizeSpaces(
    s
      .replace(/\((\s*)?(feat\.?|ft\.?|featuring)\s+[^)]+\)/gi, "")
      .replace(/(\s|-|,)?\s*(feat\.?|ft\.?|featuring)\s+.+$/gi, ""),
  );
}

function stripBrackets(s: string) {
  // remove conteúdo em [] e () (ex: [Remastered], (Live))
  return normalizeSpaces(s.replace(/\[[^\]]+\]/g, "").replace(/\([^)]*\)/g, ""));
}

function stripDashSuffix(s: string) {
  // "Song - Remastered 2011" -> "Song"
  const idx = s.indexOf(" - ");
  if (idx === -1) return s;
  return normalizeSpaces(s.slice(0, idx));
}

function buildCandidates(artist: string, track: string): Array<{ artist: string; track: string }> {
  const a0 = normalizeSpaces(artist);
  const t0 = normalizeSpaces(track);

  const variants = new Set<string>();
  const push = (a: string, t: string) => {
    const key = `${a}|||${t}`;
    if (a && t) variants.add(key);
  };

  push(a0, t0);
  push(stripFeaturing(a0), stripFeaturing(t0));
  push(stripBrackets(a0), stripBrackets(t0));
  push(stripFeaturing(stripBrackets(a0)), stripFeaturing(stripBrackets(t0)));
  push(a0, stripDashSuffix(t0));
  push(stripFeaturing(a0), stripDashSuffix(stripFeaturing(t0)));
  push(stripBrackets(a0), stripDashSuffix(stripBrackets(t0)));

  return Array.from(variants).map((k) => {
    const [a, t] = k.split("|||");
    return { artist: a, track: t };
  });
}

export async function GET(req: Request) {
  const url = new URL(req.url);
  const artistName =
    url.searchParams.get("artist_name") ||
    url.searchParams.get("artist") ||
    "";
  const trackName =
    url.searchParams.get("track_name") ||
    url.searchParams.get("track") ||
    "";

  if (!artistName.trim() || !trackName.trim()) {
    return NextResponse.json(
      { error: "Parâmetros obrigatórios: artist_name e track_name" },
      { status: 400 },
    );
  }

  const artist = primaryArtist(artistName);
  const candidates = buildCandidates(artist, trackName);
  const ovhUrl = `https://api.lyrics.ovh/v1/${encodeURIComponent(artist)}/${encodeURIComponent(trackName)}`;

  try {
    // 1) Tentativa: LRCLIB (sincronizada) com múltiplas normalizações
    let bestLrclib: any | null = null;
    let lrclibStatus = 0;
    for (const c of candidates) {
      let lrclib: { res: Response; json: any };
      try {
        const lrclibUrl = `https://lrclib.net/api/get?artist_name=${encodeURIComponent(
          c.artist,
        )}&track_name=${encodeURIComponent(c.track)}`;
        lrclib = await fetchJson(lrclibUrl);
      } catch {
        continue;
      }
      lrclibStatus = lrclib.res.status;
      if (!lrclib.res.ok || !lrclib.json) continue;

      const syncedLyrics = (lrclib.json.syncedLyrics ?? "").toString().trim();
      const plainLyrics = (lrclib.json.plainLyrics ?? "").toString().trim();
      if (syncedLyrics) {
        return NextResponse.json(lrclib.json, {
          status: 200,
          headers: {
            // synced: pode cachear bem mais
            "Cache-Control": "public, max-age=900, s-maxage=86400, stale-while-revalidate=604800",
          },
        });
      }

      // guarda melhor resposta "plain" do LRCLIB (caso exista)
      if (!bestLrclib && plainLyrics) bestLrclib = lrclib.json;
    }

    // 2) Backup: lyrics.ovh (apenas não sincronizada)
    let ovh: { res: Response; json: any };
    try {
      ovh = await fetchJson(ovhUrl);
    } catch {
      ovh = { res: new Response(null, { status: 502 }), json: null };
    }
    if (ovh.res.ok && ovh.json?.lyrics) {
      return NextResponse.json(
        {
          source: "lyrics.ovh",
          artistName,
          trackName,
          plainLyrics: String(ovh.json.lyrics),
          syncedLyrics: null,
        },
        {
          status: 200,
          headers: {
            // plain-only: cache curto (pode aparecer synced depois)
            "Cache-Control": "public, max-age=300, s-maxage=3600, stale-while-revalidate=86400",
          },
        },
      );
    }

    // 2.5) Se LRCLIB tinha plain, retorna antes de dar "não encontrada"
    if (bestLrclib) {
      return NextResponse.json(bestLrclib, {
        status: 200,
        headers: {
          // plain-only: cache curto
          "Cache-Control": "public, max-age=300, s-maxage=3600, stale-while-revalidate=86400",
        },
      });
    }

    // Se ambos falharam:
    const status = ovh.res.status || lrclibStatus || 404;
    const httpStatus = status >= 400 && status < 600 ? status : 404;
    return NextResponse.json(
      {
        error: "Letra não encontrada",
        status,
        sources: {
          lrclib: lrclibStatus || 0,
          lyricsOvh: ovh.res.status,
        },
      },
      { status: httpStatus },
    );
  } catch (err) {
    return NextResponse.json(
      { error: "Falha ao consultar APIs de letra (timeout ou rede)." },
      { status: 502 },
    );
  }
}


