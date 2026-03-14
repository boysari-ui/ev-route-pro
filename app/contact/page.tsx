"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";

export default function Contact() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async () => {
    if (!name || !email || !message) return;
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, message }),
      });
      if (!res.ok) throw new Error("Failed to send");
      setSent(true);
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const inputStyle = {
    width: "100%", padding: "12px 16px",
    border: "1.5px solid #e5e7eb", borderRadius: 10,
    fontSize: "0.95rem", color: "#111827",
    fontFamily: "inherit", outline: "none",
    background: "white", transition: "border-color 0.2s",
  };

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
      <div style={{ maxWidth: 640, margin: "0 auto", padding: "64px 24px 96px" }}>
        <div style={{ marginBottom: 48 }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 8, color: "#059669", fontWeight: 700, fontSize: "0.72rem", letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 12 }}>
            <span style={{ width: 18, height: 2, background: "#059669", borderRadius: 1, display: "inline-block" }} />
            Get in touch
          </div>
          <h1 style={{ fontWeight: 800, fontSize: "clamp(2rem,4vw,2.8rem)", letterSpacing: "-0.03em", color: "#111827", marginBottom: 14, lineHeight: 1.15 }}>Contact Us</h1>
          <p style={{ fontSize: "1rem", color: "#6b7280", lineHeight: 1.7 }}>
            Have a question, feedback, or found a bug? We&apos;d love to hear from you. Send us a message and we&apos;ll get back to you as soon as possible.
          </p>
        </div>

        {sent ? (
          <div style={{ background: "#d1fae5", border: "1.5px solid #a7f3d0", borderRadius: 16, padding: "32px", textAlign: "center" }}>
            <div style={{ fontSize: "2.5rem", marginBottom: 12 }}>✅</div>
            <div style={{ fontWeight: 700, fontSize: "1.1rem", color: "#065f46", marginBottom: 8 }}>Message sent!</div>
            <p style={{ fontSize: "0.9rem", color: "#047857" }}>Thanks for reaching out. We&apos;ll get back to you soon.</p>
          </div>
        ) : (
          <div style={{ background: "white", border: "1.5px solid #e5e7eb", borderRadius: 20, padding: "40px", boxShadow: "0 4px 16px rgba(0,0,0,0.06)" }}>
            <div style={{ marginBottom: 20 }}>
              <label style={{ display: "block", fontWeight: 600, fontSize: "0.875rem", color: "#374151", marginBottom: 8 }}>Name</label>
              <input
                type="text" placeholder="Your name"
                value={name} onChange={(e) => setName(e.target.value)}
                style={inputStyle}
                onFocus={(e) => e.target.style.borderColor = "#059669"}
                onBlur={(e) => e.target.style.borderColor = "#e5e7eb"}
              />
            </div>
            <div style={{ marginBottom: 20 }}>
              <label style={{ display: "block", fontWeight: 600, fontSize: "0.875rem", color: "#374151", marginBottom: 8 }}>Email</label>
              <input
                type="email" placeholder="your@email.com"
                value={email} onChange={(e) => setEmail(e.target.value)}
                style={inputStyle}
                onFocus={(e) => e.target.style.borderColor = "#059669"}
                onBlur={(e) => e.target.style.borderColor = "#e5e7eb"}
              />
            </div>
            <div style={{ marginBottom: 28 }}>
              <label style={{ display: "block", fontWeight: 600, fontSize: "0.875rem", color: "#374151", marginBottom: 8 }}>Message</label>
              <textarea
                placeholder="Tell us how we can help..."
                value={message} onChange={(e) => setMessage(e.target.value)}
                rows={5}
                style={{ ...inputStyle, resize: "vertical" }}
                onFocus={(e) => e.target.style.borderColor = "#059669"}
                onBlur={(e) => e.target.style.borderColor = "#e5e7eb"}
              />
            </div>
            {error && (
              <div style={{ color: "#ef4444", fontSize: "0.875rem", marginBottom: 16 }}>{error}</div>
            )}
            <button
              onClick={handleSubmit}
              disabled={loading || !name || !email || !message}
              style={{
                width: "100%", background: "#059669", color: "white",
                fontWeight: 700, fontSize: "1rem", padding: "14px",
                borderRadius: 10, border: "none",
                cursor: (loading || !name || !email || !message) ? "not-allowed" : "pointer",
                boxShadow: "0 4px 14px rgba(5,150,105,0.35)",
                opacity: (loading || !name || !email || !message) ? 0.5 : 1,
              }}
            >
              {loading ? "Sending..." : "Send Message"}
            </button>
          </div>
        )}

        {/* Info cards */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginTop: 32 }}>
          {[
            { icon: "⚡", title: "Quick Response", desc: "We aim to reply within 1–2 business days." },
            { icon: "🐛", title: "Found a bug?", desc: "Please describe the issue in detail so we can fix it fast." },
          ].map((c) => (
            <div key={c.title} style={{ background: "white", border: "1.5px solid #e5e7eb", borderRadius: 14, padding: 20 }}>
              <div style={{ fontSize: "1.4rem", marginBottom: 8 }}>{c.icon}</div>
              <div style={{ fontWeight: 700, fontSize: "0.9rem", color: "#111827", marginBottom: 4 }}>{c.title}</div>
              <p style={{ fontSize: "0.82rem", color: "#6b7280", lineHeight: 1.6 }}>{c.desc}</p>
            </div>
          ))}
        </div>
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
