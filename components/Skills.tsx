"use client";

import { motion } from "framer-motion";
import { useInView } from "react-intersection-observer";
import {
  Code,
  Database,
  Smartphone,
  Cloud,
  GitBranch,
  Palette,
  Brain,
  Bot,
} from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

export default function Skills() {
  const { t } = useLanguage();
  const [ref, inView] = useInView({
    triggerOnce: true,
    threshold: 0.1,
  });

  const skills = [
    {
      category: "Frontend",
      icon: Code,
      technologies: ["HTML", "CSS", "JavaScript", "TypeScript", "React", "Next.js"],
      color: "from-blue-500 to-cyan-500",
    },
    {
      category: "Backend",
      icon: Database,
      technologies: ["Node.js", "Express", "APIs REST", "GraphQL"],
      color: "from-green-500 to-emerald-500",
    },
    {
      category: "Mobile",
      icon: Smartphone,
      technologies: ["React Native", "Responsive Design"],
      color: "from-purple-500 to-pink-500",
    },
    {
      category: "Cloud & DevOps",
      icon: Cloud,
      technologies: ["Git", "GitHub", "Vercel", "Docker"],
      color: "from-orange-500 to-red-500",
    },
    {
      category: "Version Control",
      icon: GitBranch,
      technologies: ["Git", "GitHub", "Git Flow"],
      color: "from-gray-500 to-slate-500",
    },
    {
      category: "Design",
      icon: Palette,
      technologies: ["UI/UX", "Figma", "Tailwind CSS"],
      color: "from-pink-500 to-rose-500",
    },
    {
      category: "IA",
      icon: Brain,
      technologies: ["IA"],
      color: "from-indigo-500 to-purple-500",
    },
    {
      category: "Discord Bot Developer",
      icon: Bot,
      technologies: ["Discord Bot Developer"],
      color: "from-blue-500 to-indigo-500",
    },
  ];

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

  return (
    <section
      id="skills"
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
              {t("skills_title")}
            </span>
          </h2>
          <div className="w-24 h-1 bg-gradient-to-r from-primary-500 to-purple-500 mx-auto rounded-full" />
          <p className="text-gray-400 mt-4">
            {t("skills_subtitle")}
          </p>
        </motion.div>

        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate={inView ? "visible" : "hidden"}
          className="grid md:grid-cols-2 lg:grid-cols-3 gap-6"
        >
          {skills.map((skill, index) => {
            const Icon = skill.icon;
            return (
              <motion.div
                key={skill.category}
                variants={itemVariants}
                whileHover={{ y: -10, scale: 1.03 }}
                className="bg-gray-800/50 backdrop-blur-sm p-6 rounded-xl border border-gray-700 hover:border-primary-500/50 hover:shadow-xl hover:shadow-primary-500/20 card-hover transition-all group"
              >
                <div
                  className={`w-12 h-12 rounded-lg bg-gradient-to-br ${skill.color} p-3 mb-4 flex items-center justify-center`}
                  aria-hidden="true"
                >
                  <Icon className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-xl font-semibold text-white mb-4">
                  {skill.category}
                </h3>
                <div className="flex flex-wrap gap-2">
                  {skill.technologies.map((tech) => (
                    <motion.span
                      key={tech}
                      whileHover={{ scale: 1.15, y: -2 }}
                      className="px-3 py-1 bg-gray-700/50 rounded-full text-sm text-gray-300 border border-gray-600 group-hover:border-primary-500/50 group-hover:bg-primary-500/10 group-hover:text-primary-300 transition-all cursor-default"
                    >
                      {tech}
                    </motion.span>
                  ))}
                </div>
              </motion.div>
            );
          })}
        </motion.div>
      </div>
    </section>
  );
}

