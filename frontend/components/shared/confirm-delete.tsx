'use client';

import { useState } from 'react';
import { Trash2, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { apiErrorMessage } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger, DialogClose } from '@/components/ui/dialog';

/**
 * Botão de remoção com confirmação. Por padrão é um ícone de lixeira (size icon),
 * mas aceita children para customizar o gatilho.
 */
export function ConfirmDelete({
  onConfirm,
  titulo = 'Confirmar remoção',
  descricao = 'Esta ação não pode ser desfeita.',
  children,
  variant = 'ghost',
  size = 'icon',
  label = 'Remover',
}: {
  onConfirm: () => Promise<void> | void;
  titulo?: string;
  descricao?: string;
  children?: React.ReactNode;
  variant?: 'ghost' | 'outline' | 'destructive';
  size?: 'icon' | 'sm' | 'default';
  label?: string;
}) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  async function confirmar() {
    setLoading(true);
    try {
      await onConfirm();
      setOpen(false);
    } catch (e) {
      toast.error(apiErrorMessage(e));
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <Button variant={variant} size={size} className="text-destructive" aria-label={label}>
            {children ?? <Trash2 className="h-4 w-4" />}
          </Button>
        }
      />
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>{titulo}</DialogTitle>
          <DialogDescription>{descricao}</DialogDescription>
        </DialogHeader>
        <div className="flex justify-end gap-2">
          <DialogClose render={<Button variant="outline">Cancelar</Button>} />
          <Button variant="destructive" onClick={confirmar} disabled={loading}>
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Remover'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
