import type { Metadata, Viewport } from "next";
import { Noto_Sans_Thai } from "next/font/google";
import { PwaInstallShell } from "@/components/pwa/PwaInstallShell";
import "./globals.css";

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
  title: {
    default: "MAWELL Buffet",
    template: "%s",
  },
  description: "MAWELL Buffet — ระบบจัดการธุรกิจและโมดูลแดชบอร์ด",
  manifest: "/manifest.webmanifest",
  applicationName: "MAWELL",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "MAWELL",
  },
  icons: {
    icon: [{ url: "/icon", type: "image/png" }],
    apple: [{ url: "/apple-icon", type: "image/png" }],
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
        <PwaInstallShell>{children}</PwaInstallShell>
      </body>
    </html>
  );
}
