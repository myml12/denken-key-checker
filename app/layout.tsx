import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

/** ブラウザ UI / オーバースクロールは地色に。見出しのアクセント青とは別 */
export const viewport: Viewport = {
  themeColor: "#f5f5f7",
};

export const metadata: Metadata = {
  title: "denken key checker",
  description: "部室の鍵と照明の状態をリアルタイムで表示します",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "denken",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        {children}
      </body>
    </html>
  );
}
