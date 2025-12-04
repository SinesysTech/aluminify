'use client'

import * as React from 'react'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'
import { ActivityUploadRow } from './activity-upload-row'
import { ModuloComAtividades } from '@/app/(dashboard)/admin/materiais/types'

interface ModuleAccordionProps {
  modulo: ModuloComAtividades
  onActivityUploadSuccess?: () => void
}

export function ModuleAccordion({ modulo, onActivityUploadSuccess }: ModuleAccordionProps) {
  const atividadesCompleta = modulo.atividades.filter((a) => a.arquivoUrl).length
  const totalAtividades = modulo.atividades.length

  return (
    <Accordion type="single" collapsible className="w-full">
      <AccordionItem value={modulo.id} className="border rounded-lg mb-2">
        <AccordionTrigger className="px-4 hover:no-underline">
          <div className="flex items-center justify-between w-full mr-4">
            <div className="flex items-center gap-2">
              <span className="font-medium">
                Módulo {modulo.numero_modulo || 'N/A'}: {modulo.nome}
              </span>
            </div>
            <div className="text-sm text-muted-foreground">
              {atividadesCompleta}/{totalAtividades} atividades
            </div>
          </div>
        </AccordionTrigger>
        <AccordionContent className="px-4 pb-4">
          <div className="space-y-2 mt-2">
            {modulo.atividades.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                Nenhuma atividade cadastrada
              </p>
            ) : (
              modulo.atividades.map((atividade) => (
                <ActivityUploadRow
                  key={atividade.id}
                  atividadeId={atividade.id}
                  titulo={atividade.titulo}
                  tipo={atividade.tipo}
                  arquivoUrl={atividade.arquivoUrl}
                  onUploadSuccess={onActivityUploadSuccess}
                />
              ))
            )}
          </div>
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  )
}

