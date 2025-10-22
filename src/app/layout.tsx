// src/app/layout.tsx
import type { Metadata } from "next";
import "./globals.css";
import Menu from "@/components/Menu";
import Providers from "@/components/Providers";
import GlobalSpinner from "@/components/GlobalSpinner";
import TopProgress from "@/components/TopProgress";

export const metadata: Metadata = {
  title: "VideoPapel",
  description: "Herramienta para generar productos de impresión",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body className="min-h-screen bg-gray-50">
        <Providers>
          <Menu />
          
          <TopProgress />
          <GlobalSpinner />
          <main className="min-h-[calc(100vh-64px)]">{children}</main>
        </Providers>
      </body>
    </html>
  );
}