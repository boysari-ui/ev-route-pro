"use client";

import Image from "next/image";
import Link from "next/link";

export default function Privacy() {
  return (
    <main style={{ fontFamily: "'Inter', system-ui, sans-serif", WebkitFontSmoothing: "antialiased", background: "#f9fafb", minHeight: "100vh" }}>
      <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet" />

      {/* NAV */}
      <nav style={{ background: "rgba(10,15,35,0.97)", padding: "0 48px", height: 64, display: "flex", alignItems: "center", justifyContent: "space-between", position: "sticky", top: 0, zIndex: 100, borderBottom: "1px solid rgba(255,255,255,0.07)" }}>
        <Link href="/" style={{ display: "flex", alignItems: "center", gap: 10, textDecoration: "none" }}>
          <Image src="/ev-route-pro-logo.png" alt="EV Route Pro" width={36} height={36} style={{ borderRadius: 9, objectFit: "cover" }} />
          <div>
            <div style={{ fontWeight: 800, fontSize: "1.05rem", color: "white", letterSpacing: "-0.02em" }}>EV Route Pro</div>
            <div style={{ fontSize: "0.6rem", fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: "rgba(255,255,255,0.6)" }}>Australia</div>
          </div>
        </Link>
        <Link href="/" style={{ background: "white", color: "#059669", fontWeight: 700, fontSize: "0.875rem", padding: "10px 22px", borderRadius: 10, textDecoration: "none" }}>
          ← Back
        </Link>
      </nav>

      {/* CONTENT */}
      <div style={{ maxWidth: 760, margin: "0 auto", padding: "64px 24px 96px" }}>
        <div style={{ marginBottom: 40 }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 8, color: "#059669", fontWeight: 700, fontSize: "0.72rem", letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 12 }}>
            <span style={{ width: 18, height: 2, background: "#059669", borderRadius: 1, display: "inline-block" }} />
            Legal
          </div>
          <h1 style={{ fontWeight: 800, fontSize: "clamp(2rem,4vw,2.8rem)", letterSpacing: "-0.03em", color: "#111827", marginBottom: 12, lineHeight: 1.15 }}>Privacy Policy</h1>
          <p style={{ color: "#6b7280", fontSize: "0.9rem" }}>Last updated: March 2025</p>
        </div>

        {[
          {
            title: "1. Information We Collect",
            content: "EV Route Pro collects minimal information necessary to provide our service. We may collect your start and destination locations when you plan a trip, your vehicle model and battery level if you choose to enter them, and anonymous usage data to improve our service. We do not collect or store your personal identity information."
          },
          {
            title: "2. How We Use Your Information",
            content: "The information you provide is used solely to calculate optimal EV routes and charging stops. Location data is processed in real-time and is not stored on our servers after your session ends. We do not sell, trade, or share your information with third parties for marketing purposes."
          },
          {
            title: "3. Google Maps Integration",
            content: "EV Route Pro uses Google Maps Platform to display maps and navigation. When you use our service, Google's Privacy Policy also applies. By using EV Route Pro, you agree to be bound by Google's Terms of Service and Privacy Policy. We recommend reviewing Google's privacy practices at policies.google.com."
          },
          {
            title: "4. Local Storage",
            content: "We use your browser's local storage to remember your preferences and whether you have started a planning session. This data is stored only on your device and can be cleared at any time through your browser settings. We do not use tracking cookies."
          },
          {
            title: "5. Data Security",
            content: "We take reasonable measures to protect any information processed through our service. All data transmission is encrypted using HTTPS. However, no method of transmission over the internet is 100% secure, and we cannot guarantee absolute security."
          },
          {
            title: "6. Children's Privacy",
            content: "EV Route Pro is not directed at children under the age of 13. We do not knowingly collect personal information from children. If you believe a child has provided us with personal information, please contact us immediately."
          },
          {
            title: "7. Changes to This Policy",
            content: "We may update this Privacy Policy from time to time. We will notify users of any significant changes by updating the date at the top of this page. Continued use of EV Route Pro after changes constitutes acceptance of the updated policy."
          },
          {
            title: "8. Contact Us",
            content: "If you have any questions about this Privacy Policy, please contact us through the Contact page. We aim to respond to all privacy-related inquiries within 5 business days."
          },
        ].map((section) => (
          <div key={section.title} style={{ marginBottom: 36, paddingBottom: 36, borderBottom: "1px solid #e5e7eb" }}>
            <h2 style={{ fontWeight: 700, fontSize: "1.1rem", color: "#111827", marginBottom: 12 }}>{section.title}</h2>
            <p style={{ fontSize: "0.95rem", color: "#4b5563", lineHeight: 1.8 }}>{section.content}</p>
          </div>
        ))}
      </div>

      {/* FOOTER */}
      <footer style={{ background: "white", borderTop: "1px solid #e5e7eb", padding: "24px 48px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <span style={{ fontSize: "0.8rem", color: "#9ca3af" }}>© 2025 EV Route Pro. All rights reserved.</span>
        <div style={{ display: "flex", gap: 24 }}>
          {[["Privacy", "/privacy"], ["Terms", "/terms"], ["Contact", "/contact"]].map(([label, href]) => (
            <Link key={label} href={href} style={{ fontSize: "0.8rem", color: "#9ca3af", textDecoration: "none" }}>{label}</Link>
          ))}
        </div>
      </footer>
    </main>
  );
}
