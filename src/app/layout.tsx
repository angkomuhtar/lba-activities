import type { Metadata } from "next";
import { DM_Sans, Roboto, Geist_Mono } from "next/font/google";

const fontMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
});
import "./globals.css";

const fontSans = DM_Sans({
  subsets: ["latin"],
  variable: "--font-sans",
});

const fontSerif = Roboto({
  subsets: ["latin"],
  variable: "--font-serif",
});

export const metadata: Metadata = {
  title: "Dashboard",
  description: "Lintas Bahtera Abadi Dashboard",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang='en'
      className={`${fontSans.variable} ${fontSerif.variable} ${fontMono.variable} antialiased`}>
      <body className='min-h-full flex flex-col'>{children}</body>
    </html>
  );
}
