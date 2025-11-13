// src/components/VideosButton.tsx
'use client'

import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'

export default function CartButton() {
  const router = useRouter()

  const handleCart = () => {
    router.push('/cart') // ✅ navegación cliente de Next.js (sin recargar la página)
  }

  return (
    <Button variant="secondary" onClick={handleCart}>
      Carrito
    </Button>
  )
}
