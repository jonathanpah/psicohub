"use client"

import { useEffect } from "react"

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // Log error to external service in production
    if (process.env.NODE_ENV === "production") {
      // TODO: Send to Sentry/LogRocket
    }
  }, [error])

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#fafafa] px-4">
      <div className="text-center">
        <h1 className="text-6xl font-bold text-gray-200 mb-4">Ops!</h1>
        <h2 className="text-xl font-medium text-gray-900 mb-2">
          Algo deu errado
        </h2>
        <p className="text-gray-500 mb-6">
          Ocorreu um erro inesperado. Por favor, tente novamente.
        </p>
        <div className="space-x-4">
          <button
            onClick={() => reset()}
            className="inline-flex items-center justify-center px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors"
          >
            Tentar novamente
          </button>
          <a
            href="/dashboard"
            className="inline-flex items-center justify-center px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Voltar ao início
          </a>
        </div>
        {process.env.NODE_ENV === "development" && (
          <details className="mt-8 text-left max-w-lg mx-auto">
            <summary className="text-sm text-gray-500 cursor-pointer">
              Detalhes do erro (desenvolvimento)
            </summary>
            <pre className="mt-2 p-4 bg-gray-100 rounded-lg text-xs overflow-auto">
              {error.message}
              {error.stack && `\n\n${error.stack}`}
            </pre>
          </details>
        )}
      </div>
    </div>
  )
}
