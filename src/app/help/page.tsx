import { Metadata } from 'next'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { 
  HelpCircle, 
  BookOpen, 
  MessageSquare, 
  Mail, 
  Phone, 
  Globe,
  Shield,
  Zap,
  BarChart3,
  Bot
} from 'lucide-react'

export const metadata: Metadata = {
  title: 'Ajuda e Suporte | Crypto Trading Platform',
  description: 'Central de ajuda e suporte para usuários da plataforma de trading de criptomoedas.',
}

export default function HelpPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4">Como podemos ajudar?</h1>
          <p className="text-lg text-muted-foreground">
            Encontre respostas para suas dúvidas ou entre em contato com nossa equipe de suporte.
          </p>
        </div>

        <div className="grid gap-8 md:grid-cols-2 mb-12">
          {/* Documentação */}
          <div className="p-6 rounded-lg border bg-card">
            <div className="flex items-center gap-4 mb-4">
              <BookOpen className="h-8 w-8 text-primary" />
              <h2 className="text-2xl font-semibold">Documentação</h2>
            </div>
            <p className="text-muted-foreground mb-4">
              Guias detalhados sobre como usar a plataforma, desde o básico até recursos avançados.
            </p>
            <Button asChild variant="outline" className="w-full">
              <Link href="/docs">
                Acessar Documentação
              </Link>
            </Button>
          </div>

          {/* FAQ */}
          <div className="p-6 rounded-lg border bg-card">
            <div className="flex items-center gap-4 mb-4">
              <HelpCircle className="h-8 w-8 text-primary" />
              <h2 className="text-2xl font-semibold">FAQ</h2>
            </div>
            <p className="text-muted-foreground mb-4">
              Perguntas frequentes sobre a plataforma, trading e criptomoedas.
            </p>
            <Button asChild variant="outline" className="w-full">
              <Link href="/faq">
                Ver Perguntas Frequentes
              </Link>
            </Button>
          </div>

          {/* Comunidade */}
          <div className="p-6 rounded-lg border bg-card">
            <div className="flex items-center gap-4 mb-4">
              <MessageSquare className="h-8 w-8 text-primary" />
              <h2 className="text-2xl font-semibold">Comunidade</h2>
            </div>
            <p className="text-muted-foreground mb-4">
              Participe da nossa comunidade, compartilhe experiências e aprenda com outros traders.
            </p>
            <Button asChild variant="outline" className="w-full">
              <Link href="/community">
                Acessar Comunidade
              </Link>
            </Button>
          </div>

          {/* Suporte */}
          <div className="p-6 rounded-lg border bg-card">
            <div className="flex items-center gap-4 mb-4">
              <Mail className="h-8 w-8 text-primary" />
              <h2 className="text-2xl font-semibold">Suporte</h2>
            </div>
            <p className="text-muted-foreground mb-4">
              Entre em contato com nossa equipe de suporte para ajuda personalizada.
            </p>
            <Button asChild variant="outline" className="w-full">
              <Link href="/support">
                Contatar Suporte
              </Link>
            </Button>
          </div>
        </div>

        {/* Recursos */}
        <div className="mb-12">
          <h2 className="text-2xl font-semibold mb-6">Recursos Disponíveis</h2>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="flex items-center gap-3 p-4 rounded-lg border bg-card">
              <Shield className="h-6 w-6 text-primary" />
              <span>Segurança</span>
            </div>
            <div className="flex items-center gap-3 p-4 rounded-lg border bg-card">
              <Zap className="h-6 w-6 text-primary" />
              <span>Trading</span>
            </div>
            <div className="flex items-center gap-3 p-4 rounded-lg border bg-card">
              <BarChart3 className="h-6 w-6 text-primary" />
              <span>Análise</span>
            </div>
            <div className="flex items-center gap-3 p-4 rounded-lg border bg-card">
              <Bot className="h-6 w-6 text-primary" />
              <span>Robôs</span>
            </div>
            <div className="flex items-center gap-3 p-4 rounded-lg border bg-card">
              <Globe className="h-6 w-6 text-primary" />
              <span>Mercado</span>
            </div>
            <div className="flex items-center gap-3 p-4 rounded-lg border bg-card">
              <Phone className="h-6 w-6 text-primary" />
              <span>Mobile</span>
            </div>
          </div>
        </div>

        {/* Contato */}
        <div className="text-center">
          <h2 className="text-2xl font-semibold mb-4">Precisa de mais ajuda?</h2>
          <p className="text-muted-foreground mb-6">
            Nossa equipe está disponível 24/7 para ajudar você.
          </p>
          <Button asChild size="lg">
            <Link href="/contact">
              Fale Conosco
            </Link>
          </Button>
        </div>
      </div>
    </div>
  )
} 