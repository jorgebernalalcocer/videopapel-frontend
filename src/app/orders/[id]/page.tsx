import { MyOrders } from '@/components/orders/MyOrders'
import { MyOrdersHeader } from '@/components/orders/MyOrdersHeader'

export default async function OrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params

  return (
    <section className="mx-auto max-w-5xl space-y-8 px-4 py-12">
      <MyOrdersHeader />
      <MyOrders orderId={id} />
    </section>
  )
}
