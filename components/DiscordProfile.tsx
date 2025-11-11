"use client";

import { motion } from "framer-motion";
import { useInView } from "react-intersection-observer";
import { useEffect, useState, useRef } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import Image from "next/image";
import { 
  Music, 
  Gamepad2, 
  Code, 
  Monitor, 
  Headphones,
  Clock,
  Sparkles,
  Loader2,
  Award,
  Shield,
  Star,
  Zap,
  Bug,
  CheckCircle,
  Crown,
  Users,
  Gift,
  Heart,
  Rocket,
  Gem,
  Target,
  Circle
} from "lucide-react";

interface DiscordActivity {
  name: string;
  type: number;
  details?: string;
  state?: string;
  timestamps?: {
    start?: number;
    end?: number;
  };
  assets?: {
    large_image?: string;
    large_text?: string;
    small_image?: string;
    small_text?: string;
  };
  application_id?: string;
}

interface DiscordData {
  discord_user: {
    username: string;
    discriminator: string;
    avatar: string;
    id: string;
    public_flags?: number;
    premium_type?: number; // 0 = nenhum, 1 = Nitro Classic, 2 = Nitro
    avatar_decoration_data?: any;
    primary_guild?: {
      badge?: string | null;
      tag?: string | null;
    };
    global_name?: string;
    display_name?: string;
    banner?: string;
    banner_color?: string;
  };
  discord_status: "online" | "idle" | "dnd" | "offline";
  activities: DiscordActivity[];
  spotify?: {
    track_id: string;
    timestamps: {
      start: number;
      end: number;
    };
    song: string;
    artist: string;
    album_art_url: string;
    album: string;
  };
  kv?: {
    [key: string]: any;
  };
}

interface Badge {
  name: string;
  icon?: React.ReactNode;
  iconUrl?: string;
  color: string;
  bgColor: string;
}

