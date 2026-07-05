'use client';

import { useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight, Clock, User, MapPin, Video } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { Agendamento } from './agendamento-card';

/* ─── Types ─── */
export interface Slot {
  id: string;
  profissionalId: string;
  setor: string;
  inicio: string;
  fim: string;
  status: 'LIVRE' | 'RESERVADO';
  profissional?: { nome: string };
}

export interface CalendarioSemanalProps {
  agendamentos: Agendamento[];
  slots: Slot[];
  modo: 'gerenciar' | 'reservar' | 'leitura';
  onSlotClick?: (slot: Slot) => void;
  onAgendamentoClick?: (agendamento: Agendamento) => void;
  semanaAtual: Date;
  onSemanaChange: (novaSemana: Date) => void;
}

/* ─── Helpers ─── */
const DIAS_SEMANA = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'] as const;
const DIAS_COMPLETO = ['Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado', 'Domingo'] as const;
const HORAS = Array.from({ length: 14 }, (_, i) => i + 7); // 07:00 → 20:00

const SETOR_LABEL: Record<string, string> = {
  PSICOLOGIA: 'Psicologia',
  NUTRICAO: 'Nutrição',
  JURIDICO: 'Jurídico',
  FINANCEIRO: 'Financeiro',
};

function getMonday(d: Date): Date {
  const date = new Date(d);
  const day = date.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  date.setDate(date.getDate() + diff);
  date.setHours(0, 0, 0, 0);
  return date;
}

function addDays(d: Date, n: number): Date {
  const r = new Date(d);
  r.setDate(r.getDate() + n);
  return r;
}

function isSameDay(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

function fmtHora(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
}

function fmtData(d: Date): string {
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
}

function fmtDataLonga(d: Date): string {
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' });
}

function fmtSemana(monday: Date): string {
  const sunday = addDays(monday, 6);
  return `${fmtDataLonga(monday)} — ${fmtDataLonga(sunday)}`;
}

/* ─── Event item positioned absolutely ─── */
interface CalEventProps {
  label: string;
  subLabel?: string;
  setor?: string;
  hora: string;
  modalidade?: 'PRESENCIAL' | 'ONLINE';
  variant: 'livre' | 'reservado' | 'agendado' | 'confirmado' | 'realizado' | 'cancelado';
  topOffset: number; // px from top of cell
  height: number; // px
  onClick?: () => void;
  interactive?: boolean;
  left?: string;
  width?: string;
}

const VARIANT_CLASSES: Record<CalEventProps['variant'], string> = {
  livre: 'border-2 border-dashed border-emerald-400/60 bg-emerald-50/70 text-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-300 dark:border-emerald-500/40',
  reservado: 'border border-amber-400/60 bg-amber-50/80 text-amber-800 dark:bg-amber-950/30 dark:text-amber-300 dark:border-amber-500/40',
  agendado: 'border border-indigo-300/60 bg-indigo-50/80 text-indigo-800 dark:bg-indigo-950/30 dark:text-indigo-300 dark:border-indigo-500/40',
  confirmado: 'border border-blue-400 bg-blue-100/90 text-blue-900 dark:bg-blue-950/40 dark:text-blue-200 dark:border-blue-500/50',
  realizado: 'border border-slate-300/50 bg-slate-100/60 text-slate-500 opacity-60 dark:bg-slate-800/30 dark:text-slate-400',
  cancelado: 'border border-red-300/50 bg-red-50/50 text-red-500 line-through opacity-50 dark:bg-red-950/20 dark:text-red-400',
};

function CalEvent({ label, subLabel, setor, hora, modalidade, variant, topOffset, height, onClick, interactive, left, width }: CalEventProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={!interactive}
      className={cn(
        'absolute z-10 flex flex-col justify-start overflow-hidden rounded-lg px-1.5 py-1 text-left text-[11px] leading-tight shadow-sm transition-all duration-200',
        VARIANT_CLASSES[variant],
        interactive && 'cursor-pointer hover:scale-[1.02] hover:shadow-md hover:brightness-105 active:scale-[0.98]',
        !interactive && 'cursor-default'
      )}
      style={{
        top: `${topOffset}px`,
        height: `${Math.max(height, 22)}px`,
        left: left ?? '0.125rem',
        width: width ? `calc(${width} - 0.25rem)` : 'calc(100% - 0.25rem)',
      }}
    >
      <span className="flex items-center gap-1 font-semibold">
        <Clock className="h-3 w-3 shrink-0" />
        {hora}
      </span>
      {height > 30 && label && (
        <span className="mt-0.5 flex items-center gap-1 truncate">
          <User className="h-3 w-3 shrink-0 opacity-70" />
          <span className="truncate">{label}</span>
        </span>
      )}
      {height > 48 && subLabel && (
        <span className="mt-0.5 truncate text-[10px] opacity-70">{subLabel}</span>
      )}
      {height > 60 && setor && (
        <span className="mt-auto">
          <Badge variant="outline" className="mt-0.5 h-4 text-[9px]">
            {SETOR_LABEL[setor] ?? setor}
          </Badge>
        </span>
      )}
      {height > 60 && modalidade && (
        <span className="mt-0.5 flex items-center gap-0.5 text-[10px] opacity-60">
          {modalidade === 'ONLINE' ? <Video className="h-2.5 w-2.5" /> : <MapPin className="h-2.5 w-2.5" />}
          {modalidade === 'ONLINE' ? 'Online' : 'Presencial'}
        </span>
      )}
    </button>
  );
}

