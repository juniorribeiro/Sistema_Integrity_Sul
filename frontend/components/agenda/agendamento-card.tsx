'use client';

import { CalendarDays, Video, MapPin, ExternalLink } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ConfirmDelete } from '@/components/shared/confirm-delete';

export interface Agendamento {
  id: string;
  setor: string;
  dataHora: string;
  modalidade: 'PRESENCIAL' | 'ONLINE';
  status: 'AGENDADO' | 'CONFIRMADO' | 'REALIZADO' | 'CANCELADO';
  linkOnline: string | null;
  observacoes: string | null;
  funcionario?: { nome: string };
  profissional?: { nome: string };
}

const SETOR_LABEL: Record<string, string> = {
  PSICOLOGIA: 'Psicologia', NUTRICAO: 'Nutrição', JURIDICO: 'Jurídico', FINANCEIRO: 'Financeiro',
};
const STATUS: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
  AGENDADO: { label: 'Agendado', variant: 'secondary' },
  CONFIRMADO: { label: 'Confirmado', variant: 'default' },
  REALIZADO: { label: 'Realizado', variant: 'outline' },
  CANCELADO: { label: 'Cancelado', variant: 'destructive' },
};
const fmt = (d: string) =>
  new Date(d).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });

export function AgendamentoCard({
  agendamento: a,
  perfil,
  onStatus,
  onRemover,
}: {
  agendamento: Agendamento;
  perfil: 'profissional' | 'funcionario';
  onStatus: (id: string, status: string) => void;
  onRemover?: (id: string) => Promise<void> | void;
}) {
  const st = STATUS[a.status];
  const finalizado = a.status === 'REALIZADO' || a.status === 'CANCELADO';
  const contraparte = perfil === 'profissional' ? a.funcionario?.nome : a.profissional?.nome;

  return (
    <Card>
      <CardContent className="space-y-3 py-4">
        <div className="flex items-center justify-between gap-2">
          <span className="text-sm font-semibold">{SETOR_LABEL[a.setor] ?? a.setor}</span>
          <div className="flex items-center gap-1">
            <Badge variant={st.variant}>{st.label}</Badge>
            {perfil === 'profissional' && onRemover && (
              <ConfirmDelete onConfirm={() => onRemover(a.id)} descricao="Remover este agendamento?" />
            )}
          </div>
        </div>
        <div className="space-y-1 text-sm">
          <p className="flex items-center gap-2">
            <CalendarDays className="h-4 w-4 text-muted-foreground" /> {fmt(a.dataHora)}
          </p>
          <p className="flex items-center gap-2 text-muted-foreground">
            {a.modalidade === 'ONLINE' ? <Video className="h-4 w-4" /> : <MapPin className="h-4 w-4" />}
            {a.modalidade === 'ONLINE' ? 'Online' : 'Presencial'}
          </p>
          {contraparte && <p className="text-muted-foreground">{contraparte}</p>}
          {a.modalidade === 'ONLINE' && a.linkOnline && (
            <a href={a.linkOnline} target="_blank" rel="noreferrer" className="flex items-center gap-1 text-primary hover:underline">
              <ExternalLink className="h-3 w-3" /> Entrar na sala
            </a>
          )}
        </div>

        {!finalizado && (
          <div className="flex gap-2 pt-1">
            {perfil === 'funcionario' && a.status === 'AGENDADO' && (
              <Button size="sm" onClick={() => onStatus(a.id, 'CONFIRMADO')}>
                Confirmar
              </Button>
            )}
            {perfil === 'profissional' && (
              <Button size="sm" variant="outline" onClick={() => onStatus(a.id, 'REALIZADO')}>
                Realizado
              </Button>
            )}
            <Button size="sm" variant="ghost" className="text-destructive" onClick={() => onStatus(a.id, 'CANCELADO')}>
              Cancelar
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
