// src/components/auth/GoogleLoginButton.tsx
'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/store/auth';
import { apiFetch } from '@/lib/http';
import { Button } from '@/components/ui/button';
import { Chrome } from 'lucide-react'; // Usamos Chrome de Lucide
import { API_BASE } from '@/lib/env';

// Se leen desde el entorno para no mezclar entornos y evitar 403 por dominios no autorizados
const GOOGLE_CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
const GOOGLE_REDIRECT_URI =
  process.env.NEXT_PUBLIC_GOOGLE_REDIRECT_URI ||
  `${API_BASE}/auth/google/login/callback/`;

// Definición de tipos de respuesta del backend
type SocialLoginResponse = {
  access: string;
  refresh: string;
  user?: {
    id: number;
    email: string;
    // ... otros campos del usuario que devuelve tu serializador UserDetailsSerializer
  };
};

// ----------------------------------------------------------------------
// Función que maneja el flujo de Google OAuth
// ----------------------------------------------------------------------
export function GoogleLoginButton() {
  const router = useRouter();
  const login = useAuth((s) => s.login);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [tokenClient, setTokenClient] = useState<any>(null);
  
  // 1. Manejador del Callback de Google
  // Aquí es donde Google devuelve el access_token (flujo implícito)
  const handleTokenResponse = useCallback(async (response: any) => {
    if (!response.access_token) {
      setError('No se recibió el access_token de Google.');
      return;
    }

    setLoading(true);
    setError(null);

    // 2. POSTear el token al backend de Django
    try {
      // Endpoint de Django: /auth/google/login/
      const data = await apiFetch<SocialLoginResponse>('/auth/google/login/', {
        method: 'POST',
        body: JSON.stringify({
          access_token: response.access_token,
        }),
      });

      // 3. Login exitoso: guarda tokens y redirige
      login(data);
      router.push('/clips');

    } catch (err: any) {
      console.error('Error al enviar código a Django:', err);
      setError('El registro/login con Google falló o el email ya está registrado.');
    } finally {
      setLoading(false);
    }
  }, [login, router]);

  // 4. Inicialización del SDK de Google Identity Services (GIS)
  useEffect(() => {
    if (!GOOGLE_CLIENT_ID) {
      setError('Falta configurar NEXT_PUBLIC_GOOGLE_CLIENT_ID.');
      return;
    }

    if (!GOOGLE_REDIRECT_URI) {
      setError('Falta configurar NEXT_PUBLIC_GOOGLE_REDIRECT_URI.');
      return;
    }

    if (typeof window === 'undefined' || !window.google?.accounts?.oauth2) {
      return;
    }

    const client = window.google.accounts.oauth2.initTokenClient({
      client_id: GOOGLE_CLIENT_ID,
      scope: 'openid email profile',
      callback: handleTokenResponse,
    });

    setTokenClient(client);
  }, [handleTokenResponse]);

  // 5. Función para iniciar el flujo al hacer clic en nuestro botón
  const handleGoogleLogin = () => {
    setError(null);

    if (!tokenClient) {
      setError('Google todavía se está cargando. Inténtalo de nuevo en unos segundos.');
      return;
    }

    setLoading(true); // Mostrar loading al inicio del flujo
    tokenClient.requestAccessToken();
  };

  // 6. Renderizado del botón
  return (
    <>
      <Button
        onClick={handleGoogleLogin}
        disabled={loading}
        className="w-full bg-white text-gray-700 border border-gray-300 hover:bg-gray-100 shadow-sm"
      >
        <Chrome className="mr-2 h-5 w-5 text-blue-600" /> 
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
