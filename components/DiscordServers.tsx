"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useInView } from "react-intersection-observer";
import { useEffect, useMemo, useState } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import Image from "next/image";
import { ExternalLink, Shield, Users, Heart, History, Wrench } from "lucide-react";

interface DiscordServer {
  name: string;
  invite: string;
  icon: string;
  description: string;
  verified?: boolean;
  roleLabel?: string;
}

function DiscordServers() {
  const { t, language } = useLanguage();
  const [ref, inView] = useInView({
    triggerOnce: true,
    threshold: 0.1,
  });

  const [activeTab, setActiveTab] = useState<"community" | "ecosystem" | "friends" | "previous">("community");
  const [currentIndex, setCurrentIndex] = useState(0);
  const [paused, setPaused] = useState(false);

  const tabOrder: Array<"community" | "ecosystem" | "friends" | "previous"> = [
    "community",
    "ecosystem",
    "friends",
    "previous",
  ];

  const communityServers = useMemo(() => {
    return [
      {
        name: "It's a Trap",
        invite: "https://discord.gg/itsatrap",
        icon: "https://cdn.discordapp.com/icons/801894798641332254/37178bd94f9e910c67bd6be6e5d177de.png?size=2048",
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
      {
        name: "Chiliz",
        invite: "https://discord.gg/chiliz",
        icon: "https://cdn.discordapp.com/icons/841972703651954688/f09113c6b772b01698cb9b82aae588e0.png?size=4096",
        description: t("discord_servers_chiliz_desc"),
        verified: false,
      },
      {
        name: "Community Org Dev",
        invite: "https://discord.gg/y2HQcNT3Bv",
        icon: "https://cdn.discordapp.com/icons/1422325011359858813/3c7cda9bd47113f8fe821d6b28d7e2c4.png?size=2048",
        description: t("discord_servers_communityorg_dev_desc"),
        verified: false,
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
        name: "VoiD",
        invite: "https://discord.gg/AESBEcNSrV",
        icon: "https://cdn.discordapp.com/icons/1369237478682267690/71e98a7dec116445fa6550129d136d3f.png?size=600",
        description: t("discord_servers_friends_desc"),
        verified: false,
      },
    ];
  }, [t, language]);

  const previousServers = useMemo(() => {
    return [
      {
        name: "Servidor do Goularte",
        invite: "https://discord.gg/gou",
        icon: "https://cdn.discordapp.com/icons/311627659828527104/a_ef951d646f2f5c3112de4f8c7102a9c3.png?size=600",
        description: t("discord_servers_gou_desc"),
        verified: true,
      },
      {
        name: "Belugang",
        invite: "https://discord.gg/beluga",
        icon: "https://cdn.discordapp.com/avatars/846497753009356800/42a9670cd905cd4c9ebc248f0cdffb1d.webp?size=600",
        description: t("discord_servers_belugang_desc"),
        verified: true,
      },
      {
        name: "Celestrial Boundaries",
        invite: "https://discord.gg/celestrials",
        icon: "https://cdn.discordapp.com/icons/786437953299021844/6e85c41ef8e2ed9e2b7f3e740b11e59c.webp?size=600",
        description: t("discord_servers_celestrial_desc"),
        verified: false,
      },
      {
        name: "LEAGUE of Hu3BR",
        invite: "https://discord.gg/",
        icon: "https://cdn.discordapp.com/icons/524951730534744076/a_2a9733ff86865b29568f6b67c4fbc6e6.png?size=600",
        description: t("discord_servers_leaguehu3br_desc"),
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
        return previousServers;
      default:
        return communityServers;
    }
  };

  const currentServers = getCurrentServers();
  const activeServer = currentServers[currentIndex] ?? currentServers[0];

  // Reset ao trocar de aba
  useEffect(() => {
    setCurrentIndex(0);
  }, [activeTab]);

  // Auto-rotacionar servidores (pausa no hover). Ao chegar no fim, troca para a próxima aba.
  useEffect(() => {
    if (!inView) return;
    if (paused) return;
    const intervalMs = 6500;

    const id = setInterval(() => {
      if (currentServers.length <= 1) {
        // Sem itens suficientes para carrossel, avança a aba mesmo assim
        const nextTab =
          tabOrder[(tabOrder.indexOf(activeTab) + 1) % tabOrder.length] ?? "community";
        setActiveTab(nextTab);
        return;
      }

      setCurrentIndex((prev) => {
        const isLast = prev >= currentServers.length - 1;
        if (isLast) {
          const nextTab =
            tabOrder[(tabOrder.indexOf(activeTab) + 1) % tabOrder.length] ?? "community";
          setActiveTab(nextTab);
          return 0;
        }
        return prev + 1;
      });
    }, intervalMs);

    return () => clearInterval(id);
  }, [inView, paused, activeTab, currentServers.length, tabOrder]);

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
          <h2 className="text-4xl md:text-5xl font-bold mb-4 text-white">
            {t("discord_servers_title")}
          </h2>
          <div className="w-24 h-1 bg-white/20 mx-auto rounded-full" />
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
                ? "bg-white/10 text-white shadow-lg shadow-white/10 border border-white/10"
                : "bg-white/5 text-gray-300 hover:bg-white/10 hover:text-white border border-white/10"
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
                ? "bg-white/10 text-white shadow-lg shadow-white/10 border border-white/10"
                : "bg-white/5 text-gray-300 hover:bg-white/10 hover:text-white border border-white/10"
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
                ? "bg-white/10 text-white shadow-lg shadow-white/10 border border-white/10"
                : "bg-white/5 text-gray-300 hover:bg-white/10 hover:text-white border border-white/10"
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
                ? "bg-white/10 text-white shadow-lg shadow-white/10 border border-white/10"
                : "bg-white/5 text-gray-300 hover:bg-white/10 hover:text-white border border-white/10"
            }`}
          >
            <div className="flex items-center gap-2">
              <History className="w-5 h-5" />
              {t("discord_servers_tab_previous")}
            </div>
          </button>
        </div>

        {/* Server Cards or Construction Message */}
        {activeTab === "previous" && previousServers.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.5 }}
            className="max-w-2xl mx-auto"
          >
            <div className="bg-gray-900/80 backdrop-blur-sm p-12 rounded-2xl border border-gray-700/50 shadow-2xl relative overflow-hidden">
              {/* Background decoration */}
              <div className="absolute inset-0 bg-gray-900/40" />
              <div className="absolute top-0 right-0 w-64 h-64 bg-white/6 rounded-full blur-3xl" />
              <div className="absolute bottom-0 left-0 w-64 h-64 bg-white/4 rounded-full blur-3xl" />
              
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
                  <Wrench className="w-20 h-20 text-gray-200 mx-auto" />
                </motion.div>
                
                <h3 className="text-3xl font-bold mb-4 text-white">{t("discord_servers_previous_construction")}</h3>
                
                <p className="text-gray-300 text-lg leading-relaxed">
                  {t("discord_servers_previous_construction_desc")}
                </p>
                
                {/* Animated dots */}
                <div className="flex justify-center gap-2 mt-8">
                  {[0, 1, 2].map((i) => (
                    <motion.div
                      key={i}
                      className="w-3 h-3 rounded-full bg-white/30"
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
          <div
            className="max-w-3xl mx-auto"
            onMouseEnter={() => setPaused(true)}
            onMouseLeave={() => setPaused(false)}
          >
            <AnimatePresence mode="wait">
              {activeServer && (
                <motion.a
                  key={`${activeTab}-${activeServer.name}`}
                  href={activeServer.invite}
                  target="_blank"
                  rel="noopener noreferrer"
                  initial={{ opacity: 0, x: 24, scale: 0.98 }}
                  animate={{ opacity: 1, x: 0, scale: 1 }}
                  exit={{ opacity: 0, x: -24, scale: 0.98 }}
                  transition={{ duration: 0.45, type: "spring", stiffness: 120, damping: 18 }}
                  whileHover={{ y: -8 }}
                  className="bg-gray-800/50 backdrop-blur-sm p-6 md:p-8 rounded-2xl border border-white/10 hover:border-white/20 hover:shadow-2xl hover:shadow-white/10 transition-all group relative block"
                >
                  {/* Verified Badge */}
                  {activeServer.verified && (
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
                        src={activeServer.icon}
                        alt={activeServer.name}
                        width={72}
                        height={72}
                        className="rounded-full"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-2xl font-semibold text-white group-hover:text-gray-200 transition-colors truncate">
                        {activeServer.name}
                      </h3>
                      <p className="text-sm text-gray-500 mt-1">
                        {activeTab === "community"
                          ? t("discord_servers_tab_community")
                          : activeTab === "ecosystem"
                            ? t("discord_servers_tab_ecosystem")
                            : activeTab === "friends"
                              ? t("discord_servers_tab_friends")
                              : t("discord_servers_tab_previous")}
                      </p>
                    </div>
                  </div>

                  {/* Description */}
                  <p className="text-gray-300 text-sm md:text-base mb-5 leading-relaxed">
                    {activeServer.description}
                  </p>

                  {/* Link */}
                  <div className="flex items-center gap-2 text-gray-200 group-hover:text-white transition-colors">
                    <span className="text-sm font-medium">{t("discord_servers_join")}</span>
                    <ExternalLink className="w-4 h-4" />
                  </div>
                </motion.a>
              )}
            </AnimatePresence>

            {/* Dots / controle */}
            {currentServers.length > 1 && (
              <div className="flex items-center justify-center gap-2 mt-5">
                {currentServers.map((_, i) => (
                  <button
                    key={`dot-${activeTab}-${i}`}
                    onClick={() => setCurrentIndex(i)}
                    className={`h-2.5 rounded-full transition-all ${
                      i === currentIndex ? "w-8 bg-white/40" : "w-2.5 bg-white/10 hover:bg-white/20"
                    }`}
                    aria-label={`Ir para servidor ${i + 1}`}
                  />
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </section>
  );
}

export default DiscordServers;

