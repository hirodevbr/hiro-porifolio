import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { LanguageProvider } from "@/contexts/LanguageContext";
import RegisterSW from "@/components/RegisterSW";
import Analytics from "@/components/Analytics";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: {
    default: "Samuel (hiro) - Desenvolvedor Full Stack",
    template: "%s | Samuel (hiro)",
  },
  description: "Portfólio de Samuel (hiro) - Desenvolvedor Full Stack apaixonado por criar soluções incríveis com código. Especialista em React, Next.js, TypeScript e desenvolvimento web moderno.",
  keywords: [
    "desenvolvedor full stack",
    "desenvolvedor web",
    "React",
    "Next.js",
    "TypeScript",
    "JavaScript",
    "portfólio",
    "desenvolvedor frontend",
    "desenvolvedor backend",
    "web development",
    "Samuel hiro",
    "hirodevbr",
  ],
  authors: [{ name: "Samuel (hiro)" }],
  creator: "Samuel (hiro)",
  publisher: "Samuel (hiro)",
  metadataBase: new URL("https://samuel-hiro.dev"), // Substitua pela sua URL real
  alternates: {
    canonical: "/",
    languages: {
      "pt-BR": "/pt-BR",
      "en-US": "/en-US",
    },
  },
  openGraph: {
    type: "website",
    locale: "pt_BR",
    alternateLocale: ["en_US"],
    url: "https://samuel-hiro.dev", // Substitua pela sua URL real
    siteName: "Samuel (hiro) - Portfólio",
    title: "Samuel (hiro) - Desenvolvedor Full Stack",
    description: "Portfólio de Samuel (hiro) - Desenvolvedor Full Stack apaixonado por criar soluções incríveis com código. Especialista em React, Next.js, TypeScript e desenvolvimento web moderno.",
    images: [
      {
        url: "/og-image.png", // Você pode criar uma imagem OG personalizada
        width: 1200,
        height: 630,
        alt: "Samuel (hiro) - Desenvolvedor Full Stack",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Samuel (hiro) - Desenvolvedor Full Stack",
    description: "Portfólio de Samuel (hiro) - Desenvolvedor Full Stack apaixonado por criar soluções incríveis com código.",
    creator: "@virtualhiro",
    images: ["/og-image.png"], // Mesma imagem do Open Graph
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  verification: {
    // Adicione suas verificações aqui quando tiver
    // google: "seu-codigo-google",
    // yandex: "seu-codigo-yandex",
    // yahoo: "seu-codigo-yahoo",
  },
  icons: {
    icon: [
      { url: "/icon.svg", type: "image/svg+xml" },
      { url: "/favicon.ico", sizes: "any" },
    ],
    apple: "/apple-touch-icon.png",
  },
  manifest: "/site.webmanifest",
  category: "technology",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <body className={inter.className}>
        <LanguageProvider>
          {children}
          <RegisterSW />
          <Analytics />
        </LanguageProvider>
      </body>
    </html>
  );
}

