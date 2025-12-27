import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import {
  Users,
  Calendar,
  FileText,
  DollarSign,
  Bell,
  Shield,
  CheckCircle,
} from "lucide-react"

const features = [
  {
    icon: Users,
    title: "Gestão de Pacientes",
    description:
      "Cadastro completo com histórico, status e informações de contato organizadas.",
  },
  {
    icon: Calendar,
    title: "Agenda Inteligente",
    description:
      "Calendário visual com agendamento de sessões, recorrência e controle de status.",
  },
  {
    icon: FileText,
    title: "Prontuário Eletrônico",
    description:
      "Anotações clínicas seguras, evolução do paciente e histórico pesquisável.",
  },
  {
    icon: DollarSign,
    title: "Controle Financeiro",
    description:
      "Pagamentos, recibos em PDF e relatórios de faturamento mensal.",
  },
  {
    icon: Bell,
    title: "Notificações",
    description:
      "Lembretes automáticos por email e WhatsApp para seus pacientes.",
  },
  {
    icon: Shield,
    title: "Segurança LGPD",
    description:
      "Dados criptografados e em conformidade com a legislação brasileira.",
  },
]

const benefits = [
  "Acesse de qualquer lugar",
  "Dados seguros na nuvem",
  "Interface simples e intuitiva",
  "Suporte dedicado",
]

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="border-b border-gray-100">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900">Psicohub</h1>
          <div className="flex items-center gap-4">
            <Link href="/login">
              <Button variant="ghost">Entrar</Button>
            </Link>
            <Link href="/register">
              <Button>Criar conta</Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="py-20 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
            Gerencie seu consultório de psicologia com{" "}
            <span className="text-blue-600">simplicidade</span>
          </h2>
          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            Pacientes, agenda, prontuário e financeiro em um só lugar. Foque no
            que importa: cuidar dos seus pacientes.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/register">
              <Button size="lg" className="text-lg px-8">
                Começar gratuitamente
              </Button>
            </Link>
            <Link href="#funcionalidades">
              <Button size="lg" variant="outline" className="text-lg px-8">
                Ver funcionalidades
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="funcionalidades" className="py-20 px-4 bg-gray-50">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h3 className="text-3xl font-bold text-gray-900 mb-4">
              Tudo que você precisa
            </h3>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Ferramentas completas para gerenciar 100% do relacionamento com
              seus pacientes.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature) => (
              <Card key={feature.title} className="border-0 shadow-sm">
                <CardContent className="pt-6">
                  <div className="h-12 w-12 rounded-lg bg-blue-100 flex items-center justify-center mb-4">
                    <feature.icon className="h-6 w-6 text-blue-600" />
                  </div>
                  <h4 className="text-lg font-semibold text-gray-900 mb-2">
                    {feature.title}
                  </h4>
                  <p className="text-gray-600">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits */}
      <section className="py-20 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <h3 className="text-3xl font-bold text-gray-900 mb-6">
                Feito por quem entende a rotina do psicólogo
              </h3>
              <ul className="space-y-4">
                {benefits.map((benefit) => (
                  <li key={benefit} className="flex items-center gap-3">
                    <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0" />
                    <span className="text-gray-700">{benefit}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="bg-gray-100 rounded-2xl p-8 text-center">
              <div className="text-4xl font-bold text-gray-900 mb-2">
                Grátis
              </div>
              <p className="text-gray-600 mb-6">para começar</p>
              <Link href="/register">
                <Button size="lg" className="w-full">
                  Criar minha conta
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-4 bg-blue-600">
        <div className="max-w-4xl mx-auto text-center">
          <h3 className="text-3xl font-bold text-white mb-4">
            Pronto para organizar seu consultório?
          </h3>
          <p className="text-blue-100 mb-8">
            Comece agora e tenha controle total dos seus pacientes.
          </p>
          <Link href="/register">
            <Button
              size="lg"
              variant="secondary"
              className="text-lg px-8"
            >
              Criar conta gratuita
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-4 border-t border-gray-100">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="text-gray-600">
            &copy; {new Date().getFullYear()} Psicohub. Todos os direitos
            reservados.
          </div>
          <div className="flex gap-6 text-sm text-gray-500">
            <a href="#" className="hover:text-gray-900">
              Termos de Uso
            </a>
            <a href="#" className="hover:text-gray-900">
              Privacidade
            </a>
            <a href="#" className="hover:text-gray-900">
              Contato
            </a>
          </div>
        </div>
      </footer>
    </div>
  )
}
