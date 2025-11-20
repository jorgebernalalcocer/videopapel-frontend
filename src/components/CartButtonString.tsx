// src/components/VideosButton.tsx
'use client'

import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { ShoppingBasket } from 'lucide-react'


export default function CartButton() {
  const router = useRouter()

  const handleCart = () => {
    router.push('/cart') // ✅ navegación cliente de Next.js (sin recargar la página)
  }

  return (
    <Button className="
    inline-flex items-center
    px-3 py-1.5                  
    rounded-lg                   
    bg-green-100                  
    text-green-700
    font-medium
    transition-colors
    hover:bg-green-700            
    hover:text-white
  " onClick={handleCart}>
      <ShoppingBasket className="w-4 h-4 mr-1.5" /> 

      Mi cesta
    </Button>
  )
}
