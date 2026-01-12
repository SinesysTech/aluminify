import { NextResponse } from 'next/server'

export function GET() {
  const html = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="utf-8"/>
    <meta content="width=device-width, initial-scale=1.0" name="viewport"/>
    <title>Instância Pronta - Aluminify</title>
    <link href="https://fonts.googleapis.com" rel="preconnect"/>
    <link crossorigin="" href="https://fonts.gstatic.com" rel="preconnect"/>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&amp;family=Plus+Jakarta+Sans:wght@400;500;600;700&amp;family=JetBrains+Mono:wght@400;500&amp;display=swap" rel="stylesheet"/>
    <link href="https://fonts.googleapis.com/icon?family=Material+Icons+Outlined" rel="stylesheet"/>
    <script src="https://cdn.tailwindcss.com"></script>
    <script>
      tailwind.config = {
        theme: {
          extend: {
            colors: {
              primary: "#111827", 
              "background-light": "#F9FAFB",
            },
            fontFamily: {
              sans: ["Inter", "sans-serif"],
              display: ["Plus Jakarta Sans", "sans-serif"],
              mono: ["JetBrains Mono", "monospace"],
            },
            backgroundImage: {
              'grid-pattern': "linear-gradient(to right, #E5E7EB 1px, transparent 1px), linear-gradient(to bottom, #E5E7EB 1px, transparent 1px)",
            },
            animation: {
                'scale-in': 'scaleIn 0.5s ease-out forwards',
                'fade-up': 'fadeUp 0.8s ease-out 0.3s forwards',
            },
            keyframes: {
                scaleIn: {
                    '0%': { transform: 'scale(0.8)', opacity: '0' },
                    '100%': { transform: 'scale(1)', opacity: '1' },
                },
                fadeUp: {
                    '0%': { transform: 'translateY(20px)', opacity: '0' },
                    '100%': { transform: 'translateY(0)', opacity: '1' },
                }
            }
          },
        },
      };
    </script>
</head>
<body class="bg-white font-sans text-gray-900 antialiased h-screen flex flex-col items-center justify-center relative overflow-hidden">

    <div class="absolute inset-0 bg-grid-pattern opacity-[0.4] z-0"></div>

    <div class="relative z-10 w-full max-w-lg p-8 bg-white/80 backdrop-blur-xl border border-gray-200 rounded-2xl shadow-2xl text-center">
        
        <div class="w-20 h-20 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-6 animate-scale-in border-4 border-green-100">
            <span class="material-icons-outlined text-4xl text-green-600">dns</span>
        </div>

        <div class="opacity-0 animate-fade-up">
            <h1 class="text-3xl font-display font-bold text-gray-900 mb-2">Instância Provisionada!</h1>
            <p class="text-gray-500 text-lg mb-8 leading-relaxed">
                Sua infraestrutura está ativa. O ambiente <span class="font-mono text-xs bg-gray-100 px-1 py-0.5 rounded text-gray-700">prod-br-01</span> foi configurado e sua conta de administrador criada.
            </p>

            <div class="bg-gray-50 rounded-xl border border-gray-200 p-4 mb-8 text-left">
                <h3 class="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3 pl-1">Resumo do Deploy</h3>
                <ul class="space-y-3">
                    <li class="flex items-center justify-between text-sm">
                        <span class="flex items-center gap-2 text-gray-600">
                            <span class="material-icons-outlined text-green-500 text-sm">check_circle</span>
                            Banco de Dados
                        </span>
                        <span class="font-mono text-gray-900">Postgres v15 (Ready)</span>
                    </li>
                    <li class="flex items-center justify-between text-sm">
                        <span class="flex items-center gap-2 text-gray-600">
                            <span class="material-icons-outlined text-green-500 text-sm">check_circle</span>
                            Vector Store (RAG)
                        </span>
                        <span class="font-mono text-gray-900">Connected</span>
                    </li>
                    <li class="flex items-center justify-between text-sm">
                        <span class="flex items-center gap-2 text-gray-600">
                            <span class="material-icons-outlined text-green-500 text-sm">check_circle</span>
                            CDN & Assets
                        </span>
                        <span class="font-mono text-gray-900">Global Edge</span>
                    </li>
                </ul>
            </div>

            <div class="space-y-3">
                <a href="/auth" class="block w-full py-3.5 bg-primary text-white font-bold rounded-lg hover:bg-gray-800 transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 items-center justify-center gap-2">
                    Acessar Console Admin
                    <span class="material-icons-outlined text-sm">arrow_forward</span>
                </a>
                <a href="/docs.html" class="block text-sm text-gray-500 hover:text-primary transition-colors mt-4">
                    Ler documentação de primeiros passos
                </a>
            </div>
        </div>
    </div>

    <div class="absolute bottom-8 text-xs text-gray-400 font-mono">
        Status: All Systems Operational • Build v2.0.4
    </div>

</body>
</html>
`

  return new NextResponse(html, {
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'Cache-Control': 'no-store',
    },
  })
}
