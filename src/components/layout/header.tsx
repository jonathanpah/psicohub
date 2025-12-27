"use client"

import { useSession } from "next-auth/react"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"

export function Header() {
  const { data: session } = useSession()

  const initials = session?.user?.name
    ?.split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2) || "PS"

  return (
    <header className="h-16 border-b border-gray-200 bg-white flex items-center justify-between px-6">
      <div>
        <h2 className="text-lg font-semibold text-gray-900">
          Bem-vindo, {session?.user?.name?.split(" ")[0] || "Psicólogo"}
        </h2>
      </div>

      <div className="flex items-center gap-4">
        <Avatar>
          <AvatarFallback className="bg-blue-100 text-blue-700">
            {initials}
          </AvatarFallback>
        </Avatar>
      </div>
    </header>
  )
}
