import { PortalGuard } from '@/components/layouts/portal-guard';
import { AppShell } from '@/components/layouts/app-shell';

export default function ClienteLayout({ children }: { children: React.ReactNode }) {
  return (
    <PortalGuard portal="cliente">
      <AppShell portal="cliente">{children}</AppShell>
    </PortalGuard>
  );
}
