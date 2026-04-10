// src/components/VideosButton.tsx
'use client'

import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { ShoppingBasket } from 'lucide-react'
import { ColorActionButton } from '@/components/ui/color-action-button'


export default function CartButton() {
  const router = useRouter()

  const handleCart = () => {
    router.push('/cart') // ✅ navegación cliente de Next.js (sin recargar la página)
  }

  return (
            <ColorActionButton
  type="button"
  onClick={handleCart}
  color="green"
  size="compact"
  icon={ShoppingBasket}
>
  Mi cesta
</ColorActionButton>
  )
}
