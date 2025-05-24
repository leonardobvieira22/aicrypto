/** @type {import('next').NextConfig} */
const nextConfig = {
  // Configuração das variáveis de ambiente
  env: {
    // Variáveis públicas (expostas no cliente)
    NEXT_PUBLIC_BINANCE_API_KEY: process.env.NEXT_PUBLIC_BINANCE_API_KEY,
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL || process.env.NEXTAUTH_URL,
    
    // Variáveis privadas (apenas no servidor)
    BINANCE_API_SECRET: process.env.BINANCE_API_SECRET,
    DATABASE_URL: process.env.DATABASE_URL,
    NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET,
    NEXTAUTH_URL: process.env.NEXTAUTH_URL,
    JWT_SECRET: process.env.JWT_SECRET,
    MAILERSEND_API_TOKEN: process.env.MAILERSEND_API_TOKEN,
    ADMIN_EMAIL: process.env.ADMIN_EMAIL,
  },
  
  // Configuração de imagens otimizada
  images: {
    unoptimized: true, // Necessário para AWS Amplify
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
  
  // Configurações de produção
  reactStrictMode: true,
  swcMinify: true, // Usar SWC para minificação (mais rápido)
  
  // Configurações específicas para AWS Lambda/Amplify
  experimental: {
    // Otimizações para serverless
    serverComponentsExternalPackages: ['@prisma/client'],
  },
  
  // Configuração de output para AWS Amplify
  output: 'standalone',
  
  // Headers de segurança
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'origin-when-cross-origin',
          },
        ],
      },
    ]
  },
  
  // Configuração de webpack para otimizações
  webpack: (config, { buildId, dev, isServer, defaultLoaders, webpack }) => {
    // Otimizações para produção
    if (!dev && isServer) {
      // Configurações específicas para o servidor em produção
      config.optimization.splitChunks = {
        chunks: 'all',
        cacheGroups: {
          default: false,
          vendors: false,
          // Chunk específico para Prisma
          prisma: {
            name: 'prisma',
            chunks: 'all',
            test: /[\\/]node_modules[\\/](@prisma|prisma)[\\/]/,
            priority: 20,
          },
        },
      }
    }
    
    return config
  },
}

module.exports = nextConfig
