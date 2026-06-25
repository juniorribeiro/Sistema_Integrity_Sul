'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Menu, LogOut } from 'lucide-react';
import { cn } from '@/lib/utils';
import { api } from '@/lib/api';
import { useAuthStore } from '@/lib/auth-store';
import { NAV_POR_PORTAL, ROLE_LABEL, type Portal } from '@/lib/nav';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from '@/components/ui/sheet';

function NavLinks({ portal, onNavigate }: { portal: Portal; onNavigate?: () => void }) {
  const pathname = usePathname();
  const items = NAV_POR_PORTAL[portal];
  return (
    <nav className="flex flex-col gap-1 p-3">
      {items.map((item) => {
        const ativo = pathname === item.href || pathname.startsWith(item.href + '/');
        const Icon = item.icon;
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            className={cn(
              'flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors',
              ativo ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-muted hover:text-foreground',
            )}
          >
            <Icon className="h-4 w-4 shrink-0" />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}

export function AppShell({ portal, children }: { portal: Portal; children: React.ReactNode }) {
  const router = useRouter();
  const { usuario, refreshToken, clear } = useAuthStore();
  const [drawerOpen, setDrawerOpen] = useState(false);

  async function logout() {
    try {
      if (refreshToken) await api.post('/auth/logout', { refreshToken });
    } catch {
      /* ignora erro de logout */
    }
    clear();
    router.replace('/login');
  }

  const Brand = (
    <div className="px-4 py-5">
      <p className="text-lg font-bold text-primary">Integrity Sul</p>
      <p className="text-xs text-muted-foreground">
        {usuario ? ROLE_LABEL[usuario.role] : ''}
      </p>
    </div>
  );

  return (
    <div className="flex min-h-screen bg-muted/30">
      {/* Sidebar desktop */}
      <aside className="hidden w-64 shrink-0 border-r bg-background lg:flex lg:flex-col">
        {Brand}
        <div className="flex-1 overflow-y-auto">
          <NavLinks portal={portal} />
        </div>
        <div className="border-t p-3">
          <Button variant="ghost" className="w-full justify-start gap-3 text-muted-foreground" onClick={logout}>
            <LogOut className="h-4 w-4" /> Sair
          </Button>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        {/* Topbar (mobile) */}
        <header className="flex items-center gap-2 border-b bg-background px-4 py-3 lg:hidden">
          <Sheet open={drawerOpen} onOpenChange={setDrawerOpen}>
            <SheetTrigger
              render={
                <Button variant="ghost" size="icon" aria-label="Abrir menu">
                  <Menu className="h-5 w-5" />
                </Button>
              }
            />
            <SheetContent side="left" className="w-72 p-0">
              <SheetTitle className="sr-only">Menu de navegação</SheetTitle>
              {Brand}
              <NavLinks portal={portal} onNavigate={() => setDrawerOpen(false)} />
              <div className="border-t p-3">
                <Button variant="ghost" className="w-full justify-start gap-3 text-muted-foreground" onClick={logout}>
                  <LogOut className="h-4 w-4" /> Sair
                </Button>
              </div>
            </SheetContent>
          </Sheet>
          <span className="font-semibold text-primary">Integrity Sul</span>
        </header>

        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">{children}</main>
      </div>
    </div>
  );
}
