// El componente no necesita recibir props, por lo que se define sin argumentos.
export function MyOrdersHeader() {
  return (
    <header className="flex flex-wrap items-center justify-between gap-3">
      <div>
        <p className="text-sm text-gray-500">Historial</p>
        <h1 className="text-3xl font-semibold text-gray-900">Mis pedidos</h1>
      </div>
    </header>
  );
}