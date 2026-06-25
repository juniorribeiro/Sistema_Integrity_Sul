import { PortalGuard } from '@/components/layouts/portal-guard';
import { AppShell } from '@/components/layouts/app-shell';

export default function IntegrityLayout({ children }: { children: React.ReactNode }) {
  return (
    <PortalGuard portal="integrity">
      <AppShell portal="integrity">{children}</AppShell>
    </PortalGuard>
  );
}
