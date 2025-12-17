// src/components/auth/GoogleLoginButton.tsx
'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/store/auth';
import { apiFetch } from '@/lib/http';
import { Button } from '@/components/ui/button';
import { GoogleLogo } from '@/components/icons/GoogleLogo';
import { API_BASE } from '@/lib/env';

const GOOGLE_CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;

type SocialLoginResponse = {
  access: string;
  refresh: string;
  user?: {
    id: number;
    email: string;
  };
};

export function GoogleLoginButton() {
  const router = useRouter();
  const login = useAuth((s) => s.login);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [tokenClient, setTokenClient] = useState<any>(null);
  
  // 🔹 MANEJADOR PARA ONE TAP (recibe id_token/credential)
  const handleCredentialResponse = useCallback(async (response: any) => {
    if (!response?.credential) {
      console.log('One Tap: sin credential');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Envía el ID token al backend
      const data = await apiFetch<SocialLoginResponse>('/auth/google/login/', {
        method: 'POST',
        body: JSON.stringify({
          id_token: response.credential, // 🚨 Cambia según tu backend
        }),
      });

      login(data);
      router.push('/clips');
    } catch (err: any) {
      console.error('Error en One Tap:', err);
      setError('El inicio de sesión con Google falló.');
    } finally {
      setLoading(false);
    }
  }, [login, router]);

  // 🔹 MANEJADOR PARA EL BOTÓN MANUAL (recibe access_token)
  const handleTokenResponse = useCallback(async (response: any) => {
    if (!response?.access_token) {
      setError('No se recibió el access_token de Google.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const data = await apiFetch<SocialLoginResponse>('/auth/google/login/', {
        method: 'POST',
        body: JSON.stringify({
          access_token: response.access_token,
        }),
      });

      login(data);
      router.push('/clips');
    } catch (err: any) {
      console.error('Error en botón manual:', err);
      setError('El inicio de sesión con Google falló.');
    } finally {
      setLoading(false);
    }
  }, [login, router]);

  // 🔹 INICIALIZACIÓN
  useEffect(() => {
    if (!GOOGLE_CLIENT_ID) {
      setError('Falta configurar NEXT_PUBLIC_GOOGLE_CLIENT_ID.');
      return;
    }

    if (typeof window === 'undefined' || !window.google?.accounts) {
      return;
    }

    // ONE TAP (popup automático)
    window.google.accounts.id.initialize({
      client_id: GOOGLE_CLIENT_ID,
      callback: handleCredentialResponse, // 🚨 Usa el handler de credential
    });
    
    window.google.accounts.id.prompt();

    // BOTÓN MANUAL (OAuth con access_token)
    const client = window.google.accounts.oauth2.initTokenClient({
      client_id: GOOGLE_CLIENT_ID,
      scope: 'openid email profile',
      callback: handleTokenResponse, // 🚨 Usa el handler de token
    });

    setTokenClient(client);
  }, [handleCredentialResponse, handleTokenResponse]);

  const handleGoogleLogin = () => {
    setError(null);

    if (!tokenClient) {
      setError('Google todavía se está cargando.');
      return;
    }

    setLoading(true);
    tokenClient.requestAccessToken();
  };

  return (
    <>
      <Button
        onClick={handleGoogleLogin}
        disabled={loading}
        className="w-full bg-white text-gray-700 border border-gray-300 hover:bg-gray-100 shadow-sm"
      >
        <GoogleLogo className="mr-2 h-6 w-6 text-blue-600" /> 
        {loading ? 'Conectando...' : 'Continuar con Google'}
      </Button>
      
      {error && (
        <div className="rounded-md bg-red-50 p-3 text-sm text-red-700 mt-2">
          {error}
        </div>
      )}
    </>
  );
}