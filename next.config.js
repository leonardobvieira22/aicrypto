/** @type {import('next').NextConfig} */
const nextConfig = {
  // Configuração das variáveis de ambiente
  env: {
    NEXT_PUBLIC_BINANCE_API_KEY: process.env.NEXT_PUBLIC_BINANCE_API_KEY,
    BINANCE_API_SECRET: process.env.BINANCE_API_SECRET,
  },
  images: {
    unoptimized: true,
    domains: [
      "source.unsplash.com",
      "images.unsplash.com",
      "ext.same-assets.com",
      "ugc.same-assets.com",
    ],
    remotePatterns: [
      {
        protocol: "https",
        hostname: "source.unsplash.com",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "images.unsplash.com",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "ext.same-assets.com",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "ugc.same-assets.com",
        pathname: "/**",
      },
    ],
  },
  // Configuração otimizada para AWS Amplify
  eslint: {
    ignoreDuringBuilds: true, // Ignora erros de ESLint durante o build
  },
  typescript: {
    ignoreBuildErrors: true, // Ignora erros de TypeScript durante o build
  },
  // Configura opção para o React em ambiente de produção
  reactStrictMode: true,
};

module.exports = nextConfig;
