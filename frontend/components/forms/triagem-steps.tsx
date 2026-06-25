'use client';

import { useForm, Controller, type Control, type FieldValues, type Path } from 'react-hook-form';
import { toast } from 'sonner';
import { api, apiErrorMessage } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';

type Opt = { value: string; label: string };

// ---------------------------------------------------------------- helpers UI

function Pergunta({ label, children, error }: { label: string; children: React.ReactNode; error?: boolean }) {
  return (
    <div className="space-y-2">
      <Label className={cn(error && 'text-destructive')}>{label}</Label>
      {children}
    </div>
  );
}

function EscalaField<T extends FieldValues>({
  control,
  name,
  label,
}: {
  control: Control<T>;
  name: Path<T>;
  label: string;
}) {
  return (
    <Controller
      control={control}
      name={name}
      rules={{ required: true }}
      render={({ field, fieldState }) => (
        <Pergunta label={label} error={!!fieldState.error}>
          <div className="flex flex-wrap gap-1.5">
            {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => (
              <button
                key={n}
                type="button"
                onClick={() => field.onChange(n)}
                className={cn(
                  'h-9 w-9 rounded-md border text-sm transition-colors',
                  field.value === n
                    ? 'border-primary bg-primary text-primary-foreground'
                    : 'border-input hover:bg-muted',
                )}
              >
                {n}
              </button>
            ))}
          </div>
        </Pergunta>
      )}
    />
  );
}

function RadioField<T extends FieldValues>({
  control,
  name,
  label,
  options,
}: {
  control: Control<T>;
  name: Path<T>;
  label: string;
  options: Opt[];
}) {
  return (
    <Controller
      control={control}
      name={name}
      rules={{ required: true }}
      render={({ field, fieldState }) => (
        <Pergunta label={label} error={!!fieldState.error}>
          <div className="flex flex-wrap gap-2">
            {options.map((o) => (
              <button
                key={o.value}
                type="button"
                onClick={() => field.onChange(o.value)}
                className={cn(
                  'rounded-md border px-3 py-1.5 text-sm transition-colors',
                  field.value === o.value
                    ? 'border-primary bg-primary text-primary-foreground'
                    : 'border-input hover:bg-muted',
                )}
              >
                {o.label}
              </button>
            ))}
          </div>
        </Pergunta>
      )}
    />
  );
}

function BoolField<T extends FieldValues>({
  control,
  name,
  label,
}: {
  control: Control<T>;
  name: Path<T>;
  label: string;
}) {
  return (
    <Controller
      control={control}
      name={name}
      rules={{ validate: (v) => v === true || v === false }}
      render={({ field, fieldState }) => (
        <Pergunta label={label} error={!!fieldState.error}>
          <div className="flex gap-2">
            {[
              { v: true, l: 'Sim' },
              { v: false, l: 'Não' },
            ].map((o) => (
              <button
                key={o.l}
                type="button"
                onClick={() => field.onChange(o.v)}
                className={cn(
                  'rounded-md border px-4 py-1.5 text-sm transition-colors',
                  field.value === o.v
                    ? 'border-primary bg-primary text-primary-foreground'
                    : 'border-input hover:bg-muted',
                )}
              >
                {o.l}
              </button>
            ))}
          </div>
        </Pergunta>
      )}
    />
  );
}

function MultiField<T extends FieldValues>({
  control,
  name,
  label,
  options,
}: {
  control: Control<T>;
  name: Path<T>;
  label: string;
  options: Opt[];
}) {
  return (
    <Controller
      control={control}
      name={name}
      defaultValue={[] as never}
      render={({ field }) => {
        const arr: string[] = field.value ?? [];
        const toggle = (v: string) =>
          field.onChange(arr.includes(v) ? arr.filter((x) => x !== v) : [...arr, v]);
        return (
          <Pergunta label={label}>
            <div className="flex flex-wrap gap-2">
              {options.map((o) => (
                <button
                  key={o.value}
                  type="button"
                  onClick={() => toggle(o.value)}
                  className={cn(
                    'rounded-md border px-3 py-1.5 text-sm transition-colors',
                    arr.includes(o.value)
                      ? 'border-primary bg-primary text-primary-foreground'
                      : 'border-input hover:bg-muted',
                  )}
                >
                  {o.label}
                </button>
              ))}
            </div>
          </Pergunta>
        );
      }}
    />
  );
}

