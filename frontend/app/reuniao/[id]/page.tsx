'use client';

import { useEffect, useState, use } from 'react';
import { useRouter } from 'next/navigation';
import { LiveKitRoom, VideoConference } from '@livekit/components-react';
import { Loader2, VideoOff, Home, MicOff } from 'lucide-react';
import { toast } from 'sonner';

import { api, apiErrorMessage } from '@/lib/api';
import { Button } from '@/components/ui/button';

import '@livekit/components-styles';

interface ReuniaoData {
  token: string;
  serverUrl: string;
  roomName: string;
}

export default function ReuniaoPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const { id } = use(params);

  const [data, setData] = useState<ReuniaoData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function carregarToken() {
      try {
        const { data: res } = await api.get<ReuniaoData>(`/agendamentos/${id}/reuniao-token`);
        setData(res);
      } catch (err) {
        const msg = apiErrorMessage(err);
        setError(msg);
        toast.error(msg);
      } finally {
        setLoading(false);
      }
    }
    carregarToken();
  }, [id]);

  function voltarParaHome() {
    router.push('/integrity/calendario');
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-slate-950 text-slate-100">
        <Loader2 className="h-10 w-10 animate-spin text-indigo-500 mb-4" />
        <p className="text-sm font-medium tracking-wide text-slate-400 animate-pulse">
          Conectando ao servidor de videoconferência...
        </p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-slate-950 text-slate-100 px-6 text-center">
        <div className="bg-slate-900/50 border border-slate-800/80 rounded-2xl p-8 max-w-md shadow-2xl backdrop-blur-xl">
          <div className="w-16 h-16 bg-red-950/40 border border-red-500/30 rounded-full flex items-center justify-center mx-auto mb-6">
            <VideoOff className="h-8 w-8 text-red-500" />
          </div>
          <h1 className="text-xl font-semibold mb-2">Não foi possível entrar na sala</h1>
          <p className="text-sm text-slate-400 mb-6">
            {error || 'Sala de reunião inválida ou indisponível no momento.'}
          </p>
          <Button onClick={voltarParaHome} className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700">
            <Home className="h-4 w-4" /> Voltar ao Painel
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full min-h-screen bg-slate-950 text-slate-100" data-lk-theme="default">
      <LiveKitRoom
        video={true}
        audio={true}
        token={data.token}
        serverUrl={data.serverUrl}
        onDisconnected={voltarParaHome}
        className="min-h-screen flex flex-col"
      >
        <VideoConference />
      </LiveKitRoom>
    </div>
  );
}
