import { auth } from "@/lib/auth"
import { NextResponse } from "next/server"

export default auth((req) => {
  const isLoggedIn = !!req.auth
  const isAuthPage = req.nextUrl.pathname.startsWith("/login") ||
                     req.nextUrl.pathname.startsWith("/register")
  const isDashboard = req.nextUrl.pathname.startsWith("/dashboard") ||
                      req.nextUrl.pathname.startsWith("/pacientes") ||
                      req.nextUrl.pathname.startsWith("/agenda") ||
                      req.nextUrl.pathname.startsWith("/financeiro") ||
                      req.nextUrl.pathname.startsWith("/perfil")

  if (isAuthPage && isLoggedIn) {
    return NextResponse.redirect(new URL("/dashboard", req.nextUrl))
  }

  if (isDashboard && !isLoggedIn) {
    return NextResponse.redirect(new URL("/login", req.nextUrl))
  }

  return NextResponse.next()
})

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/pacientes/:path*",
    "/agenda/:path*",
    "/financeiro/:path*",
    "/perfil/:path*",
    "/login",
    "/register",
  ],
}
