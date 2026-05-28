import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";

import { AppProviders } from "@/components/providers/app-providers";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Avizme — Lembretes por SMS, WhatsApp e e-mail",
  description:
    "Agende lembretes flexíveis e receba notificações do jeito que preferir.",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Avizme",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  themeColor: "#53a08e",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="pt-BR"
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body
        suppressHydrationWarning
        className="min-h-dvh flex flex-col font-sans"
      >
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  );
}
