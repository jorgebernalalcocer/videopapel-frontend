import { MyOrders } from '@/components/orders/MyOrders'
import { MyOrdersHeader } from '@/components/orders/MyOrdersHeader'

export default function OrdersPage() {
  return (
    <section className="max-w-5xl mx-auto px-4 py-12 space-y-8">
      <MyOrdersHeader />

      <MyOrders />
    </section>
  )
}
