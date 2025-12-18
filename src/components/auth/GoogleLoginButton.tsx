// src/components/auth/GoogleLoginButton.tsx
'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/store/auth';
import { apiFetch } from '@/lib/http';
import { Button } from '@/components/ui/button';
import { GoogleLogo } from '@/components/icons/GoogleLogo';

const GOOGLE_CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;

type SocialLoginResponse = {
  access: string;
  refresh: string;
  user?: {
    id: number;
    email: string;
  };
};

interface GoogleLoginButtonProps {
  mode?: 'login' | 'register';
  redirectTo?: string;
  className?: string;
}

export function GoogleLoginButton({ 
  mode = 'login',
  redirectTo = '/clips',
  className = '',
}: GoogleLoginButtonProps) {
  const router = useRouter();
  const login = useAuth((s) => s.login);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [tokenClient, setTokenClient] = useState<any>(null);
  
  // Textos según el modo
  const buttonText = mode === 'register' 
    ? 'Registrarse con Google'
    : 'Iniciar sesión con Google';
  
  const loadingText = mode === 'register'
    ? 'Registrando...'
    : 'Conectando...';

  const handleCredentialResponse = useCallback(async (response: any) => {
    if (!response?.credential) return;

    setLoading(true);
    setError(null);

    try {
      const data = await apiFetch<SocialLoginResponse>('/auth/google/login/', {
        method: 'POST',
        body: JSON.stringify({
          id_token: response.credential,
          mode, // Enviar el modo para analytics en backend
        }),
      });

      login(data);
      router.push(redirectTo);
    } catch (err: any) {
      console.error(`Error en One Tap (${mode}):`, err);
      const errorMessage = mode === 'register'
        ? 'El registro con Google falló.'
        : 'El inicio de sesión con Google falló.';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [login, router, mode, redirectTo]);

  const handleTokenResponse = useCallback(async (response: any) => {
    if (!response?.access_token) {
      setError('No se recibió el access_token de Google.');
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const data = await apiFetch<SocialLoginResponse>('/auth/google/login/', {
        method: 'POST',
        body: JSON.stringify({
          access_token: response.access_token,
          mode, // Enviar el modo para analytics en backend
        }),
      });

      login(data);
      router.push(redirectTo);
    } catch (err: any) {
      console.error(`Error en botón manual (${mode}):`, err);
      const errorMessage = mode === 'register'
        ? 'El registro con Google falló.'
        : 'El inicio de sesión con Google falló.';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [login, router, mode, redirectTo]);

  useEffect(() => {
    if (!GOOGLE_CLIENT_ID) {
      setError('Falta configurar NEXT_PUBLIC_GOOGLE_CLIENT_ID.');
      return;
    }

    if (typeof window === 'undefined' || !window.google?.accounts) {
      return;
    }

    // Inicializar One Tap de Google
    window.google.accounts.id.initialize({
      client_id: GOOGLE_CLIENT_ID,
      callback: handleCredentialResponse,
    });
    
    // Solo mostrar One Tap automático en login (opcional)
    if (mode === 'login') {
      window.google.accounts.id.prompt();
    }

    // Inicializar cliente OAuth2 para el botón manual
    const client = window.google.accounts.oauth2.initTokenClient({
      client_id: GOOGLE_CLIENT_ID,
      scope: 'openid email profile',
      callback: handleTokenResponse,
    });

    setTokenClient(client);
  }, [handleCredentialResponse, handleTokenResponse, mode]);

  const handleGoogleLogin = () => {
    setError(null);

    if (!tokenClient) {
      setError('Google todavía se está cargando.');
      return;
    }

    // Cancelar One Tap antes de iniciar OAuth manual
    if (window.google?.accounts?.id) {
      (window.google.accounts.id as any).cancel?.();
    }

    setLoading(true);
    tokenClient.requestAccessToken();
  };

  return (
    <div className="w-full">
      <Button
        onClick={handleGoogleLogin}
        disabled={loading}
        className={`w-full bg-white text-gray-700 border border-gray-300 hover:bg-gray-100 shadow-sm ${className}`}
      >
        <GoogleLogo className="mr-2 h-6 w-6 text-blue-600" /> 
        {loading ? loadingText : buttonText}
      </Button>
      
      {error && (
        <div className="rounded-md bg-red-50 p-3 text-sm text-red-700 mt-2">
          {error}
        </div>
      )}
    </div>
  );
}