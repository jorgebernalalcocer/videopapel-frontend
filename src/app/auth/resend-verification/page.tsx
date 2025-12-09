// app/auth/resend-verification/page.tsx (Versión con FETCH nativo)
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

type FormStatus = 'idle' | 'loading' | 'success' | 'error';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export default function ResendVerificationPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<FormStatus>('idle');
  const [message, setMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email) {
      setStatus('error');
      setMessage('Por favor ingresa tu email');
      return;
    }

    setStatus('loading');

    try {
      const response = await fetch(`${API_URL}/api/auth/resend-verification/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || 'Error al enviar el email');
      }

      setStatus('success');
      setMessage(data.detail || 'Email de verificación enviado correctamente');
    } catch (error: any) {
      setStatus('error');
      const errorMessage = error.message || 'Error al enviar el email. Por favor intenta de nuevo.';
      setMessage(errorMessage);
      console.error('Error reenviando verificación:', error);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="max-w-md w-full">
        <div className="bg-white rounded-lg shadow-lg p-8">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              📹 Papel Video
            </h1>
            <h2 className="text-xl font-semibold text-gray-700 mb-2">
              Reenviar Verificación de Email
            </h2>
            <p className="text-gray-600 text-sm">
              Ingresa tu email y te enviaremos un nuevo enlace de verificación
            </p>
          </div>

          {/* Form - Solo mostrar si no hay success */}
          {status !== 'success' && (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label
                  htmlFor="email"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Email
                </label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="tu@email.com"
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all"
                  disabled={status === 'loading'}
                />
              </div>

              {/* Error Message */}
              {status === 'error' && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                  <div className="flex items-start">
                    <svg
                      className="w-5 h-5 text-red-600 mt-0.5 mr-3 flex-shrink-0"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                    <p className="text-sm text-red-700">{message}</p>
                  </div>
                </div>
              )}

              {/* Submit Button */}
              <button
                type="submit"
                disabled={status === 'loading'}
                className="w-full px-6 py-3 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-700 disabled:bg-indigo-400 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
              >
                {status === 'loading' ? (
                  <>
                    <svg
                      className="animate-spin h-5 w-5 mr-3"
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
                    Enviando...
                  </>
                ) : (
                  'Enviar Email de Verificación'
                )}
              </button>
            </form>
          )}

          {/* Success Message */}
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
                      d="M3 19v-8.93a2 2 0 01.89-1.664l7-4.666a2 2 0 012.22 0l7 4.666A2 2 0 0121 10.07V19M3 19a2 2 0 002 2h14a2 2 0 002-2M3 19l6.75-4.5M21 19l-6.75-4.5M3 10l6.75 4.5M21 10l-6.75 4.5m0 0l-1.14.76a2 2 0 01-2.22 0l-1.14-.76"
                    />
                  </svg>
                </div>
              </div>
              <h2 className="text-2xl font-bold text-green-600 mb-3">
                ✅ ¡Email Enviado!
              </h2>
              <p className="text-gray-700 mb-6">{message}</p>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6 text-left">
                <p className="text-sm text-blue-800 font-semibold mb-2">
                  📬 ¿Qué hacer ahora?
                </p>
                <ol className="text-sm text-blue-700 space-y-2 list-decimal list-inside">
                  <li>Revisa tu bandeja de entrada</li>
                  <li>Busca el email de Papel Video</li>
                  <li>Haz clic en el enlace de verificación</li>
                  <li>Si no lo ves, revisa tu carpeta de spam</li>
                </ol>
              </div>

              <button
                onClick={() => router.push('/auth/login')}
                className="w-full px-6 py-3 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-700 transition-colors"
              >
                Ir a Login
              </button>
            </div>
          )}

          {/* Back to Login */}
          {status !== 'success' && (
            <div className="mt-6 text-center">
              <button
                onClick={() => router.push('/auth/login')}
                className="text-sm text-indigo-600 hover:text-indigo-800 font-medium"
              >
                ← Volver al Login
              </button>
            </div>
          )}
        </div>

        {/* Help Footer */}
        <div className="text-center mt-6 text-sm text-gray-600">
          <p>
            ¿Necesitas ayuda?{' '}
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
