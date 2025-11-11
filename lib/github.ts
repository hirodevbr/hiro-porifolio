export interface GitHubRepo {
  id: number;
  name: string;
  description: string | null;
  html_url: string;
  language: string | null;
  stargazers_count: number;
  forks_count: number;
  updated_at: string;
  topics: string[];
}

export async function getGitHubRepos(username: string): Promise<GitHubRepo[]> {
  try {
    const response = await fetch(
      `https://api.github.com/users/${username}/repos?sort=updated&per_page=12`,
      {
        next: { revalidate: 3600 }, // Revalida a cada hora
      }
    );

    if (!response.ok) {
      throw new Error("Failed to fetch repos");
    }

    const repos: GitHubRepo[] = await response.json();
    
    // Filtrar apenas repositórios públicos e com descrição
    return repos
      .filter((repo) => !repo.name.includes("hirodevbr") || repo.description)
      .slice(0, 12);
  } catch (error) {
    console.error("Error fetching GitHub repos:", error);
    return [];
  }
}

