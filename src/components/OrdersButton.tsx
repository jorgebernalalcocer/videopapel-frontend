// src/components/VideosButton.tsx
'use client'

import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'

export default function OrdersButton() {
  const router = useRouter()

  const handleOrders = () => {
    router.push('/orders') // ✅ navegación cliente de Next.js (sin recargar la página)
  }

  return (
    <Button className="rounded-full bg-blue-50 p-2 text-blue-600"  onClick={handleOrders}>
      Pedidos
    </Button>
  )
}
