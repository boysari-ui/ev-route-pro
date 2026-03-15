import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import PWAInstallBanner from "../components/PWAInstallBanner";
import { AuthProvider } from "../components/AuthProvider";

const inter = Inter({ variable: "--font-inter", subsets: ["latin"], weight: ["400", "500", "600", "700", "800"] });

export const metadata: Metadata = {
  title: "EV Route Pro — Smart EV Trip Planner Australia",
  description: "Plan your EV road trip across Australia. Find charging stops, estimate battery usage, and arrive stress-free.",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "EV Route Pro",
  },
  openGraph: {
    title: "EV Route Pro",
    description: "Smart EV trip planner for Australia",
    url: "https://evroutepro.com",
    siteName: "EV Route Pro",
    type: "website",
    images: [{ url: "https://evroutepro.com/og-image.png", width: 1200, height: 630, alt: "EV Route Pro" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "EV Route Pro",
    description: "Smart EV trip planner for Australia",
    images: ["https://evroutepro.com/og-image.png"],
  },
};

export const viewport: Viewport = {
  themeColor: "#059669",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="apple-touch-icon" sizes="192x192" href="/icons/icon-192.png" />
        <link rel="apple-touch-icon" sizes="512x512" href="/icons/icon-512.png" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="mobile-web-app-capable" content="yes" />
        <script async src="https://www.googletagmanager.com/gtag/js?id=G-F2WF4LM5XJ" />
        <script dangerouslySetInnerHTML={{
          __html: `
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', 'G-F2WF4LM5XJ');
          `
        }} />
      </head>
      <body className={`${inter.variable} antialiased`} style={{ fontFamily: "'Inter', system-ui, sans-serif" }}>
        <AuthProvider>
          {children}
        </AuthProvider>
        <PWAInstallBanner />
        <script dangerouslySetInnerHTML={{
          __html: `
            if ('serviceWorker' in navigator) {
              window.addEventListener('load', function() {
                navigator.serviceWorker.register('/sw.js')
                  .then(function() {})
                  .catch(function() {});
              });
            }
          `
        }} />
      </body>
    </html>
  );
}
