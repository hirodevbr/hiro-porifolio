/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**.discordapp.com',
      },
      {
        protocol: 'https',
        hostname: '**.githubusercontent.com',
      },
      {
        protocol: 'https',
        hostname: '**.scdn.co',
      },
    ],
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
  },
  webpack: (config, { dev }) => {
    // Windows às vezes falha ao renomear arquivos do cache do webpack no dev (ENOENT/locks/AV).
    // Forçar cache em memória evita esses warnings e costuma estabilizar o HMR.
    if (dev) {
      config.cache = { type: "memory" };
    }
    return config;
  },
}

module.exports = nextConfig

