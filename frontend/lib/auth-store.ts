'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { UsuarioResumo } from './types';

interface AuthState {
  accessToken: string | null;
  refreshToken: string | null;
  usuario: UsuarioResumo | null;
  setSession: (data: { accessToken: string; refreshToken: string; usuario: UsuarioResumo }) => void;
  setTokens: (accessToken: string, refreshToken: string) => void;
  setPrimeiroLoginConcluido: () => void;
  clear: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      accessToken: null,
      refreshToken: null,
      usuario: null,
      setSession: ({ accessToken, refreshToken, usuario }) => set({ accessToken, refreshToken, usuario }),
      setTokens: (accessToken, refreshToken) => set({ accessToken, refreshToken }),
      setPrimeiroLoginConcluido: () => {
        const u = get().usuario;
        if (u) set({ usuario: { ...u, primeiroLogin: false } });
      },
      clear: () => set({ accessToken: null, refreshToken: null, usuario: null }),
    }),
    { name: 'integrity-auth' },
  ),
);
