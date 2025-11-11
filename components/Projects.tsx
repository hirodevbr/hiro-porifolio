"use client";

import { motion } from "framer-motion";
import { useInView } from "react-intersection-observer";
import { ExternalLink, Github, Star, GitFork, Sparkles, Clock, AlertCircle, RefreshCw } from "lucide-react";
import { useEffect, useState, useCallback } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { trackProjectClick, trackProjectView, trackSocialClick } from "@/lib/analytics";

interface GitHubRepo {
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

export default function Projects() {
  const { t } = useLanguage();
  const [ref, inView] = useInView({
    triggerOnce: true,
    threshold: 0.1,
  });

  const [repos, setRepos] = useState<GitHubRepo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchRepos = useCallback(async () => {
    try {
      setError(null);
      setLoading(true);
      const response = await fetch(
        `https://api.github.com/users/hirodevbr/repos?sort=updated&per_page=12`
      );
      if (!response.ok) {
        if (response.status === 403) {
          throw new Error("rate_limit");
        } else if (response.status === 404) {
          throw new Error("user_not_found");
        } else {
          throw new Error("fetch_error");
        }
      }
      const data: GitHubRepo[] = await response.json();
      const filteredRepos = data
        .filter((repo) => repo.description || repo.name !== "hirodevbr")
        .slice(0, 12);
      setRepos(filteredRepos);
    } catch (error) {
      console.error("Error fetching GitHub repos:", error);
      if (error instanceof Error) {
        setError(error.message);
      } else {
        setError("fetch_error");
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRepos();
  }, [fetchRepos]);

  // Tracking de visualização de projetos quando entram em view
  useEffect(() => {
    if (inView && repos.length > 0) {
      repos.forEach((repo) => {
        trackProjectView(repo.name, repo.html_url);
      });
    }
  }, [inView, repos]);

  const handleRetry = () => {
    fetchRepos();
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.5,
        type: "spring",
        stiffness: 100,
      },
    },
  };

  const getLanguageColor = (language: string | null) => {
    const colors: Record<string, string> = {
      JavaScript: "bg-yellow-500",
      TypeScript: "bg-blue-500",
      HTML: "bg-orange-500",
      CSS: "bg-pink-500",
      Python: "bg-green-500",
      Java: "bg-red-500",
      "C++": "bg-blue-600",
      "C#": "bg-purple-500",
    };
    return colors[language || ""] || "bg-gray-500";
  };

  // Função para verificar se um projeto é recente (últimos 30 dias)
  const isRecentProject = (updatedAt: string): boolean => {
    const updatedDate = new Date(updatedAt);
    const now = new Date();
    const daysDiff = (now.getTime() - updatedDate.getTime()) / (1000 * 60 * 60 * 24);
    return daysDiff <= 30;
  };

  // Função para calcular tempo relativo
  const getRelativeTime = (updatedAt: string): string => {
    const updatedDate = new Date(updatedAt);
    const now = new Date();
    const secondsDiff = Math.floor((now.getTime() - updatedDate.getTime()) / 1000);
    
    if (secondsDiff < 60) return "agora mesmo";
    if (secondsDiff < 3600) return `${Math.floor(secondsDiff / 60)} min atrás`;
    if (secondsDiff < 86400) return `${Math.floor(secondsDiff / 3600)} h atrás`;
    if (secondsDiff < 2592000) return `${Math.floor(secondsDiff / 86400)} dias atrás`;
    return `${Math.floor(secondsDiff / 2592000)} meses atrás`;
  };

  // Ordenar projetos: recentes primeiro, depois por data de atualização
  const sortedRepos = [...repos].sort((a, b) => {
    const aIsRecent = isRecentProject(a.updated_at);
    const bIsRecent = isRecentProject(b.updated_at);
    
    if (aIsRecent && !bIsRecent) return -1;
    if (!aIsRecent && bIsRecent) return 1;
    
    // Se ambos são recentes ou ambos não são, ordenar por data
    return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime();
  });

  // Componente de Skeleton Loading melhorado
  const ProjectSkeleton = () => (
    <div className="bg-gray-800/50 backdrop-blur-sm p-6 rounded-xl border border-gray-700 animate-pulse">
      {/* Badge skeleton */}
      <div className="flex justify-end mb-2">
        <div className="h-5 w-16 bg-gray-700 rounded-full" />
      </div>
      {/* Título skeleton */}
      <div className="h-6 bg-gray-700 rounded w-3/4 mb-3" />
      {/* Linguagem skeleton */}
      <div className="flex items-center gap-2 mb-3">
        <div className="h-3 w-3 bg-gray-700 rounded-full" />
        <div className="h-4 bg-gray-700 rounded w-20" />
      </div>
      {/* Tempo skeleton */}
      <div className="h-3 bg-gray-700 rounded w-24 mb-4" />
      {/* Descrição skeleton */}
      <div className="space-y-2 mb-4">
        <div className="h-3 bg-gray-700 rounded w-full" />
        <div className="h-3 bg-gray-700 rounded w-5/6" />
        <div className="h-3 bg-gray-700 rounded w-4/6" />
      </div>
      {/* Footer skeleton */}
      <div className="flex items-center justify-between pt-4 border-t border-gray-700">
        <div className="flex items-center gap-4">
          <div className="h-4 w-12 bg-gray-700 rounded" />
          <div className="h-4 w-12 bg-gray-700 rounded" />
        </div>
        <div className="flex gap-2">
          <div className="h-9 w-9 bg-gray-700 rounded-lg" />
          <div className="h-9 w-9 bg-gray-700 rounded-lg" />
        </div>
      </div>
    </div>
  );

  if (loading) {
    return (
      <section
        id="projects"
        className="py-20 px-4 sm:px-6 lg:px-8"
      >
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-4">
              <span className="bg-gradient-to-r from-primary-400 to-purple-500 bg-clip-text text-transparent">
                {t("projects_title")}
              </span>
            </h2>
            <div className="w-24 h-1 bg-gradient-to-r from-primary-500 to-purple-500 mx-auto rounded-full" />
            <p className="text-gray-400 mt-4 max-w-2xl mx-auto">
              {t("projects_subtitle")}
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <ProjectSkeleton key={i} />
            ))}
          </div>
        </div>
      </section>
    );
  }

  return (
    <section id="projects" ref={ref} className="py-20 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5 }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl md:text-5xl font-bold mb-4">
            <span className="bg-gradient-to-r from-primary-400 to-purple-500 bg-clip-text text-transparent">
              {t("projects_title")}
            </span>
          </h2>
          <div className="w-24 h-1 bg-gradient-to-r from-primary-500 to-purple-500 mx-auto rounded-full" />
          <p className="text-gray-400 mt-4 max-w-2xl mx-auto">
            {t("projects_subtitle")}
          </p>
        </motion.div>

        {error ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-12"
          >
            <div className="max-w-md mx-auto bg-gray-800/50 backdrop-blur-sm p-8 rounded-xl border border-red-500/50">
              <AlertCircle className="w-16 h-16 text-red-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-white mb-2">
                {t("projects_error_title")}
              </h3>
              <p className="text-gray-400 mb-6">
                {error === "rate_limit"
                  ? t("projects_error_rate_limit")
                  : error === "user_not_found"
                  ? t("projects_error_user_not_found")
                  : t("projects_error_fetch")}
              </p>
              <motion.button
                onClick={handleRetry}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-primary-500 to-primary-600 rounded-lg font-semibold text-white shadow-lg shadow-primary-500/50 hover:shadow-xl hover:shadow-primary-500/50 transition-all focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 focus:ring-offset-gray-900"
              >
                <RefreshCw className="w-5 h-5" />
                {t("projects_error_retry")}
              </motion.button>
            </div>
          </motion.div>
        ) : repos.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-400 text-lg">
              {t("projects_no_projects")}
            </p>
          </div>
        ) : (
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate={inView ? "visible" : "hidden"}
            className="grid md:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            {sortedRepos.map((repo) => {
              const isRecent = isRecentProject(repo.updated_at);
              return (
              <motion.div
                key={repo.id}
                variants={itemVariants}
                whileHover={{ y: -12, scale: 1.03 }}
                className={`relative bg-gray-800/50 backdrop-blur-sm p-6 rounded-xl border transition-all group card-hover ${
                  isRecent
                    ? "border-primary-500/50 shadow-lg shadow-primary-500/20 hover:shadow-xl hover:shadow-primary-500/40"
                    : "border-gray-700 hover:border-primary-500/50 hover:shadow-lg hover:shadow-primary-500/20"
                }`}
              >
                {/* Badge de projeto recente */}
                {isRecent && (
                  <motion.div
                    initial={{ scale: 0, rotate: -180 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{ type: "spring", stiffness: 200, damping: 15 }}
                    className="absolute -top-3 -right-3 flex items-center gap-1 px-3 py-1 bg-gradient-to-r from-primary-500 to-purple-500 rounded-full text-xs font-semibold text-white shadow-lg"
                  >
                    <Sparkles className="w-3 h-3" />
                    <span>{t("projects_new")}</span>
                  </motion.div>
                )}

                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className={`text-xl font-semibold group-hover:text-primary-400 transition-colors ${
                        isRecent ? "text-primary-300" : "text-white"
                      }`}>
                        {repo.name}
                      </h3>
                    </div>
                    {repo.language && (
                      <div className="flex items-center gap-2 mb-3">
                        <div
                          className={`w-3 h-3 rounded-full ${getLanguageColor(
                            repo.language
                          )}`}
                        />
                        <span className="text-sm text-gray-400">
                          {repo.language}
                        </span>
                      </div>
                    )}
                    {/* Indicador de tempo de atualização */}
                    <div className="flex items-center gap-1 text-xs text-gray-500 mb-2">
                      <Clock className="w-3 h-3" />
                      <span>{t("projects_updated")} {getRelativeTime(repo.updated_at)}</span>
                    </div>
                  </div>
                </div>

                <p className={`text-sm mb-4 line-clamp-3 ${
                  isRecent ? "text-gray-300" : "text-gray-400"
                }`}>
                  {repo.description || "Sem descrição disponível"}
                </p>

                <div className="flex items-center justify-between pt-4 border-t border-gray-700">
                  <div className="flex items-center gap-4 text-sm text-gray-400">
                    <div className="flex items-center gap-1">
                      <Star className="w-4 h-4" />
                      <span>{repo.stargazers_count}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <GitFork className="w-4 h-4" />
                      <span>{repo.forks_count}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <motion.a
                      href={repo.html_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      whileHover={{ scale: 1.15, rotate: 5 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={() => trackProjectClick(repo.name, repo.html_url)}
                      className={`p-2 rounded-lg transition-all hover-lift focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 focus:ring-offset-gray-800 ${
                        isRecent
                          ? "bg-primary-500/20 hover:bg-primary-500/40 hover:shadow-lg hover:shadow-primary-500/30"
                          : "bg-gray-700/50 hover:bg-primary-500/30 hover:shadow-lg hover:shadow-primary-500/20"
                      }`}
                      aria-label={`Ver código do projeto ${repo.name} no GitHub (abre em nova aba)`}
                    >
                      <Github className={`w-5 h-5 transition-colors ${
                        isRecent ? "text-primary-400" : "text-gray-400 hover:text-primary-400"
                      }`} aria-hidden="true" />
                    </motion.a>
                    {repo.html_url && (
                      <motion.a
                        href={repo.html_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        whileHover={{ scale: 1.15, rotate: -5 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={() => trackProjectClick(repo.name, repo.html_url)}
                        className={`p-2 rounded-lg transition-all hover-lift focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 focus:ring-offset-gray-800 ${
                          isRecent
                            ? "bg-primary-500/20 hover:bg-primary-500/40 hover:shadow-lg hover:shadow-primary-500/30"
                            : "bg-gray-700/50 hover:bg-primary-500/30 hover:shadow-lg hover:shadow-primary-500/20"
                        }`}
                        aria-label={`Abrir projeto ${repo.name} (abre em nova aba)`}
                      >
                        <ExternalLink className={`w-5 h-5 transition-colors ${
                          isRecent ? "text-primary-400" : "text-gray-400 hover:text-primary-400"
                        }`} aria-hidden="true" />
                      </motion.a>
                    )}
                  </div>
                </div>
              </motion.div>
            );
            })}
          </motion.div>
        )}

        <motion.div
          initial={{ opacity: 0 }}
          animate={inView ? { opacity: 1 } : {}}
          transition={{ delay: 0.5 }}
          className="text-center mt-12"
        >
          <motion.a
            href="https://github.com/hirodevbr"
            target="_blank"
            rel="noopener noreferrer"
            whileHover={{ scale: 1.05, y: -4 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => trackSocialClick("GitHub", "https://github.com/hirodevbr")}
            className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-primary-500 to-primary-600 rounded-lg font-semibold text-white shadow-lg shadow-primary-500/50 hover:shadow-xl hover:shadow-primary-500/70 glow-on-hover hover-lift transition-all focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 focus:ring-offset-gray-900"
            aria-label={`${t("projects_view_all")} no GitHub (abre em nova aba)`}
          >
            <Github className="w-5 h-5" aria-hidden="true" />
                {t("projects_view_all")}
          </motion.a>
        </motion.div>
      </div>
    </section>
  );
}

