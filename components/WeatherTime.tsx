"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useInView } from "react-intersection-observer";
import { useLanguage } from "@/contexts/LanguageContext";

interface WeatherData {
  temperature: number;
  weatherCode: number;
}

// Função para obter emoji do clima baseado no código do tempo
function getWeatherEmoji(code: number): string {
  // Códigos do Open-Meteo WMO Weather interpretation codes
  if (code === 0) return "☀️"; // Clear sky
  if (code === 1 || code === 2 || code === 3) return "🌤️"; // Mainly clear, partly cloudy, overcast
  if (code === 45 || code === 48) return "🌫️"; // Fog
  if (code === 51 || code === 53 || code === 55) return "🌦️"; // Drizzle
  if (code === 56 || code === 57) return "🌨️"; // Freezing Drizzle
  if (code === 61 || code === 63 || code === 65) return "🌧️"; // Rain
  if (code === 66 || code === 67) return "🌨️"; // Freezing Rain
  if (code === 71 || code === 73 || code === 75) return "❄️"; // Snow fall
  if (code === 77) return "🌨️"; // Snow grains
  if (code === 80 || code === 81 || code === 82) return "⛈️"; // Rain showers
  if (code === 85 || code === 86) return "🌨️"; // Snow showers
  if (code === 95 || code === 96 || code === 99) return "⛈️"; // Thunderstorm
  return "🌤️"; // Default
}

export default function WeatherTime() {
  const { t, language } = useLanguage();
  const [ref, inView] = useInView({
    triggerOnce: true,
    threshold: 0.1,
  });

  const [time, setTime] = useState<string>("");
  const [date, setDate] = useState<string>("");
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  // Atualizar hora a cada segundo
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      
      // Formatar hora usando timezone de Teresina
      const formatter = new Intl.DateTimeFormat("pt-BR", {
        timeZone: "America/Fortaleza",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: false,
      });
      
      const parts = formatter.formatToParts(now);
      const hours = parts.find(p => p.type === "hour")?.value || "00";
      const minutes = parts.find(p => p.type === "minute")?.value || "00";
      const seconds = parts.find(p => p.type === "second")?.value || "00";
      setTime(`${hours}:${minutes}:${seconds}`);

      // Formatar data usando timezone de Teresina
      const dateOptions: Intl.DateTimeFormatOptions = {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
        timeZone: "America/Fortaleza",
      };
      
      if (language === "pt_BR") {
        setDate(now.toLocaleDateString("pt-BR", dateOptions));
      } else {
        setDate(now.toLocaleDateString("en-US", dateOptions));
      }
    };

    updateTime();
    const interval = setInterval(updateTime, 1000);

    return () => clearInterval(interval);
  }, [language]);

  // Buscar dados do clima
  useEffect(() => {
    const fetchWeather = async () => {
      try {
        setLoading(true);
        const response = await fetch("/api/weather");
        if (!response.ok) {
          throw new Error("Failed to fetch weather");
        }
        const data = await response.json();
        setWeather(data);
        setError(false);
      } catch (err) {
        console.error("Error fetching weather:", err);
        setError(true);
      } finally {
        setLoading(false);
      }
    };

    fetchWeather();
    // Atualizar clima a cada 5 minutos
    const interval = setInterval(fetchWeather, 300000);

    return () => clearInterval(interval);
  }, []);

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 20 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.5 }}
      className="w-full"
    >
      <div className="bg-gradient-to-br from-primary-500/20 via-purple-500/20 to-primary-500/20 rounded-2xl p-6 backdrop-blur-sm border border-gray-700 hover:border-primary-500/50 hover:shadow-xl hover:shadow-primary-500/20 transition-all duration-300">
        <div className="flex flex-col items-center justify-center space-y-4">
          {/* Localização */}
          <div className="flex items-center gap-2 text-gray-300">
            <span className="text-2xl">📍</span>
            <span className="text-lg font-semibold">
              {language === "pt_BR" ? "Teresina-PI, Brasil" : "Teresina-PI, Brazil"}
            </span>
          </div>

          {/* Hora */}
          <div className="text-center">
            <div className="flex items-center justify-center gap-2 mb-2">
              <span className="text-3xl">🕐</span>
              <motion.div
                key={time}
                initial={{ scale: 1.1 }}
                animate={{ scale: 1 }}
                transition={{ duration: 0.3 }}
                className="text-5xl md:text-6xl font-bold bg-gradient-to-r from-primary-400 to-purple-500 bg-clip-text text-transparent"
              >
                {time}
              </motion.div>
            </div>
            <p className="text-gray-400 text-sm md:text-base capitalize">
              {date}
            </p>
          </div>

          {/* Temperatura */}
          <div className="flex items-center gap-4 pt-2">
            {loading ? (
              <div className="flex items-center gap-2 text-gray-400">
                <span className="text-2xl animate-pulse">🌡️</span>
                <span className="text-xl">...</span>
              </div>
            ) : error ? (
              <div className="flex items-center gap-2 text-gray-400">
                <span className="text-2xl">🌡️</span>
                <span className="text-xl">
                  {language === "pt_BR" ? "Erro ao carregar" : "Error loading"}
                </span>
              </div>
            ) : weather ? (
              <>
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", stiffness: 200 }}
                  className="text-4xl"
                >
                  {getWeatherEmoji(weather.weatherCode)}
                </motion.div>
                <div className="text-center">
                  <div className="flex items-baseline gap-1">
                    <motion.span
                      key={weather.temperature}
                      initial={{ scale: 1.2, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ duration: 0.3 }}
                      className="text-4xl md:text-5xl font-bold text-white"
                    >
                      {weather.temperature}
                    </motion.span>
                    <span className="text-2xl text-gray-400">°C</span>
                  </div>
                  <p className="text-gray-400 text-xs mt-1">
                    {language === "pt_BR" ? "Temperatura atual" : "Current temperature"}
                  </p>
                </div>
              </>
            ) : null}
          </div>
        </div>
      </div>
    </motion.div>
  );
}

