import { NextResponse } from "next/server";

export const runtime = "nodejs";

async function fetchJson(url: string) {
  const res = await fetch(url, {
    headers: {
      "User-Agent": "portfolio/1.0 (Next.js)",
      Accept: "application/json",
    },
    // Cache no servidor: reduz latência e carga. Cliente ainda pode ter cache local.
    next: { revalidate: 60 * 60 * 24 }, // 24h
  });
  return { res, json: await res.json().catch(() => null) };
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

  const lrclibUrl = `https://lrclib.net/api/get?artist_name=${encodeURIComponent(
    artistName,
  )}&track_name=${encodeURIComponent(trackName)}`;
  const ovhUrl = `https://api.lyrics.ovh/v1/${encodeURIComponent(artistName)}/${encodeURIComponent(trackName)}`;

  try {
    // 1) Tentativa: LRCLIB (sincronizada)
    const lrclib = await fetchJson(lrclibUrl);
    if (lrclib.res.ok && lrclib.json) {
      const syncedLyrics = (lrclib.json.syncedLyrics ?? "").toString().trim();
      const plainLyrics = (lrclib.json.plainLyrics ?? "").toString().trim();
      if (syncedLyrics || plainLyrics) {
        return NextResponse.json(lrclib.json, {
          status: 200,
          headers: {
            "Cache-Control": "public, max-age=900, s-maxage=86400, stale-while-revalidate=604800",
          },
        });
      }
      // se LRCLIB responder sem letra, cai pro backup
    }

    // 2) Backup: lyrics.ovh (apenas não sincronizada)
    const ovh = await fetchJson(ovhUrl);
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
            "Cache-Control": "public, max-age=900, s-maxage=86400, stale-while-revalidate=604800",
          },
        },
      );
    }

    // Se ambos falharam:
    const status = lrclib.res.ok ? ovh.res.status : lrclib.res.status;
    return NextResponse.json(
      {
        error: "Letra não encontrada",
        status,
        sources: {
          lrclib: lrclib.res.status,
          lyricsOvh: ovh.res.status,
        },
      },
      { status: status || 404 },
    );
  } catch {
    return NextResponse.json({ error: "Falha ao consultar LRCLIB" }, { status: 502 });
  }
}


