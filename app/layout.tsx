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

const META_PIXEL_ID = "1759277125364157";

const metaPixel = `
!function(f,b,e,v,n,t,s)
{if(f.fbq)return;n=f.fbq=function(){n.callMethod?
n.callMethod.apply(n,arguments):n.queue.push(arguments)};
if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
n.queue=[];t=b.createElement(e);t.async=!0;
t.src=v;s=b.getElementsByTagName(e)[0];
s.parentNode.insertBefore(t,s)}(window, document,'script',
'https://connect.facebook.net/en_US/fbevents.js');
fbq('init', '${META_PIXEL_ID}');
fbq('track', 'PageView');
`;

export default function RootLayout({
  children,
}: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="en" className={`${inter.variable} ${spaceGrotesk.variable}`}>
      <head>
        {/* Meta Pixel — raw <script> so it ships inside <head> in the server HTML. */}
        <script id="meta-pixel" dangerouslySetInnerHTML={{ __html: metaPixel }} />
      </head>
      <body className="font-sans antialiased">
        <WaitlistModalProvider>{children}</WaitlistModalProvider>

        <noscript>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            alt=""
            height="1"
            width="1"
            style={{ display: "none" }}
            src={`https://www.facebook.com/tr?id=${META_PIXEL_ID}&ev=PageView&noscript=1`}
          />
        </noscript>
      </body>
    </html>
  );
}
