import { MyOrders } from '@/components/orders/MyOrders'
import { MyOrdersHeader } from '@/components/orders/MyOrdersHeader'

export default async function OrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const orderId = Number.parseInt(id, 10)

  return (
    <section className="mx-auto max-w-5xl space-y-8 px-4 py-12">
      <MyOrdersHeader />
      {Number.isNaN(orderId) ? (
        <div className="rounded-2xl border border-gray-200 bg-white px-6 py-10 text-center text-sm text-red-600 shadow-sm">
          Identificador de pedido no válido.
        </div>
      ) : (
        <MyOrders orderId={orderId} />
      )}
    </section>
  )
}
