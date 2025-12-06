import * as React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Loader2, Trash2, Plus, HelpCircle } from 'lucide-react';

type TipoAtividade =
  | 'Nivel_1'
  | 'Nivel_2'
  | 'Nivel_3'
  | 'Nivel_4'
  | 'Conceituario'
  | 'Lista_Mista'
  | 'Simulado_Diagnostico'
  | 'Simulado_Cumulativo'
  | 'Simulado_Global'
  | 'Flashcards'
  | 'Revisao';

type RegraAtividade = {
  id: string;
  cursoId: string | null;
  tipoAtividade: TipoAtividade;
  nomePadrao: string;
  frequenciaModulos: number;
  comecarNoModulo: number;
  acumulativo: boolean;
  gerarNoUltimo: boolean;
};

type RulesPanelProps = {
  cursoSelecionado: string;
  frenteSelecionada: string;
  regras: RegraAtividade[];
  onCreate: (regra: {
    tipoAtividade: TipoAtividade;
    nomePadrao: string;
    frequenciaModulos: number;
    comecarNoModulo: number;
    acumulativo: boolean;
    gerarNoUltimo: boolean;
  }) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  onGerarEstrutura: () => Promise<void>;
  isGenerating: boolean;
  onAtualizarEstrutura: () => Promise<void>;
  isUpdating: boolean;
};

const tipoOptions: { value: TipoAtividade; label: string }[] = [
  { value: 'Nivel_1', label: 'Nível 1' },
  { value: 'Nivel_2', label: 'Nível 2' },
  { value: 'Nivel_3', label: 'Nível 3' },
  { value: 'Nivel_4', label: 'Nível 4' },
  { value: 'Conceituario', label: 'Conceituário' },
  { value: 'Lista_Mista', label: 'Lista Mista' },
  { value: 'Simulado_Diagnostico', label: 'Simulado Diagnóstico' },
  { value: 'Simulado_Cumulativo', label: 'Simulado Cumulativo' },
  { value: 'Simulado_Global', label: 'Simulado Global' },
  { value: 'Flashcards', label: 'Flashcards' },
  { value: 'Revisao', label: 'Revisão' },
];

