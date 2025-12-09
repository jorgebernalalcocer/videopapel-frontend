// hooks/useAuth.ts (Versión con FETCH nativo - sin axios)
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface User {
  id: string;
  email: string;
  username: string;
  phone?: string;
  is_active: boolean;
  is_staff: boolean;
}

interface AuthTokens {
  access: string;
  refresh: string;
}

interface LoginCredentials {
  email: string;
  password: string;
}

interface RegisterCredentials {
  email: string;
  password: string;
  confirm: string;
  username?: string;
  phone?: string;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

// Helper para hacer requests con fetch
async function fetchAPI(endpoint: string, options: RequestInit = {}) {
  const token = localStorage.getItem('access_token');
  
  const config: RequestInit = {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` }),
      ...options.headers,
    },
  };

  const response = await fetch(`${API_URL}${endpoint}`, config);
  
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw { response: { status: response.status, data: errorData } };
  }

  return response.json();
}

export function useAuth() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Obtener datos del usuario actual
  useEffect(() => {
    const token = localStorage.getItem('access_token');
    if (token) {
      fetchUser();
    } else {
      setLoading(false);
    }
  }, []);

  const fetchUser = async () => {
    try {
      const data = await fetchAPI('/api/auth/user/');
      setUser(data);
      setIsAuthenticated(true);
    } catch (error) {
      console.error('Error fetching user:', error);
      logout();
    } finally {
      setLoading(false);
    }
  };

  // Login con email y password
  const login = async (credentials: LoginCredentials) => {
    try {
      const data = await fetchAPI('/api/auth/login/', {
        method: 'POST',
        body: JSON.stringify(credentials),
      });

      const { access, refresh, user } = data;

      // Guardar tokens
      localStorage.setItem('access_token', access);
      localStorage.setItem('refresh_token', refresh);

      // Guardar usuario
      setUser(user);
      setIsAuthenticated(true);

      return { success: true, user };
    } catch (error: any) {
      console.error('Login error:', error);
      
      // Manejar casos específicos de error
      if (error.response?.status === 403) {
        return {
          success: false,
          error: 'Por favor verifica tu email antes de iniciar sesión',
          needsVerification: true,
        };
      }

      return {
        success: false,
        error: error.response?.data?.detail || 
               error.response?.data?.non_field_errors?.[0] ||
               'Error al iniciar sesión',
      };
    }
  };

  // Registro tradicional
  const register = async (credentials: RegisterCredentials) => {
    try {
      const data = await fetchAPI('/api/auth/registration/', {
        method: 'POST',
        body: JSON.stringify(credentials),
      });

      return {
        success: true,
        message: 'Registro exitoso. Por favor verifica tu email.',
        data,
      };
    } catch (error: any) {
      console.error('Register error:', error);
      
      const errorData = error.response?.data;
      let errorMessage = 'Error al registrar usuario';

      // Manejar errores específicos
      if (errorData?.email) {
        errorMessage = Array.isArray(errorData.email) 
          ? errorData.email[0] 
          : errorData.email;
      } else if (errorData?.password1) {
        errorMessage = Array.isArray(errorData.password1)
          ? errorData.password1[0]
          : errorData.password1;
      } else if (errorData?.detail) {
        errorMessage = errorData.detail;
      } else if (errorData?.non_field_errors) {
        errorMessage = errorData.non_field_errors[0];
      }

      return {
        success: false,
        error: errorMessage,
      };
    }
  };

  // Login con Google OAuth
  const loginWithGoogle = async (code: string) => {
    try {
      const data = await fetchAPI('/auth/google/login/callback/', {
        method: 'POST',
        body: JSON.stringify({ 
          code,
          redirect_uri: `${window.location.origin}/auth/google/callback`
        }),
      });

      const { access, refresh, user } = data;

      // Guardar tokens
      localStorage.setItem('access_token', access);
      localStorage.setItem('refresh_token', refresh);

      // Guardar usuario
      setUser(user);
      setIsAuthenticated(true);

      return { success: true, user };
    } catch (error: any) {
      console.error('Google login error:', error);
      return {
        success: false,
        error: error.response?.data?.detail || 'Error al iniciar sesión con Google',
      };
    }
  };

  // Logout
  const logout = () => {
    // Limpiar tokens
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('user');
    
    // Limpiar estado
    setUser(null);
    setIsAuthenticated(false);
    
    // Redirigir al login
    router.push('/auth/login');
  };

  // Refrescar token
  const refreshToken = async () => {
    try {
      const refresh = localStorage.getItem('refresh_token');
      if (!refresh) {
        throw new Error('No refresh token');
      }

      const data = await fetchAPI('/api/auth/token/refresh/', {
        method: 'POST',
        body: JSON.stringify({ refresh }),
      });

      const { access } = data;
      localStorage.setItem('access_token', access);

      return { success: true };
    } catch (error) {
      console.error('Token refresh error:', error);
      logout();
      return { success: false };
    }
  };

  // Reenviar email de verificación
  const resendVerification = async (email: string) => {
    try {
      const data = await fetchAPI('/api/auth/resend-verification/', {
        method: 'POST',
        body: JSON.stringify({ email }),
      });

      return {
        success: true,
        message: data.detail || 'Email enviado correctamente',
      };
    } catch (error: any) {
      console.error('Resend verification error:', error);
      return {
        success: false,
        error: error.response?.data?.detail || 'Error al enviar email',
      };
    }
  };

  return {
    user,
    loading,
    isAuthenticated,
    login,
    register,
    loginWithGoogle,
    logout,
    refreshToken,
    resendVerification,
    fetchUser,
  };
}