import { PortalGuard } from '@/components/layouts/portal-guard';
import { AppShell } from '@/components/layouts/app-shell';

export default function FuncionarioLayout({ children }: { children: React.ReactNode }) {
  return (
    <PortalGuard portal="funcionario">
      <AppShell portal="funcionario">{children}</AppShell>
    </PortalGuard>
  );
}
