// src/app/layout.tsx
import type { Metadata } from "next";
import "./globals.css";
import Menu from "@/components/Menu";
// import Footer from "@/components/Footer" // si lo tienes
// import Providers from "@/components/Providers"; // si usas React Query, Theme, etc. (opcional)

export const metadata: Metadata = {
  title: "VideoPapel",
  description: "Herramienta para generar productos de impresión",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body className="min-h-screen bg-gray-50">
        {/* Si usas QueryClientProvider o similares, envuelve aquí */}
        {/* <Providers> */}
          <Menu />
          <main className="min-h-[calc(100vh-64px)]">{children}</main>
          {/* <Footer /> */}
        {/* </Providers> */}
      </body>
    </html>
  );
}
