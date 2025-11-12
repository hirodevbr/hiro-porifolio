"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";

type Language = "pt_BR" | "en_US";

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

// Traduções
const translations = {
  pt_BR: {
    // Navbar
    nav_home: "Início",
    nav_about: "Sobre",
    nav_skills: "Skills",
    nav_projects: "Projetos",
    nav_discord: "Discord",
    nav_contact: "Contato",
    
    // Hero
    hero_greeting: "Olá, eu sou",
    hero_name: "Samuel (hiro)",
    hero_role: "Desenvolvedor Full Stack",
    hero_description: "Apaixonado por criar soluções incríveis com código. Transformando ideias em realidade através da tecnologia.",
    hero_projects: "Ver Projetos",
    hero_contact: "Entre em Contato",
    
    // About
    about_title: "Sobre Mim",
    about_text_1: "Olá! Sou Samuel (hiro), um desenvolvedor Full Stack apaixonado por tecnologia e inovação. Atualmente trabalho na",
    about_text_2: "e estou sempre aprendendo novas tecnologias para criar soluções cada vez melhores.",
    about_text_3: "Minha jornada na programação começou com HTML, CSS e JavaScript, e desde então tenho me dedicado a expandir meus conhecimentos e criar projetos incríveis que fazem a diferença.",
    about_location: "Localização",
    about_location_value: "Teresina-PI, Brasil",
    about_availability: "Disponibilidade",
    about_availability_value: "Aberto a projetos",
    about_passion: "Paixão",
    about_passion_value: "Desenvolvimento",
    about_focus_title: "🎯 Foco Atual",
    about_focus_text: "Trabalhando na Community ORG, criando soluções inovadoras e colaborando com uma equipe incrível.",
    about_learning_title: "🌱 Aprendendo",
    about_learning_text: "Sempre aprimorando habilidades em HTML, CSS, JavaScript e explorando novas tecnologias do ecossistema web moderno.",
    about_curiosity_title: "⚡ Curiosidade",
    about_curiosity_text: "As capas da Patrulha da Noite de Game of Thrones são feitas de tapetes da Ikea! 🎭",
    
    // Skills
    skills_title: "Skills",
    skills_subtitle: "Tecnologias que domino",
    
    // Projects
    projects_title: "Meus Projetos",
    projects_subtitle: "Explore alguns dos meus projetos no GitHub. Cada projeto representa uma jornada de aprendizado e inovação.",
    projects_new: "Novo",
    projects_updated: "Atualizado",
    projects_view_all: "Ver Todos no GitHub",
    projects_no_projects: "Nenhum projeto encontrado no momento.",
    projects_error_title: "Ops! Algo deu errado",
    projects_error_rate_limit: "Limite de requisições excedido. Por favor, tente novamente em alguns minutos.",
    projects_error_user_not_found: "Usuário não encontrado. Verifique se o nome de usuário está correto.",
    projects_error_fetch: "Não foi possível carregar os projetos. Verifique sua conexão com a internet e tente novamente.",
    projects_error_retry: "Tentar Novamente",
    discord_title: "Discord",
    discord_subtitle: "Veja o que estou fazendo no Discord agora",
    discord_online: "Online",
    discord_idle: "Ausente",
    discord_dnd: "Ocupado",
    discord_offline: "Offline",
    discord_badges: "Badges",
    discord_listening_spotify: "Ouvindo no Spotify",
    discord_activities: "Atividades",
    discord_playing: "Jogando",
    discord_streaming: "Transmitindo",
    discord_listening: "Ouvindo",
    discord_watching: "Assistindo",
    discord_custom: "Personalizado",
    discord_competing: "Competindo",
    discord_no_activities: "Nenhuma atividade no momento",
    discord_ago: "Há",
    discord_account_created_on: "Conta criada em",
    discord_account_age_ago: "atrás",
    discord_account_age_year: "ano",
    discord_account_age_years: "anos",
    discord_account_age_month: "mês",
    discord_account_age_months: "meses",
    discord_account_age_day: "dia",
    discord_account_age_days: "dias",
    
    // Contact
    contact_title: "Entre em Contato",
    contact_subtitle: "Vamos conversar! Entre em contato através das redes sociais ou envie uma mensagem.",
    contact_name: "Nome",
    contact_email: "Email",
    contact_message: "Mensagem",
    contact_send: "Enviar Mensagem",
    contact_sending: "Enviando...",
    contact_success: "Mensagem enviada com sucesso!",
    contact_error: "Erro ao enviar mensagem. Tente novamente.",
    contact_validation_name_required: "O nome é obrigatório",
    contact_validation_name_min: "O nome deve ter pelo menos 2 caracteres",
    contact_validation_email_required: "O email é obrigatório",
    contact_validation_email_invalid: "Por favor, insira um email válido",
    contact_validation_message_required: "A mensagem é obrigatória",
    contact_validation_message_min: "A mensagem deve ter pelo menos 10 caracteres",
    contact_work_together: "Vamos trabalhar juntos?",
    contact_work_text: "Estou sempre interessado em novos projetos e oportunidades. Se você tem uma ideia ou projeto em mente, não hesite em entrar em contato!",
    contact_social_media: "Redes Sociais",
    footer_made_by: "Feito com",
    footer_by: "por Samuel (hiro)",
    footer_rights: "Todos os direitos reservados",
    scroll_to_top: "Voltar ao topo",
  },
  en_US: {
    // Navbar
    nav_home: "Home",
    nav_about: "About",
    nav_skills: "Skills",
    nav_projects: "Projects",
    nav_discord: "Discord",
    nav_contact: "Contact",
    
    // Hero
    hero_greeting: "Hello, I'm",
    hero_name: "Samuel (hiro)",
    hero_role: "Full Stack Developer",
    hero_description: "Passionate about creating amazing solutions with code. Transforming ideas into reality through technology.",
    hero_projects: "View Projects",
    hero_contact: "Get in Touch",
    
    // About
    about_title: "About Me",
    about_text_1: "Hello! I'm Samuel (hiro), a Full Stack developer passionate about technology and innovation. Currently working at",
    about_text_2: "and I'm always learning new technologies to create better solutions.",
    about_text_3: "My programming journey started with HTML, CSS and JavaScript, and since then I've been dedicated to expanding my knowledge and creating amazing projects that make a difference.",
    about_location: "Location",
    about_location_value: "Teresina-PI, Brazil",
    about_availability: "Availability",
    about_availability_value: "Open to projects",
    about_passion: "Passion",
    about_passion_value: "Development",
    about_focus_title: "🎯 Current Focus",
    about_focus_text: "Working at Community ORG, creating innovative solutions and collaborating with an amazing team.",
    about_learning_title: "🌱 Learning",
    about_learning_text: "Always improving skills in HTML, CSS, JavaScript and exploring new technologies in the modern web ecosystem.",
    about_curiosity_title: "⚡ Curiosity",
    about_curiosity_text: "The Night's Watch cloaks from Game of Thrones are made from Ikea rugs! 🎭",
    
    // Skills
    skills_title: "Skills",
    skills_subtitle: "Technologies I master",
    
    // Projects
    projects_title: "My Projects",
    projects_subtitle: "Explore some of my projects on GitHub. Each project represents a journey of learning and innovation.",
    projects_new: "New",
    projects_updated: "Updated",
    projects_view_all: "View All on GitHub",
    projects_no_projects: "No projects found at the moment.",
    projects_error_title: "Oops! Something went wrong",
    projects_error_rate_limit: "Rate limit exceeded. Please try again in a few minutes.",
    projects_error_user_not_found: "User not found. Please check if the username is correct.",
    projects_error_fetch: "Could not load projects. Check your internet connection and try again.",
    projects_error_retry: "Try Again",
    
    // Discord
    discord_title: "Discord",
    discord_subtitle: "See what I'm doing on Discord right now",
    discord_online: "Online",
    discord_idle: "Idle",
    discord_dnd: "Do Not Disturb",
    discord_offline: "Offline",
    discord_badges: "Badges",
    discord_listening_spotify: "Listening on Spotify",
    discord_activities: "Activities",
    discord_playing: "Playing",
    discord_streaming: "Streaming",
    discord_listening: "Listening",
    discord_watching: "Watching",
    discord_custom: "Custom",
    discord_competing: "Competing",
    discord_no_activities: "No activities at the moment",
    discord_ago: "Ago",
    discord_account_created_on: "Account created on",
    discord_account_age_ago: "ago",
    discord_account_age_year: "year",
    discord_account_age_years: "years",
    discord_account_age_month: "month",
    discord_account_age_months: "months",
    discord_account_age_day: "day",
    discord_account_age_days: "days",
    
    // Contact
    contact_title: "Get in Touch",
    contact_subtitle: "Let's talk! Get in touch through social media or send a message.",
    contact_name: "Name",
    contact_email: "Email",
    contact_message: "Message",
    contact_send: "Send Message",
    contact_sending: "Sending...",
    contact_success: "Message sent successfully!",
    contact_error: "Error sending message. Please try again.",
    contact_validation_name_required: "Name is required",
    contact_validation_name_min: "Name must be at least 2 characters",
    contact_validation_email_required: "Email is required",
    contact_validation_email_invalid: "Please enter a valid email",
    contact_validation_message_required: "Message is required",
    contact_validation_message_min: "Message must be at least 10 characters",
    contact_work_together: "Let's work together?",
    contact_work_text: "I'm always interested in new projects and opportunities. If you have an idea or project in mind, don't hesitate to get in touch!",
    contact_social_media: "Social Media",
    footer_made_by: "Made with",
    footer_by: "by Samuel (hiro)",
    footer_rights: "All rights reserved",
    scroll_to_top: "Back to top",
  },
};

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>("pt_BR");

  useEffect(() => {
    // Carregar idioma salvo do localStorage
    const savedLanguage = localStorage.getItem("language") as Language;
    if (savedLanguage && (savedLanguage === "pt_BR" || savedLanguage === "en_US")) {
      setLanguageState(savedLanguage);
    }
  }, []);

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem("language", lang);
  };

  const t = (key: string): string => {
    return translations[language][key as keyof typeof translations.pt_BR] || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error("useLanguage must be used within a LanguageProvider");
  }
  return context;
}

