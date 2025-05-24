"use client"

import { motion } from "framer-motion"
import Image from "next/image"
import Link from "next/link"
import { InteractiveChat } from "./InteractiveChat"

export function Hero() {
  return (
    <section className="overflow-hidden py-24 md:py-32 bg-white">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-screen-xl">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-center">
          {/* Coluna de texto */}
          <div className="max-w-2xl">
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="text-[2.75rem] font-semibold leading-[1.2] tracking-tight text-black mb-6"
            >
              Trading de criptomoedas com IA intuitiva
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="text-xl text-black mb-8"
            >
              Realize operações de alto desempenho com integrações simples, API robusta e documentação detalhada.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="flex flex-col sm:flex-row gap-4"
            >
              <Link
                href="/auth/register"
                className="bg-[#5957D5] hover:bg-[#4F4EC0] text-white px-6 py-3 rounded-md font-medium text-center transition-colors"
              >
                Começar grátis
              </Link>

              <Link
                href="#api"
                className="bg-white border border-gray-200 hover:bg-gray-50 text-[#0F1115] px-6 py-3 rounded-md font-medium text-center transition-colors"
              >
                API Reference
              </Link>
            </motion.div>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="mt-8 text-sm text-black flex flex-wrap gap-x-6 gap-y-2"
            >
              <div className="flex items-center gap-2">
                <svg viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5 text-[#5957D5]">
                  <path fillRule="evenodd" d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z" clipRule="evenodd" />
                </svg>
                <span>Testar gratuitamente</span>
              </div>
              <div className="flex items-center gap-2">
                <svg viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5 text-[#5957D5]">
                  <path fillRule="evenodd" d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z" clipRule="evenodd" />
                </svg>
                <span>Suporte 24/7</span>
              </div>
              <div className="flex items-center gap-2">
                <svg viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5 text-[#5957D5]">
                  <path fillRule="evenodd" d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z" clipRule="evenodd" />
                </svg>
                <span>99,5% de uptime garantido</span>
              </div>
            </motion.div>
          </div>

          {/* Coluna do Chat Interativo */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.7 }}
            className="relative"
          >
            <InteractiveChat />

            {/* Elementos decorativos */}
            <div className="absolute -top-4 -right-4 w-20 h-20 bg-[#d8f3ff] rounded-full blur-2xl opacity-60"></div>
            <div className="absolute -bottom-6 -left-6 w-24 h-24 bg-[#d8f3ff] rounded-full blur-2xl opacity-60"></div>
          </motion.div>
        </div>
      </div>
    </section>
  )
}
