'use client'

type ShippingSelectorItem = {
  id: string | number
  label?: string | null
  line1: string
  city: string
}

type ShippingSelectorProps<T extends ShippingSelectorItem> = {
  label?: string
  items: T[]
  selectedItemId: T['id'] | null
  onSelectItem: (itemId: number) => void
  className?: string
}

export default function ShippingSelector<T extends ShippingSelectorItem>({
  label = 'Escoge una dirección',
  items,
  selectedItemId,
  onSelectItem,
  className = 'mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500',
}: ShippingSelectorProps<T>) {
  return (
    <label className="block text-sm font-medium text-gray-700">
      {label}
      <select
        className={className}
        value={selectedItemId ?? ''}
        onChange={(event) => onSelectItem(Number(event.target.value))}
      >
        {items.map((item) => (
          <option key={item.id} value={item.id}>
            {item.label ? `${item.label} · ` : ''}
            {item.line1} · {item.city}
          </option>
        ))}
      </select>
    </label>
  )
}
