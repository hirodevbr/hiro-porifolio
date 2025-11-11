/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: [
      'avatars.githubusercontent.com', 
      'cdn.discordapp.com', 
      'raw.githubusercontent.com',
      'i.scdn.co', // Spotify
      'mosaic.scdn.co', // Spotify
    ],
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
}

module.exports = nextConfig

