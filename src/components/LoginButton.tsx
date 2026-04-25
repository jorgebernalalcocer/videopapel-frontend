// src/components/LoginButton.tsx
'use client'

import { useRouter } from 'next/navigation'
import { LogIn } from 'lucide-react'
import { ColorActionButton } from '@/components/ui/color-action-button'

export default function LoginButton() {
  const router = useRouter()

  const handleLogin = () => {
    router.push('/login') // ✅ navegación cliente de Next.js (sin recargar la página)
  }

  return (
    <ColorActionButton
      color="emerald"
      size="compact"
      icon={LogIn}
      onClick={handleLogin}
    >
      Iniciar sesión
    </ColorActionButton>
  )
}
