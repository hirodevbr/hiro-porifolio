"use client";

import { motion } from "framer-motion";
import { useInView } from "react-intersection-observer";
import { useLanguage } from "@/contexts/LanguageContext";

export default function BugHunter() {
  const { t } = useLanguage();
  const [ref, inView] = useInView({
    triggerOnce: true,
    threshold: 0.1,
  });

  return (
    <section
      id="bug-hunter"
      ref={ref}
      className="py-20 px-4 sm:px-6 lg:px-8 bg-gray-900/70 relative overflow-hidden"
    >
      {/* ruído de fundo sutil */}
      <motion.div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 opacity-20"
        initial={{ opacity: 0 }}
        animate={inView ? { opacity: 0.2 } : {}}
        transition={{ duration: 1 }}
      >
        <div className="w-full h-full bg-[radial-gradient(circle_at_top,_rgba(59,130,246,0.15),_transparent_60%),radial-gradient(circle_at_bottom,_rgba(147,51,234,0.15),_transparent_60%)]" />
      </motion.div>

      <div className="max-w-7xl mx-auto relative z-10">
        {/* título */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5 }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl md:text-5xl font-bold mb-4">
            <span className="bg-gradient-to-r from-primary-400 to-purple-500 bg-clip-text text-transparent">
              {t("bughunter_title")}
            </span>
          </h2>
          <div className="w-24 h-1 bg-gradient-to-r from-primary-500 to-purple-500 mx-auto rounded-full" />
          <p className="text-gray-400 mt-4 max-w-2xl mx-auto">
            {t("bughunter_subtitle")}
          </p>
        </motion.div>

        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* texto */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={inView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.6 }}
            className="space-y-6"
          >
            <div className="inline-flex items-center gap-2 px-4 py-1 rounded-full bg-primary-500/10 border border-primary-500/40 text-primary-300 text-sm font-semibold">
              <span>🐛</span>
              <span>{t("bughunter_chip_label")}</span>
            </div>

            <p className="text-lg text-gray-300 leading-relaxed">
              {t("bughunter_description_1")}
            </p>
            <p className="text-lg text-gray-300 leading-relaxed">
              {t("bughunter_description_2")}
            </p>

            <div className="grid sm:grid-cols-2 gap-4 pt-4">
              <motion.div
                whileHover={{ y: -4, scale: 1.02 }}
                className="bg-gray-800/60 border border-gray-700 rounded-xl p-4"
              >
                <p className="text-sm text-gray-400 mb-1">
                  {t("about_location")}
                </p>
                <p className="text-white font-semibold">
                  {t("about_location_value")}
                </p>
                <p className="text-xs text-gray-500 mt-2">
                  {t("bughunter_status_scanning")}
                </p>
              </motion.div>

              <motion.div
                whileHover={{ y: -4, scale: 1.02 }}
                className="bg-gray-800/60 border border-primary-500/40 rounded-xl p-4"
              >
                <p className="text-sm text-gray-400 mb-1">
                  Discord • Web
                </p>
                <p className="text-white font-semibold">
                  {t("bughunter_status_found")}
                </p>
                <p className="text-xs text-gray-500 mt-2">
                  /reports /logs /fix
                </p>
              </motion.div>
            </div>
          </motion.div>

          {/* card com animação de glitch e inseto */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={inView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.6 }}
            className="relative"
          >
            <div className="relative bg-gray-900/80 border border-gray-700 rounded-2xl overflow-hidden shadow-2xl shadow-primary-500/20">
              {/* bordas com glitch */}
              <motion.div
                aria-hidden="true"
                className="absolute inset-0 pointer-events-none mix-blend-screen"
                animate={
                  inView
                    ? {
                        opacity: [0.2, 0.4, 0.15],
                        x: [0, -2, 2, -1, 0],
                      }
                    : {}
                }
                transition={{
                  duration: 1.2,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
              >
                <div className="w-full h-full bg-[repeating-linear-gradient(0deg,rgba(148,163,184,0.15)_0px,rgba(148,163,184,0.15)_1px,transparent_1px,transparent_3px)]" />
              </motion.div>

              {/* topo tipo header de janela */}
              <div className="relative z-10 flex items-center justify-between px-4 py-3 border-b border-gray-700 bg-gray-900/90">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-red-500/80" />
                  <span className="w-3 h-3 rounded-full bg-yellow-500/80" />
                  <span className="w-3 h-3 rounded-full bg-green-500/80" />
                </div>
                <span className="text-xs text-gray-400 font-mono">
                  bug-hunter.ts
                </span>
              </div>

              {/* conteúdo principal com glitch */}
              <div className="relative z-10 p-6 md:p-8">
                <motion.div
                  animate={
                    inView
                      ? {
                          x: [0, -1, 1, 0],
                          skewX: [0, 1, -1, 0],
                        }
                      : {}
                  }
                  transition={{
                    duration: 0.45,
                    repeat: Infinity,
                    repeatType: "mirror",
                    ease: "easeInOut",
                  }}
                  className="font-mono text-2xl md:text-3xl font-semibold text-white relative inline-block"
                >
                  <span className="relative z-10">
                    {"<bug hunter />"}
                  </span>

                  {/* camada colorida para efeito de glitch */}
                  <motion.span
                    aria-hidden="true"
                    className="absolute inset-0 text-primary-400 blur-[1px]"
                    animate={
                      inView
                        ? {
                            x: [0, 2, -1, 0],
                            y: [0, -1, 1, 0],
                            opacity: [0.3, 0.6, 0.2],
                          }
                        : {}
                    }
                    transition={{
                      duration: 0.35,
                      repeat: Infinity,
                      ease: "easeInOut",
                    }}
                  >
                    {"<bug hunter />"}
                  </motion.span>
                </motion.div>

                <p className="mt-6 text-sm md:text-base text-gray-400 font-mono">
                  $ npm run scan --target="discord,web"
                </p>
                <p className="mt-1 text-xs md:text-sm text-primary-300 font-mono">
                  ✔ {t("bughunter_status_found")}
                </p>
              </div>

              {/* linha de scan descendo */}
              <motion.div
                aria-hidden="true"
                className="absolute left-0 right-0 h-10 bg-gradient-to-b from-primary-500/40 via-transparent to-transparent mix-blend-screen"
                style={{ top: 0 }}
                animate={
                  inView
                    ? {
                        y: ["0%", "120%"],
                      }
                    : {}
                }
                transition={{
                  duration: 2.2,
                  repeat: Infinity,
                  ease: "linear",
                  repeatDelay: 1,
                }}
              />

              {/* inseto saindo do card */}
              <motion.div
                aria-hidden="true"
                className="absolute -right-4 bottom-4 md:right-4 md:-bottom-6 text-5xl drop-shadow-[0_0_20px_rgba(56,189,248,0.6)]"
                animate={
                  inView
                    ? {
                        y: [24, -8, 0, -4, 0],
                        rotate: [0, -10, 5, 0],
                      }
                    : {}
                }
                transition={{
                  duration: 2.4,
                  repeat: Infinity,
                  repeatDelay: 3,
                  ease: "easeInOut",
                }}
              >
                🐛
              </motion.div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}


