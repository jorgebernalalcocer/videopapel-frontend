'use client';

import { useState } from 'react';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { API_URL } from '@/lib/env';
import { Button } from '@/components/ui/button';

const schema = z.object({
  email: z.string().email('Introduce un email válido'),
});
type FormData = z.infer<typeof schema>;

export default function ResetPasswordRequestPage() {
  const [serverError, setServerError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { email: '' },
  });

  const onSubmit = async (values: FormData) => {
    setServerError(null);
    try {
      const res = await fetch(`${API_URL}/auth/reset-password/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values),
      });
      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || `HTTP ${res.status}`);
      }
      setDone(true);
    } catch (err: any) {
      setServerError(err.message || 'No se pudo enviar el correo de restablecimiento');
    }
  };

  if (done) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <div className="w-full max-w-md rounded-xl border bg-white p-6 shadow-sm">
          <h1 className="text-2xl font-semibold mb-2">Revisa tu correo</h1>
          <p className="text-sm text-gray-600">
            Si el email existe, hemos enviado un enlace para restablecer la contraseña.
          </p>
          <a href="/login" className="mt-4 inline-block text-blue-600 hover:underline text-sm">
            Volver al inicio de sesión
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <div className="w-full max-w-md rounded-xl border bg-white p-6 shadow-sm">
        <h1 className="text-2xl font-semibold mb-1">Restablecer contraseña</h1>
        <p className="text-sm text-gray-500 mb-6">
          Introduce tu email y te enviaremos un enlace para restablecerla.
        </p>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1" htmlFor="email">
              Email
            </label>
            <input
              id="email"
              type="email"
              className="w-full rounded-md border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="tucorreo@dominio.com"
              {...register('email')}
            />
            {errors.email && (
              <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>
            )}
          </div>

          {serverError && (
            <div className="rounded-md bg-red-50 p-3 text-sm text-red-700">
              {serverError}
            </div>
          )}

          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? 'Enviando…' : 'Enviar enlace'}
          </Button>
        </form>
      </div>
    </div>
  );
}
