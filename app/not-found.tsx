import Link from "next/link";
import { Button } from "@/components/ui/button";
import { AluminifyLogo } from "@/components/ui/aluminify-logo";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-background-light dark:bg-background-dark text-text-main-light dark:text-text-main-dark font-sans antialiased flex flex-col items-center justify-center relative overflow-hidden">
      {/* Background Grid Pattern */}
      <div className="absolute inset-0 pointer-events-none z-0">
        <div className="absolute inset-0 bg-(image:--color-grid-pattern) dark:bg-(image:--color-grid-pattern-dark) opacity-[0.3] grid-bg"></div>
        {/* Ambient Glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-primary/20 rounded-full blur-3xl opacity-20 pointer-events-none"></div>
      </div>

      <div className="relative z-10 flex flex-col items-center text-center max-w-lg px-4">
        <div className="mb-8">
          <AluminifyLogo className="scale-150" />
        </div>

        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 mb-6">
          <span className="flex h-2 w-2 rounded-full bg-red-500"></span>
          <span className="text-xs font-medium text-gray-600 dark:text-gray-300">
            Error 404
          </span>
        </div>

        <h1 className="text-5xl md:text-6xl font-display font-bold tracking-tight mb-4 text-transparent bg-clip-text bg-linear-to-b from-gray-900 to-gray-600 dark:from-white dark:to-gray-400">
          Página não encontrada
        </h1>

        <p className="text-lg text-text-muted-light dark:text-text-muted-dark leading-relaxed mb-10">
          Parece que você se aventurou além da fronteira do conhecimento mapeado. Essa página não existe na nossa infraestrutura.
        </p>

        <div className="flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto">
          <Button size="lg" className="w-full sm:w-auto font-medium" asChild>
            <Link href="/">
              Voltar ao Início
            </Link>
          </Button>
          <Button size="lg" variant="outline" className="w-full sm:w-auto font-medium bg-white dark:bg-transparent" asChild>
            <Link href="mailto:support@aluminify.com">
              Contatar Suporte
            </Link>
          </Button>
        </div>
      </div>

      <div className="absolute bottom-8 text-center">
        <p className="text-xs text-text-muted-light dark:text-text-muted-dark opacity-60">
          © 2026 Aluminify Inc. Infraestrutura Invisível.
        </p>
      </div>
    </div>
  );
}
