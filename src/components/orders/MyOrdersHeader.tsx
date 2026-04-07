// El componente no necesita recibir props, por lo que se define sin argumentos.
import { List } from 'lucide-react'

export function MyOrdersHeader() {
  return (
    <header className="flex flex-wrap items-center justify-between gap-3">
      <div className="flex items-center gap-3">
        <List className="h-8 w-8 text-blue-600" />
        <div>
          <h1 className="text-3xl font-semibold text-gray-900">Mis pedidos</h1>
          <p className="text-sm text-gray-500">Historial</p>
        </div>
      </div>
    </header>
  )
}
