// app/auth/verify-email/[key]/page.tsx (Versión con FETCH nativo)
'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';

type VerificationStatus = 'loading' | 'success' | 'error';

interface VerificationResponse {
  detail: string;
  user?: {
    id: string;
    email: string;
    username: string;
  };
  tokens?: {
    access: string;
    refresh: string;
  };
}

const API_URL = process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:8000';

export default function VerifyEmailPage() {
  const router = useRouter();
  const params = useParams();
  const key = params?.key as string;

  const [status, setStatus] = useState<VerificationStatus>('loading');
  const [message, setMessage] = useState('');
  const [userData, setUserData] = useState<VerificationResponse['user'] | null>(null);

  useEffect(() => {
    if (!key) {
      setStatus('error');
      setMessage('No se proporcionó clave de verificación');
      return;
    }

    const verifyEmail = async () => {
      try {
const response = await fetch(`${API_URL}/api/auth/verify-email/`, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({ key }),
});

        const data: VerificationResponse = await response.json();

        if (!response.ok) {
          throw new Error(data.detail || 'Error al verificar el email');
        }

        setStatus('success');
        setMessage(data.detail);
        setUserData(data.user || null);

        // Guardar tokens en localStorage si se devuelven
        if (data.tokens) {
          localStorage.setItem('access_token', data.tokens.access);
          localStorage.setItem('refresh_token', data.tokens.refresh);

          // También guardar el usuario
          if (data.user) {
            localStorage.setItem('user', JSON.stringify(data.user));
          }
        }

        // Redirigir después de 3 segundos
        setTimeout(() => {
          router.push('/dashboard');
        }, 3000);
      } catch (error: any) {
        setStatus('error');
        const errorMessage = error.message || 'Error al verificar el email. El enlace puede haber expirado.';
        setMessage(errorMessage);
        console.error('Error verificando email:', error);
      }
    };

    verifyEmail();
  }, [key, router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="max-w-md w-full">
        <div className="bg-white rounded-lg shadow-lg p-8">
          {/* Header */}
          <div className="text-center mb-6">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              📹 Papel Video
            </h1>
            <p className="text-gray-600">Verificación de Email</p>
          </div>

          {/* Loading State */}
          {status === 'loading' && (
            <div className="text-center py-8">
              <div className="inline-block animate-spin rounded-full h-16 w-16 border-4 border-indigo-500 border-t-transparent mb-4"></div>
              <h2 className="text-xl font-semibold text-gray-900 mb-2">
                Verificando tu email...
              </h2>
              <p className="text-gray-600">Por favor espera un momento</p>
            </div>
          )}

          {/* Success State */}
          {status === 'success' && (
            <div className="text-center py-8">
              <div className="mb-4">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full">
                  <svg
                    className="w-8 h-8 text-green-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                </div>
              </div>
              <h2 className="text-2xl font-bold text-green-600 mb-3">
                ✅ ¡Email Verificado!
              </h2>
              <p className="text-gray-700 mb-4">{message}</p>
              {userData && (
                <div className="bg-gray-50 rounded-lg p-4 mb-4">
                  <p className="text-sm text-gray-600">Cuenta verificada:</p>
                  <p className="font-semibold text-gray-900">{userData.email}</p>
                </div>
              )}
              <div className="flex items-center justify-center text-sm text-gray-600">
                <svg
                  className="animate-spin h-4 w-4 mr-2"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
                Redirigiendo al dashboard...
              </div>
            </div>
          )}

          {/* Error State */}
          {status === 'error' && (
            <div className="text-center py-8">
              <div className="mb-4">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-red-100 rounded-full">
                  <svg
                    className="w-8 h-8 text-red-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </div>
              </div>
              <h2 className="text-2xl font-bold text-red-600 mb-3">
                ❌ Error de Verificación
              </h2>
              <p className="text-gray-700 mb-6">{message}</p>

              <div className="space-y-3">
                <button
                  onClick={() => router.push('/auth/resend-verification')}
                  className="w-full px-6 py-3 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-700 transition-colors"
                >
                  Reenviar Email de Verificación
                </button>
                <button
                  onClick={() => router.push('/auth/login')}
                  className="w-full px-6 py-3 bg-gray-200 text-gray-700 font-semibold rounded-lg hover:bg-gray-300 transition-colors"
                >
                  Ir a Login
                </button>
              </div>

              <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg text-left">
                <p className="text-sm text-yellow-800 font-semibold mb-2">
                  💡 Posibles causas:
                </p>
                <ul className="text-sm text-yellow-700 space-y-1 list-disc list-inside">
                  <li>El enlace ha expirado (válido por 3 días)</li>
                  <li>El enlace ya fue usado anteriormente</li>
                  <li>El enlace es incorrecto o está incompleto</li>
                </ul>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="text-center mt-6 text-sm text-gray-600">
          <p>
            ¿Problemas?{' '}
            <a
              href="mailto:hola@papel.video"
              className="text-indigo-600 hover:text-indigo-800 font-medium"
            >
              Contáctanos
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
