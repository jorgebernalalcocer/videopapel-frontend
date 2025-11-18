'use client';

import { useState } from 'react';
import Link from 'next/link';
import { z } from 'zod';
import { useForm, type SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';

import { useAuth } from '@/store/auth';
import { Button } from '@/components/ui/button';
import { apiFetch } from '@/lib/http';

// --- ZOD SCHEMAS REFINADOS PARA DJANGO ---
// Si se envía, debe ser válido. Si está vacío, se convierte a null.

const usernameSchema = z.string()
  .trim()
  // Regla simple: si hay texto, debe tener al menos 3 caracteres (la regla de max 150 es del backend)
  .refine(val => val.length === 0 || val.length >= 3, 'Mínimo 3 caracteres si se proporciona')
  .transform(val => val.length > 0 ? val : null) 
  .nullable(); // El valor final es string | null

const phoneSchema = z.string()
  .trim()
  .refine(val => val.length === 0 || val.length <= 24, 'Máximo 24 caracteres')
  .transform(val => val.length > 0 ? val : null)
  .nullable(); // El valor final es string | null
// --- FIN ZOD SCHEMAS ---


const schema = z
  .object({
    email: z.string().email('Email no válido'),
    password: z.string().min(6, 'Mínimo 6 caracteres'),
    confirm: z.string().min(6, 'Mínimo 6 caracteres'),
    
    // Estos campos serán string | null
    username: usernameSchema,
    phone: phoneSchema,
  })
  .refine((vals) => vals.password === vals.confirm, {
    path: ['confirm'],
    message: 'Las contraseñas no coinciden',
  });

// Definimos el tipo de datos final que usaremos en onSubmit: ahora son string | null
type FormData = z.infer<typeof schema>;


type RegisterResponse =
  | {
      // caso: la API crea usuario y devuelve tokens
      access: string;
      refresh: string;
      user?: { id: number; email: string; username?: string | null; phone?: string | null; is_active: boolean };
    }
  | {
      // caso: la API solo devuelve info/usuario
      user: { id: number; email: string; username?: string | null; phone?: string | null; is_active: boolean };
      detail?: string;
    };

export default function RegisterPage() {
  const router = useRouter();
  const login = useAuth((s) => s.login);
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
} = useForm<FormData>({
  resolver: zodResolver(schema),
  // FIX: Inicializamos con null para que coincida con el tipo de salida de Zod (string | null)
  defaultValues: { 
      email: '', 
      password: '', 
      confirm: '', 
      username: null, 
      phone: null     
    },
});

  const onSubmit: SubmitHandler<FormData> = async (values) => {
    console.log('Submitting values:', values);
    setServerError(null);
    try {
      // Zod se encargó de convertir '' a null. 
      // Construimos el payload enviando solo los campos que tienen valor real.
      const payload: Record<string, any> = {
        email: values.email,
        password: values.password,
      };

      // Si values.username es un string (no null), lo incluimos.
      if (values.username) payload.username = values.username;
      if (values.phone) payload.phone = values.phone;

      // Nota: Si usas Next.js 14+ con App Router y estás en el mismo dominio, puedes usar solo la ruta.
      // Si usas proxy o un dominio diferente, asegúrate de que apiFetch maneje la URL base.
const data = await apiFetch<RegisterResponse>('/auth/register/', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
});

      // La RegisterView devuelve un mensaje de éxito y los datos del usuario.
      // Si tu backend NO devuelve tokens al registrar, solo redirigimos a login.
      if ('access' in data && 'refresh' in data) {
        // Si tu RegisterView de alguna manera devuelve tokens (no es el caso de tu vista actual)
        login(data); // guarda tokens + user en el store
        router.push('/'); // o /dashboard
        return;
      }

      // El flujo estándar de tu RegisterView (solo devuelve el usuario y un mensaje 201)
      router.push('/login?registered=1');
} catch (err: any) {
  let errorMessage = 'Error en el registro';

  // 1) si tu apiFetch añade `status`/`data` en el error:
  if (err?.data && typeof err.data === 'object') {
    const e = err.data;
    if (e.email) errorMessage = 'Email: ' + (Array.isArray(e.email) ? e.email.join(' ') : String(e.email));
    else if (e.phone) errorMessage = 'Teléfono: ' + (Array.isArray(e.phone) ? e.phone.join(' ') : String(e.phone));
    else if (e.username) errorMessage = 'Nombre de usuario: ' + (Array.isArray(e.username) ? e.username.join(' ') : String(e.username));
    else if (e.password) errorMessage = 'Contraseña: ' + (Array.isArray(e.password) ? e.password.join(' ') : String(e.password));
    else if (e.non_field_errors) errorMessage = Array.isArray(e.non_field_errors) ? e.non_field_errors.join(' ') : String(e.non_field_errors);
    else errorMessage = 'Revise los datos introducidos.';
  } else {
    // 2) fallback: intenta parsear message como JSON
    try {
      const parsed = JSON.parse(err.message);
      if (parsed) {
        if (parsed.email) errorMessage = 'Email: ' + (Array.isArray(parsed.email) ? parsed.email.join(' ') : String(parsed.email));
        else if (parsed.phone) errorMessage = 'Teléfono: ' + (Array.isArray(parsed.phone) ? parsed.phone.join(' ') : String(parsed.phone));
        else if (parsed.username) errorMessage = 'Nombre de usuario: ' + (Array.isArray(parsed.username) ? parsed.username.join(' ') : String(parsed.username));
        else if (parsed.password) errorMessage = 'Contraseña: ' + (Array.isArray(parsed.password) ? parsed.password.join(' ') : String(parsed.password));
      }
    } catch {
      errorMessage = err.message || 'Error desconocido del servidor.';
    }
  }

  setServerError(errorMessage);
}
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <main className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-md rounded-xl border bg-white p-6 shadow-sm">
          <h1 className="text-2xl font-semibold mb-1">Crear cuenta</h1>
          <p className="text-sm text-gray-500 mb-6">
            Regístrate para empezar con Videos de Papel
          </p>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1" htmlFor="email">
                Email *
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
                <p className="mt-1 text-sm text-red-600">{errors.email.message as string}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium mb-1" htmlFor="username">
                Nombre de usuario (opcional)
              </label>
              <input
                id="username"
                type="text"
                autoComplete="username"
                className="w-full rounded-md border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="tu_nick (Máx. 150 chars)"
                // Nota: Los campos de input de texto DEBEN tener un valor de tipo string para funcionar con React.
                // Aunque el valor por defecto sea null, el input lo tratará como string.
                {...register('username')}
              />
              {errors.username && (
                <p className="mt-1 text-sm text-red-600">{errors.username.message as string}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium mb-1" htmlFor="phone">
                Teléfono (opcional)
              </label>
              <input
                id="phone"
                type="tel"
                autoComplete="tel"
                className="w-full rounded-md border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="+34 600 000 000 (Máx. 24 chars)"
                {...register('phone')}
              />
              {errors.phone && (
                <p className="mt-1 text-sm text-red-600">{errors.phone.message as string}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium mb-1" htmlFor="password">
                Contraseña *
              </label>
              <input
                id="password"
                type="password"
                autoComplete="new-password"
                className="w-full rounded-md border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="********"
                {...register('password')}
              />
              {errors.password && (
                <p className="mt-1 text-sm text-red-600">{errors.password.message as string}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium mb-1" htmlFor="confirm">
                Repetir contraseña *
              </label>
              <input
                id="confirm"
                type="password"
                autoComplete="new-password"
                className="w-full rounded-md border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="********"
                {...register('confirm')}
              />
              {errors.confirm && (
                <p className="mt-1 text-sm text-red-600">{errors.confirm.message as string}</p>
              )}
            </div>

            {serverError && (
              <div className="rounded-md bg-red-50 p-3 text-sm text-red-700">
                {serverError}
              </div>
            )}

            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? 'Creando cuenta…' : 'Registrarme'}
            </Button>
          </form>

          <div className="mt-4 flex items-center justify-between text-sm">
            <Link href="/login" className="text-blue-600 hover:underline">
              ¿Ya tienes cuenta? Inicia sesión
            </Link>
            <Link href="/reset-password" className="text-gray-600 hover:underline">
              ¿Olvidaste la contraseña?
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
