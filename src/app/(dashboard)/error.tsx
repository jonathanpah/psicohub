"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { AlertTriangle } from "lucide-react"
import { Button } from "@/components/ui/button"

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  const router = useRouter()

  useEffect(() => {
    if (process.env.NODE_ENV === "production") {
      // TODO: Send to Sentry/LogRocket
    }
  }, [error])

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] px-4">
      <AlertTriangle className="h-12 w-12 text-amber-500 mb-4" />
      <h2 className="text-xl font-medium text-gray-900 mb-2">
        Erro ao carregar página
      </h2>
      <p className="text-gray-500 mb-6 text-center max-w-md">
        Ocorreu um erro ao carregar esta página. Isso pode ser um problema
        temporário.
      </p>
      <div className="flex gap-3">
        <Button onClick={() => reset()}>Tentar novamente</Button>
        <Button variant="outline" onClick={() => router.push("/dashboard")}>
          Ir para Dashboard
        </Button>
      </div>
      {process.env.NODE_ENV === "development" && (
        <details className="mt-8 text-left w-full max-w-lg">
          <summary className="text-sm text-gray-500 cursor-pointer">
            Detalhes do erro
          </summary>
          <pre className="mt-2 p-4 bg-gray-100 rounded-lg text-xs overflow-auto">
            {error.message}
          </pre>
        </details>
      )}
    </div>
  )
}
