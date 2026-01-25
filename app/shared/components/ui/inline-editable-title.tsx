import * as React from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Pencil, Check, X } from 'lucide-react';

type InlineEditableTitleProps = {
  value: string;
  isEditing: boolean;
  onStartEdit: () => void;
  onSave: (value: string) => Promise<void> | void;
  onCancel: () => void;
};

export default function InlineEditableTitle({
  value,
  isEditing,
  onStartEdit,
  onSave,
  onCancel,
}: InlineEditableTitleProps) {
  const [localValue, setLocalValue] = React.useState(value);
  const [isSaving, setIsSaving] = React.useState(false);

  React.useEffect(() => {
    if (!isEditing) {
      setLocalValue(value);
    }
  }, [isEditing, value]);

  const handleSave = async () => {
    try {
      setIsSaving(true);
      await onSave(localValue.trim());
    } finally {
      setIsSaving(false);
    }
  };

  if (!isEditing) {
    return (
      <div className="flex items-center gap-2">
        <span className="text-sm font-medium leading-none">{value}</span>
        <Button
          type="button"
          size="icon"
          variant="ghost"
          onClick={onStartEdit}
          className="h-8 w-8"
          aria-label="Editar título"
        >
          <Pencil className="h-4 w-4" />
        </Button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <Input
        value={localValue}
        onChange={(e) => setLocalValue(e.target.value)}
        className="h-9 text-sm"
        autoFocus
      />
      <Button
        type="button"
        size="icon"
        variant="ghost"
        onClick={onCancel}
        className="h-8 w-8"
        aria-label="Cancelar edição"
        disabled={isSaving}
      >
        <X className="h-4 w-4" />
      </Button>
      <Button
        type="button"
        size="icon"
        onClick={handleSave}
        className="h-8 w-8"
        aria-label="Salvar título"
        disabled={isSaving}
      >
        {isSaving ? <span className="text-xs">...</span> : <Check className="h-4 w-4" />}
      </Button>
    </div>
  );
}