export default function RulesPanel({
  cursoSelecionado,
  frenteSelecionada,
  regras,
  onCreate,
  onDelete,
  onGerarEstrutura,
  isGenerating,
  onAtualizarEstrutura,
  isUpdating,
}: RulesPanelProps) {
  const [tipoAtividade, setTipoAtividade] = React.useState<TipoAtividade>('Nivel_1');
  const [nomePadrao, setNomePadrao] = React.useState('');
  const [frequenciaModulos, setFrequenciaModulos] = React.useState('1');
  const [comecarNoModulo, setComecarNoModulo] = React.useState('1');
  const [acumulativo, setAcumulativo] = React.useState(false);
  const [gerarNoUltimo, setGerarNoUltimo] = React.useState(false);
  const [isSaving, setIsSaving] = React.useState(false);

  const reset = () => {
    setTipoAtividade('Nivel_1');
    setNomePadrao('');
    setFrequenciaModulos('1');
    setComecarNoModulo('1');
    setAcumulativo(false);
    setGerarNoUltimo(false);
  };

  const handleCreate = async () => {
    if (!nomePadrao.trim()) return;
    setIsSaving(true);
    await onCreate({
      tipoAtividade,
      nomePadrao: nomePadrao.trim(),
      frequenciaModulos: Number(frequenciaModulos) || 1,
      comecarNoModulo: Number(comecarNoModulo) || 1,
      acumulativo,
      gerarNoUltimo,
    });
    setIsSaving(false);
    reset();
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between gap-4">
        <CardTitle>Regras de Atividades</CardTitle>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={onAtualizarEstrutura}
            disabled={isUpdating || !cursoSelecionado || !frenteSelecionada}
          >
            {isUpdating ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Atualizar Estrutura'}
          </Button>
          <Button onClick={onGerarEstrutura} disabled={isGenerating || !cursoSelecionado || !frenteSelecionada}>
            {isGenerating ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Gerar Estrutura'}
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-4 md:grid-cols-5">
          <div className="space-y-2">
            <Label>Tipo</Label>
            <Select value={tipoAtividade} onValueChange={(v) => setTipoAtividade(v as TipoAtividade)}>
              <SelectTrigger>
                <SelectValue placeholder="Tipo" />
              </SelectTrigger>
              <SelectContent>
                {tipoOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2 md:col-span-2">
            <Label>Nome Padrão</Label>
            <Input
              value={nomePadrao}
              onChange={(e) => setNomePadrao(e.target.value)}
              placeholder='Ex: "Lista de Fixação"'
            />
          </div>
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Label className="mb-0">Começar no módulo</Label>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <HelpCircle className="h-4 w-4 text-muted-foreground" aria-label="Ajuda sobre módulo inicial" />
                  </TooltipTrigger>
                  <TooltipContent side="top">
                    A regra só passa a valer a partir deste módulo. Antes dele nada é gerado.
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            <Input
              type="number"
              value={comecarNoModulo}
              onChange={(e) => setComecarNoModulo(e.target.value)}
              min={1}
            />
          </div>
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Label className="mb-0">Frequência (módulos)</Label>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <HelpCircle className="h-4 w-4 text-muted-foreground" aria-label="Ajuda sobre frequência" />
                  </TooltipTrigger>
                  <TooltipContent side="top">
                    Gera uma atividade a cada N módulos, contando a partir do módulo inicial. Ex.: frequência 2 gera nos módulos 1,3,5...
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            <Input
              type="number"
              value={frequenciaModulos}
              onChange={(e) => setFrequenciaModulos(e.target.value)}
              min={1}
            />
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={acumulativo}
              onChange={(e) => setAcumulativo(e.target.checked)}
              className="h-4 w-4"
            />
            <span className="flex items-center gap-1">
              Acumulativo (Módulos X a Y)
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <HelpCircle className="h-4 w-4 text-muted-foreground" aria-label="Ajuda sobre acumulativo" />
                  </TooltipTrigger>
                  <TooltipContent side="top">
                    O título indica o intervalo de módulos coberto. Útil para listas ou blocos que somam vários módulos.
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </span>
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={gerarNoUltimo}
              onChange={(e) => setGerarNoUltimo(e.target.checked)}
              className="h-4 w-4"
            />
            <span className="flex items-center gap-1">
              Gerar no último módulo
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <HelpCircle className="h-4 w-4 text-muted-foreground" aria-label="Ajuda sobre último módulo" />
                  </TooltipTrigger>
                  <TooltipContent side="top">
                    Garante uma atividade extra no último módulo, mesmo que não caia na frequência.
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </span>
          </label>
          <Button
            className="ml-auto"
            onClick={handleCreate}
            disabled={isSaving || !cursoSelecionado || !frenteSelecionada || !nomePadrao.trim()}
          >
            {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Plus className="h-4 w-4 mr-2" />Adicionar</>}
          </Button>
        </div>

        <div className="space-y-3">
          {regras.length === 0 ? (
            <div className="text-sm text-muted-foreground">Nenhuma regra cadastrada para este curso.</div>
          ) : (
            regras.map((regra) => (
              <div
                key={regra.id}
                className="flex items-start justify-between rounded-md border p-3"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary">{regra.tipoAtividade}</Badge>
                    <span className="font-medium">{regra.nomePadrao}</span>
                  </div>
                  <div className="text-xs text-muted-foreground flex flex-wrap gap-2">
                    <span>Frequência: a cada {regra.frequenciaModulos} módulo(s)</span>
                    <span>Começar no módulo {regra.comecarNoModulo}</span>
                    {regra.acumulativo && <Badge variant="outline">Acumulativo</Badge>}
                    {regra.gerarNoUltimo && <Badge variant="outline">Gera no último</Badge>}
                  </div>
                </div>
                <Button variant="ghost" size="icon" onClick={() => onDelete(regra.id)}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}
