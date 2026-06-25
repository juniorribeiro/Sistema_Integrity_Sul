import {
  LayoutDashboard,
  Building2,
  Users,
  FileText,
  Wallet,
  BarChart3,
  Brain,
  Apple,
  Scale,
  PiggyBank,
  CalendarDays,
  ClipboardList,
  type LucideIcon,
} from 'lucide-react';
import type { Role } from './types';

export interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
}

export type Portal = 'integrity' | 'cliente' | 'funcionario';

export const NAV_INTEGRITY: NavItem[] = [
  { label: 'Dashboard', href: '/integrity/dashboard', icon: LayoutDashboard },
  { label: 'Clientes', href: '/integrity/clientes', icon: Building2 },
  { label: 'Colaboradores', href: '/integrity/colaboradores', icon: Users },
  { label: 'Currículos', href: '/integrity/curriculos', icon: FileText },
  { label: 'Financeiro', href: '/integrity/financeiro', icon: Wallet },
  { label: 'Métricas', href: '/integrity/metricas', icon: BarChart3 },
];

export const NAV_CLIENTE: NavItem[] = [
  { label: 'Dashboard', href: '/cliente/dashboard', icon: LayoutDashboard },
  { label: 'Funcionários', href: '/cliente/funcionarios', icon: Users },
  { label: 'Contratos', href: '/cliente/contratos', icon: FileText },
  { label: 'Métricas', href: '/cliente/metricas', icon: BarChart3 },
];

export const NAV_FUNCIONARIO: NavItem[] = [
  { label: 'Início', href: '/funcionario/inicio', icon: LayoutDashboard },
  { label: 'Triagem', href: '/funcionario/triagem', icon: ClipboardList },
  { label: 'Psicologia', href: '/funcionario/psicologia', icon: Brain },
  { label: 'Nutrição', href: '/funcionario/nutricao', icon: Apple },
  { label: 'Jurídico', href: '/funcionario/juridico', icon: Scale },
  { label: 'Financeiro', href: '/funcionario/financeiro', icon: PiggyBank },
  { label: 'Agenda', href: '/funcionario/agenda', icon: CalendarDays },
];

export const NAV_POR_PORTAL: Record<Portal, NavItem[]> = {
  integrity: NAV_INTEGRITY,
  cliente: NAV_CLIENTE,
  funcionario: NAV_FUNCIONARIO,
};

/** Rótulo amigável de cada role (exibido no menu do usuário). */
export const ROLE_LABEL: Record<Role, string> = {
  DIRETORIA: 'Diretoria',
  CONSULTOR_RH: 'Consultor RH',
  PSICOLOGO: 'Psicólogo(a)',
  NUTRICIONISTA: 'Nutricionista',
  JURIDICO: 'Jurídico',
  FINANCEIRO_ATENDIMENTO: 'Financeiro (Atendimento)',
  FINANCEIRO_INTEGRITY: 'Financeiro (Interno)',
  RH_CLIENTE: 'RH',
  FUNCIONARIO: 'Funcionário',
};
