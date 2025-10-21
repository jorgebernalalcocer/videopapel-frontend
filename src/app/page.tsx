'use client';

import Menu from '@/components/Menu';
import Body from '@/components/Body';
import Footer from '@/components/Footer';

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen">
      <Menu />
      <Body />
      <Footer />
    </div>
  );
}


// 'use client';

// import { useQuery } from '@tanstack/react-query';

// export default function Home() {
//   const { data, isLoading, error } = useQuery({
//     queryKey: ['categorynametype'],
//     queryFn: async () => {
//       const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL ?? '';
//       const prefix = process.env.NEXT_PUBLIC_API_PREFIX ?? '';
//       const res = await fetch(`${baseUrl}${prefix}/categorynametype/`, { credentials: 'include' });
//       if (!res.ok) throw new Error('Error al cargar categorías');
//       return res.json();
//     },
//   });

//   return (
//     <main className="p-4 space-y-4">
//       <h1 className="text-2xl font-bold">VideoPapel</h1>
//       {isLoading && <p>Cargando…</p>}
//       {error && <p className="text-red-600">Error: {(error as Error).message}</p>}
//       {data && <pre className="bg-gray-100 p-3 rounded">{JSON.stringify(data, null, 2)}</pre>}
//     </main>
//   );
// }
