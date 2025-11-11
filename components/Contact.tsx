"use client";

import { motion } from "framer-motion";
import { useInView } from "react-intersection-observer";
import { Mail, Github, Instagram, Twitter, Send, CheckCircle, XCircle, Loader2 } from "lucide-react";
import { useState } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { trackContactSubmit, trackSocialClick } from "@/lib/analytics";

interface FormErrors {
  name?: string;
  email?: string;
  message?: string;
}

export default function Contact() {
  const { t } = useLanguage();
  const [ref, inView] = useInView({
    triggerOnce: true,
    threshold: 0.1,
  });

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    message: "",
  });

  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<"idle" | "success" | "error">("idle");
  const [submitMessage, setSubmitMessage] = useState("");

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    // Validação do nome
    if (!formData.name.trim()) {
      newErrors.name = t("contact_validation_name_required");
    } else if (formData.name.trim().length < 2) {
      newErrors.name = t("contact_validation_name_min");
    }

    // Validação do email
    if (!formData.email.trim()) {
      newErrors.email = t("contact_validation_email_required");
    } else {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(formData.email)) {
        newErrors.email = t("contact_validation_email_invalid");
      }
    }

    // Validação da mensagem
    if (!formData.message.trim()) {
      newErrors.message = t("contact_validation_message_required");
    } else if (formData.message.trim().length < 10) {
      newErrors.message = t("contact_validation_message_min");
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Limpar status anterior
    setSubmitStatus("idle");
    setSubmitMessage("");

    // Validar formulário
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || t("contact_error"));
      }

      // Sucesso
      setSubmitStatus("success");
      setSubmitMessage(t("contact_success"));
      setFormData({ name: "", email: "", message: "" });
      setErrors({});
      
      // Tracking de analytics
      trackContactSubmit(true, "email");

      // Limpar mensagem de sucesso após 5 segundos
      setTimeout(() => {
        setSubmitStatus("idle");
        setSubmitMessage("");
      }, 5000);
    } catch (error) {
      // Erro
      setSubmitStatus("error");
      setSubmitMessage(
        error instanceof Error ? error.message : t("contact_error")
      );
      
      // Tracking de analytics
      trackContactSubmit(false, "email");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (field: keyof typeof formData) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setFormData({ ...formData, [field]: e.target.value });
    // Limpar erro do campo quando o usuário começar a digitar
    if (errors[field]) {
      setErrors({ ...errors, [field]: undefined });
    }
    // Limpar status de erro quando o usuário começar a digitar
    if (submitStatus === "error") {
      setSubmitStatus("idle");
      setSubmitMessage("");
    }
  };

  const socialLinks = [
    {
      name: "GitHub",
      icon: Github,
      href: "https://github.com/hirodevbr",
      color: "hover:text-gray-400",
    },
    {
      name: "Instagram",
      icon: Instagram,
      href: "https://instagram.com/sxmu.slv",
      color: "hover:text-pink-500",
    },
    {
      name: "Twitter",
      icon: Twitter,
      href: "https://twitter.com/virtualhiro",
      color: "hover:text-blue-400",
    },
  ];

  return (
    <section
      id="contact"
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
              {t("contact_title")}
            </span>
          </h2>
          <div className="w-24 h-1 bg-gradient-to-r from-primary-500 to-purple-500 mx-auto rounded-full" />
          <p className="text-gray-400 mt-4 max-w-2xl mx-auto">
            {t("contact_subtitle")}
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 gap-12">
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            animate={inView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="space-y-8"
          >
            <div>
              <h3 className="text-2xl font-semibold text-white mb-4">
                {t("contact_work_together")}
              </h3>
              <p className="text-gray-400 leading-relaxed">
                {t("contact_work_text")}
              </p>
            </div>

            <div className="space-y-4">
              <motion.a
                href="mailto:hiro.communitydev@gmail.com"
                whileHover={{ x: 5, y: -4 }}
                className="flex items-center gap-4 p-4 bg-gray-800/50 backdrop-blur-sm rounded-lg border border-gray-700 hover:border-primary-500/50 hover:shadow-lg hover:shadow-primary-500/20 card-hover transition-all group focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 focus:ring-offset-gray-900"
                aria-label={`Enviar email para hiro.communitydev@gmail.com`}
              >
                <div className="w-12 h-12 bg-gradient-to-br from-primary-500 to-primary-600 rounded-lg flex items-center justify-center">
                  <Mail className="w-6 h-6 text-white" aria-hidden="true" />
                </div>
                <div>
                  <p className="text-gray-400 text-sm">{t("contact_email")}</p>
                  <p className="text-white group-hover:text-primary-400 transition-colors">
                    hiro.communitydev@gmail.com
                  </p>  
                </div>
              </motion.a>
            </div>

            <div>
              <h4 className="text-lg font-semibold text-white mb-4">
                {t("contact_social_media")}
              </h4>
              <div className="flex gap-4">
                {socialLinks.map((social) => {
                  const Icon = social.icon;
                  return (
                    <motion.a
                      key={social.name}
                      href={social.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      whileHover={{ scale: 1.15, y: -5, rotate: 5 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={() => trackSocialClick(social.name, social.href)}
                      className={`w-12 h-12 bg-gray-800/50 backdrop-blur-sm rounded-lg border border-gray-700 flex items-center justify-center text-gray-400 ${social.color} hover:shadow-lg hover:shadow-primary-500/30 hover-lift transition-all focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 focus:ring-offset-gray-900`}
                      aria-label={`Visitar perfil no ${social.name} (abre em nova aba)`}
                    >
                      <Icon className="w-6 h-6" aria-hidden="true" />
                    </motion.a>
                  );
                })}
              </div>
            </div>
          </motion.div>

          <motion.form
            initial={{ opacity: 0, x: 50 }}
            animate={inView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.5, delay: 0.4 }}
            onSubmit={handleSubmit}
            className="space-y-6"
          >
            <div>
              <label
                htmlFor="name"
                className="block text-sm font-medium text-gray-300 mb-2"
              >
                {t("contact_name")}
              </label>
              <input
                type="text"
                id="name"
                value={formData.name}
                onChange={handleChange("name")}
                className={`w-full px-4 py-3 bg-gray-800/50 backdrop-blur-sm border rounded-lg text-white placeholder-gray-500 focus:outline-none transition-colors ${
                  errors.name
                    ? "border-red-500 focus:border-red-500 focus:ring-2 focus:ring-red-500/50"
                    : "border-gray-700 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/50"
                }`}
                placeholder={t("contact_name")}
                disabled={isSubmitting}
                aria-required="true"
              />
              {errors.name && (
                <motion.p
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-1 text-sm text-red-400 flex items-center gap-1"
                >
                  <XCircle className="w-4 h-4" />
                  {errors.name}
                </motion.p>
              )}
            </div>
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-gray-300 mb-2"
              >
                {t("contact_email")}
              </label>
              <input
                type="email"
                id="email"
                value={formData.email}
                onChange={handleChange("email")}
                className={`w-full px-4 py-3 bg-gray-800/50 backdrop-blur-sm border rounded-lg text-white placeholder-gray-500 focus:outline-none transition-colors ${
                  errors.email
                    ? "border-red-500 focus:border-red-500 focus:ring-2 focus:ring-red-500/50"
                    : "border-gray-700 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/50"
                }`}
                placeholder={t("contact_email")}
                disabled={isSubmitting}
                aria-required="true"
              />
              {errors.email && (
                <motion.p
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-1 text-sm text-red-400 flex items-center gap-1"
                >
                  <XCircle className="w-4 h-4" />
                  {errors.email}
                </motion.p>
              )}
            </div>
            <div>
              <label
                htmlFor="message"
                className="block text-sm font-medium text-gray-300 mb-2"
              >
                {t("contact_message")}
              </label>
              <textarea
                id="message"
                value={formData.message}
                onChange={handleChange("message")}
                rows={6}
                className={`w-full px-4 py-3 bg-gray-800/50 backdrop-blur-sm border rounded-lg text-white placeholder-gray-500 focus:outline-none transition-colors resize-none ${
                  errors.message
                    ? "border-red-500 focus:border-red-500 focus:ring-2 focus:ring-red-500/50"
                    : "border-gray-700 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/50"
                }`}
                placeholder={t("contact_message")}
                disabled={isSubmitting}
                aria-required="true"
              />
              {errors.message && (
                <motion.p
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-1 text-sm text-red-400 flex items-center gap-1"
                >
                  <XCircle className="w-4 h-4" />
                  {errors.message}
                </motion.p>
              )}
            </div>

            {/* Mensagem de feedback */}
            {submitMessage && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`p-4 rounded-lg flex items-center gap-3 ${
                  submitStatus === "success"
                    ? "bg-green-500/20 border border-green-500/50"
                    : "bg-red-500/20 border border-red-500/50"
                }`}
              >
                {submitStatus === "success" ? (
                  <CheckCircle className="w-5 h-5 text-green-400" />
                ) : (
                  <XCircle className="w-5 h-5 text-red-400" />
                )}
                <p
                  className={
                    submitStatus === "success"
                      ? "text-green-400"
                      : "text-red-400"
                  }
                >
                  {submitMessage}
                </p>
              </motion.div>
            )}
            <motion.button
              type="submit"
              whileHover={!isSubmitting ? { scale: 1.05, y: -4 } : {}}
              whileTap={!isSubmitting ? { scale: 0.95 } : {}}
              disabled={isSubmitting}
              className={`w-full px-6 py-3 bg-gradient-to-r from-primary-500 to-primary-600 rounded-lg font-semibold text-white shadow-lg shadow-primary-500/50 hover:shadow-xl hover:shadow-primary-500/70 glow-on-hover hover-lift transition-all flex items-center justify-center gap-2 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 focus:ring-offset-gray-900 ${
                isSubmitting
                  ? "opacity-70 cursor-not-allowed"
                  : "cursor-pointer"
              }`}
              aria-label={t("contact_send")}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" aria-hidden="true" />
                  {t("contact_sending")}
                </>
              ) : (
                <>
                  <Send className="w-5 h-5" aria-hidden="true" />
                  {t("contact_send")}
                </>
              )}
            </motion.button>
          </motion.form>
        </div>
      </div>
    </section>
  );
}

