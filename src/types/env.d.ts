declare namespace NodeJS {
  interface ProcessEnv {
    // Database
    DATABASE_URL: string
    
    // NextAuth
    NEXTAUTH_SECRET: string
    NEXTAUTH_URL: string
    
    // JWT
    JWT_SECRET: string
    
    // Binance API
    NEXT_PUBLIC_BINANCE_API_KEY?: string
    BINANCE_API_SECRET?: string
    NEXT_PUBLIC_DEMO_MODE?: string
  }
} 