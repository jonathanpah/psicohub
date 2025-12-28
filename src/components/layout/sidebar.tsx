"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import {
  LayoutDashboard,
  Users,
  Calendar,
  DollarSign,
  User,
  LogOut,
  PlusCircle,
} from "lucide-react"
import { signOut } from "next-auth/react"

const menuItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/pacientes", label: "Pacientes", icon: Users },
  { href: "/agenda", label: "Agenda", icon: Calendar },
  { href: "/financeiro", label: "Financeiro", icon: DollarSign },
  { href: "/perfil", label: "Perfil", icon: User },
]

export function Sidebar() {
  const pathname = usePathname()

  return (
    <aside className="w-60 bg-white/80 backdrop-blur-xl border-r border-gray-100 min-h-screen flex flex-col">
      <div className="px-6 py-8">
        <h1 className="text-xl font-semibold tracking-tight text-gray-900">
          PsicoHub
        </h1>
        <p className="text-[10px] text-gray-400 tracking-wide mt-0.5">
          Gestão & Psicologia
        </p>
      </div>

      <nav className="flex-1 px-3">
        {/* Botão de Novo Atendimento */}
        <Link
          href="/novo-atendimento"
          className="flex items-center gap-3 px-3 py-2.5 mb-4 rounded-lg text-sm font-medium bg-gray-900 text-white hover:bg-gray-800 transition-all duration-200"
        >
          <PlusCircle className="h-[18px] w-[18px]" strokeWidth={1.5} />
          Novo Atendimento
        </Link>

        <ul className="space-y-1">
          {menuItems.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`)
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all duration-200",
                    isActive
                      ? "bg-gray-900 text-white font-medium"
                      : "text-gray-500 hover:text-gray-900 hover:bg-gray-50"
                  )}
                >
                  <item.icon className={cn(
                    "h-[18px] w-[18px]",
                    isActive ? "text-white" : "text-gray-400"
                  )} strokeWidth={1.5} />
                  {item.label}
                </Link>
              </li>
            )
          })}
        </ul>
      </nav>

      <div className="px-3 py-6">
        <button
          onClick={() => signOut({ callbackUrl: "/login" })}
          className="flex items-center gap-3 px-3 py-2.5 w-full text-sm text-gray-400 hover:text-gray-600 rounded-lg transition-all duration-200"
        >
          <LogOut className="h-[18px] w-[18px]" strokeWidth={1.5} />
          Sair
        </button>
      </div>
    </aside>
  )
}
