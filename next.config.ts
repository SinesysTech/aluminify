import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Otimizações para produção
  reactStrictMode: true,
  
  // Configuração para Vercel (SSR por padrão)
  output: undefined,
  
  // Otimizações de imagens
  images: {
    formats: ["image/avif", "image/webp"],
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**.supabase.co",
      },
    ],
  },
  
  // Compressão e otimizações
  compress: true,
  
  // Configurações de produção
  poweredByHeader: false,
  
  // Otimizações de bundle
  experimental: {
    optimizePackageImports: [
      "@radix-ui/react-accordion",
      "@radix-ui/react-dialog",
      "@radix-ui/react-dropdown-menu",
      "@radix-ui/react-select",
      "lucide-react",
    ],
  },

  // Configuração do Turbopack para tratar dependências opcionais
  turbopack: {
    resolveAlias: {
      '@aws-sdk/client-s3': false,
    },
  },
};

export default nextConfig;
