"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { AlertCircle } from "lucide-react"

interface ErrorStateProps {
  title: string
  message: string
  backHref: string
  backLabel: string
}

export function ErrorState({ title, message, backHref, backLabel }: ErrorStateProps) {
  return (
    <div className="flex items-center justify-center h-96">
      <Card className="w-full max-w-md">
        <CardContent className="pt-6">
          <div className="text-center space-y-4">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto">
              <AlertCircle className="h-8 w-8 text-red-600" />
            </div>
            <h2 className="text-xl font-medium text-gray-900">{title}</h2>
            <p className="text-gray-500">{message}</p>
            <Link href={backHref}>
              <Button>{backLabel}</Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
