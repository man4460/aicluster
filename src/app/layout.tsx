import type { Metadata } from "next";
import { Noto_Sans_Thai } from "next/font/google";
import "./globals.css";

const notoSansThai = Noto_Sans_Thai({
  subsets: ["latin", "thai"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-noto-sans-thai",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "MAWELL Buffet",
    template: "%s",
  },
  description: "MAWELL Buffet — ระบบจัดการบุฟเฟต์",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="th" className={`${notoSansThai.variable} h-full antialiased`}>
      <body
        className={`${notoSansThai.className} font-sans min-h-full flex flex-col bg-[#f8fafc] text-slate-900`}
      >
        {children}
      </body>
    </html>
  );
}
