// src/app/layout.tsx
import type { Metadata } from "next";
import "./globals.css";
import Menu from "@/components/Menu";
import Providers from "@/components/Providers";
import GlobalSpinner from "@/components/GlobalSpinner";
import TopProgress from "@/components/TopProgress";
import { ToasterProvider } from '@/components/ToasterProvider'
import ClientProviders from '@/components/ClientProviders'
import AuthSessionGuard from '@/components/AuthSessionGuard'
import ScrollToTopOnRouteChange from '@/components/ScrollToTopOnRouteChange'
import Script from 'next/script';
import { GoogleAnalytics } from "@next/third-parties/google";

export const metadata: Metadata = {
  title: "VideoPapel",
  description: "Herramienta para generar productos de impresión",
};

const gaId = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <head>
        <Script
          src="https://accounts.google.com/gsi/client"
          strategy="beforeInteractive" 
        />
      </head>
      <body className="min-h-screen bg-gray-50">
        <Providers>
          <ClientProviders>
            <AuthSessionGuard />
            <ScrollToTopOnRouteChange />
            <Menu />
            <TopProgress />
            <GlobalSpinner />
            <main className="min-h-[calc(100vh-64px)]">{children}</main>
            <ToasterProvider />
          </ClientProviders>
        </Providers>
        {gaId ? <GoogleAnalytics gaId={gaId} /> : null}
      </body>
    </html>
  );
}
