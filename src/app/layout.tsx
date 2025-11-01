import type { Metadata } from "next";
import { Toaster } from "@/components/ui/toaster";
import "./globals.css";
import { cn } from "@/lib/utils";
import { AppHeader } from "@/components/header";

export const metadata: Metadata = {
  title: "Stradar",
  description: "Strategic Radar for visualizing and executing your organization's strategy.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=PT+Sans:wght@400;700&display=swap"
          rel="stylesheet"
        />
        {/* Explicit favicon (svg radar icon) - overrides default /favicon.ico */}
        <link rel="icon" href="/favicon.svg" />
      </head>
      <body
        className={cn(
          "min-h-screen bg-background font-body antialiased"
        )}
      >
        <AppHeader />
        {children}
        <Toaster />
      </body>
    </html>
  );
}
