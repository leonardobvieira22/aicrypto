"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { cn } from "@/lib/utils"
import {
  LayoutDashboard,
  BarChart3,
  ListOrdered,
  Users,
  Wallet,
  Settings,
  HelpCircle,
  Bell,
  User,
  Menu,
  X,
  CandlestickChart,
  BellRing,
  LineChart,
  PencilRuler,
  LogOut,
  Search,
  ChevronRight,
  Home,
  Bot
} from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { useAuth } from "@/lib/context/AuthContext"
import { toast } from "sonner"

const sidebarItems = [
  {
    title: "Dashboard",
    href: "/dashboard",
    icon: <Home className="h-5 w-5" />,
    category: "main"
  },
  {
    title: "Robôs de IA",
    href: "/dashboard/robots",
    icon: <Bot className="h-5 w-5" />,
    category: "trading"
  },
  {
    title: "Trading",
    href: "/dashboard/trading",
    icon: <CandlestickChart className="h-5 w-5" />,
    category: "trading"
  },
  {
    title: "Backtesting",
    href: "/dashboard/backtesting",
    icon: <LineChart className="h-5 w-5" />,
    category: "trading"
  },
  {
    title: "Paper Trading",
    href: "/dashboard/paper-trading",
    icon: <PencilRuler className="h-5 w-5" />,
    category: "trading"
  },
  {
    title: "Alertas",
    href: "/dashboard/alerts",
    icon: <BellRing className="h-5 w-5" />,
    category: "tools"
  },
  {
    title: "Histórico",
    href: "/dashboard/history",
    icon: <ListOrdered className="h-5 w-5" />,
    category: "tools"
  },
  {
    title: "Copy Trading",
    href: "/dashboard/copy-trading",
    icon: <Users className="h-5 w-5" />,
    category: "tools"
  },
  {
    title: "Carteira",
    href: "/dashboard/wallet",
    icon: <Wallet className="h-5 w-5" />,
    category: "account"
  },
  {
    title: "Configurações",
    href: "/dashboard/settings",
    icon: <Settings className="h-5 w-5" />,
    category: "account"
  },
  {
    title: "Suporte",
    href: "/dashboard/support",
    icon: <HelpCircle className="h-5 w-5" />,
    category: "account"
  },
]

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const pathname = usePathname()
  const router = useRouter()
  const { logout } = useAuth()

  const handleLogout = async () => {
    try {
      await logout()
      toast.success("Logout realizado com sucesso!")
      router.push("/auth/login")
    } catch (error) {
      toast.error("Erro ao fazer logout. Tente novamente.")
    }
  }

  const groupedItems = {
    main: sidebarItems.filter(item => item.category === 'main'),
    trading: sidebarItems.filter(item => item.category === 'trading'),
    tools: sidebarItems.filter(item => item.category === 'tools'),
    account: sidebarItems.filter(item => item.category === 'account'),
  }

  const SidebarContent = () => (
    <div className="flex h-full flex-col">
      {/* Logo */}
      <div className="flex items-center px-6 py-6 border-b border-gray-800/50">
        <Link href="/dashboard" className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-sm">AI</span>
          </div>
          <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-400">
            Stakent
          </span>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 py-6 space-y-8 overflow-y-auto">
        {/* Main */}
        <div>
          <div className="flex items-center text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3 px-2">
            Principal
          </div>
          <div className="space-y-1">
            {groupedItems.main.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "group flex items-center px-3 py-2.5 text-sm font-medium rounded-lg transition-all duration-200",
                  pathname === item.href
                    ? "bg-gradient-to-r from-blue-600/20 to-purple-600/20 text-blue-400 border-r-2 border-blue-400"
                    : "text-gray-300 hover:text-white hover:bg-gray-800/50"
                )}
              >
                <span className={cn(
                  "transition-colors duration-200",
                  pathname === item.href ? "text-blue-400" : "text-gray-400 group-hover:text-white"
                )}>
                  {item.icon}
                </span>
                <span className="ml-3">{item.title}</span>
                {pathname === item.href && (
                  <ChevronRight className="ml-auto h-4 w-4 text-blue-400" />
                )}
              </Link>
            ))}
          </div>
        </div>

        {/* Trading */}
        <div>
          <div className="flex items-center text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3 px-2">
            Trading
          </div>
          <div className="space-y-1">
            {groupedItems.trading.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "group flex items-center px-3 py-2.5 text-sm font-medium rounded-lg transition-all duration-200",
                  pathname === item.href
                    ? "bg-gradient-to-r from-blue-600/20 to-purple-600/20 text-blue-400 border-r-2 border-blue-400"
                    : "text-gray-300 hover:text-white hover:bg-gray-800/50"
                )}
              >
                <span className={cn(
                  "transition-colors duration-200",
                  pathname === item.href ? "text-blue-400" : "text-gray-400 group-hover:text-white"
                )}>
                  {item.icon}
                </span>
                <span className="ml-3">{item.title}</span>
                {pathname === item.href && (
                  <ChevronRight className="ml-auto h-4 w-4 text-blue-400" />
                )}
              </Link>
            ))}
          </div>
        </div>

        {/* Tools */}
        <div>
          <div className="flex items-center text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3 px-2">
            Ferramentas
          </div>
          <div className="space-y-1">
            {groupedItems.tools.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "group flex items-center px-3 py-2.5 text-sm font-medium rounded-lg transition-all duration-200",
                  pathname === item.href
                    ? "bg-gradient-to-r from-blue-600/20 to-purple-600/20 text-blue-400 border-r-2 border-blue-400"
                    : "text-gray-300 hover:text-white hover:bg-gray-800/50"
                )}
              >
                <span className={cn(
                  "transition-colors duration-200",
                  pathname === item.href ? "text-blue-400" : "text-gray-400 group-hover:text-white"
                )}>
                  {item.icon}
                </span>
                <span className="ml-3">{item.title}</span>
                {pathname === item.href && (
                  <ChevronRight className="ml-auto h-4 w-4 text-blue-400" />
                )}
              </Link>
            ))}
          </div>
        </div>

        {/* Account */}
        <div>
          <div className="flex items-center text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3 px-2">
            Conta
          </div>
          <div className="space-y-1">
            {groupedItems.account.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "group flex items-center px-3 py-2.5 text-sm font-medium rounded-lg transition-all duration-200",
                  pathname === item.href
                    ? "bg-gradient-to-r from-blue-600/20 to-purple-600/20 text-blue-400 border-r-2 border-blue-400"
                    : "text-gray-300 hover:text-white hover:bg-gray-800/50"
                )}
              >
                <span className={cn(
                  "transition-colors duration-200",
                  pathname === item.href ? "text-blue-400" : "text-gray-400 group-hover:text-white"
                )}>
                  {item.icon}
                </span>
                <span className="ml-3">{item.title}</span>
                {pathname === item.href && (
                  <ChevronRight className="ml-auto h-4 w-4 text-blue-400" />
                )}
              </Link>
            ))}
          </div>
        </div>
      </nav>

      {/* User Profile */}
      <div className="border-t border-gray-800/50 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
              <span className="text-white font-semibold text-sm">JS</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white truncate">
                João Silva
              </p>
              <p className="text-xs text-gray-400 truncate">
                Plano Gratuito
              </p>
            </div>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-gray-400 hover:text-white hover:bg-gray-800/50"
              >
                <Settings className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56 bg-gray-900 border-gray-800">
              <DropdownMenuLabel className="text-gray-300">Minha Conta</DropdownMenuLabel>
              <DropdownMenuSeparator className="bg-gray-800" />
              <DropdownMenuItem className="text-gray-300 hover:text-white hover:bg-gray-800">
                <User className="mr-2 h-4 w-4" />
                Perfil
              </DropdownMenuItem>
              <DropdownMenuItem className="text-gray-300 hover:text-white hover:bg-gray-800">
                <Settings className="mr-2 h-4 w-4" />
                Configurações
              </DropdownMenuItem>
              <DropdownMenuItem className="text-gray-300 hover:text-white hover:bg-gray-800">
                <HelpCircle className="mr-2 h-4 w-4" />
                Suporte
              </DropdownMenuItem>
              <DropdownMenuSeparator className="bg-gray-800" />
              <DropdownMenuItem 
                onClick={handleLogout}
                className="text-red-400 hover:text-red-300 hover:bg-red-900/20"
              >
                <LogOut className="mr-2 h-4 w-4" />
                Sair
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </div>
  )

  return (
    <div className="flex h-screen bg-gray-950">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex lg:w-72 lg:flex-col bg-gray-900 border-r border-gray-800">
        <SidebarContent />
      </aside>

      {/* Mobile Sidebar */}
      <Sheet open={isSidebarOpen} onOpenChange={setIsSidebarOpen}>
        <SheetContent side="left" className="w-72 p-0 bg-gray-900 border-gray-800">
          <SidebarContent />
        </SheetContent>
      </Sheet>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Header */}
        <header className="bg-gray-900/50 backdrop-blur-xl border-b border-gray-800/50 sticky top-0 z-40">
          <div className="flex h-16 items-center justify-between px-4 lg:px-6">
            {/* Mobile Menu Button */}
            <div className="flex items-center lg:hidden">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsSidebarOpen(true)}
                className="text-gray-400 hover:text-white hover:bg-gray-800/50"
              >
                <Menu className="h-6 w-6" />
              </Button>
            </div>

            {/* Search */}
            <div className="flex-1 max-w-md mx-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Pesquisar..."
                  className="w-full h-10 pl-10 pr-4 bg-gray-800/50 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-transparent transition-all duration-200"
                />
              </div>
            </div>

            {/* Right Section */}
            <div className="flex items-center space-x-3">
              {/* Notifications */}
              <Button
                variant="ghost"
                size="icon"
                className="relative text-gray-400 hover:text-white hover:bg-gray-800/50"
              >
                <Bell className="h-5 w-5" />
                <span className="absolute -top-1 -right-1 h-3 w-3 bg-blue-500 rounded-full border-2 border-gray-900"></span>
              </Button>

              {/* User Menu - Mobile */}
              <div className="lg:hidden">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-gray-400 hover:text-white hover:bg-gray-800/50"
                    >
                      <User className="h-5 w-5" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56 bg-gray-900 border-gray-800">
                    <DropdownMenuLabel className="text-gray-300">João Silva</DropdownMenuLabel>
                    <DropdownMenuSeparator className="bg-gray-800" />
                    <DropdownMenuItem className="text-gray-300 hover:text-white hover:bg-gray-800">
                      <User className="mr-2 h-4 w-4" />
                      Perfil
                    </DropdownMenuItem>
                    <DropdownMenuItem className="text-gray-300 hover:text-white hover:bg-gray-800">
                      <Settings className="mr-2 h-4 w-4" />
                      Configurações
                    </DropdownMenuItem>
                    <DropdownMenuItem className="text-gray-300 hover:text-white hover:bg-gray-800">
                      <HelpCircle className="mr-2 h-4 w-4" />
                      Suporte
                    </DropdownMenuItem>
                    <DropdownMenuSeparator className="bg-gray-800" />
                    <DropdownMenuItem 
                      onClick={handleLogout}
                      className="text-red-400 hover:text-red-300 hover:bg-red-900/20"
                    >
                      <LogOut className="mr-2 h-4 w-4" />
                      Sair
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          </div>
        </header>

        {/* Main Content Area */}
        <main className="flex-1 overflow-y-auto bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950">
          <div className="p-4 lg:p-6">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}
