// src/components/VideosButton.tsx
'use client'

import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { List } from 'lucide-react'
import { ColorActionButton } from '@/components/ui/color-action-button'

export default function OrdersButton() {
  const router = useRouter()

  const handleOrders = () => {
    router.push('/orders') // ✅ navegación cliente de Next.js (sin recargar la página)
  }

  return (
        <ColorActionButton
  type="button"
  onClick={handleOrders}
  color="blue"
  size="compact"
  icon={List}
>
  Pedidos
</ColorActionButton>
    
  )
}
