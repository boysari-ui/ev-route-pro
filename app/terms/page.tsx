"use client";

import Image from "next/image";
import Link from "next/link";

export default function Terms() {
  return (
    <main style={{ fontFamily: "'Inter', system-ui, sans-serif", WebkitFontSmoothing: "antialiased", background: "#f9fafb", minHeight: "100vh" }}>
      <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet" />

      {/* NAV */}
      <nav style={{ background: "rgba(10,15,35,0.97)", padding: "0 48px", height: 64, display: "flex", alignItems: "center", justifyContent: "space-between", position: "sticky", top: 0, zIndex: 100, borderBottom: "1px solid rgba(255,255,255,0.07)" }}>
        <Link href="/" style={{ display: "flex", alignItems: "center", gap: 10, textDecoration: "none" }}>
          <Image src="/ev-route-pro-logo.png" alt="EV Route Pro" width={36} height={36} style={{ borderRadius: 9, objectFit: "cover" }} />
          <div style={{ lineHeight: 1 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <div style={{ fontWeight: 800, fontSize: "1.05rem", color: "white", letterSpacing: "-0.02em" }}>EV Route Pro</div>
              <span style={{ fontSize: "0.55rem", fontWeight: 800, letterSpacing: "0.1em", background: "#16a34a", color: "white", padding: "2px 5px", borderRadius: 4 }}>BETA</span>
            </div>
            <div style={{ fontSize: "0.6rem", fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: "rgba(255,255,255,0.6)", marginTop: 2 }}>Australia</div>
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
          <h1 style={{ fontWeight: 800, fontSize: "clamp(2rem,4vw,2.8rem)", letterSpacing: "-0.03em", color: "#111827", marginBottom: 12, lineHeight: 1.15 }}>Terms of Service</h1>
          <p style={{ color: "#6b7280", fontSize: "0.9rem" }}>Last updated: March 2025</p>
        </div>

        {[
          {
            title: "1. Acceptance of Terms",
            content: "By accessing and using EV Route Pro, you accept and agree to be bound by these Terms of Service. If you do not agree to these terms, please do not use our service. These terms apply to all users of EV Route Pro, including visitors, registered users, and others who access the service."
          },
          {
            title: "2. Description of Service",
            content: "EV Route Pro is a web-based electric vehicle trip planning tool designed for use in Australia. Our service helps EV drivers plan road trips by calculating optimal charging stops based on their vehicle's battery capacity and the selected route. Routes are then opened in Google Maps for navigation."
          },
          {
            title: "3. Accuracy of Route Information",
            content: "While we strive to provide accurate and up-to-date charging stop information, EV Route Pro does not guarantee the accuracy, completeness, or reliability of route calculations or charging station data. Charging station data is sourced from OpenChargeMap (openchargemap.org) and supercharge.info — third-party sources that may be incomplete or out of date. Battery estimates are approximate and may vary based on driving speed, temperature, terrain, and other conditions. Always verify charger availability and compatibility with your vehicle before departing. We are not responsible for any inconvenience or costs arising from inaccurate information."
          },
          {
            title: "4. Use of Google Maps",
            content: "EV Route Pro integrates with Google Maps for navigation. Use of Google Maps through our service is subject to Google's Terms of Service. We are not responsible for the accuracy of Google Maps data or any changes Google makes to their service."
          },
          {
            title: "5. Acceptable Use",
            content: "You agree to use EV Route Pro only for lawful purposes and in a way that does not infringe on the rights of others. You must not attempt to gain unauthorised access to any part of the service, interfere with the service's operation, or use the service to transmit harmful or malicious content."
          },
          {
            title: "6. Disclaimer of Warranties",
            content: "EV Route Pro is provided 'as is' without warranties of any kind, either express or implied. We do not warrant that the service will be uninterrupted, error-free, or free of viruses or other harmful components. Your use of the service is at your sole risk."
          },
          {
            title: "7. Limitation of Liability",
            content: "To the fullest extent permitted by law, EV Route Pro and its operators shall not be liable for any indirect, incidental, special, consequential, or punitive damages resulting from your use or inability to use the service, including but not limited to vehicle breakdowns, missed charging opportunities, or navigation errors."
          },
          {
            title: "8. Changes to Terms",
            content: "We reserve the right to modify these Terms of Service at any time. Changes will be effective immediately upon posting. Your continued use of EV Route Pro after any changes constitutes your acceptance of the new terms."
          },
          {
            title: "9. Governing Law",
            content: "These Terms of Service are governed by the laws of Australia. Any disputes arising from these terms or your use of EV Route Pro shall be subject to the exclusive jurisdiction of the courts of Australia."
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
