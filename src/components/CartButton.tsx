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
            <div className="rounded-full bg-emerald-50 p-2 text-emerald-600" onClick={handleCart}>
            <ShoppingCart className="h-5 w-5" />
          </div>
    
  )
}
