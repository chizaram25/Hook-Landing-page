import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import { Inter, Space_Grotesk } from "next/font/google";
import { site } from "@/lib/site";
import WaitlistModalProvider from "@/components/WaitlistModal";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-space-grotesk",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(site.url),
  title: {
    default: "Hook — Your Favourite Markets, One Tap Away",
    template: "%s · Hook",
  },
  description: site.tagline,
  keywords: [
    "open-air markets",
    "market delivery",
    "wholesale prices",
    "Nigerian markets",
    "Hook",
  ],
  openGraph: {
    title: "Hook — Your Favourite Markets, One Tap Away",
    description: site.tagline,
    url: site.url,
    siteName: site.name,
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Hook — Your Favourite Markets, One Tap Away",
    description: site.tagline,
  },
  verification: {
    google: "VcrCQ_krdlL5YHP-705bm2EcydIVZQmnqRmDTLqJOF0",
  },
};

export const viewport: Viewport = {
  themeColor: "#111111",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="en" className={`${inter.variable} ${spaceGrotesk.variable}`}>
      <body className="font-sans antialiased">
        <WaitlistModalProvider>{children}</WaitlistModalProvider>
      </body>
    </html>
  );
}
