"use client";

import { motion } from "framer-motion";
import { useInView } from "react-intersection-observer";
import { useState, useMemo } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import Image from "next/image";
import { ExternalLink, Shield, Users, Heart, History, Wrench } from "lucide-react";

interface DiscordServer {
  name: string;
  invite: string;
  icon: string;
  description: string;
  verified?: boolean;
}

function DiscordServers() {
  const { t, language } = useLanguage();
  const [ref, inView] = useInView({
    triggerOnce: true,
    threshold: 0.1,
  });

  const [activeTab, setActiveTab] = useState<"community" | "ecosystem" | "friends" | "previous">("community");

  const communityServers = useMemo(() => {
    return [
      {
        name: "It's a Trap",
        invite: "https://discord.gg/itsatrap",
        icon: "https://cdn.discordapp.com/icons/801894798641332254/cc0d783d32a81c548e26c8b3049c7ac3.png?size=2048",
        description: t("discord_servers_itsatrap_desc"),
        verified: true,
      },
      {
        name: "Viggle",
        invite: "https://discord.gg/vigle",
        icon: "https://cdn.discordapp.com/icons/1181076253172842537/131ad9e0f231d38d30fff2d7c80e2ce8.png?size=80&quality=lossless",
        description: t("discord_servers_viggle_desc"),
        verified: true,
      },
    ];
  }, [t, language]);

  const ecosystemServers = useMemo(() => {
    return [
      {
        name: "Discord Admins",
        invite: "https://support.discord.com/hc/en-us/articles/5309276245271-Discord-Admin-FAQ",
        icon: "https://cdn.discordapp.com/icons/942897714956472401/9acee431859aa6076cba3d71fb156f1c.png?size=80&quality=lossless",
        description: t("discord_servers_admins_desc"),
        verified: true,
      },
    ];
  }, [t, language]);

  const friendsServers = useMemo(() => {
    return [
      {
        name: "(VoiD) Meu Servidor de Amigos",
        invite: "https://discord.gg/AESBEcNSrV",
        icon: "https://cdn.discordapp.com/icons/1369237478682267690/bdd3e9e3ed0f66491a2b64cb9b5b280d.png?size=2048",
        description: t("discord_servers_friends_desc"),
        verified: false,
      },
    ];
  }, [t, language]);

  const verifiedIcon = "https://cdn.discordapp.com/emojis/960580118827389028.webp?size=96";

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
    hidden: { opacity: 0, y: 30, scale: 0.9 },
    visible: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: {
        duration: 0.5,
        type: "spring",
        stiffness: 100,
      },
    },
  };

  const getCurrentServers = () => {
    switch (activeTab) {
      case "community":
        return communityServers;
      case "ecosystem":
        return ecosystemServers;
      case "friends":
        return friendsServers;
      case "previous":
        return [];
      default:
        return communityServers;
    }
  };

  const currentServers = getCurrentServers();

  return (
    <section
      id="discord-servers"
      ref={ref}
      className="py-20 px-4 sm:px-6 lg:px-8 bg-gray-900/50"
    >
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5 }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl md:text-5xl font-bold mb-4">
            <span className="bg-gradient-to-r from-primary-400 to-purple-500 bg-clip-text text-transparent">
              {t("discord_servers_title")}
            </span>
          </h2>
          <div className="w-24 h-1 bg-gradient-to-r from-primary-500 to-purple-500 mx-auto rounded-full" />
          <p className="text-gray-400 mt-4">
            {t("discord_servers_subtitle")}
          </p>
        </motion.div>

        {/* Tabs */}
        <div className="flex justify-center mb-8 gap-4 flex-wrap">
          <button
            onClick={() => setActiveTab("community")}
            className={`px-6 py-3 rounded-lg font-semibold transition-all ${
              activeTab === "community"
                ? "bg-primary-500 text-white shadow-lg shadow-primary-500/50"
                : "bg-gray-800 text-gray-400 hover:bg-gray-700 hover:text-gray-300"
            }`}
          >
            <div className="flex items-center gap-2">
              <Shield className="w-5 h-5" />
              {t("discord_servers_tab_community")}
            </div>
          </button>
          <button
            onClick={() => setActiveTab("ecosystem")}
            className={`px-6 py-3 rounded-lg font-semibold transition-all ${
              activeTab === "ecosystem"
                ? "bg-primary-500 text-white shadow-lg shadow-primary-500/50"
                : "bg-gray-800 text-gray-400 hover:bg-gray-700 hover:text-gray-300"
            }`}
          >
            <div className="flex items-center gap-2">
              <Users className="w-5 h-5" />
              {t("discord_servers_tab_ecosystem")}
            </div>
          </button>
          <button
            onClick={() => setActiveTab("friends")}
            className={`px-6 py-3 rounded-lg font-semibold transition-all ${
              activeTab === "friends"
                ? "bg-primary-500 text-white shadow-lg shadow-primary-500/50"
                : "bg-gray-800 text-gray-400 hover:bg-gray-700 hover:text-gray-300"
            }`}
          >
            <div className="flex items-center gap-2">
              <Heart className="w-5 h-5" />
              {t("discord_servers_tab_friends")}
            </div>
          </button>
          <button
            onClick={() => setActiveTab("previous")}
            className={`px-6 py-3 rounded-lg font-semibold transition-all ${
              activeTab === "previous"
                ? "bg-primary-500 text-white shadow-lg shadow-primary-500/50"
                : "bg-gray-800 text-gray-400 hover:bg-gray-700 hover:text-gray-300"
            }`}
          >
            <div className="flex items-center gap-2">
              <History className="w-5 h-5" />
              {t("discord_servers_tab_previous")}
            </div>
          </button>
        </div>

        {/* Server Cards or Construction Message */}
        {activeTab === "previous" ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.5 }}
            className="max-w-2xl mx-auto"
          >
            <div className="bg-gradient-to-br from-gray-800/80 to-gray-900/80 backdrop-blur-sm p-12 rounded-2xl border border-gray-700/50 shadow-2xl relative overflow-hidden">
              {/* Background decoration */}
              <div className="absolute inset-0 bg-gradient-to-br from-primary-500/5 via-purple-500/5 to-transparent" />
              <div className="absolute top-0 right-0 w-64 h-64 bg-primary-500/10 rounded-full blur-3xl" />
              <div className="absolute bottom-0 left-0 w-64 h-64 bg-purple-500/10 rounded-full blur-3xl" />
              
              <div className="relative z-10 text-center">
                <motion.div
                  animate={{
                    rotate: [0, 10, -10, 0],
                    scale: [1, 1.1, 1],
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    repeatType: "reverse",
                    ease: "easeInOut",
                  }}
                  className="inline-block mb-6"
                >
                  <Wrench className="w-20 h-20 text-primary-400 mx-auto" />
                </motion.div>
                
                <h3 className="text-3xl font-bold mb-4 bg-gradient-to-r from-primary-400 to-purple-500 bg-clip-text text-transparent">
                  {t("discord_servers_previous_construction")}
                </h3>
                
                <p className="text-gray-300 text-lg leading-relaxed">
                  {t("discord_servers_previous_construction_desc")}
                </p>
                
                {/* Animated dots */}
                <div className="flex justify-center gap-2 mt-8">
                  {[0, 1, 2].map((i) => (
                    <motion.div
                      key={i}
                      className="w-3 h-3 rounded-full bg-primary-500"
                      animate={{
                        scale: [1, 1.5, 1],
                        opacity: [0.5, 1, 0.5],
                      }}
                      transition={{
                        duration: 1.5,
                        repeat: Infinity,
                        delay: i * 0.2,
                        ease: "easeInOut",
                      }}
                    />
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        ) : (
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate={inView ? "visible" : "hidden"}
            className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto"
          >
            {currentServers.map((server) => (
              <motion.a
                key={server.name}
                href={server.invite}
                target="_blank"
                rel="noopener noreferrer"
                variants={itemVariants}
                whileHover={{ y: -10, scale: 1.03 }}
                className="bg-gray-800/50 backdrop-blur-sm p-6 rounded-xl border border-gray-700 hover:border-primary-500/50 hover:shadow-xl hover:shadow-primary-500/20 card-hover transition-all group relative"
              >
                {/* Verified Badge */}
                {server.verified && (
                  <div className="absolute top-4 right-4 z-10">
                    <Image
                      src={verifiedIcon}
                      alt="Verified"
                      width={24}
                      height={24}
                      className="w-6 h-6"
                      unoptimized
                    />
                  </div>
                )}

                {/* Server Icon */}
                <div className="flex items-center gap-4 mb-4">
                  <div className="relative flex-shrink-0">
                    <Image
                      src={server.icon}
                      alt={server.name}
                      width={64}
                      height={64}
                      className="rounded-full"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-xl font-semibold text-white group-hover:text-primary-400 transition-colors truncate">
                      {server.name}
                    </h3>
                  </div>
                </div>

                {/* Description */}
                <p className="text-gray-400 text-sm mb-4 line-clamp-2">
                  {server.description}
                </p>

                {/* Link */}
                <div className="flex items-center gap-2 text-primary-400 group-hover:text-primary-300 transition-colors">
                  <span className="text-sm font-medium">{t("discord_servers_join")}</span>
                  <ExternalLink className="w-4 h-4" />
                </div>
              </motion.a>
            ))}
          </motion.div>
        )}
      </div>
    </section>
  );
}

export default DiscordServers;

