"use client";

import { motion } from "framer-motion";
import { Github, Instagram, Twitter, Heart } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { trackSocialClick } from "@/lib/analytics";

export default function Footer() {
  const { t } = useLanguage();
  const currentYear = new Date().getFullYear();

  return (
    <footer className="py-8 px-4 sm:px-6 lg:px-8 border-t border-gray-800">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <motion.p
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-gray-400 text-sm flex items-center gap-2"
          >
            {t("footer_made_by")} <Heart className="w-4 h-4 text-gray-300 fill-gray-300" aria-hidden="true" />{" "}
            {t("footer_by")}
          </motion.p>
          <motion.p
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-gray-400 text-sm"
          >
            © {currentYear} {t("footer_rights")}
          </motion.p>
          <div className="flex items-center gap-4">
            <motion.a
              href="https://github.com/hirodevbr"
              target="_blank"
              rel="noopener noreferrer"
              whileHover={{ scale: 1.1, y: -2 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => trackSocialClick("GitHub", "https://github.com/hirodevbr")}
              className="focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-black rounded"
              aria-label="Visitar perfil no GitHub (abre em nova aba)"
            >
              <Github className="w-5 h-5 text-gray-400 hover:text-white transition-colors" aria-hidden="true" />
            </motion.a>
            <motion.a
              href="https://instagram.com/sxmu.slv"
              target="_blank"
              rel="noopener noreferrer"
              whileHover={{ scale: 1.1, y: -2 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => trackSocialClick("Instagram", "https://instagram.com/sxmu.slv")}
              className="focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-black rounded"
              aria-label="Visitar perfil no Instagram (abre em nova aba)"
            >
              <Instagram className="w-5 h-5 text-gray-400 hover:text-white transition-colors" aria-hidden="true" />
            </motion.a>
            <motion.a
              href="https://twitter.com/virtualhiro"
              target="_blank"
              rel="noopener noreferrer"
              whileHover={{ scale: 1.1, y: -2 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => trackSocialClick("Twitter", "https://twitter.com/virtualhiro")}
              className="focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-black rounded"
              aria-label="Visitar perfil no Twitter (abre em nova aba)"
            >
              <Twitter className="w-5 h-5 text-gray-400 hover:text-white transition-colors" aria-hidden="true" />
            </motion.a>
          </div>
        </div>
      </div>
    </footer>
  );
}

