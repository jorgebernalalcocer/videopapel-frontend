'use client';

import { useState } from 'react';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';
import { API_URL } from '@/lib/env';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/store/auth';

const schema = z.object({
  email: z.string().email('Email no válido'),
  password: z.string().min(6, 'Mínimo 6 caracteres'),
});

type FormData = z.infer<typeof schema>;

export default function LoginPage() {
  const router = useRouter();
  const login = useAuth((s) => s.login);
  const [serverError, setServerError] = useState<string | null>(null);

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { email: '', password: '' },
  });

  const onSubmit = async (values: FormData) => {
    setServerError(null);
    try {
      const res = await fetch(`${API_URL}/token/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        // si pasas a cookies httpOnly en backend: credentials: 'include',
        body: JSON.stringify({ email: values.email, password: values.password }),
      });

      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || `HTTP ${res.status}`);
      }

      const data = await res.json() as {
        access: string;
        refresh: string;
        user?: { id: number; email: string; is_active: boolean };
      };

      // guarda tokens + user en el store
      login(data);

      // redirige
      router.push('/'); // o /dashboard
    } catch (err: any) {
      setServerError(err.message || 'Error en el inicio de sesión');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <div className="w-full max-w-md rounded-xl border bg-white p-6 shadow-sm">
        <h1 className="text-2xl font-semibold mb-1">Iniciar sesión</h1>
        <p className="text-sm text-gray-500 mb-6">
          Accede a tu cuenta de VideoPapel
        </p>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1" htmlFor="email">
              Email
            </label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              className="w-full rounded-md border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="tucorreo@dominio.com"
              {...register('email')}
            />
            {errors.email && (
              <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium mb-1" htmlFor="password">
              Contraseña
            </label>
            <input
              id="password"
              type="password"
              autoComplete="current-password"
              className="w-full rounded-md border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="********"
              {...register('password')}
            />
            {errors.password && (
              <p className="mt-1 text-sm text-red-600">{errors.password.message}</p>
            )}
          </div>

          {serverError && (
            <div className="rounded-md bg-red-50 p-3 text-sm text-red-700">
              {serverError}
            </div>
          )}

          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? 'Entrando…' : 'Entrar'}
          </Button>
        </form>

        <div className="mt-4 flex items-center justify-between text-sm">
          <a href="#" className="text-blue-600 hover:underline">¿Olvidaste la contraseña?</a>
          <a href="/register" className="text-gray-600 hover:underline">Crear cuenta</a>
        </div>
      </div>
    </div>
  );
}
