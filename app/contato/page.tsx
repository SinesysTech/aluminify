import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
    title: 'Fale Conosco',
    description: 'Entre em contato com nossa equipe comercial.',
}

export default function ContactPage() {
    return (
        <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50 p-4">
            <div className="w-full max-w-lg space-y-8 rounded-xl bg-white p-8 shadow-lg text-center">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-gray-900">
                        Fale com nossos especialistas
                    </h1>
                    <p className="mt-4 text-gray-600">
                        Estamos prontos para ajudar sua instituição a crescer. Entre em contato para saber mais sobre nossos planos e soluções.
                    </p>
                </div>

                <div className="space-y-4">
                    <div className="rounded-lg bg-blue-50 p-4 text-blue-900">
                        <p className="font-medium">Email de contato</p>
                        <a href="mailto:contato@aluminify.com" className="text-blue-700 hover:underline">
                            contato@aluminify.com
                        </a>
                    </div>

                    <div className="text-sm text-gray-500">
                        Em breve, um formulário direto aqui.
                    </div>
                </div>

                <div className="mt-6">
                    <Link
                        href="/"
                        className="text-sm font-medium text-gray-600 hover:text-gray-900"
                    >
                        &larr; Voltar para a página inicial
                    </Link>
                </div>
            </div>
        </div>
    )
}
