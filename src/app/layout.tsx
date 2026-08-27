import type { Metadata, Viewport } from "next";
import { Noto_Sans_Thai } from "next/font/google";
import { PwaInstallShell } from "@/components/pwa/PwaInstallShell";
import { CapacitorNativeChrome } from "@/components/native/CapacitorNativeChrome";
import {
  MAWELL_OG_IMAGE,
  MAWELL_OG_IMAGE_SQUARE,
  MAWELL_PWA_ICON_192,
  MAWELL_PWA_ICON_APPLE,
} from "@/lib/pwa/brand-assets";
import { normalizeAppPublicBase } from "@/lib/url/normalize-app-public-base";
import "./globals.css";

const siteDescription = "MAWELL PLATFORM — ระบบจัดการธุรกิจและโมดูลแดชบอร์ด";
const metadataBaseOrigin =
  normalizeAppPublicBase(process.env.NEXT_PUBLIC_APP_URL) ||
  normalizeAppPublicBase(process.env.APP_URL) ||
  "https://app.ma-well.com";

const notoSansThai = Noto_Sans_Thai({
  subsets: ["latin", "thai"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-noto-sans-thai",
  display: "swap",
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#4f2f9a",
};

export const metadata: Metadata = {
  metadataBase: new URL(metadataBaseOrigin),
  title: {
    default: "MAWELL PLATFORM",
    template: "%s",
  },
  description: siteDescription,
  manifest: "/manifest.webmanifest",
  applicationName: "MAWELL PLATFORM",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "MAWELL PLATFORM",
  },
  icons: {
    icon: [
      { url: "/icons/mawell-32.png", sizes: "32x32", type: "image/png" },
      { url: MAWELL_PWA_ICON_192, sizes: "192x192", type: "image/png" },
    ],
    apple: [{ url: MAWELL_PWA_ICON_APPLE, sizes: "180x180", type: "image/png" }],
  },
  openGraph: {
    type: "website",
    locale: "th_TH",
    siteName: "MAWELL PLATFORM",
    title: "MAWELL PLATFORM",
    description: siteDescription,
    images: [
      { url: MAWELL_OG_IMAGE_SQUARE, width: 1200, height: 1200, alt: "MAWELL" },
      { url: MAWELL_OG_IMAGE, width: 1200, height: 630, alt: "MAWELL" },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "MAWELL PLATFORM",
    description: siteDescription,
    images: [MAWELL_OG_IMAGE_SQUARE, MAWELL_OG_IMAGE],
  },
  other: {
    "mobile-web-app-capable": "yes",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="th" className={`${notoSansThai.variable} app-shell h-full antialiased`} suppressHydrationWarning>
      <body
        className={`${notoSansThai.className} app-shell min-h-full flex flex-col font-sans`}
        suppressHydrationWarning
      >
        <CapacitorNativeChrome />
        <PwaInstallShell>{children}</PwaInstallShell>
      </body>
    </html>
  );
}
