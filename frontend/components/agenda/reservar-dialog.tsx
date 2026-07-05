'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { CalendarCheck, Clock, User, MapPin, Video, Loader2 } from 'lucide-react';
import { api, apiErrorMessage } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogClose } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { Slot } from './calendario-semanal';

const SETOR_LABEL: Record<string, string> = {
  PSICOLOGIA: 'Psicologia',
  NUTRICAO: 'Nutrição',
  JURIDICO: 'Jurídico',
  FINANCEIRO: 'Financeiro',
};

function fmtDataHora(iso: string): string {
  return new Date(iso).toLocaleString('pt-BR', {
    weekday: 'long',
    day: '2-digit',
    month: 'long',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function ReservarDialog({
  slot,
  open,
  onOpenChange,
  onSuccess,
}: {
  slot: Slot | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}) {
  const [observacoes, setObservacoes] = useState('');
  const [modalidade, setModalidade] = useState<string>('PRESENCIAL');
  const [loading, setLoading] = useState(false);

  async function reservar() {
    if (!slot) return;
    setLoading(true);
    try {
      await api.post(`/agendamentos/slots/${slot.id}/reservar`, {
        observacoes: observacoes || undefined,
        modalidade,
      });
      toast.success('Horário reservado com sucesso!');
      setObservacoes('');
      onOpenChange(false);
      onSuccess();
    } catch (e) {
      toast.error(apiErrorMessage(e));
    } finally {
      setLoading(false);
    }
  }

  if (!slot) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CalendarCheck className="h-5 w-5 text-primary" />
            Reservar horário
          </DialogTitle>
          <DialogDescription>Confirme os detalhes do agendamento.</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Slot details */}
          <div className="rounded-lg border border-border/60 bg-gradient-to-br from-muted/40 to-muted/20 p-4 shadow-sm dark:from-muted/20 dark:to-muted/5">
            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2">
                <User className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium">{slot.profissional?.nome ?? 'Profissional'}</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <span>{fmtDataHora(slot.inicio)}</span>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="secondary">{SETOR_LABEL[slot.setor] ?? slot.setor}</Badge>
              </div>
            </div>
          </div>

          {/* Modalidade */}
          <div className="space-y-2">
            <Label>Modalidade</Label>
            <Select value={modalidade} onValueChange={(val) => val && setModalidade(val)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="PRESENCIAL">
                  <span className="flex items-center gap-1.5">
                    <MapPin className="h-3.5 w-3.5" /> Presencial
                  </span>
                </SelectItem>
                <SelectItem value="ONLINE">
                  <span className="flex items-center gap-1.5">
                    <Video className="h-3.5 w-3.5" /> Online
                  </span>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Observações */}
          <div className="space-y-2">
            <Label htmlFor="reservar-obs">Observações (opcional)</Label>
            <Textarea
              id="reservar-obs"
              placeholder="Informe qualquer detalhe importante…"
              value={observacoes}
              onChange={(e) => setObservacoes(e.target.value)}
              rows={3}
            />
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-1">
            <DialogClose render={<Button variant="outline">Cancelar</Button>} />
            <Button onClick={reservar} disabled={loading}>
              {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CalendarCheck className="mr-2 h-4 w-4" />}
              Reservar
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
