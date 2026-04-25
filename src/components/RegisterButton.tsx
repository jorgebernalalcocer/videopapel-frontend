// src/components/RegisterButton.tsx
'use client'

import { useRouter } from 'next/navigation'
import { User } from 'lucide-react'
import { ColorActionButton } from '@/components/ui/color-action-button'

export default function RegisterButton() {
  const router = useRouter()

  const handleRegister = () => {
    router.push('/register') // ✅ navegación cliente de Next.js (sin recargar la página)
  }

  return (
    <ColorActionButton
      color="emerald"
      filled
      size="compact"
      icon={User}
      onClick={handleRegister}
    >
      Registrarse
    </ColorActionButton>
  )
}
