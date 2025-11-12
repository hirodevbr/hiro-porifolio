import { NextResponse } from 'next/server';

export async function GET() {
  // Retorna um SVG moderno como apple-touch-icon
  // O tamanho padrão do apple-touch-icon é 180x180
  const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg width="180" height="180" viewBox="0 0 180 180" xmlns="http://www.w3.org/2000/svg">
  <rect width="180" height="180" rx="40" fill="#0a0a0a"/>
  <rect width="180" height="180" rx="40" fill="url(#gradientBg)" opacity="0.1"/>
  
  <!-- Letra S estilizada -->
  <path d="M45 45C45 38 50 33 57 33C64 33 69 38 71 42L78 36C75 30 68 27 60 27C48 27 39 36 39 48C39 58 46 65 56 69C66 73 70 78 70 84C70 89 65 94 60 94C55 94 50 89 48 84L41 90C44 96 51 99 60 99C72 99 81 90 81 78C81 68 74 61 64 57C54 53 50 48 50 42C50 37 55 32 60 32C65 32 70 37 72 42L79 36C76 30 69 27 60 27C48 27 39 36 39 48C39 58 46 65 56 69C66 73 70 78 70 84C70 89 65 94 60 94C55 94 50 89 48 84L41 90C44 96 51 99 60 99C72 99 81 90 81 78C81 68 74 61 64 57C54 53 50 48 50 42C50 37 55 32 60 32Z" fill="url(#gradient)" transform="translate(39, 40)"/>
  
  <!-- Efeito de brilho -->
  <circle cx="90" cy="90" r="68" fill="url(#glow)" opacity="0.3"/>
  
  <defs>
    <linearGradient id="gradient" x1="0" y1="0" x2="180" y2="180" gradientUnits="userSpaceOnUse">
      <stop offset="0%" stop-color="#0ea5e9"/>
      <stop offset="50%" stop-color="#38bdf8"/>
      <stop offset="100%" stop-color="#0284c7"/>
    </linearGradient>
    <linearGradient id="gradientBg" x1="0" y1="0" x2="180" y2="180" gradientUnits="userSpaceOnUse">
      <stop offset="0%" stop-color="#0ea5e9"/>
      <stop offset="100%" stop-color="#0284c7"/>
    </linearGradient>
    <radialGradient id="glow" cx="50%" cy="50%">
      <stop offset="0%" stop-color="#0ea5e9" stop-opacity="0.5"/>
      <stop offset="100%" stop-color="#0ea5e9" stop-opacity="0"/>
    </radialGradient>
  </defs>
</svg>`;

  return new NextResponse(svg, {
    headers: {
      'Content-Type': 'image/svg+xml',
      'Cache-Control': 'public, max-age=31536000, immutable',
    },
  });
}

