"use client";

import { motion } from "framer-motion";
import { useInView } from "react-intersection-observer";
import { MapPin, Calendar, Heart } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import WeatherTime from "./WeatherTime";

export default function About() {
  const { t } = useLanguage();
  const [ref, inView] = useInView({
    triggerOnce: true,
    threshold: 0.1,
  });

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.5,
      },
    },
  };

  return (
    <section
      id="about"
      ref={ref}
      className="py-20 px-4 sm:px-6 lg:px-8 relative"
    >
      <div className="max-w-7xl mx-auto">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate={inView ? "visible" : "hidden"}
          className="text-center mb-16"
        >
          <motion.h2
            variants={itemVariants}
            className="text-4xl md:text-5xl font-bold mb-4"
          >
            <span className="bg-gradient-to-r from-primary-400 to-purple-500 bg-clip-text text-transparent">
              {t("about_title")}
            </span>
          </motion.h2>
          <motion.div
            variants={itemVariants}
            className="w-24 h-1 bg-gradient-to-r from-primary-500 to-purple-500 mx-auto rounded-full"
          />
        </motion.div>

        <div className="grid md:grid-cols-2 gap-12 items-center">
          <motion.div
            variants={itemVariants}
            initial="hidden"
            animate={inView ? "visible" : "hidden"}
            className="space-y-6"
          >
            <p className="text-lg text-gray-300 leading-relaxed">
              {t("about_text_1")}{" "}
              <span className="text-primary-400 font-semibold">
                Community ORG
              </span>{" "}
              {t("about_text_2")}
            </p>
            <p className="text-lg text-gray-300 leading-relaxed">
              {t("about_text_3")}
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-6">
              <motion.div
                whileHover={{ scale: 1.05, y: -8 }}
                className="bg-gray-800/50 backdrop-blur-sm p-4 rounded-lg border border-gray-700 hover:border-primary-500/50 hover:shadow-lg hover:shadow-primary-500/20 card-hover focus-within:ring-2 focus-within:ring-primary-500 focus-within:ring-offset-2 focus-within:ring-offset-gray-900"
                tabIndex={0}
                role="region"
                aria-label={`${t("about_location")}: ${t("about_location_value")}`}
              >
                <MapPin className="w-8 h-8 text-primary-400 mb-2" aria-hidden="true" />
                <p className="text-gray-400 text-sm">{t("about_location")}</p>
                <p className="text-white font-semibold">{t("about_location_value")}</p>
              </motion.div>
              <motion.div
                whileHover={{ scale: 1.05, y: -8 }}
                className="bg-gray-800/50 backdrop-blur-sm p-4 rounded-lg border border-gray-700 hover:border-primary-500/50 hover:shadow-lg hover:shadow-primary-500/20 card-hover focus-within:ring-2 focus-within:ring-primary-500 focus-within:ring-offset-2 focus-within:ring-offset-gray-900"
                tabIndex={0}
                role="region"
                aria-label={`${t("about_availability")}: ${t("about_availability_value")}`}
              >
                <Calendar className="w-8 h-8 text-primary-400 mb-2" aria-hidden="true" />
                <p className="text-gray-400 text-sm">{t("about_availability")}</p>
                <p className="text-white font-semibold">{t("about_availability_value")}</p>
              </motion.div>
              <motion.div
                whileHover={{ scale: 1.05, y: -8 }}
                className="bg-gray-800/50 backdrop-blur-sm p-4 rounded-lg border border-gray-700 hover:border-primary-500/50 hover:shadow-lg hover:shadow-primary-500/20 card-hover focus-within:ring-2 focus-within:ring-primary-500 focus-within:ring-offset-2 focus-within:ring-offset-gray-900"
                tabIndex={0}
                role="region"
                aria-label={`${t("about_passion")}: ${t("about_passion_value")}`}
              >
                <Heart className="w-8 h-8 text-primary-400 mb-2" aria-hidden="true" />
                <p className="text-gray-400 text-sm">{t("about_passion")}</p>
                <p className="text-white font-semibold">{t("about_passion_value")}</p>
              </motion.div>
            </div>
            <motion.div
              variants={itemVariants}
              initial="hidden"
              animate={inView ? "visible" : "hidden"}
              className="bg-gradient-to-br from-primary-500/20 to-purple-500/20 rounded-2xl p-6 backdrop-blur-sm border border-gray-700 hover:border-primary-500/50 hover:shadow-xl hover:shadow-primary-500/20 card-hover mt-6"
            >
              <div className="space-y-4">
                <div>
                  <h3 className="text-xl font-semibold text-primary-400 mb-2">
                    {t("about_focus_title")}
                  </h3>
                  <p className="text-gray-300">
                    {t("about_focus_text")}
                  </p>
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-primary-400 mb-2">
                    {t("about_learning_title")}
                  </h3>
                  <p className="text-gray-300">
                    {t("about_learning_text")}
                  </p>
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-primary-400 mb-2">
                    {t("about_curiosity_title")}
                  </h3>
                  <p className="text-gray-300">
                    {t("about_curiosity_text")}
                  </p>
                </div>
              </div>
            </motion.div>
          </motion.div>

          <motion.div
            variants={itemVariants}
            initial="hidden"
            animate={inView ? "visible" : "hidden"}
            className="relative"
          >
            <WeatherTime />
          </motion.div>
        </div>
      </div>
    </section>
  );
}

