// src/components/RegisterButton.tsx
'use client'

import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'

export default function RegisterButton() {
  const router = useRouter()

  const handleRegister = () => {
    router.push('/register') // ✅ navegación cliente de Next.js (sin recargar la página)
  }

  return (
    <Button variant="default" onClick={handleRegister}>
      Registrarse
    </Button>
  )
}
