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
    
    // Bug Hunter
    bughunter_title: "Bug Hunter",
    bughunter_subtitle: "Eu adoro quebrar coisas para deixá-las melhores.",
    bughunter_description_1: "Sou caçador de bugs na plataforma Discord, em sites e aplicações web.",
    bughunter_description_2: "Não procuro bugs só no Discord: analiso qualquer plataforma onde eu possa encontrar glitches visuais, comportamentos estranhos e problemas de experiência para deixar tudo mais fluido.",
    bughunter_chip_label: "Caçador de bugs",
    bughunter_os_label: "Sistema operacional",
    bughunter_os_value: "Linux",
    bughunter_status_scanning: "Scaneando o site...",
    bughunter_status_found: "Bug encontrado! Corrigindo...",
    bughunter_log_scanning: "[scan] Procurando bugs em",
    bughunter_log_bug_found: "[warn] Novo bug encontrado em um componente crítico.",
    bughunter_log_reported: "[report] Bug reportado com evidências e passos de reprodução.",
    bughunter_log_fixed: "[fix] Bug corrigido e validado em produção.",
    bughunter_log_placeholder: "Aguardando execução do scanner de bugs...",

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
    discord_servers_title: "Servidores Discord",
    discord_servers_subtitle: "Servidores onde trabalho como gerente de comunidade e moderador",
    discord_servers_tab_community: "Gerente de Comunidade e Moderador",
    discord_servers_tab_ecosystem: "Servidor do Ecossistema",
    discord_servers_tab_friends: "Meu Servidor de Amigos",
    discord_servers_tab_previous: "Servidores Anteriores",
    discord_servers_join: "Entrar no servidor",
    discord_servers_itsatrap_desc: "Servidor de comunidade onde atuo como desenvolvedor, criando soluções e contribuindo para o crescimento da plataforma.",
    discord_servers_viggle_desc: "Servidor de comunidade onde atuo como moderador, ajudando a manter um ambiente saudável e acolhedor.",
    discord_servers_chiliz_desc: "Servidor onde atuo como moderador/gerente, ajudando a manter a comunidade organizada e ativa.",
    discord_servers_communityorg_dev_desc: "Servidor onde atuo como Community Leader, ajudando a liderar e organizar a comunidade.",
    discord_servers_gou_desc: "Servidor do Goularte (desativado em 2024). Participei da equipe de moderação em 2021.",
    discord_servers_belugang_desc: "Belugang • Moderador (2024) — ajudei a manter a comunidade organizada e segura.",
    discord_servers_celestrial_desc: "Celestrial Boundaries • Moderador (2025) — apoiei a comunidade e a moderação.",
    discord_servers_leaguehu3br_desc: "LEAGUE of Hu3BR • Moderador e Líder de Desenvolvimento (2023–2024).",
    discord_servers_admins_desc: "Comunidade oficial para administradores de servidores Discord. Um espaço para compartilhar conhecimento, experiências e melhores práticas de moderação e gestão de comunidades.",
    discord_servers_friends_desc: "Meu servidor pessoal de amigos, um lugar descontraído para conversar e passar o tempo.",
    discord_servers_previous_construction: "Em Construção",
    discord_servers_previous_construction_desc: "Esta seção está sendo desenvolvida. Em breve você poderá ver os servidores onde já trabalhei anteriormente.",
    
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
    
    // Bug Hunter
    bughunter_title: "Bug Hunter",
    bughunter_subtitle: "I love breaking things to make them better.",
    bughunter_description_1: "I'm a bug hunter on the Discord platform, websites and web apps.",
    bughunter_description_2: "I don't only look for bugs on Discord: I analyze any platform where I can find visual glitches, strange behaviors and UX issues to make everything smoother.",
    bughunter_chip_label: "Bug hunter",
    bughunter_os_label: "Operating system",
    bughunter_os_value: "Linux",
    bughunter_status_scanning: "Scanning the site...",
    bughunter_status_found: "Bug found! Fixing...",
    bughunter_log_scanning: "[scan] Looking for bugs on",
    bughunter_log_bug_found: "[warn] New bug found in a critical component.",
    bughunter_log_reported: "[report] Bug reported with evidence and reproduction steps.",
    bughunter_log_fixed: "[fix] Bug fixed and validated in production.",
    bughunter_log_placeholder: "Waiting for the bug scanner to start...",

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
    discord_servers_title: "Discord Servers",
    discord_servers_subtitle: "Servers where I work as community manager and moderator",
    discord_servers_tab_community: "Community Manager & Moderator",
    discord_servers_tab_ecosystem: "Ecosystem Server",
    discord_servers_tab_friends: "My Friends Server",
    discord_servers_tab_previous: "Previous Servers",
    discord_servers_join: "Join server",
    discord_servers_itsatrap_desc: "Community server where I work as a developer, creating solutions and contributing to platform growth.",
    discord_servers_viggle_desc: "Community server where I work as a moderator, helping maintain a healthy and welcoming environment.",
    discord_servers_chiliz_desc: "Server where I work as a moderator/community role, helping keep the community organized and active.",
    discord_servers_communityorg_dev_desc: "Server where I work as a Community Leader, helping lead and organize the community.",
    discord_servers_gou_desc: "Goularte community server (disabled in 2024). I was part of the moderation team in 2021.",
    discord_servers_belugang_desc: "Belugang • Moderator (2024) — helped keep the community organized and safe.",
    discord_servers_celestrial_desc: "Celestrial Boundaries • Moderator (2025) — supported the community and moderation.",
    discord_servers_leaguehu3br_desc: "LEAGUE of Hu3BR • Moderator & Development Lead (2023–2024).",
    discord_servers_admins_desc: "Official community for Discord server administrators. A space to share knowledge, experiences and best practices for moderation and community management.",
    discord_servers_friends_desc: "My personal friends server, a relaxed place to chat and hang out.",
    discord_servers_previous_construction: "Under Construction",
    discord_servers_previous_construction_desc: "This section is being developed. Soon you'll be able to see the servers where I previously worked.",
    
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
  // Sempre inicializar com pt_BR para consistência entre servidor e cliente
  const [language, setLanguageState] = useState<Language>("pt_BR");
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    // Após a hidratação, carregar o idioma do localStorage
    setIsHydrated(true);
    if (typeof window !== "undefined") {
      const savedLanguage = localStorage.getItem("language") as Language;
      if (savedLanguage && (savedLanguage === "pt_BR" || savedLanguage === "en_US")) {
        setLanguageState(savedLanguage);
      }
    }
  }, []);

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    if (typeof window !== "undefined") {
      localStorage.setItem("language", lang);
    }
  };

  const t = (key: string): string => {
    // Durante a hidratação inicial, sempre usar pt_BR
    const currentLang = isHydrated ? language : "pt_BR";
    return translations[currentLang][key as keyof typeof translations.pt_BR] || key;
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