function SubmitBtn({ submitting, ultimo }: { submitting: boolean; ultimo?: boolean }) {
  return (
    <Button type="submit" className="w-full" disabled={submitting}>
      {submitting ? 'Salvando…' : ultimo ? 'Concluir triagem' : 'Salvar e continuar'}
    </Button>
  );
}

async function enviar(setor: string, payload: unknown, onDone: () => void) {
  try {
    await api.post(`/triagem/${setor}`, payload);
    onDone();
  } catch (err) {
    toast.error(apiErrorMessage(err));
  }
}

// ---------------------------------------------------------------- PSICOLOGIA

const SONO: Opt[] = [
  { value: 'MUITO_BOA', label: 'Muito boa' },
  { value: 'BOA', label: 'Boa' },
  { value: 'REGULAR', label: 'Regular' },
  { value: 'RUIM', label: 'Ruim' },
  { value: 'MUITO_RUIM', label: 'Muito ruim' },
];

export function PsicologiaStep({ onDone }: { onDone: () => void }) {
  const {
    control,
    register,
    handleSubmit,
    watch,
    formState: { isSubmitting },
  } = useForm({ defaultValues: { acompanhamentoAnterior: undefined, medicacaoPsiq: undefined } as FieldValues });

  return (
    <form onSubmit={handleSubmit((d) => enviar('psicologia', d, onDone))} className="space-y-5" noValidate>
      <EscalaField control={control} name="saudeMentalNota" label="Como você descreveria seu estado de saúde mental atual? (1–10)" />
      <BoolField control={control} name="acompanhamentoAnterior" label="Já fez acompanhamento psicológico ou psiquiátrico?" />
      {watch('acompanhamentoAnterior') === true && (
        <Input placeholder="Conte brevemente" {...register('acompanhamentoDetalhe')} />
      )}
      <BoolField control={control} name="medicacaoPsiq" label="Faz uso de medicação psiquiátrica atualmente?" />
      {watch('medicacaoPsiq') === true && <Input placeholder="Qual medicação?" {...register('medicacaoDetalhe')} />}
      <EscalaField control={control} name="stressTrabNota" label="Nível de estresse no trabalho (1–10)" />
      <RadioField control={control} name="qualidadeSono" label="Como está sua qualidade de sono?" options={SONO} />
      <EscalaField control={control} name="ansiedadeTristeza" label="Tem sentido ansiedade ou tristeza frequente? (1–10)" />
      <Pergunta label="Há alguma situação que esteja te afetando muito? (opcional)">
        <Textarea {...register('situacaoAtual')} />
      </Pergunta>
      <div className="rounded-md border bg-muted/40 p-3">
        <p className="mb-3 text-sm font-medium">Contato de emergência (uso exclusivo da Psicologia)</p>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <Input placeholder="Nome" {...register('contatoEmergNome', { required: true })} />
          <Input placeholder="Telefone" {...register('contatoEmergTel', { required: true })} />
          <Input placeholder="Parentesco" {...register('contatoEmergParent', { required: true })} />
        </div>
      </div>
      <SubmitBtn submitting={isSubmitting} />
    </form>
  );
}

// ---------------------------------------------------------------- NUTRIÇÃO

