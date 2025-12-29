import { Sidebar } from "@/components/layout/sidebar"
import { Header } from "@/components/layout/header"
import { Providers } from "@/components/providers"

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <Providers>
      {/* Skip link for keyboard navigation */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-gray-900 focus:text-white focus:rounded-md"
      >
        Pular para o conteúdo principal
      </a>
      <div className="flex min-h-screen bg-[#fafafa]">
        <Sidebar />
        <div className="flex-1 flex flex-col">
          <Header />
          <main id="main-content" className="flex-1 p-8" role="main" tabIndex={-1}>
            {children}
          </main>
        </div>
      </div>
    </Providers>
  )
}
