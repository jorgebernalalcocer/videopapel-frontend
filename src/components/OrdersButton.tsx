// src/components/VideosButton.tsx
'use client'

import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { List } from 'lucide-react'

export default function OrdersButton() {
  const router = useRouter()

  const handleOrders = () => {
    router.push('/orders') // ✅ navegación cliente de Next.js (sin recargar la página)
  }

  return (
    <Button   className="
    inline-flex items-center
    px-3 py-1.5                  
    rounded-lg                   
    bg-blue-100                  
    text-blue-700
    font-medium
    transition-colors
    hover:bg-blue-700            
    hover:text-white
  "  onClick={handleOrders}>
    <List className="w-4 h-4 mr-1.5" /> 
      Pedidos
    </Button>
  )
}
