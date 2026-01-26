
import * as React from 'react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Loader2 } from 'lucide-react';
import { TipoAtividade } from '../../types';

type AddActivityForm = {
    tipo: TipoAtividade;
    titulo: string;
    ordemExibicao?: number;
};

type AddActivityModalProps = {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSubmit: (data: AddActivityForm) => Promise<void>;
    isSubmitting?: boolean;
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

export function AddActivityModal({
    open,
    onOpenChange,
    onSubmit,
    isSubmitting,
}: AddActivityModalProps) {
    const [tipo, setTipo] = React.useState<TipoAtividade>('Nivel_1');
    const [titulo, setTitulo] = React.useState('');
    const [ordemExibicao, setOrdemExibicao] = React.useState<string>('');

    const reset = () => {
        setTipo('Nivel_1');
        setTitulo('');
        setOrdemExibicao('');
    };

    const handleSubmit = async () => {
        if (!titulo.trim()) return;

        await onSubmit({
            tipo,
            titulo: titulo.trim(),
            ordemExibicao: ordemExibicao ? Number(ordemExibicao) : undefined,
        });
        reset();
    };

    return (
        <Dialog open={open} onOpenChange={(value) => {
            if (!value) reset();
            onOpenChange(value);
        }}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Adicionar Atividade</DialogTitle>
                </DialogHeader>

                <div className="space-y-4">
                    <div className="space-y-2">
                        <Label>Tipo</Label>
                        <Select value={tipo} onValueChange={(value) => setTipo(value as TipoAtividade)}>
                            <SelectTrigger>
                                <SelectValue placeholder="Selecione um tipo" />
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

                    <div className="space-y-2">
                        <Label>Título</Label>
                        <Input
                            value={titulo}
                            onChange={(e) => setTitulo(e.target.value)}
                            placeholder="Digite o título da atividade"
                        />
                    </div>

                    <div className="space-y-2">
                        <Label>Ordem de exibição (opcional)</Label>
                        <Input
                            type="number"
                            value={ordemExibicao}
                            onChange={(e) => setOrdemExibicao(e.target.value)}
                            placeholder="Ex: 1"
                        />
                    </div>
                </div>

                <DialogFooter className="mt-4">
                    <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
                        Cancelar
                    </Button>
                    <Button onClick={handleSubmit} disabled={isSubmitting || !titulo.trim()}>
                        {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Salvar'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
