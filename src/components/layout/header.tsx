"use client"

import { useSession } from "next-auth/react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

export function Header() {
  const { data: session } = useSession()

  const initials = session?.user?.name
    ?.split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2) || "PS"

  return (
    <header className="h-14 border-b border-gray-100 bg-white/80 backdrop-blur-xl flex items-center justify-end px-6">
      <div className="flex items-center gap-3">
        <span className="text-sm text-gray-500">
          {session?.user?.name?.split(" ")[0]}
        </span>
        <Avatar className="h-8 w-8">
          <AvatarImage src={(session?.user as { image?: string })?.image || undefined} />
          <AvatarFallback className="bg-gray-100 text-gray-600 text-xs font-medium">
            {initials}
          </AvatarFallback>
        </Avatar>
      </div>
    </header>
  )
}
