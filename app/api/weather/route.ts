import { NextResponse } from "next/server";

// Coordenadas de Teresina-PI
const TERESINA_LAT = -5.0892;
const TERESINA_LON = -42.8019;

export async function GET() {
  try {
    // Usando Open-Meteo API (gratuita, sem necessidade de chave)
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${TERESINA_LAT}&longitude=${TERESINA_LON}&current=temperature_2m,weather_code&timezone=America/Fortaleza`;
    
    const response = await fetch(url, {
      next: { revalidate: 300 }, // Cache por 5 minutos
    });

    if (!response.ok) {
      throw new Error("Failed to fetch weather data");
    }

    const data = await response.json();
    
    return NextResponse.json({
      temperature: Math.round(data.current.temperature_2m),
      weatherCode: data.current.weather_code,
      timezone: data.timezone,
    });
  } catch (error) {
    console.error("Error fetching weather:", error);
    return NextResponse.json(
      { error: "Failed to fetch weather data" },
      { status: 500 }
    );
  }
}