export default function DiscordProfile() {
  const { t } = useLanguage();
  const [ref, inView] = useInView({
    triggerOnce: true,
    threshold: 0.1,
  });

  const [discordData, setDiscordData] = useState<DiscordData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const hasDataRef = useRef(false);

  // ID do Discord - você precisa substituir pelo seu ID
  // Para encontrar seu ID: 
  // 1. Ative o Modo Desenvolvedor no Discord: Configurações > Avançado > Modo Desenvolvedor
  // 2. Clique com botão direito no seu perfil > Copiar ID
  // Ou use: https://discord.id/ para encontrar seu ID
  const DISCORD_USER_ID = "380475076174282753";
  
  // Badges adicionais que não são detectadas pela API pública
  // Defina como true se você possui essas badges
  const ADDITIONAL_BADGES = {
    nitro: true,           // Se você tem Nitro
    pomelo: true,          // Se você tem badge Pomelo
    orb: true,             // Se você tem badge Orb
    impulso: true,         // Se você está impulsionando um servidor
    missao: true           // Se você completou uma missão
  };

  useEffect(() => {
    const fetchDiscordData = async () => {
      try {
        // Adicionar timestamp para evitar cache
        const timestamp = Date.now();
        const response = await fetch(
          `https://api.lanyard.rest/v1/users/${DISCORD_USER_ID}?_=${timestamp}`,
          {
            cache: 'no-store',
            headers: {
              'Cache-Control': 'no-cache, no-store, must-revalidate',
              'Pragma': 'no-cache',
              'Expires': '0',
            },
          }
        );
        
        if (!response.ok) {
          throw new Error("Failed to fetch Discord data");
        }

        const data = await response.json();
        
        if (data.success && data.data) {
          // Atualizar sempre para garantir que mudanças sejam refletidas
          setDiscordData(data.data);
          hasDataRef.current = true;
          setError(null); // Limpar erro se dados foram carregados com sucesso
        } else {
          throw new Error("Invalid Discord data");
        }
      } catch (err) {
        console.error("Error fetching Discord data:", err);
        // Só definir erro se ainda não tivermos dados carregados
        if (!hasDataRef.current) {
          setError("Não foi possível carregar o perfil do Discord");
        }
      } finally {
        setLoading(false);
      }
    };

    // Buscar imediatamente
    fetchDiscordData();
    
    // Atualizar a cada 5 segundos para tempo real mais responsivo
    const interval = setInterval(fetchDiscordData, 5000);
    
    return () => clearInterval(interval);
  }, []); // Array vazio para executar apenas uma vez na montagem

  const getStatusColor = (status: string) => {
    switch (status) {
      case "online":
        return "bg-green-500";
      case "idle":
        return "bg-yellow-500";
      case "dnd":
        return "bg-red-500";
      default:
        return "bg-gray-500";
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "online":
        return t("discord_online");
      case "idle":
        return t("discord_idle");
      case "dnd":
        return t("discord_dnd");
      default:
        return t("discord_offline");
    }
  };

  const getActivityType = (type: number) => {
    switch (type) {
      case 0:
        return t("discord_playing");
      case 1:
        return t("discord_streaming");
      case 2:
        return t("discord_listening");
      case 3:
        return t("discord_watching");
      case 4:
        return t("discord_custom");
      case 5:
        return t("discord_competing");
      default:
        return t("discord_playing");
    }
  };

  // Função para obter todas as URLs possíveis da imagem da atividade
  const getActivityImageUrls = (activity: DiscordActivity): string[] => {
    const urls: string[] = [];
    
    if (!activity.assets?.large_image) {
      return urls;
    }

    const largeImage = activity.assets.large_image;
    const applicationId = activity.application_id;

    // Se a imagem começa com "mp:", é uma URL externa
    if (largeImage.startsWith("mp:")) {
      const match = largeImage.match(/mp:external\/(.+)/);
      if (match) {
        const urlPart = match[1];
        
        // Se contém "https/" ou "http/", extrair a parte após isso
        const httpsMatch = urlPart.match(/(?:https|http)\/(.+)/);
        if (httpsMatch) {
          urls.push(`https://${httpsMatch[1]}`);
        } else {
          // Tentar decodificar
          try {
            const decodedUrl = decodeURIComponent(urlPart);
            if (decodedUrl.startsWith("http://") || decodedUrl.startsWith("https://")) {
              urls.push(decodedUrl);
            } else if (decodedUrl.startsWith("//")) {
              urls.push(`https:${decodedUrl}`);
            } else {
              urls.push(`https://${decodedUrl}`);
            }
          } catch {
            if (urlPart.startsWith("http://") || urlPart.startsWith("https://")) {
              urls.push(urlPart);
            } else {
              urls.push(`https://${urlPart}`);
            }
          }
        }
      }
    }

    // Se tem application_id, adicionar URLs do CDN do Discord
    // Tentar diferentes formatos e tamanhos
    if (applicationId) {
      // Formato padrão
      urls.push(
        `https://cdn.discordapp.com/app-assets/${applicationId}/${largeImage}.png`,
        `https://cdn.discordapp.com/app-assets/${applicationId}/${largeImage}.jpg`,
        `https://cdn.discordapp.com/app-assets/${applicationId}/${largeImage}.webp`,
        `https://cdn.discordapp.com/app-assets/${applicationId}/${largeImage}.gif`
      );
      
      // Tentar com a_ prefix (animated)
      if (largeImage.startsWith("a_")) {
        const baseImage = largeImage.substring(2);
        urls.push(
          `https://cdn.discordapp.com/app-assets/${applicationId}/${baseImage}.png`,
          `https://cdn.discordapp.com/app-assets/${applicationId}/${baseImage}.gif`
        );
      }
      
      // Tentar sem extensão (Discord às vezes usa hash sem extensão)
      urls.push(
        `https://cdn.discordapp.com/app-assets/${applicationId}/${largeImage}`,
        `https://cdn.discordapp.com/app-assets/${applicationId}/${largeImage}.png?size=512`,
        `https://cdn.discordapp.com/app-assets/${applicationId}/${largeImage}.png?size=1024`
      );
    }

    return urls;
  };

  // Função para obter URL da imagem da atividade (mantida para compatibilidade)
  const getActivityImageUrl = (activity: DiscordActivity): string | null => {
    const urls = getActivityImageUrls(activity);
    return urls.length > 0 ? urls[0] : null;
  };

  // Função para obter URL da imagem pequena da atividade
  const getActivitySmallImageUrl = (activity: DiscordActivity): string | null => {
    if (!activity.assets?.small_image) {
      return null;
    }

    const smallImage = activity.assets.small_image;
    const applicationId = activity.application_id;

    // Se a imagem começa com "mp:", é uma URL externa
    if (smallImage.startsWith("mp:")) {
      const match = smallImage.match(/mp:external\/(.+)/);
      if (match) {
        const urlPart = match[1];
        
        const httpsMatch = urlPart.match(/(?:https|http)\/(.+)/);
        if (httpsMatch) {
          return `https://${httpsMatch[1]}`;
        }
        
        try {
          const decodedUrl = decodeURIComponent(urlPart);
          if (decodedUrl.startsWith("http://") || decodedUrl.startsWith("https://")) {
            return decodedUrl;
          }
          if (decodedUrl.startsWith("//")) {
            return `https:${decodedUrl}`;
          }
          return `https://${decodedUrl}`;
        } catch {
          if (urlPart.startsWith("http://") || urlPart.startsWith("https://")) {
            return urlPart;
          }
          return `https://${urlPart}`;
        }
      }
    }

    // Se tem application_id, usar CDN do Discord
    if (applicationId) {
      return `https://cdn.discordapp.com/app-assets/${applicationId}/${smallImage}.png`;
    }

    return null;
  };

  const getActivityIcon = (activity: DiscordActivity) => {
    if (activity.name.toLowerCase().includes("spotify")) {
      return <Music className="w-5 h-5" />;
    }
    
    switch (activity.type) {
      case 0:
      case 5:
        return <Gamepad2 className="w-5 h-5" />;
      case 1:
        return <Monitor className="w-5 h-5" />;
      case 2:
        return <Music className="w-5 h-5" />;
      case 3:
        return <Monitor className="w-5 h-5" />;
      default:
        return <Code className="w-5 h-5" />;
    }
  };

  // Função para formatar tempo decorrido em horas, minutos e segundos
  const formatElapsedTime = (startTimestamp: number): string => {
    const now = Date.now();
    const elapsedMs = now - startTimestamp;
    const elapsedSeconds = Math.floor(elapsedMs / 1000);
    
    const hours = Math.floor(elapsedSeconds / 3600);
    const minutes = Math.floor((elapsedSeconds % 3600) / 60);
    const seconds = elapsedSeconds % 60;
    
    if (hours > 0) {
      return `${hours}h ${minutes}min ${seconds}s`;
    } else if (minutes > 0) {
      return `${minutes}min ${seconds}s`;
    } else {
      return `${seconds}s`;
    }
  };

  // Função para formatar tempo em minutos e segundos (para música)
  const formatMusicTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getBadges = (
    flags?: number, 
    premiumType?: number, 
    kv?: { [key: string]: any },
    avatarDecoration?: any,
    primaryGuild?: { badge?: string | null; tag?: string | null }
  ): Badge[] => {
    const badges: Badge[] = [];
    
    // Debug: decodificar flags
    if (flags) {
      console.log("Decodificando flags:", flags);
      console.log("Flags binárias:", flags.toString(2));
    }
    
    // Discord Staff (1)
    if (flags && flags & 1) {
      badges.push({
        name: "Funcionário do Discord",
        iconUrl: "https://raw.githubusercontent.com/mezotv/discord-badges/main/assets/discordstaff.svg",
        icon: <Shield className="w-4 h-4" />,
        color: "text-red-400",
        bgColor: "bg-red-500/20 border-red-500/50"
      });
    }
    
    // Discord Partner (2)
    if (flags && flags & 2) {
      badges.push({
        name: "Parceiro do Discord",
        iconUrl: "https://raw.githubusercontent.com/mezotv/discord-badges/main/assets/discordpartner.svg",
        icon: <Crown className="w-4 h-4" />,
        color: "text-purple-400",
        bgColor: "bg-purple-500/20 border-purple-500/50"
      });
    }
    
    // HypeSquad Events (4)
    if (flags && flags & 4) {
      badges.push({
        name: "HypeSquad Events",
        iconUrl: "https://raw.githubusercontent.com/mezotv/discord-badges/main/assets/hypesquadevents.svg",
        icon: <Zap className="w-4 h-4" />,
        color: "text-yellow-400",
        bgColor: "bg-yellow-500/20 border-yellow-500/50"
      });
    }
    
    // Bug Hunter Level 1 (8)
    if (flags && flags & 8) {
      badges.push({
        name: "Bug Hunter Nível 1",
        iconUrl: "https://raw.githubusercontent.com/mezotv/discord-badges/main/assets/discordbughunter1.svg",
        icon: <Bug className="w-4 h-4" />,
        color: "text-green-400",
        bgColor: "bg-green-500/20 border-green-500/50"
      });
    }
    
    // HypeSquad Bravery (64)
    if (flags && flags & 64) {
      badges.push({
        name: "HypeSquad Bravery",
        iconUrl: "https://raw.githubusercontent.com/mezotv/discord-badges/main/assets/hypesquadbravery.svg",
        icon: <Shield className="w-4 h-4" />,
        color: "text-orange-400",
        bgColor: "bg-orange-500/20 border-orange-500/50"
      });
    }
    
    // HypeSquad Brilliance (128)
    if (flags && flags & 128) {
      badges.push({
        name: "HypeSquad Brilliance",
        iconUrl: "https://raw.githubusercontent.com/mezotv/discord-badges/main/assets/hypesquadbrilliance.svg",
        icon: <Shield className="w-4 h-4" />,
        color: "text-blue-400",
        bgColor: "bg-blue-500/20 border-blue-500/50"
      });
    }
    
    // HypeSquad Balance (256)
    if (flags && flags & 256) {
      badges.push({
        name: "HypeSquad Balance",
        iconUrl: "https://raw.githubusercontent.com/mezotv/discord-badges/main/assets/hypesquadbalance.svg",
        icon: <Shield className="w-4 h-4" />,
        color: "text-cyan-400",
        bgColor: "bg-cyan-500/20 border-cyan-500/50"
      });
    }
    
    // Early Supporter (512)
    if (flags && flags & 512) {
      badges.push({
        name: "Early Supporter",
        iconUrl: "https://raw.githubusercontent.com/mezotv/discord-badges/main/assets/discordearlysupporter.svg",
        icon: <Heart className="w-4 h-4" />,
        color: "text-pink-400",
        bgColor: "bg-pink-500/20 border-pink-500/50"
      });
    }
    
    // Bug Hunter Level 2 (16384)
    if (flags && flags & 16384) {
      badges.push({
        name: "Bug Hunter Nível 2",
        iconUrl: "https://raw.githubusercontent.com/mezotv/discord-badges/main/assets/discordbughunter2.svg",
        icon: <Bug className="w-4 h-4" />,
        color: "text-emerald-400",
        bgColor: "bg-emerald-500/20 border-emerald-500/50"
      });
    }
    
    // Verified Bot Developer (131072)
    if (flags && flags & 131072) {
      badges.push({
        name: "Desenvolvedor de Bot Verificado",
        iconUrl: "https://raw.githubusercontent.com/mezotv/discord-badges/main/assets/discordbotdev.svg",
        icon: <CheckCircle className="w-4 h-4" />,
        color: "text-indigo-400",
        bgColor: "bg-indigo-500/20 border-indigo-500/50"
      });
    }
    
    // Certified Moderator (262144)
    if (flags && flags & 262144) {
      badges.push({
        name: "Moderador Certificado",
        iconUrl: "https://raw.githubusercontent.com/mezotv/discord-badges/main/assets/discordmod.svg",
        icon: <Shield className="w-4 h-4" />,
        color: "text-violet-400",
        bgColor: "bg-violet-500/20 border-violet-500/50"
      });
    }
    
    // Active Developer (4194304)
    if (flags && flags & 4194304) {
      badges.push({
        name: "Desenvolvedor Ativo",
        iconUrl: "https://raw.githubusercontent.com/mezotv/discord-badges/main/assets/activedeveloper.svg",
        icon: <Code className="w-4 h-4" />,
        color: "text-primary-400",
        bgColor: "bg-primary-500/20 border-primary-500/50"
      });
    }
    
    // Nitro Badge (premium_type ou avatar_decoration indica Nitro)
    if (premiumType && premiumType > 0) {
      badges.push({
        name: premiumType === 1 ? "Nitro Classic" : "Nitro",
        iconUrl: "https://raw.githubusercontent.com/mezotv/discord-badges/refs/heads/main/assets/subscriptions/badges/diamond.png",
        icon: <Gem className="w-4 h-4" />,
        color: "text-rose-400",
        bgColor: "bg-rose-500/20 border-rose-500/50"
      });
    } else if (avatarDecoration) {
      badges.push({
        name: "Nitro",
        iconUrl: "https://raw.githubusercontent.com/mezotv/discord-badges/refs/heads/main/assets/subscriptions/badges/diamond.png",
        icon: <Gem className="w-4 h-4" />,
        color: "text-rose-400",
        bgColor: "bg-rose-500/20 border-rose-500/50"
      });
    }
    
    // Pomelo Badge
    if (primaryGuild?.tag) {
      badges.push({
        name: "Pomelo",
        iconUrl: "https://raw.githubusercontent.com/mezotv/discord-badges/main/assets/username.png",
        icon: <Gift className="w-4 h-4" />,
        color: "text-fuchsia-400",
        bgColor: "bg-fuchsia-500/20 border-fuchsia-500/50"
      });
    }
    
    // Badge do primary_guild
    if (primaryGuild?.badge) {
      const badgeName = primaryGuild.badge;
      if (badgeName.includes("orb") || badgeName.includes("Orb")) {
        badges.push({
          name: "Orb",
          iconUrl: "https://raw.githubusercontent.com/mezotv/discord-badges/main/assets/orb.svg",
          icon: <Circle className="w-4 h-4" />,
          color: "text-cyan-400",
          bgColor: "bg-cyan-500/20 border-cyan-500/50"
        });
      } else if (badgeName.includes("boost") || badgeName.includes("Impulso")) {
        badges.push({
          name: "Impulso de Servidor",
          iconUrl: "https://raw.githubusercontent.com/mezotv/discord-badges/main/assets/boosts/discordboost9.svg",
          icon: <Rocket className="w-4 h-4" />,
          color: "text-purple-400",
          bgColor: "bg-purple-500/20 border-purple-500/50"
        });
      } else if (badgeName.includes("mission") || badgeName.includes("Missão")) {
        badges.push({
          name: "Missão Completa",
          iconUrl: "https://raw.githubusercontent.com/mezotv/discord-badges/main/assets/quest.png",
          icon: <Target className="w-4 h-4" />,
          color: "text-yellow-400",
          bgColor: "bg-yellow-500/20 border-yellow-500/50"
        });
      }
    }
    
    // Orb Badge (gastou Orbs) - verificar em kv
    if (kv && (kv.orb_badge || kv.orb || kv.has_orb)) {
      badges.push({
        name: "Orb",
        iconUrl: "https://raw.githubusercontent.com/mezotv/discord-badges/main/assets/orb.svg",
        icon: <Circle className="w-4 h-4" />,
        color: "text-cyan-400",
        bgColor: "bg-cyan-500/20 border-cyan-500/50"
      });
    }
    
    // Impulso de Servidor (Server Boosting) - verificar em kv
    if (kv && (kv.server_boost || kv.boosting || kv.has_boost)) {
      badges.push({
        name: "Impulso de Servidor",
        iconUrl: "https://raw.githubusercontent.com/mezotv/discord-badges/main/assets/boosts/discordboost9.svg",
        icon: <Rocket className="w-4 h-4" />,
        color: "text-purple-400",
        bgColor: "bg-purple-500/20 border-purple-500/50"
      });
    }
    
    // Missão Completa - verificar em kv
    if (kv && (kv.mission_complete || kv.mission || kv.completed_mission)) {
      badges.push({
        name: "Missão Completa",
        iconUrl: "https://raw.githubusercontent.com/mezotv/discord-badges/main/assets/quest.png",
        icon: <Target className="w-4 h-4" />,
        color: "text-yellow-400",
        bgColor: "bg-yellow-500/20 border-yellow-500/50"
      });
    }
    
    // Ordenar badges por importância
    const badgeOrder = [
      "Funcionário do Discord",
      "Parceiro do Discord",
      "Moderador Certificado",
      "Desenvolvedor de Bot Verificado",
      "Nitro",
      "Nitro Classic",
      "HypeSquad Events",
      "HypeSquad Bravery",
      "HypeSquad Brilliance",
      "HypeSquad Balance",
      "Desenvolvedor Ativo",
      "Impulso de Servidor",
      "Pomelo",
      "Orb",
      "Bug Hunter Nível 2",
      "Bug Hunter Nível 1",
      "Early Supporter",
      "Missão Completa"
    ];
    
    return badges.sort((a, b) => {
      const indexA = badgeOrder.indexOf(a.name);
      const indexB = badgeOrder.indexOf(b.name);
      if (indexA === -1) return 1;
      if (indexB === -1) return -1;
      return indexA - indexB;
    });
  };

  if (loading) {
    return (
      <section
        id="discord"
        ref={ref}
        className="py-20 px-4 sm:px-6 lg:px-8 bg-gray-900/50"
      >
        <div className="max-w-4xl mx-auto">
          <div className="bg-gray-800/50 backdrop-blur-sm p-8 rounded-xl border border-gray-700">
            <div className="flex items-center justify-center">
              <Loader2 className="w-8 h-8 text-primary-400 animate-spin" aria-label="Carregando perfil do Discord" role="status" />
            </div>
          </div>
        </div>
      </section>
    );
  }

  if (error || !discordData) {
    return (
      <section
        id="discord"
        ref={ref}
        className="py-20 px-4 sm:px-6 lg:px-8 bg-gray-900/50"
      >
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.5 }}
            className="text-center mb-8"
          >
            <h2 className="text-4xl md:text-5xl font-bold mb-4">
              <span className="bg-gradient-to-r from-primary-400 to-purple-500 bg-clip-text text-transparent">
                {t("discord_title")}
              </span>
            </h2>
            <div className="w-24 h-1 bg-gradient-to-r from-primary-500 to-purple-500 mx-auto rounded-full" />
          </motion.div>
          <div className="bg-gray-800/50 backdrop-blur-sm p-8 rounded-xl border border-gray-700 text-center">
            <p className="text-gray-400">{error || "Perfil não disponível"}</p>
            <p className="text-sm text-gray-500 mt-2">
              Configure seu Discord User ID no componente DiscordProfile.tsx
            </p>
          </div>
        </div>
      </section>
    );
  }

  const { discord_user, discord_status, activities, spotify, kv } = discordData;
  const avatarUrl = discord_user.avatar
    ? `https://cdn.discordapp.com/avatars/${discord_user.id}/${discord_user.avatar}.png?size=256`
    : `https://cdn.discordapp.com/embed/avatars/${parseInt(discord_user.discriminator) % 5}.png`;
  
  // Banner do Discord
  // Configuração manual do banner (encontrado na API do Discord)
  // Hash do banner: a_c09674aec6189e73e7d3073f6656f65d (animado)
  // Cor do banner: #232428
  const MANUAL_BANNER_HASH = "a_c09674aec6189e73e7d3073f6656f65d";
  const MANUAL_BANNER_COLOR = "#232428";
  
  const bannerUrl = discord_user.banner || MANUAL_BANNER_HASH
    ? (discord_user.banner || MANUAL_BANNER_HASH).startsWith("a_")
      ? `https://cdn.discordapp.com/banners/${discord_user.id}/${discord_user.banner || MANUAL_BANNER_HASH}.gif?size=1024`
      : `https://cdn.discordapp.com/banners/${discord_user.id}/${discord_user.banner || MANUAL_BANNER_HASH}.png?size=1024`
    : null;
  
  const bannerColor = discord_user.banner_color || MANUAL_BANNER_COLOR;
  
  const badges = getBadges(
    discord_user.public_flags, 
    discord_user.premium_type, 
    kv,
    discord_user.avatar_decoration_data,
    discord_user.primary_guild
  );
  
  // Adicionar badges manuais se configuradas
  if (ADDITIONAL_BADGES.nitro && !badges.find(b => b.name === "Nitro" || b.name === "Nitro Classic")) {
    badges.push({
      name: "Nitro",
      iconUrl: "https://raw.githubusercontent.com/mezotv/discord-badges/refs/heads/main/assets/subscriptions/badges/diamond.png",
      icon: <Gem className="w-4 h-4" />,
      color: "text-rose-400",
      bgColor: "bg-rose-500/20 border-rose-500/50"
    });
  }
  
  if (ADDITIONAL_BADGES.pomelo && !badges.find(b => b.name === "Pomelo")) {
    badges.push({
      name: "Pomelo",
      iconUrl: "https://raw.githubusercontent.com/mezotv/discord-badges/main/assets/username.png",
      icon: <Gift className="w-4 h-4" />,
      color: "text-fuchsia-400",
      bgColor: "bg-fuchsia-500/20 border-fuchsia-500/50"
    });
  }
  
  if (ADDITIONAL_BADGES.orb && !badges.find(b => b.name === "Orb")) {
    badges.push({
      name: "Orb",
      iconUrl: "https://raw.githubusercontent.com/mezotv/discord-badges/main/assets/orb.svg",
      icon: <Circle className="w-4 h-4" />,
      color: "text-cyan-400",
      bgColor: "bg-cyan-500/20 border-cyan-500/50"
    });
  }
  
  if (ADDITIONAL_BADGES.impulso && !badges.find(b => b.name === "Impulso de Servidor")) {
    badges.push({
      name: "Impulso de Servidor",
      iconUrl: "https://raw.githubusercontent.com/mezotv/discord-badges/main/assets/boosts/discordboost9.svg",
      icon: <Rocket className="w-4 h-4" />,
      color: "text-purple-400",
      bgColor: "bg-purple-500/20 border-purple-500/50"
    });
  }
  
  if (ADDITIONAL_BADGES.missao && !badges.find(b => b.name === "Missão Completa")) {
    badges.push({
      name: "Missão Completa",
      iconUrl: "https://raw.githubusercontent.com/mezotv/discord-badges/main/assets/quest.png",
      icon: <Target className="w-4 h-4" />,
      color: "text-yellow-400",
      bgColor: "bg-yellow-500/20 border-yellow-500/50"
    });
  }
  
  // Reordenar badges após adicionar as manuais
  const badgeOrder = [
    "Funcionário do Discord",
    "Parceiro do Discord",
    "Moderador Certificado",
    "Desenvolvedor de Bot Verificado",
    "Nitro",
    "Nitro Classic",
    "HypeSquad Events",
    "HypeSquad Bravery",
    "HypeSquad Brilliance",
    "HypeSquad Balance",
    "Desenvolvedor Ativo",
    "Impulso de Servidor",
    "Pomelo",
    "Orb",
    "Bug Hunter Nível 2",
    "Bug Hunter Nível 1",
    "Early Supporter",
    "Missão Completa"
  ];
  
  badges.sort((a, b) => {
    const indexA = badgeOrder.indexOf(a.name);
    const indexB = badgeOrder.indexOf(b.name);
    if (indexA === -1) return 1;
    if (indexB === -1) return -1;
    return indexA - indexB;
  });
  
  // Debug: log das badges detectadas
  console.log("Badges detectadas:", badges.map(b => b.name));
  console.log("Total de badges:", badges.length);

  return (
    <section
      id="discord"
      ref={ref}
      className="py-20 px-4 sm:px-6 lg:px-8 bg-gray-900/50"
    >
      <div className="max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5 }}
          className="text-center mb-8"
        >
          <h2 className="text-4xl md:text-5xl font-bold mb-4">
            <span className="bg-gradient-to-r from-primary-400 to-purple-500 bg-clip-text text-transparent">
              {t("discord_title")}
            </span>
          </h2>
          <div className="w-24 h-1 bg-gradient-to-r from-primary-500 to-purple-500 mx-auto rounded-full" />
          <p className="text-gray-400 mt-4">
            {t("discord_subtitle")}
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="bg-gray-800/50 backdrop-blur-sm rounded-xl border border-gray-700 hover:border-primary-500/50 transition-all overflow-hidden"
        >
          {/* Banner do Discord */}
          {bannerUrl ? (
            <div className="relative w-full h-32 md:h-40 overflow-hidden">
              <Image
                src={bannerUrl}
                alt="Banner"
                fill
                className="object-cover"
                loading="lazy"
                unoptimized
                sizes="100vw"
              />
              {/* Overlay gradiente no banner */}
              <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-gray-800/50" />
              {/* Fade para o card do perfil */}
              <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-b from-transparent to-gray-800/50" />
            </div>
          ) : bannerColor ? (
            <div className="relative w-full h-32 md:h-40">
              <div 
                className="w-full h-full"
                style={{ backgroundColor: bannerColor }}
              />
              {/* Fade para o card do perfil */}
              <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-b from-transparent to-gray-800/50" />
            </div>
          ) : null}
          
          {/* Perfil do Discord */}
          <div className={`flex items-center gap-4 ${bannerUrl || bannerColor ? 'mt-4' : ''} mb-6 pb-6 border-b border-gray-700 px-6 pt-6`}>
            <div className="relative">
              <motion.div
                whileHover={{ scale: 1.05 }}
                transition={{ type: "spring", stiffness: 300 }}
                className="relative w-20 h-20"
              >
                <Image
                  src={avatarUrl}
                  alt={discord_user.username}
                  width={80}
                  height={80}
                  className="rounded-full border-4 border-gray-700"
                  loading="lazy"
                  unoptimized
                />
              </motion.div>
              <div
                className={`absolute bottom-0 right-0 w-6 h-6 ${getStatusColor(
                  discord_status
                )} rounded-full border-4 border-gray-800`}
                title={getStatusText(discord_status)}
                aria-label={`Status: ${getStatusText(discord_status)}`}
                role="status"
              />
            </div>
            <div className="flex-1">
              <div className="mb-1">
                {/* Display Name (nome principal) */}
                <h3 className="text-xl font-semibold text-white">
                  {discord_user.display_name || discord_user.global_name || discord_user.username}
                </h3>
                {/* Username (abaixo do display name) */}
                <div className="flex items-center gap-1 mt-0.5">
                  <span className="text-sm text-gray-400">
                    {discord_user.username}
                  </span>
                  {discord_user.discriminator !== "0" && (
                    <span className="text-sm text-gray-500">#{discord_user.discriminator}</span>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2 mt-1">
                <div
                  className={`w-2 h-2 rounded-full ${getStatusColor(
                    discord_status
                  )}`}
                />
                <span className="text-sm text-gray-400">
                  {getStatusText(discord_status)}
                </span>
              </div>
            </div>
          </div>

          {/* Badges do Discord */}
          {badges.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ delay: 0.25 }}
              className="mb-6 pb-6 border-b border-gray-700 px-6"
            >
              <h4 className="text-sm font-semibold text-gray-400 mb-3 flex items-center gap-2">
                <Award className="w-4 h-4" aria-hidden="true" />
                {t("discord_badges")}
              </h4>
                  <div className="flex flex-wrap gap-2">
                    {badges.map((badge, index) => (
                      <motion.div
                        key={index}
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={inView ? { opacity: 1, scale: 1 } : {}}
                        transition={{ delay: 0.3 + index * 0.05 }}
                        whileHover={{ scale: 1.1, y: -2 }}
                        className="relative group"
                      >
                        {badge.iconUrl ? (
                          <Image
                            src={badge.iconUrl}
                            alt={badge.name}
                            width={24}
                            height={24}
                            className="object-contain cursor-pointer transition-transform focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 focus:ring-offset-gray-800 rounded"
                            loading="lazy"
                            unoptimized
                            tabIndex={0}
                            role="img"
                            aria-label={badge.name}
                          />
                        ) : (
                          badge.icon && (
                            <div 
                              className={`w-6 h-6 flex items-center justify-center ${badge.color} cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 focus:ring-offset-gray-800 rounded`}
                              tabIndex={0}
                              role="img"
                              aria-label={badge.name}
                            >
                              {badge.icon}
                            </div>
                          )
                        )}
                        {/* Tooltip no hover */}
                        <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-1.5 bg-gray-900 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-10 border border-gray-700 shadow-lg">
                          {badge.name}
                          <div className="absolute top-full left-1/2 transform -translate-x-1/2 -mt-1">
                            <div className="border-4 border-transparent border-t-gray-900"></div>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
            </motion.div>
          )}

          {/* Spotify */}
          {spotify && (
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={inView ? { opacity: 1, x: 0 } : {}}
              transition={{ delay: 0.3 }}
              className="mb-6 p-4 bg-gradient-to-r from-green-500/10 to-green-600/10 rounded-lg border border-green-500/20 mx-6"
            >
              {/* Componente Spotify Timer */}
              {(() => {
                const SpotifyTimer = () => {
                  const [currentTime, setCurrentTime] = useState(0);
                  const [totalDuration, setTotalDuration] = useState(0);

                  useEffect(() => {
                    const updateTime = () => {
                      const now = Date.now();
                      const elapsed = Math.floor((now - spotify.timestamps.start) / 1000);
                      const duration = Math.floor((spotify.timestamps.end - spotify.timestamps.start) / 1000);
                      
                      setCurrentTime(Math.max(0, elapsed));
                      setTotalDuration(Math.max(1, duration));
                    };

                    // Atualizar imediatamente
                    updateTime();
                    
                    // Atualizar a cada segundo
                    const interval = setInterval(updateTime, 1000);

                    return () => clearInterval(interval);
                  }, [spotify.timestamps]);

                  const progress = totalDuration > 0 ? (currentTime / totalDuration) * 100 : 0;
                  const remaining = Math.max(0, totalDuration - currentTime);

                  return (
                    <div className="flex items-center gap-3">
                      {spotify.album_art_url && (
                        <Image
                          src={spotify.album_art_url}
                          alt={spotify.album}
                          width={64}
                          height={64}
                          className="rounded-lg flex-shrink-0"
                          loading="lazy"
                          unoptimized
                        />
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2">
                          <Music className="w-4 h-4 text-green-400" aria-hidden="true" />
                        <span className="text-xs text-green-400 font-semibold">
                          {t("discord_listening_spotify")}
                        </span>
                        </div>
                        <p className="text-white font-semibold truncate mb-1">
                          {spotify.song}
                        </p>
                        <p className="text-sm text-gray-400 truncate mb-2">
                          {spotify.artist}
                        </p>
                        
                        {/* Barra de progresso */}
                        <div className="mb-1">
                          <div className="w-full h-1 bg-gray-700/50 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-green-500 transition-all duration-1000 ease-linear"
                              style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
                            />
                          </div>
                        </div>
                        
                        {/* Timer */}
                        <div className="flex items-center justify-between text-xs text-gray-400">
                          <span>{formatMusicTime(currentTime)}</span>
                          <span>-{formatMusicTime(remaining)}</span>
                        </div>
                      </div>
                    </div>
                  );
                };

                return <SpotifyTimer />;
              })()}
            </motion.div>
          )}

          {/* Atividades */}
          {activities && activities.length > 0 ? (
            <div className="space-y-4 px-6 pb-6">
              <h4 className="text-lg font-semibold text-white flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-primary-400" aria-hidden="true" />
                {t("discord_activities")}
              </h4>
              {activities
                .filter((activity) => activity.type !== 4) // Filtrar atividades customizadas
                .filter((activity) => {
                  // Remover Spotify da lista de atividades (já tem card dedicado)
                  const activityName = activity.name?.toLowerCase() || '';
                  return !activityName.includes('spotify');
                })
                .map((activity, index) => {
                  // Componente para timer em tempo real
                  const ActivityTimer = ({ startTimestamp }: { startTimestamp: number }) => {
                    const [elapsedTime, setElapsedTime] = useState(formatElapsedTime(startTimestamp));

                    useEffect(() => {
                      // Atualizar imediatamente
                      setElapsedTime(formatElapsedTime(startTimestamp));
                      
                      // Atualizar a cada segundo
                      const interval = setInterval(() => {
                        setElapsedTime(formatElapsedTime(startTimestamp));
                      }, 1000);

                      return () => clearInterval(interval);
                    }, [startTimestamp]);

                    return (
                      <div className="flex items-center gap-1 mt-2 text-xs text-gray-500">
                        <Clock className="w-3 h-3" aria-hidden="true" />
                        <span>{t("discord_ago")} {elapsedTime}</span>
                      </div>
                    );
                  };

                  // Componente para exibir a imagem da atividade
                  const ActivityImage = () => {
                    const [imageUrls, setImageUrls] = useState<string[]>([]);
                    const [currentUrlIndex, setCurrentUrlIndex] = useState(0);
                    const [showFallback, setShowFallback] = useState(false);
                    const [imageError, setImageError] = useState(false);

                    useEffect(() => {
                      const urls = getActivityImageUrls(activity);
                      setImageUrls(urls);
                      setCurrentUrlIndex(0);
                      setShowFallback(false);
                      setImageError(false);
                      // eslint-disable-next-line react-hooks/exhaustive-deps
                    }, [activity.assets?.large_image, activity.application_id]);

                    const handleImageError = () => {
                      if (currentUrlIndex < imageUrls.length - 1) {
                        setCurrentUrlIndex(currentUrlIndex + 1);
                        setImageError(false);
                      } else {
                        setShowFallback(true);
                        setImageError(true);
                      }
                    };

                    if (showFallback || imageUrls.length === 0 || imageError) {
                      return (
                        <div className="w-20 h-20 bg-gray-700 rounded-lg flex items-center justify-center flex-shrink-0">
                          <div className="text-primary-400">
                            {getActivityIcon(activity)}
                          </div>
                        </div>
                      );
                    }

                    return (
                      <div className="relative w-20 h-20">
                        <Image
                          src={imageUrls[currentUrlIndex]}
                          alt={activity.name}
                          fill
                          className="rounded-lg object-cover flex-shrink-0"
                          loading="lazy"
                          unoptimized
                          sizes="80px"
                          onError={handleImageError}
                        />
                      </div>
                    );
                  };

                  return (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, x: -20 }}
                      animate={inView ? { opacity: 1, x: 0 } : {}}
                      transition={{ delay: 0.4 + index * 0.1 }}
                      className="p-4 bg-gray-700/30 rounded-lg border border-gray-600/50"
                    >
                      <div className="flex items-start gap-4">
                        {/* Imagem grande da atividade */}
                        <ActivityImage />
                        
                        {/* Conteúdo da atividade */}
                        <div className="flex-1 min-w-0">
                          <div className="mb-1.5">
                            <span className="text-xs text-gray-400 uppercase tracking-wide">
                              {getActivityType(activity.type)}
                            </span>
                          </div>
                          <p className="text-white font-semibold text-lg mb-1.5">
                            {activity.name}
                          </p>
                          {activity.details && (
                            <p className="text-sm text-gray-300 mb-1">
                              {activity.details}
                            </p>
                          )}
                          {activity.state && (
                            <p className="text-sm text-gray-400 mb-1.5">
                              {activity.state}
                            </p>
                          )}
                          {activity.timestamps?.start && (
                            <ActivityTimer startTimestamp={activity.timestamps.start} />
                          )}
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
            </div>
          ) : (
            <div className="text-center py-8 px-6">
              <Code className="w-12 h-12 text-gray-600 mx-auto mb-3" aria-hidden="true" />
              <p className="text-gray-400">
                {t("discord_no_activities")}
              </p>
            </div>
          )}
        </motion.div>
      </div>
    </section>
  );
}


