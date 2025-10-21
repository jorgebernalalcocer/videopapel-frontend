'use client';

import { useState } from 'react';
import { useParams, useSearchParams, useRouter } from 'next/navigation';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { API_URL } from '@/lib/env';
import { Button } from '@/components/ui/button';

const schema = z.object({
  new_password: z.string().min(8, 'Mínimo 8 caracteres'),
  confirm_password: z.string().min(8, 'Mínimo 8 caracteres'),
}).refine((data) => data.new_password === data.confirm_password, {
  path: ['confirm_password'],
  message: 'Las contraseñas no coinciden',
});

type FormData = z.infer<typeof schema>;

export default function ResetPasswordConfirmPage() {
  const router = useRouter();
  const params = useParams<{ token: string }>();
  const search = useSearchParams();
  const email = search.get('email') || undefined;

  const [serverError, setServerError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { new_password: '', confirm_password: '' },
  });

  const onSubmit = async (values: FormData) => {
    setServerError(null);
    try {
      const res = await fetch(`${API_URL}/reset-password-confirm/${params.token}/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ new_password: values.new_password }),
      });
      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || `HTTP ${res.status}`);
      }
      setDone(true);
      setTimeout(() => router.push('/login'), 1500);
    } catch (err: any) {
      setServerError(err.message || 'No se pudo restablecer la contraseña');
    }
  };

  if (done) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <div className="w-full max-w-md rounded-xl border bg-white p-6 shadow-sm">
          <h1 className="text-2xl font-semibold mb-2">Contraseña actualizada</h1>
          <p className="text-sm text-gray-600">Redirigiendo al inicio de sesión…</p>
          <a href="/login" className="mt-3 inline-block text-blue-600 hover:underline text-sm">
            Ir ahora
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <div className="w-full max-w-md rounded-xl border bg-white p-6 shadow-sm">
        <h1 className="text-2xl font-semibold mb-1">Nueva contraseña</h1>
        {email && (
          <p className="text-sm text-gray-500 mb-4">
            Para: <span className="font-medium">{email}</span>
          </p>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1" htmlFor="new_password">
              Nueva contraseña
            </label>
            <input
              id="new_password"
              type="password"
              className="w-full rounded-md border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500"
              {...register('new_password')}
            />
            {errors.new_password && (
              <p className="mt-1 text-sm text-red-600">{errors.new_password.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium mb-1" htmlFor="confirm_password">
              Confirmar contraseña
            </label>
            <input
              id="confirm_password"
              type="password"
              className="w-full rounded-md border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500"
              {...register('confirm_password')}
            />
            {errors.confirm_password && (
              <p className="mt-1 text-sm text-red-600">{errors.confirm_password.message}</p>
            )}
          </div>

          {serverError && (
            <div className="rounded-md bg-red-50 p-3 text-sm text-red-700">
              {serverError}
            </div>
          )}

          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? 'Guardando…' : 'Guardar nueva contraseña'}
          </Button>
        </form>
      </div>
    </div>
  );
}
