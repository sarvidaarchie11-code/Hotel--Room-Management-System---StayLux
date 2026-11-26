import axios, { AxiosError } from 'axios';
import { API_URL } from '@/constants/config';

let token: string | null = null;
let onUnauthorized: (() => void) | null = null;

export const setAuthToken = (t: string | null) => { token = t; };
export const setUnauthorizedHandler = (fn: (() => void) | null) => { onUnauthorized = fn; };

export const api = axios.create({ baseURL: API_URL, timeout: 20000 });

api.interceptors.request.use((config) => {
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (r) => r,
  (error: AxiosError<{ message?: string; code?: string }>) => {
    // an expired / revoked session signs the user out everywhere
    if (error.response?.status === 401 && token && !error.config?.url?.includes('/auth/login')) onUnauthorized?.();
    return Promise.reject(error);
  },
);

export function errMsg(e: unknown): string {
  if (axios.isAxiosError(e)) {
    const data = e.response?.data as { message?: string } | undefined;
    if (data?.message) return data.message;
    if (!e.response) return 'Cannot reach the server. Check your Wi-Fi and the EXPO_PUBLIC_API_URL setting.';
  }
  return e instanceof Error ? e.message : 'Something went wrong';
}

export function fieldErrors(e: unknown): Record<string, string> {
  if (axios.isAxiosError(e)) return (e.response?.data as { errors?: Record<string, string> } | undefined)?.errors ?? {};
  return {};
}

export const errCode = (e: unknown): string | undefined =>
  axios.isAxiosError(e) ? (e.response?.data as { code?: string } | undefined)?.code : undefined;
