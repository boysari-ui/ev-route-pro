import type { Metadata } from "next";
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

export const metadata = {
  title: "EV Route Pro",
  description: "Smart EV trip planner for Australia",
  openGraph: {
    title: "EV Route Pro",
    description: "Smart EV trip planner for Australia",
    url: "https://evroutepro.com",
    siteName: "EV Route Pro",
    images: ["/og-image.png"],
    type: "website",
    icons: {
    icon: "/favicon.ico",
    shortcut: "/favicon.ico",
    apple: "/apple-icon-180.png",   },
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
  <link rel="icon" href="/favicon.ico" />
  <link rel="apple-touch-icon" href="/apple-icon-180.png" />
</head>

      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
