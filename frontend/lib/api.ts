import axios, { type AxiosError, type InternalAxiosRequestConfig } from 'axios';
import { useAuthStore } from './auth-store';

const baseURL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000';

export const api = axios.create({ baseURL });

// Anexa o access token em cada requisição
api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().accessToken;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Refresh automático em 401 (uma tentativa por requisição)
let refreshing: Promise<string | null> | null = null;

async function doRefresh(): Promise<string | null> {
  const { refreshToken, setTokens, clear } = useAuthStore.getState();
  if (!refreshToken) return null;
  try {
    const { data } = await axios.post(`${baseURL}/auth/refresh`, { refreshToken });
    setTokens(data.accessToken, data.refreshToken);
    return data.accessToken as string;
  } catch {
    clear();
    return null;
  }
}

api.interceptors.response.use(
  (res) => res,
  async (error: AxiosError) => {
    const original = error.config as InternalAxiosRequestConfig & { _retry?: boolean };
    const isAuthRoute = original?.url?.includes('/auth/login') || original?.url?.includes('/auth/refresh');

    if (error.response?.status === 401 && original && !original._retry && !isAuthRoute) {
      original._retry = true;
      refreshing = refreshing ?? doRefresh();
      const newToken = await refreshing;
      refreshing = null;
      if (newToken) {
        original.headers.Authorization = `Bearer ${newToken}`;
        return api(original);
      }
      if (typeof window !== 'undefined') window.location.href = '/login';
    }
    return Promise.reject(error);
  },
);

/** Extrai mensagem de erro amigável de uma resposta da API. */
export function apiErrorMessage(err: unknown, fallback = 'Ocorreu um erro. Tente novamente.'): string {
  if (axios.isAxiosError(err)) {
    return (err.response?.data as { error?: string })?.error ?? fallback;
  }
  return fallback;
}
