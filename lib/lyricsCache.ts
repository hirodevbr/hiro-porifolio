export type CachedLyrics = {
  key: string; // normalmente spotify.track_id
  artist: string;
  track: string;
  fetchedAt: number; // epoch ms
  syncedLyrics?: string | null;
  plainLyrics?: string | null;
};

const STORAGE_KEY = "spotifyLyricsCache:v1";
const MAX_ITEMS_DEFAULT = 40;
const TTL_MS_DEFAULT = 1000 * 60 * 60 * 24 * 14; // 14 dias

const memory = new Map<string, CachedLyrics>();

function safeParse<T>(raw: string | null): T | null {
  if (!raw) return null;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

function loadAll(): CachedLyrics[] {
  if (typeof window === "undefined") return [];
  return safeParse<CachedLyrics[]>(window.localStorage.getItem(STORAGE_KEY)) ?? [];
}

function saveAll(items: CachedLyrics[]) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  } catch {
    // se estourar quota, não quebra UX
  }
}

export function getCachedLyrics(
  key: string,
  { ttlMs = TTL_MS_DEFAULT }: { ttlMs?: number } = {},
): { entry: CachedLyrics | null; stale: boolean } {
  const k = key.trim();
  if (!k) return { entry: null, stale: false };

  const mem = memory.get(k);
  if (mem) {
    const stale = Date.now() - mem.fetchedAt > ttlMs;
    return { entry: mem, stale };
  }

  const all = loadAll();
  const found = all.find((x) => x.key === k) ?? null;
  if (found) memory.set(k, found);
  const stale = found ? Date.now() - found.fetchedAt > ttlMs : false;
  return { entry: found, stale };
}

export function setCachedLyrics(
  entry: CachedLyrics,
  { maxItems = MAX_ITEMS_DEFAULT }: { maxItems?: number } = {},
) {
  const k = entry.key.trim();
  if (!k) return;

  memory.set(k, entry);

  if (typeof window === "undefined") return;
  const all = loadAll().filter((x) => x.key !== k);

  // LRU simples: mais recente no topo
  all.unshift(entry);
  if (all.length > maxItems) all.length = maxItems;
  saveAll(all);
}













