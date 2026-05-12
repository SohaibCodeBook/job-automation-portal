import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { PortalAtmosphere } from "@/components/portal-atmosphere";
import { Providers } from "@/app/providers";
import { APP_CONFIG } from "@/constants/app";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: APP_CONFIG.name,
  description: APP_CONFIG.description,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body
        className="relative min-h-full bg-background font-sans text-foreground antialiased"
        suppressHydrationWarning
      >
        <PortalAtmosphere />
        <div className="relative z-[1] min-h-full">
          <Providers>{children}</Providers>
        </div>
      </body>
    </html>
  );
}