export function NutricaoStep({ onDone }: { onDone: () => void }) {
  const {
    control,
    register,
    handleSubmit,
    formState: { isSubmitting },
  } = useForm({ defaultValues: { restricoes: [], condicoesSaude: [] } as FieldValues });

  return (
    <form onSubmit={handleSubmit((d) => enviar('nutricao', d, onDone))} className="space-y-5" noValidate>
      <div className="grid grid-cols-2 gap-4">
        <Pergunta label="Peso atual (kg)">
          <Input type="number" step="0.1" {...register('pesoKg', { required: true })} />
        </Pergunta>
        <Pergunta label="Altura (cm)">
          <Input type="number" step="0.1" {...register('alturaCm', { required: true })} />
        </Pergunta>
      </div>
      <MultiField
        control={control}
        name="restricoes"
        label="Restrições alimentares (múltipla escolha)"
        options={[
          { value: 'LACTOSE', label: 'Lactose' },
          { value: 'GLUTEN', label: 'Glúten' },
          { value: 'VEGETARIANO', label: 'Vegetariano' },
          { value: 'VEGANO', label: 'Vegano' },
          { value: 'OUTRO', label: 'Outro' },
        ]}
      />
      <MultiField
        control={control}
        name="condicoesSaude"
        label="Condições de saúde relevantes"
        options={[
          { value: 'DIABETES', label: 'Diabetes' },
          { value: 'HIPERTENSAO', label: 'Hipertensão' },
          { value: 'COLESTEROL', label: 'Colesterol alto' },
          { value: 'HIPOTIREOIDISMO', label: 'Hipotireoidismo' },
          { value: 'OUTRO', label: 'Outro' },
        ]}
      />
      <RadioField
        control={control}
        name="habitosAlimentares"
        label="Como descreveria seus hábitos alimentares?"
        options={[
          { value: 'MUITO_RUINS', label: 'Muito ruins' },
          { value: 'RUINS', label: 'Ruins' },
          { value: 'REGULARES', label: 'Regulares' },
          { value: 'BONS', label: 'Bons' },
          { value: 'MUITO_BONS', label: 'Muito bons' },
        ]}
      />
      <RadioField
        control={control}
        name="objetivo"
        label="Qual seu principal objetivo?"
        options={[
          { value: 'PERDER_PESO', label: 'Perder peso' },
          { value: 'GANHAR_MASSA', label: 'Ganhar massa' },
          { value: 'MELHORAR_ENERGIA', label: 'Melhorar energia' },
          { value: 'CONTROLAR_DOENCA', label: 'Controlar doença' },
          { value: 'MANUTENCAO', label: 'Manutenção' },
          { value: 'OUTRO', label: 'Outro' },
        ]}
      />
      <RadioField
        control={control}
        name="atividadeFisica"
        label="Pratica atividade física regularmente?"
        options={[
          { value: 'NAO', label: 'Não' },
          { value: '1_2X', label: '1–2x/semana' },
          { value: '3_4X', label: '3–4x/semana' },
          { value: '5_MAIS', label: '5+ x/semana' },
        ]}
      />
      <div className="grid grid-cols-2 gap-4">
        <Pergunta label="Refeições por dia">
          <Input type="number" {...register('refeicoesDia', { required: true })} />
        </Pergunta>
        <RadioField
          control={control}
          name="consumoAgua"
          label="Consumo de água"
          options={[
            { value: 'MENOS_1L', label: '< 1L' },
            { value: '1_2L', label: '1–2L' },
            { value: 'MAIS_2L', label: '> 2L' },
          ]}
        />
      </div>
      <SubmitBtn submitting={isSubmitting} />
    </form>
  );
}

// ---------------------------------------------------------------- JURÍDICO

export function JuridicoStep({ onDone }: { onDone: () => void }) {
  const {
    control,
    register,
    handleSubmit,
    watch,
    formState: { isSubmitting },
  } = useForm({ defaultValues: { temDemanda: undefined, processoAndamento: undefined } as FieldValues });

  const temDemanda = watch('temDemanda');

  return (
    <form onSubmit={handleSubmit((d) => enviar('juridico', d, onDone))} className="space-y-5" noValidate>
      <BoolField control={control} name="temDemanda" label="Você tem alguma demanda jurídica que precise de atenção?" />
      {temDemanda === true && (
        <>
          <RadioField
            control={control}
            name="areaDir"
            label="Qual área do direito?"
            options={[
              { value: 'TRABALHISTA', label: 'Trabalhista' },
              { value: 'FAMILIA', label: 'Família' },
              { value: 'CONSUMIDOR', label: 'Consumidor' },
              { value: 'CRIMINAL', label: 'Criminal' },
              { value: 'PREVIDENCIARIO', label: 'Previdenciário' },
              { value: 'CIVIL', label: 'Civil' },
              { value: 'OUTRO', label: 'Outro' },
            ]}
          />
          <RadioField
            control={control}
            name="urgencia"
            label="Nível de urgência"
            options={[
              { value: 'URGENTE', label: 'Urgente' },
              { value: 'MODERADO', label: 'Moderado' },
              { value: 'AGUARDAR', label: 'Posso aguardar' },
            ]}
          />
          <BoolField control={control} name="processoAndamento" label="Existe processo já em andamento?" />
          {watch('processoAndamento') === true && <Input placeholder="Em qual fase?" {...register('processoFase')} />}
          <Pergunta label="Outra parte envolvida (opcional)">
            <Input placeholder="Ex.: ex-empregador, empresa…" {...register('outraParte')} />
          </Pergunta>
          <BoolField control={control} name="temDocumentacao" label="Já possui documentação relacionada?" />
          <Pergunta label="Descreva brevemente sua situação (opcional)">
            <Textarea {...register('descricao')} />
          </Pergunta>
        </>
      )}
      <SubmitBtn submitting={isSubmitting} />
    </form>
  );
}

