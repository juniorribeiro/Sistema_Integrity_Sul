export type Role =
  | 'DIRETORIA'
  | 'CONSULTOR_RH'
  | 'PSICOLOGO'
  | 'NUTRICIONISTA'
  | 'JURIDICO'
  | 'FINANCEIRO_ATENDIMENTO'
  | 'FINANCEIRO_INTEGRITY'
  | 'RH_CLIENTE'
  | 'FUNCIONARIO';

export interface UsuarioResumo {
  id: string;
  email: string;
  role: Role;
  primeiroLogin: boolean;
}

export interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  usuario: UsuarioResumo;
}

/** Portais por nível de acesso. */
export const PORTAL_POR_ROLE: Record<Role, 'integrity' | 'cliente' | 'funcionario'> = {
  DIRETORIA: 'integrity',
  CONSULTOR_RH: 'integrity',
  PSICOLOGO: 'integrity',
  NUTRICIONISTA: 'integrity',
  JURIDICO: 'integrity',
  FINANCEIRO_ATENDIMENTO: 'integrity',
  FINANCEIRO_INTEGRITY: 'integrity',
  RH_CLIENTE: 'cliente',
  FUNCIONARIO: 'funcionario',
};

/** Rota inicial de cada portal após o login. */
export const ROTA_INICIAL: Record<'integrity' | 'cliente' | 'funcionario', string> = {
  integrity: '/integrity/dashboard',
  cliente: '/cliente/dashboard',
  funcionario: '/funcionario/triagem',
};
