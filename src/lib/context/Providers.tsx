"use client"

import type React from 'react'
import { useEffect } from 'react'
import { ThemeProvider } from 'next-themes'
import { SessionProvider } from 'next-auth/react'
import { BinanceProvider } from './BinanceContext'
import { RobotProvider } from './RobotContext'
import { AuthProvider } from './AuthContext'
import { Toaster } from "sonner"
import { CookieConsent } from '@/components/CookieConsent'

export function Providers({ children }: { children: React.ReactNode }) {
  // Inicialização básica apenas no cliente
  useEffect(() => {
    if (typeof window !== 'undefined') {
      // Configurações básicas do cliente
      console.log('Providers initialized on client')
    }
  }, [])

  return (
    <SessionProvider>
      <ThemeProvider
        attribute="class"
        defaultTheme="dark"
        enableSystem
        storageKey="ai-crypto-theme"
        themes={['light', 'dark']}
      >
        <AuthProvider>
          <BinanceProvider>
            <RobotProvider>
              {children}
              <Toaster
                richColors
                closeButton
                position="top-right"
                theme="system"
                toastOptions={{
                  className: "group",
                  descriptionClassName: "text-muted-foreground text-sm",
                  duration: 5000,
                }}
              />
              <CookieConsent />
            </RobotProvider>
          </BinanceProvider>
        </AuthProvider>
      </ThemeProvider>
    </SessionProvider>
  )
}