// ---------------------------------------------------------------- FINANCEIRO

export function FinanceiroStep({ onDone, ultimo }: { onDone: () => void; ultimo?: boolean }) {
  const {
    control,
    handleSubmit,
    formState: { isSubmitting },
  } = useForm({ defaultValues: {} as FieldValues });

  return (
    <form onSubmit={handleSubmit((d) => enviar('financeiro', d, onDone))} className="space-y-5" noValidate>
      <RadioField
        control={control}
        name="faixaRenda"
        label="Faixa de renda mensal"
        options={[
          { value: 'ATE_2000', label: 'Até R$2.000' },
          { value: '2001_5000', label: 'R$2.001–5.000' },
          { value: '5001_10000', label: 'R$5.001–10.000' },
          { value: 'ACIMA_10000', label: 'Acima de R$10.000' },
        ]}
      />
      <RadioField
        control={control}
        name="situacaoDividas"
        label="Possui dívidas em aberto?"
        options={[
          { value: 'NAO', label: 'Não' },
          { value: 'CONTROLADAS', label: 'Sim, controladas' },
          { value: 'DIFICULDADE', label: 'Sim, com dificuldade' },
        ]}
      />
      <RadioField
        control={control}
        name="objetivoPrinc"
        label="Principal objetivo financeiro"
        options={[
          { value: 'SAIR_DIVIDAS', label: 'Sair das dívidas' },
          { value: 'RESERVA_EMERGENCIA', label: 'Reserva de emergência' },
          { value: 'INVESTIR', label: 'Investir' },
          { value: 'APOSENTADORIA', label: 'Aposentadoria' },
          { value: 'COMPRAR_IMOVEL', label: 'Comprar imóvel' },
          { value: 'OUTRO', label: 'Outro' },
        ]}
      />
      <RadioField
        control={control}
        name="investeAtual"
        label="Você investe atualmente?"
        options={[
          { value: 'NAO', label: 'Não' },
          { value: 'POUPANCA', label: 'Poupança' },
          { value: 'RENDA_FIXA', label: 'Renda fixa' },
          { value: 'RENDA_VARIAVEL', label: 'Renda variável' },
        ]}
      />
      <RadioField
        control={control}
        name="controlGastos"
        label="Como avalia seu controle de gastos?"
        options={[
          { value: 'NAO_CONTROLO', label: 'Não controlo' },
          { value: 'PARCIAL', label: 'Parcial' },
          { value: 'PLANILHA', label: 'Tenho planilha' },
          { value: 'APLICATIVO', label: 'Uso aplicativo' },
        ]}
      />
      <RadioField
        control={control}
        name="previdencia"
        label="Contribui para previdência?"
        options={[
          { value: 'SO_INSS', label: 'Só INSS' },
          { value: 'INSS_PRIVADA', label: 'INSS + privada' },
          { value: 'APENAS_PRIVADA', label: 'Apenas privada' },
          { value: 'NENHUMA', label: 'Nenhuma' },
        ]}
      />
      <RadioField
        control={control}
        name="dependentes"
        label="Tem dependentes financeiros?"
        options={[
          { value: 'NAO', label: 'Não' },
          { value: 'UM', label: 'Sim, 1' },
          { value: 'DOIS', label: 'Sim, 2' },
          { value: 'TRES_MAIS', label: 'Sim, 3 ou mais' },
        ]}
      />
      <SubmitBtn submitting={isSubmitting} ultimo={ultimo} />
    </form>
  );
}