/* ─── Main component ─── */
const CELL_HEIGHT = 72; // px per hour row

export function CalendarioSemanal({
  agendamentos,
  slots,
  modo,
  onSlotClick,
  onAgendamentoClick,
  semanaAtual,
  onSemanaChange,
}: CalendarioSemanalProps) {
  const monday = useMemo(() => getMonday(semanaAtual), [semanaAtual]);
  const weekDays = useMemo(() => Array.from({ length: 7 }, (_, i) => addDays(monday, i)), [monday]);
  const today = useMemo(() => new Date(), []);

  // Mobile: single day selector
  const [mobileDay, setMobileDay] = useState(0);

  function prevWeek() {
    onSemanaChange(addDays(monday, -7));
  }
  function nextWeek() {
    onSemanaChange(addDays(monday, 7));
  }
  function goToday() {
    onSemanaChange(getMonday(new Date()));
  }

  // Map events to their day + hour position
  function eventPosition(isoStr: string) {
    const d = new Date(isoStr);
    const dayIdx = weekDays.findIndex((wd) => isSameDay(wd, d));
    const hour = d.getHours();
    const minutes = d.getMinutes();
    const topOffset = (minutes / 60) * CELL_HEIGHT;
    return { dayIdx, hour, topOffset };
  }

  function eventHeight(startIso: string, endIso: string) {
    const diffMs = new Date(endIso).getTime() - new Date(startIso).getTime();
    const diffHours = diffMs / (1000 * 60 * 60);
    return diffHours * CELL_HEIGHT;
  }

  function agendamentoHeight() {
    return CELL_HEIGHT; // default 1-hour for agendamentos without end time
  }

  function slotVariant(slot: Slot): CalEventProps['variant'] {
    return slot.status === 'LIVRE' ? 'livre' : 'reservado';
  }

  function agendamentoVariant(a: Agendamento): CalEventProps['variant'] {
    switch (a.status) {
      case 'AGENDADO': return 'agendado';
      case 'CONFIRMADO': return 'confirmado';
      case 'REALIZADO': return 'realizado';
      case 'CANCELADO': return 'cancelado';
      default: return 'agendado';
    }
  }

  // Build a map: dayIdx → hour → events
  type EventData = {
    key: string;
    topOffset: number;
    height: number;
    props: Omit<CalEventProps, 'topOffset' | 'height'>;
  };

  const eventsByDayHour = useMemo(() => {
    const map: Map<string, EventData[]> = new Map();

    function addEvent(dayIdx: number, hour: number, ev: EventData) {
      if (dayIdx < 0 || dayIdx > 6) return;
      const k = `${dayIdx}-${hour}`;
      const list = map.get(k) ?? [];
      list.push(ev);
      map.set(k, list);
    }

    for (const s of slots) {
      const pos = eventPosition(s.inicio);
      const h = eventHeight(s.inicio, s.fim);
      const interactive = modo === 'gerenciar' ? s.status === 'LIVRE' : modo === 'reservar' ? s.status === 'LIVRE' : false;
      addEvent(pos.dayIdx, pos.hour, {
        key: `slot-${s.id}`,
        topOffset: pos.topOffset,
        height: h,
        props: {
          label: s.profissional?.nome ?? '',
          hora: `${fmtHora(s.inicio)}–${fmtHora(s.fim)}`,
          setor: s.setor,
          variant: slotVariant(s),
          interactive,
          onClick: interactive && onSlotClick ? () => onSlotClick(s) : undefined,
        },
      });
    }

    for (const a of agendamentos) {
      const pos = eventPosition(a.dataHora);
      const h = agendamentoHeight();
      addEvent(pos.dayIdx, pos.hour, {
        key: `ag-${a.id}`,
        topOffset: pos.topOffset,
        height: h,
        props: {
          label: a.profissional?.nome ?? a.funcionario?.nome ?? '',
          subLabel: a.funcionario?.nome ?? '',
          hora: fmtHora(a.dataHora),
          setor: a.setor,
          modalidade: a.modalidade,
          variant: agendamentoVariant(a),
          interactive: modo !== 'leitura',
          onClick: onAgendamentoClick ? () => onAgendamentoClick(a) : undefined,
        },
      });
    }

    // Post-process map to assign left and width props for side-by-side positioning of overlapping events
    for (const [_, list] of map.entries()) {
      const N = list.length;
      if (N > 1) {
        list.forEach((ev, idx) => {
          const pctWidth = 100 / N;
          const pctLeft = idx * pctWidth;
          ev.props.left = `${pctLeft}%`;
          ev.props.width = `${pctWidth}%`;
        });
      }
    }

    return map;
  }, [slots, agendamentos, modo, onSlotClick, onAgendamentoClick, weekDays]);

  function getEvents(dayIdx: number, hour: number): EventData[] {
    return eventsByDayHour.get(`${dayIdx}-${hour}`) ?? [];
  }

  /* ─── Render ─── */
  return (
    <div className="flex flex-col gap-3">
      {/* Navigation header */}
      <div className="flex items-center justify-between rounded-xl border border-border/60 bg-gradient-to-r from-muted/50 to-muted/30 px-4 py-2.5 shadow-sm dark:from-muted/20 dark:to-muted/10">
        <Button variant="ghost" size="icon" onClick={prevWeek} aria-label="Semana anterior">
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" onClick={goToday} className="text-xs">
            Hoje
          </Button>
          <span className="text-sm font-semibold tracking-tight">{fmtSemana(monday)}</span>
        </div>
        <Button variant="ghost" size="icon" onClick={nextWeek} aria-label="Próxima semana">
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      {/* Mobile day tabs (< md) */}
      <div className="flex gap-1 overflow-x-auto rounded-lg bg-muted/40 p-1 md:hidden">
        {weekDays.map((d, i) => (
          <button
            key={i}
            type="button"
            onClick={() => setMobileDay(i)}
            className={cn(
              'flex min-w-0 flex-1 flex-col items-center rounded-md px-1 py-1.5 text-xs font-medium transition-all',
              mobileDay === i
                ? 'bg-background text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground',
              isSameDay(d, today) && 'ring-2 ring-primary/30'
            )}
          >
            <span>{DIAS_SEMANA[i]}</span>
            <span className="text-[10px]">{fmtData(d)}</span>
          </button>
        ))}
      </div>

      {/* Desktop grid (≥ md) */}
      <div className="hidden overflow-hidden rounded-xl border border-border/60 bg-background shadow-sm md:block">
        {/* Header row */}
        <div className="grid grid-cols-[60px_repeat(7,1fr)] border-b border-border/40 bg-gradient-to-r from-muted/60 to-muted/30 dark:from-muted/20 dark:to-muted/10">
          <div className="border-r border-border/30 p-2" />
          {weekDays.map((d, i) => (
            <div
              key={i}
              className={cn(
                'flex flex-col items-center justify-center border-r border-border/30 px-1 py-2 text-xs font-medium last:border-r-0',
                isSameDay(d, today) && 'bg-primary/5'
              )}
            >
              <span className={cn('text-muted-foreground', isSameDay(d, today) && 'text-primary font-semibold')}>
                {DIAS_COMPLETO[i]}
              </span>
              <span
                className={cn(
                  'mt-0.5 flex h-6 w-6 items-center justify-center rounded-full text-sm font-semibold',
                  isSameDay(d, today) && 'bg-primary text-primary-foreground'
                )}
              >
                {d.getDate()}
              </span>
            </div>
          ))}
        </div>

        {/* Time grid */}
        <div className="relative">
          {HORAS.map((hour) => (
            <div key={hour} className="grid grid-cols-[60px_repeat(7,1fr)] border-b border-border/20 last:border-b-0">
              <div className="flex items-start justify-end border-r border-border/30 pr-2 pt-1 text-[11px] font-medium text-muted-foreground">
                {String(hour).padStart(2, '0')}:00
              </div>
              {weekDays.map((d, dayIdx) => {
                const events = getEvents(dayIdx, hour);
                return (
                  <div
                    key={dayIdx}
                    className={cn(
                      'relative border-r border-border/20 last:border-r-0',
                      isSameDay(d, today) && 'bg-primary/[0.02]'
                    )}
                    style={{ height: `${CELL_HEIGHT}px` }}
                  >
                    {/* Half-hour line */}
                    <div className="absolute inset-x-0 top-1/2 border-t border-dashed border-border/10" />
                    {events.map((ev) => (
                      <CalEvent key={ev.key} topOffset={ev.topOffset} height={ev.height} {...ev.props} />
                    ))}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>

      {/* Mobile single-day view (< md) */}
      <div className="overflow-hidden rounded-xl border border-border/60 bg-background shadow-sm md:hidden">
        <div className="border-b border-border/40 bg-gradient-to-r from-muted/50 to-muted/30 px-3 py-2 text-center text-sm font-semibold dark:from-muted/20 dark:to-muted/10">
          {DIAS_COMPLETO[mobileDay]} · {fmtData(weekDays[mobileDay])}
        </div>
        {HORAS.map((hour) => {
          const events = getEvents(mobileDay, hour);
          return (
            <div key={hour} className="flex border-b border-border/20 last:border-b-0">
              <div className="flex w-14 shrink-0 items-start justify-end border-r border-border/30 pr-2 pt-1 text-[11px] font-medium text-muted-foreground">
                {String(hour).padStart(2, '0')}:00
              </div>
              <div className="relative flex-1" style={{ height: `${CELL_HEIGHT}px` }}>
                <div className="absolute inset-x-0 top-1/2 border-t border-dashed border-border/10" />
                {events.map((ev) => (
                  <CalEvent key={ev.key} topOffset={ev.topOffset} height={ev.height} {...ev.props} />
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* Legend */}
      <div className="flex flex-wrap items-center gap-3 rounded-lg border border-border/40 bg-muted/20 px-3 py-2 text-[11px] text-muted-foreground">
        <span className="font-medium">Legenda:</span>
        <span className="flex items-center gap-1">
          <span className="inline-block h-3 w-3 rounded border-2 border-dashed border-emerald-400 bg-emerald-50 dark:bg-emerald-950/40" />
          Livre
        </span>
        <span className="flex items-center gap-1">
          <span className="inline-block h-3 w-3 rounded border border-amber-400 bg-amber-50 dark:bg-amber-950/40" />
          Reservado
        </span>
        <span className="flex items-center gap-1">
          <span className="inline-block h-3 w-3 rounded border border-indigo-300 bg-indigo-50 dark:bg-indigo-950/40" />
          Agendado
        </span>
        <span className="flex items-center gap-1">
          <span className="inline-block h-3 w-3 rounded border border-blue-400 bg-blue-100 dark:bg-blue-950/40" />
          Confirmado
        </span>
        <span className="flex items-center gap-1">
          <span className="inline-block h-3 w-3 rounded border border-slate-300 bg-slate-100 opacity-60 dark:bg-slate-800/30" />
          Realizado
        </span>
        <span className="flex items-center gap-1">
          <span className="inline-block h-3 w-3 rounded border border-red-300 bg-red-50 opacity-50 dark:bg-red-950/20" />
          Cancelado
        </span>
      </div>
    </div>
  );
}
