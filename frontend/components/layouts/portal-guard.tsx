'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/auth-store';
import { PORTAL_POR_ROLE, ROTA_INICIAL } from '@/lib/types';
import type { Portal } from '@/lib/nav';

/**
 * Protege um portal: exige autenticação, força a troca de senha no primeiro
 * acesso e redireciona o usuário para o portal correto ao seu role.
 *
 * Aguarda a reidratação do zustand-persist antes de decidir, para não expulsar
 * um usuário logado num reload (F5) por causa do estado inicial vazio.
 */
export function PortalGuard({ portal, children }: { portal: Portal; children: React.ReactNode }) {
  const router = useRouter();
  const { accessToken, usuario } = useAuthStore();
  const [hidratado, setHidratado] = useState(() => useAuthStore.persist.hasHydrated());
  const [pronto, setPronto] = useState(false);

  // Aguarda a hidratação do storage persistido
  useEffect(() => {
    if (useAuthStore.persist.hasHydrated()) setHidratado(true);
    const unsub = useAuthStore.persist.onFinishHydration(() => setHidratado(true));
    return unsub;
  }, []);

  useEffect(() => {
    if (!hidratado) return;
    if (!accessToken || !usuario) {
      router.replace('/login');
      return;
    }
    if (usuario.primeiroLogin) {
      router.replace('/primeiro-acesso');
      return;
    }
    const portalDoUsuario = PORTAL_POR_ROLE[usuario.role];
    if (portalDoUsuario !== portal) {
      router.replace(ROTA_INICIAL[portalDoUsuario]);
      return;
    }
    setPronto(true);
  }, [hidratado, accessToken, usuario, portal, router]);

  if (!pronto) {
    return (
      <div className="flex min-h-screen items-center justify-center text-sm text-muted-foreground">
        Carregando…
      </div>
    );
  }
  return <>{children}</>;
}
