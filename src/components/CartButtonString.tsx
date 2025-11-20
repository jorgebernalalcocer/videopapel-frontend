// src/components/VideosButton.tsx
'use client'

import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { ShoppingCart } from 'lucide-react'


export default function CartButton() {
  const router = useRouter()

  const handleCart = () => {
    router.push('/cart') // ✅ navegación cliente de Next.js (sin recargar la página)
  }

  return (
    <Button variant="secondary" onClick={handleCart}>
      <ShoppingBasket className="w-4 h-4" />

      Mi cesta
    </Button>
  )
}
