"use client";

import { motion } from "framer-motion";
import { useInView } from "react-intersection-observer";
import { useEffect, useState, useRef, useMemo } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import Image from "next/image";
import { DISCORD_USER_ID } from "@/lib/config";
import { useLanyardUser } from "@/lib/lanyardClient";
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
  const { t, language } = useLanguage();
  const [ref, inView] = useInView({
    triggerOnce: true,
    threshold: 0.1,
  });

  const { data: discordDataRaw, loading, error: lanyardError } = useLanyardUser(DISCORD_USER_ID);
  const discordData = (discordDataRaw as DiscordData | null) ?? null;
  const error = lanyardError;
  
  // Badges adicionais que n�o s�o detectadas pela API p�blica
  // Defina como true se voc� possui essas badges
  const ADDITIONAL_BADGES = {
    nitro: true,           // Se voc� tem Nitro
    pomelo: true,          // Se voc� tem badge Pomelo
    orb: true,             // Se voc� tem badge Orb
    impulso: true,         // Se voc� est� impulsionando um servidor
    missao: true           // Se voc� completou uma miss�o
  };

  // Removido: polling pr�prio. Agora usamos `useLanyardUser` (um �nico poller compartilhado e paus�vel).

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

  // Fun��o para obter todas as URLs poss�veis da imagem da atividade
  const getActivityImageUrls = (activity: DiscordActivity): string[] => {
    const urls: string[] = [];
    
    const largeImage = activity.assets?.large_image;
    const applicationId = activity.application_id;

    // CASO ESPECIAL: Se n�o tem large_image mas tem application_id (ex: Valorant)
    // Para jogos como Valorant que n�o enviam large_image, tentar buscar o �cone do app
    // Infelizmente, o Discord n�o exp�e o hash do �cone diretamente na API p�blica
    // Vamos tentar alguns formatos conhecidos e usar um servi�o de terceiros como fallback
    if (!largeImage && applicationId) {
      // Tentar formatos conhecidos do Discord (podem n�o funcionar sem o hash correto)
      urls.push(
        `https://cdn.discordapp.com/app-icons/${applicationId}/${applicationId}.png`,
        `https://cdn.discordapp.com/app-icons/${applicationId}/${applicationId}.png?size=512`,
        `https://cdn.discordapp.com/app-icons/${applicationId}/${applicationId}.png?size=1024`,
        `https://cdn.discordapp.com/app-icons/${applicationId}/icon.png`,
        `https://cdn.discordapp.com/app-icons/${applicationId}/icon.png?size=512`,
        `https://cdn.discordapp.com/app-icons/${applicationId}/icon.png?size=1024`,
        `https://cdn.discordapp.com/app-icons/${applicationId}.png`,
        `https://cdn.discordapp.com/app-icons/${applicationId}.png?size=512`,
        `https://cdn.discordapp.com/app-icons/${applicationId}.png?size=1024`,
        // Tentar formato com a_ prefix (animated)
        `https://cdn.discordapp.com/app-icons/${applicationId}/a_${applicationId}.png`,
        `https://cdn.discordapp.com/app-icons/${applicationId}/a_${applicationId}.gif`,
        // Tentar servi�o de terceiros que mapeia application_id para �cones
        `https://discord.com/api/v9/applications/${applicationId}/icon`,
        `https://discord.com/api/v9/applications/${applicationId}/icon.png`
      );
      
      // Se nenhuma URL funcionar, o componente mostrar� o fallback (�cone gen�rico)
      return urls;
    }

    if (!largeImage) {
      return urls;
    }

    // PRIORIDADE 1: Se a imagem come�a com "mp:", � uma URL externa (PreMiD, etc.)
    // IMPORTANTE: URLs mp: n�o devem ser usadas no Discord CDN, precisam ser decodificadas primeiro
    if (largeImage && largeImage.startsWith("mp:")) {
      const match = largeImage.match(/mp:external\/(.+)/);
      if (match) {
        const urlPart = match[1];
        
        // Se cont�m "https/" ou "http/", extrair a parte ap�s isso
        const httpsMatch = urlPart.match(/(?:https|http)\/(.+)/);
        if (httpsMatch) {
          // Decodificar a URL que est� ap�s "https/"
          try {
            const decodedUrl = decodeURIComponent(httpsMatch[1]);
            const finalUrl = decodedUrl.startsWith("http://") || decodedUrl.startsWith("https://")
              ? decodedUrl
              : `https://${decodedUrl}`;
            urls.push(finalUrl);
          } catch {
            // Se falhar na decodifica��o, usar diretamente
            urls.push(`https://${httpsMatch[1]}`);
          }
        } else {
          // Tentar decodificar diretamente
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
      // Retornar apenas URLs externas decodificadas, n�o tentar Discord CDN para mp:
      return urls;
    }

    // PRIORIDADE 2: Se tem application_id, priorizar URLs do CDN do Discord (Rich Presence de jogos)
    // Esta � a forma mais confi�vel para jogos como Valorant, League of Legends, etc.
    // IMPORTANTE: S� fazer isso se largeImage N�O come�ar com "mp:" (j� tratado acima)
    if (applicationId && largeImage && !largeImage.startsWith("mp:")) {
      // PRIORIDADE M�XIMA: app-icons primeiro (usado por Valorant e outros jogos para o �cone do app)
      urls.push(
        `https://cdn.discordapp.com/app-icons/${applicationId}/${largeImage}.png`,
        `https://cdn.discordapp.com/app-icons/${applicationId}/${largeImage}.png?size=512`,
        `https://cdn.discordapp.com/app-icons/${applicationId}/${largeImage}.png?size=1024`,
        `https://cdn.discordapp.com/app-icons/${applicationId}/${largeImage}.jpg`,
        `https://cdn.discordapp.com/app-icons/${applicationId}/${largeImage}.webp`,
        `https://cdn.discordapp.com/app-icons/${applicationId}/${largeImage}` // Sem extens�o
      );
      
      // Tentar com a_ prefix removido em app-icons (para imagens animadas)
      if (largeImage.startsWith("a_")) {
        const baseImage = largeImage.substring(2);
        urls.push(
          `https://cdn.discordapp.com/app-icons/${applicationId}/${baseImage}.png`,
          `https://cdn.discordapp.com/app-icons/${applicationId}/${baseImage}.png?size=512`,
          `https://cdn.discordapp.com/app-icons/${applicationId}/${baseImage}.png?size=1024`
        );
      }
      
      // Formato padr�o do Discord Rich Presence (app-assets para imagens grandes)
      urls.push(
        `https://cdn.discordapp.com/app-assets/${applicationId}/${largeImage}.png`,
        `https://cdn.discordapp.com/app-assets/${applicationId}/${largeImage}.png?size=512`,
        `https://cdn.discordapp.com/app-assets/${applicationId}/${largeImage}.png?size=1024`
      );
      
      // Tentar outros formatos em app-assets
      urls.push(
        `https://cdn.discordapp.com/app-assets/${applicationId}/${largeImage}.jpg`,
        `https://cdn.discordapp.com/app-assets/${applicationId}/${largeImage}.webp`,
        `https://cdn.discordapp.com/app-assets/${applicationId}/${largeImage}.gif`,
        `https://cdn.discordapp.com/app-assets/${applicationId}/${largeImage}` // Sem extens�o
      );
      
      // Tentar com a_ prefix (animated) em app-assets
      if (largeImage.startsWith("a_")) {
        const baseImage = largeImage.substring(2);
        urls.push(
          `https://cdn.discordapp.com/app-assets/${applicationId}/${baseImage}.png`,
          `https://cdn.discordapp.com/app-assets/${applicationId}/${baseImage}.gif`
        );
      }
    }

    return urls;
  };

  // Fun��o para obter URL da imagem da atividade (mantida para compatibilidade)
  const getActivityImageUrl = (activity: DiscordActivity): string | null => {
    const urls = getActivityImageUrls(activity);
    return urls.length > 0 ? urls[0] : null;
  };

  // Fun��o para obter URL da imagem pequena da atividade
  const getActivitySmallImageUrl = (activity: DiscordActivity): string | null => {
    if (!activity.assets?.small_image) {
      return null;
    }

    const smallImage = activity.assets.small_image;
    const applicationId = activity.application_id;

    // PRIORIDADE 1: Se a imagem come�a com "mp:", � uma URL externa (PreMiD, etc.)
    // IMPORTANTE: URLs mp: n�o devem ser usadas no Discord CDN
    if (smallImage && smallImage.startsWith("mp:")) {
      const match = smallImage.match(/mp:external\/(.+)/);
      if (match) {
        const urlPart = match[1];
        
        const httpsMatch = urlPart.match(/(?:https|http)\/(.+)/);
        if (httpsMatch) {
          // Decodificar a URL que est� ap�s "https/"
          try {
            const decodedUrl = decodeURIComponent(httpsMatch[1]);
            return decodedUrl.startsWith("http://") || decodedUrl.startsWith("https://")
              ? decodedUrl
              : `https://${decodedUrl}`;
          } catch {
            return `https://${httpsMatch[1]}`;
          }
        }
        
        // Tentar decodificar diretamente
        try {
          const decodedUrl = decodeURIComponent(urlPart);
          if (decodedUrl.startsWith("http://") || decodedUrl.startsWith("https://")) {
            return decodedUrl;
          } else if (decodedUrl.startsWith("//")) {
            return `https:${decodedUrl}`;
          } else {
            return `https://${decodedUrl}`;
          }
        } catch {
          if (urlPart.startsWith("http://") || urlPart.startsWith("https://")) {
            return urlPart;
          } else {
            return `https://${urlPart}`;
          }
        }
      }
      // Retornar null se n�o conseguir decodificar
      return null;
    }

    // PRIORIDADE 2: Se tem application_id e smallImage N�O come�a com "mp:", usar CDN do Discord
    if (applicationId && smallImage && !smallImage.startsWith("mp:")) {
      return `https://cdn.discordapp.com/app-assets/${applicationId}/${smallImage}.png`;
    }

    return null;
  };

  const getActivityIcon = (activity: DiscordActivity) => {
    if (activity.name.toLowerCase().includes("spotify")) {
      return <Music className="w-5 h-5" />;
    }
    
    switch (activity.type) {
      case 0: // Playing
      case 5: // Competing
        return <Gamepad2 className="w-5 h-5" />; // Gamepad apenas para jogando
      case 1: // Streaming
        return <Code className="w-5 h-5" />; // Code para streaming
      case 2: // Listening
        return <Music className="w-5 h-5" />;
      case 3: // Watching - n�o mostrar �cone
        return null;
      default:
        return <Code className="w-5 h-5" />;
    }
  };

  // Fun��o para formatar tempo decorrido em horas, minutos e segundos
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

  // Fun��o para formatar tempo em minutos e segundos (para m�sica)
  const formatMusicTime = (seconds: number): string => {
    // Garante que o valor seja sempre não-negativo e válido
    const safeSeconds = Math.max(0, Math.floor(seconds || 0));
    const mins = Math.floor(safeSeconds / 60);
    const secs = safeSeconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Fun��o para calcular a data de cria��o da conta Discord a partir do ID (snowflake)
  const getAccountCreationDate = (userId: string): Date => {
    // Discord epoch: 2015-01-01 00:00:00 UTC
    const DISCORD_EPOCH = 1420070400000;
    // Snowflake cont�m timestamp: (id >> 22) + epoch
    const id = BigInt(userId);
    const timestamp = Number(id >> BigInt(22)) + DISCORD_EPOCH;
    return new Date(timestamp);
  };

  // Fun��o para formatar a data de cria��o
  const formatCreationDate = (date: Date): string => {
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    const diffMonths = Math.floor(diffDays / 30);
    const diffYears = Math.floor(diffDays / 365);

    if (diffYears > 0) {
      return `${diffYears} ${diffYears === 1 ? t('discord_account_age_year') : t('discord_account_age_years')}`;
    } else if (diffMonths > 0) {
      return `${diffMonths} ${diffMonths === 1 ? t('discord_account_age_month') : t('discord_account_age_months')}`;
    } else {
      return `${diffDays} ${diffDays === 1 ? t('discord_account_age_day') : t('discord_account_age_days')}`;
    }
  };

  const getBadges = (
    flags?: number, 
    premiumType?: number, 
    kv?: { [key: string]: any },
    avatarDecoration?: any,
    primaryGuild?: { badge?: string | null; tag?: string | null }
  ): Badge[] => {
    const badges: Badge[] = [];
    
    // Debug removido para evitar logs excessivos
    
    // Discord Staff (1)
    if (flags && flags & 1) {
      badges.push({
        name: "Funcion�rio do Discord",
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
        name: "Bug Hunter N�vel 1",
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
        name: "Bug Hunter N�vel 2",
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
          icon: <Circle className="w-3 h-3" />,
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
      } else if (badgeName.includes("mission") || badgeName.includes("Miss�o")) {
        badges.push({
          name: "Miss�o Completa",
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
        icon: <Circle className="w-3 h-3" />,
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
    
    // Miss�o Completa - verificar em kv
    if (kv && (kv.mission_complete || kv.mission || kv.completed_mission)) {
      badges.push({
        name: "Miss�o Completa",
        iconUrl: "https://raw.githubusercontent.com/mezotv/discord-badges/main/assets/quest.png",
        icon: <Target className="w-4 h-4" />,
        color: "text-yellow-400",
        bgColor: "bg-yellow-500/20 border-yellow-500/50"
      });
    }
    
    // Ordenar badges por import�ncia
    const badgeOrder = [
      "Funcion�rio do Discord",
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
      "Miss�o Completa",
      "Orb",
      "Bug Hunter N�vel 2",
      "Bug Hunter N�vel 1",
      "Early Supporter"
    ];
    
    return badges.sort((a, b) => {
      const indexA = badgeOrder.indexOf(a.name);
      const indexB = badgeOrder.indexOf(b.name);
      if (indexA === -1) return 1;
      if (indexB === -1) return -1;
      return indexA - indexB;
    });
  };

  // Memoizar badges ANTES de qualquer return condicional para evitar erro de hooks React #310
  // Isso garante que o hook seja sempre chamado na mesma ordem em todas as renderiza��es
  const badges = useMemo(() => {
    if (!discordData?.discord_user) {
      return [];
    }
    
    const { discord_user, kv } = discordData;
    const calculatedBadges = getBadges(
      discord_user.public_flags, 
      discord_user.premium_type, 
      kv,
      discord_user.avatar_decoration_data,
      discord_user.primary_guild
    );
    
    // Adicionar badges manuais se configuradas
    if (ADDITIONAL_BADGES.nitro && !calculatedBadges.find(b => b.name === "Nitro" || b.name === "Nitro Classic")) {
      calculatedBadges.push({
        name: "Nitro",
        iconUrl: "https://raw.githubusercontent.com/mezotv/discord-badges/refs/heads/main/assets/subscriptions/badges/diamond.png",
        icon: <Gem className="w-4 h-4" />,
        color: "text-rose-400",
        bgColor: "bg-rose-500/20 border-rose-500/50"
      });
    }
    
    if (ADDITIONAL_BADGES.pomelo && !calculatedBadges.find(b => b.name === "Pomelo")) {
      calculatedBadges.push({
        name: "Pomelo",
        iconUrl: "https://raw.githubusercontent.com/mezotv/discord-badges/main/assets/username.png",
        icon: <Gift className="w-4 h-4" />,
        color: "text-fuchsia-400",
        bgColor: "bg-fuchsia-500/20 border-fuchsia-500/50"
      });
    }
    
    if (ADDITIONAL_BADGES.orb && !calculatedBadges.find(b => b.name === "Orb")) {
      calculatedBadges.push({
        name: "Orb",
        iconUrl: "https://raw.githubusercontent.com/mezotv/discord-badges/main/assets/orb.svg",
        icon: <Circle className="w-3 h-3" />,
        color: "text-cyan-400",
        bgColor: "bg-cyan-500/20 border-cyan-500/50"
      });
    }
    
    if (ADDITIONAL_BADGES.impulso && !calculatedBadges.find(b => b.name === "Impulso de Servidor")) {
      calculatedBadges.push({
        name: "Impulso de Servidor",
        iconUrl: "https://raw.githubusercontent.com/mezotv/discord-badges/main/assets/boosts/discordboost9.svg",
        icon: <Rocket className="w-4 h-4" />,
        color: "text-purple-400",
        bgColor: "bg-purple-500/20 border-purple-500/50"
      });
    }
    
    if (ADDITIONAL_BADGES.missao && !calculatedBadges.find(b => b.name === "Miss�o Completa")) {
      calculatedBadges.push({
        name: "Miss�o Completa",
        iconUrl: "https://raw.githubusercontent.com/mezotv/discord-badges/main/assets/quest.png",
        icon: <Target className="w-4 h-4" />,
        color: "text-yellow-400",
        bgColor: "bg-yellow-500/20 border-yellow-500/50"
      });
    }
    
    // Reordenar badges
    const badgeOrder = [
      "Funcion�rio do Discord",
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
      "Miss�o Completa",
      "Orb",
      "Bug Hunter N�vel 2",
      "Bug Hunter N�vel 1",
      "Early Supporter"
    ];
    
    calculatedBadges.sort((a, b) => {
      const indexA = badgeOrder.indexOf(a.name);
      const indexB = badgeOrder.indexOf(b.name);
      if (indexA === -1) return 1;
      if (indexB === -1) return -1;
      return indexA - indexB;
    });
    // Normalizar cores para tema dark monocromático (sem cores vivas)
    return calculatedBadges.map((b) => ({
      ...b,
      color: "text-gray-200",
      bgColor: "bg-white/10 border-white/10",
    }));
  }, [
    discordData?.discord_user?.public_flags,
    discordData?.discord_user?.premium_type,
    discordData?.kv,
    discordData?.discord_user?.avatar_decoration_data,
    discordData?.discord_user?.primary_guild
  ]);

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
              <Loader2 className="w-8 h-8 text-white/70 animate-spin" aria-label="Carregando perfil do Discord" role="status" />
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
            <h2 className="text-4xl md:text-5xl font-bold mb-4 text-white">{t("discord_title")}</h2>
            <div className="w-24 h-1 bg-white/20 mx-auto rounded-full" />
          </motion.div>
          <div className="bg-gray-800/50 backdrop-blur-sm p-8 rounded-xl border border-gray-700 text-center">
            <p className="text-gray-400">{error || "Perfil n�o dispon�vel"}</p>
            <p className="text-sm text-gray-500 mt-2">
              Configure seu Discord User ID no componente DiscordProfile.tsx
            </p>
          </div>
        </div>
      </section>
    );
  }

  const { discord_user, discord_status, activities = [], spotify, kv } = discordData;
  
  // Avatar do Discord - suporta GIF animado
  const avatarUrl = discord_user.avatar
    ? discord_user.avatar.startsWith("a_")
      ? `https://cdn.discordapp.com/avatars/${discord_user.id}/${discord_user.avatar}.gif?size=256`
      : `https://cdn.discordapp.com/avatars/${discord_user.id}/${discord_user.avatar}.png?size=256`
    : `https://cdn.discordapp.com/embed/avatars/${parseInt(discord_user.discriminator) % 5}.png`;
  
  const isAnimatedAvatar = discord_user.avatar?.startsWith("a_") || false;
  
  // Calcular data de cria��o da conta
  let accountCreationInfo: { formattedDate: string; accountAge: string } | null = null;
  try {
    if (discord_user.id) {
      const creationDate = getAccountCreationDate(discord_user.id);
      const locale = language === 'pt_BR' ? 'pt-BR' : 'en-US';
      const formattedDate = creationDate.toLocaleDateString(locale, {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      });
      const accountAge = formatCreationDate(creationDate);
      accountCreationInfo = { formattedDate, accountAge };
    }
  } catch (error) {
    console.error('Erro ao calcular data de cria��o:', error);
  }
  
  // Componente para avatar GIF animado
  const AnimatedAvatar = () => {
    const imgRef = useRef<HTMLImageElement>(null);
    const baseGifUrl = `https://cdn.discordapp.com/avatars/${discord_user.id}/${discord_user.avatar}.gif?size=256`;
    
    useEffect(() => {
      const img = imgRef.current;
      if (!img) return;
      
      // Recarregar o GIF para for�ar anima��o
      const reloadGif = () => {
        if (img && img.src.includes('.gif')) {
          const baseSrc = img.src.split('?')[0];
          img.src = '';
          setTimeout(() => {
            img.src = `${baseSrc}?size=256&nocache=${Date.now()}`;
          }, 10);
        }
      };
      
      img.addEventListener('load', reloadGif, { once: true });
      const timer = setTimeout(reloadGif, 200);
      
      return () => {
        clearTimeout(timer);
        img.removeEventListener('load', reloadGif);
      };
    }, []);
    
    return (
      <img
        ref={imgRef}
        src={baseGifUrl}
        alt={discord_user.username}
        width={80}
        height={80}
        className="rounded-full border-4 border-gray-700"
        style={{
          display: 'block',
          objectFit: 'cover',
          width: '80px',
          height: '80px'
        }}
        loading="eager"
      />
    );
  };

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
          <h2 className="text-4xl md:text-5xl font-bold mb-4 text-white">
              {t("discord_title")}
          </h2>
          <div className="w-24 h-1 bg-white/20 mx-auto rounded-full" />
          <p className="text-gray-400 mt-4">
            {t("discord_subtitle")}
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          whileHover={{ y: -6, scale: 1.01 }}
          transition={{ duration: 0.5, type: "spring", stiffness: 220, damping: 18 }}
          className="bg-gray-800/50 backdrop-blur-sm rounded-xl border border-white/10 hover:border-white/20 transition-all overflow-hidden"
        >
          {/* Perfil do Discord */}
          <div className="flex items-center gap-4 mb-6 pb-6 border-b border-gray-700 px-6 pt-6">
            <div className="relative">
              <motion.div
                whileHover={{ scale: 1.05 }}
                transition={{ type: "spring", stiffness: 300 }}
                className="relative w-20 h-20"
              >
                {isAnimatedAvatar ? (
                  <AnimatedAvatar key={`avatar-${discord_user.id}-${discord_user.avatar}`} />
                ) : (
                  <Image
                    src={avatarUrl}
                    alt={discord_user.username}
                    width={80}
                    height={80}
                    className="rounded-full border-4 border-gray-700"
                    loading="lazy"
                    unoptimized
                  />
                )}
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
                {/* Data de cria��o da conta */}
                {accountCreationInfo && (
                  <div className="flex items-center gap-1 mt-1">
                    <span className="text-xs text-gray-500">
                      {t('discord_account_created_on')} {accountCreationInfo.formattedDate} ({accountCreationInfo.accountAge} {t('discord_account_age_ago')})
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Badges do Discord */}
          {badges.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.3 }}
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
                        transition={{ duration: 0.3 }}
                        whileHover={{ scale: 1.1, y: -2 }}
                        className="relative group"
                      >
                        {badge.iconUrl ? (
                          <Image
                            src={badge.iconUrl}
                            alt={badge.name}
                            width={24}
                            height={24}
                            className="object-contain cursor-pointer transition-transform focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-black rounded"
                            loading="lazy"
                            unoptimized
                            tabIndex={0}
                            role="img"
                            aria-label={badge.name}
                          />
                        ) : (
                          badge.icon && (
                            <div 
                              className={`w-6 h-6 flex items-center justify-center ${badge.color} cursor-pointer focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-black rounded`}
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
              transition={{ duration: 0.3 }}
              className="mb-6 p-4 bg-white/5 rounded-lg border border-white/10 mx-6"
            >
              {/* Componente Spotify Timer com sincronização robusta */}
              {(() => {
                const SpotifyTimer = () => {
                  const [currentTime, setCurrentTime] = useState(0);
                  const [totalDuration, setTotalDuration] = useState(0);
                  const animationFrameRef = useRef<number | null>(null);

                  useEffect(() => {
                    if (!spotify) {
                      setCurrentTime(0);
                      setTotalDuration(0);
                      if (animationFrameRef.current) {
                        cancelAnimationFrame(animationFrameRef.current);
                        animationFrameRef.current = null;
                      }
                      return;
                    }

                    // Calcula duração total
                    const start = spotify.timestamps.start;
                    const end = spotify.timestamps.end;
                    const duration = Math.max(1, Math.floor((end - start) / 1000));
                    setTotalDuration(duration);

                    // Calcula tempo de forma simples: Date.now() - start_timestamp
                    const updateTime = () => {
                      if (!spotify) return;
                      
                      const now = Date.now();
                      const elapsed = (now - start) / 1000;
                      
                      setCurrentTime(Math.max(0, elapsed));
                      animationFrameRef.current = requestAnimationFrame(updateTime);
                    };

                    // Inicia loop de atualização
                    updateTime();

                    return () => {
                      if (animationFrameRef.current) {
                        cancelAnimationFrame(animationFrameRef.current);
                        animationFrameRef.current = null;
                      }
                    };
                  }, [spotify]);

                  // Usa currentTime real para manter sincronia
                  // Limita apenas para exibição e cálculo de remaining
                  const safeTotalDuration = Math.max(1, totalDuration || 0);
                  const displayTime = Math.max(0, Math.min(currentTime || 0, safeTotalDuration));
                  const progress = safeTotalDuration > 0 ? (displayTime / safeTotalDuration) * 100 : 0;
                  // Garante que remaining nunca seja negativo
                  const remaining = Math.max(0, Math.floor(safeTotalDuration - displayTime));

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
                        <div className="flex flex-col gap-1 mb-2">
                          <div className="flex items-center gap-2">
                          <Music className="w-4 h-4 text-gray-200" aria-hidden="true" />
                        <span className="text-xs text-gray-200 font-semibold">
                          {t("discord_listening_spotify")}
                        </span>
                          </div>
                        </div>
                        <p className="text-white font-semibold truncate mb-1">
                          {spotify.song}
                        </p>
                        <p className="text-sm text-gray-400 truncate mb-2">
                          {spotify.artist}
                        </p>
                        
                        {/* Barra de progresso com animação fluida */}
                        <div className="mb-1">
                          <div className="w-full h-1.5 bg-gray-700/50 rounded-full overflow-hidden">
                            <div
                              className="h-full rounded-full bg-white/40 transition-[width] duration-75 ease-out"
                              style={{ 
                                width: `${Math.min(100, Math.max(0, progress))}%`,
                                willChange: 'width'
                              }}
                            />
                          </div>
                        </div>
                        
                        {/* Timer */}
                        <div className="flex items-center justify-between text-xs text-gray-400">
                          <span>{formatMusicTime(displayTime)}</span>
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
                <Sparkles className="w-5 h-5 text-gray-200" aria-hidden="true" />
                {t("discord_activities")}
              </h4>
              {activities
                .filter((activity) => activity.type !== 4) // Filtrar atividades customizadas
                .filter((activity) => {
                  // Remover Spotify da lista de atividades (j� tem card dedicado)
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
                    const [isLoading, setIsLoading] = useState(true);
                    const [loadedImageUrl, setLoadedImageUrl] = useState<string | null>(null);
                    const prevImageKeyRef = useRef<string>('');

                    useEffect(() => {
                      const urls = getActivityImageUrls(activity);
                      // Filtrar URLs inv�lidas que cont�m "mp:" no meio (n�o devem estar no Discord CDN)
                      const validUrls = urls.filter(url => {
                        // Se a URL cont�m "mp:external" e tamb�m cont�m "discordapp.com", � inv�lida
                        if (url.includes('mp:external') && url.includes('discordapp.com')) {
                          return false;
                        }
                        return true;
                      });
                      
                      const currentImageKey = `${activity.assets?.large_image || 'no-image'}-${activity.application_id || 'no-app-id'}`;
                      
                      // S� resetar se a imagem realmente mudou
                      if (prevImageKeyRef.current !== currentImageKey) {
                        setImageUrls(validUrls);
                        setCurrentUrlIndex(0);
                        setShowFallback(false);
                        setImageError(false);
                        setIsLoading(true);
                        setLoadedImageUrl(null);
                        prevImageKeyRef.current = currentImageKey;
                      }
                      // eslint-disable-next-line react-hooks/exhaustive-deps
                    }, [activity.assets?.large_image, activity.application_id]);

                    const handleImageError = () => {
                      // Se j� temos uma imagem carregada, n�o tentar outras URLs para evitar piscar
                      if (loadedImageUrl) {
                        return;
                      }

                      // Tentar pr�xima URL imediatamente
                      setCurrentUrlIndex((prev) => {
                        if (prev < imageUrls.length - 1) {
                          return prev + 1;
                        } else {
                          setShowFallback(true);
                          setImageError(true);
                          setIsLoading(false);
                          return prev;
                        }
                      });
                      setImageError(false);
                    };

                    const handleImageLoad = () => {
                      // Salvar URL da imagem carregada com sucesso
                      if (imageUrls[currentUrlIndex]) {
                        setLoadedImageUrl(imageUrls[currentUrlIndex]);
                      }
                      
                      // Atualizar estado imediatamente
                      setIsLoading(false);
                      setImageError(false);
                    };

                    // Se todas as URLs falharam ou n�o h� URLs, mostrar fallback com �cone apropriado
                    if (showFallback || imageUrls.length === 0) {
                      const activityIcon = getActivityIcon(activity);
                      // Se n�o h� �cone (ex: watching), n�o mostrar fallback
                      if (!activityIcon) {
                        return null;
                      }
                      return (
                        <div className="w-20 h-20 bg-gray-700 rounded-lg flex items-center justify-center flex-shrink-0">
                          <div className="text-gray-200">
                            {activityIcon}
                          </div>
                        </div>
                      );
                    }

                    // Se j� temos uma imagem carregada e a URL atual � diferente, usar a carregada
                    const imageUrlToUse = loadedImageUrl && loadedImageUrl === imageUrls[currentUrlIndex] 
                      ? loadedImageUrl 
                      : imageUrls[currentUrlIndex];

                    // Se n�o h� URL v�lida, mostrar fallback
                    if (!imageUrlToUse) {
                      const activityIcon = getActivityIcon(activity);
                      // Se n�o h� �cone (ex: watching), n�o mostrar fallback
                      if (!activityIcon) {
                        return null;
                      }
                      return (
                        <div className="w-20 h-20 bg-gray-700 rounded-lg flex items-center justify-center flex-shrink-0">
                          <div className="text-gray-200">
                            {activityIcon}
                          </div>
                        </div>
                      );
                    }

                    return (
                      <div className="relative w-20 h-20">
                        {isLoading && !loadedImageUrl && (
                          <div className="absolute inset-0 bg-gray-700 rounded-lg animate-pulse z-10" />
                        )}
                        <Image
                          key={imageUrlToUse} // Key para for�ar re-render quando URL muda
                          src={imageUrlToUse}
                          alt={activity.name || activity.details || 'Activity'}
                          fill
                          className={`rounded-lg object-cover flex-shrink-0 ${isLoading && !loadedImageUrl ? 'opacity-0' : 'opacity-100'} transition-opacity duration-300`}
                          loading="lazy"
                          unoptimized
                          sizes="80px"
                          onError={handleImageError}
                          onLoad={handleImageLoad}
                          referrerPolicy="no-referrer"
                        />
                      </div>
                    );
                  };

                  return (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, x: -20 }}
                      animate={inView ? { opacity: 1, x: 0 } : {}}
                      transition={{ duration: 0.3 }}
                      className="p-4 bg-gray-700/30 rounded-lg border border-gray-600/50"
                    >
                      <div className="flex items-start gap-4">
                        {/* Imagem grande da atividade */}
                        <ActivityImage />
                        
                        {/* Conte�do da atividade */}
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
                            <p className="text-sm text-gray-400 mb-1.5 font-medium">
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



