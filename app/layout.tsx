import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";
import { MobileNav } from "@/components/layout/mobile-nav";
import { Providers } from "@/components/providers/providers";
import { CommandPalette } from "@/components/ui/command-palette";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Trading OS — Advanced Journal & Performance Engine",
  description:
    "Production-grade trading journal with performance analytics, trading DNA profiling, psychology tracker, AI coach, and rule enforcement for discretionary traders.",
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"),
  icons: {
    icon: "/favicon.ico",
  },
  openGraph: {
    title: "Trading OS — Advanced Journal & Performance Engine",
    description: "Your personal trading journal, analytics engine, and AI performance coach.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={inter.variable} suppressHydrationWarning data-scroll-behavior="smooth">
      <body className="min-h-screen flex">
        <Providers>
          {/* Desktop Sidebar */}
          <Sidebar />

          {/* Main Content Area */}
          <div className="flex-1 flex flex-col min-w-0 min-h-screen">
            <Header />
            <main className="flex-1 px-4 py-5 md:px-6 md:py-6 lg:px-8 lg:py-8 overflow-y-auto has-bottom-nav lg:pb-8">
              <div className="max-w-6xl mx-auto w-full page-enter">
                {children}
              </div>
            </main>
          </div>

          {/* Mobile Bottom Navigation */}
          <MobileNav />

          {/* Global Command Palette (Ctrl+K) */}
          <CommandPalette />
        </Providers>
      </body>
    </html>
  );
}
