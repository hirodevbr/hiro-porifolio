import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic"; // Força revalidação a cada request (mas usa cache do Next.js)

const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutos de cache no servidor
const GITHUB_USERNAME = "hirodevbr";

// Cache simples em memória (para múltiplas requisições simultâneas)
const memoryCache = new Map<string, { data: any; timestamp: number }>();

async function fetchGitHubRepos() {
  const cacheKey = `repos:${GITHUB_USERNAME}`;
  const cached = memoryCache.get(cacheKey);
  
  // Verifica cache em memória
  if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
    return cached.data;
  }

  try {
    const response = await fetch(
      `https://api.github.com/users/${GITHUB_USERNAME}/repos?sort=updated&per_page=12`,
      {
        headers: {
          "User-Agent": "portfolio/1.0",
          Accept: "application/vnd.github.v3+json",
        },
        // Cache do Next.js (revalida a cada 5 minutos)
        next: { revalidate: 300 },
      }
    );

    if (!response.ok) {
      if (response.status === 403) {
        // Rate limit - retorna erro específico
        return { error: "rate_limit", status: 403 };
      } else if (response.status === 404) {
        return { error: "user_not_found", status: 404 };
      } else {
        return { error: "fetch_error", status: response.status };
      }
    }

    const data = await response.json();
    
    // Filtra e limita repositórios
    const filteredRepos = data
      .filter((repo: any) => repo.description || repo.name !== GITHUB_USERNAME)
      .slice(0, 12)
      .map((repo: any) => ({
        id: repo.id,
        name: repo.name,
        description: repo.description,
        html_url: repo.html_url,
        language: repo.language,
        stargazers_count: repo.stargazers_count,
        forks_count: repo.forks_count,
        updated_at: repo.updated_at,
        topics: repo.topics || [],
      }));

    // Salva no cache em memória
    memoryCache.set(cacheKey, { data: filteredRepos, timestamp: Date.now() });
    
    return filteredRepos;
  } catch (error) {
    console.error("Error fetching GitHub repos:", error);
    return { error: "fetch_error", status: 500 };
  }
}

export async function GET() {
  const result = await fetchGitHubRepos();
  
  if (result && typeof result === "object" && "error" in result) {
    return NextResponse.json(result, { status: result.status || 500 });
  }
  
  return NextResponse.json(result, {
    headers: {
      "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600",
    },
  });
}

