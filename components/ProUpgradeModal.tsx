"use client";
import { useState } from "react";

interface Props {
  onClose: () => void;
}

export default function ProUpgradeModal({ onClose }: Props) {
  const [loading, setLoading] = useState(false);

  const handleUpgrade = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          priceId: process.env.NEXT_PUBLIC_STRIPE_PRICE_ID,
        }),
      });
      const data = await res.json();
      if (data.url) window.location.href = data.url;
    } catch {
      alert("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 999999,
      background: "rgba(0,0,0,0.7)",
      display: "flex", alignItems: "center", justifyContent: "center", overflowY: "auto",
      padding: "20px", backdropFilter: "blur(6px)",
    }}>
      <div style={{
        background: "linear-gradient(160deg, #0d1117 0%, #161b27 100%)",
        borderRadius: 24, padding: "32px 28px",
        maxWidth: 420, width: "100%",
        border: "1px solid rgba(255,255,255,0.08)",
        boxShadow: "0 32px 64px rgba(0,0,0,0.6)",
        position: "relative",
      }}>
        {/* Close */}
        <button onClick={onClose} style={{
          position: "absolute", top: 16, right: 16,
          background: "rgba(255,255,255,0.1)", border: "none", borderRadius: "50%",
          width: 32, height: 32, color: "white", fontSize: 16, cursor: "pointer",
        }}>✕</button>

        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: 28 }}>
          <div style={{ fontSize: 40, marginBottom: 8 }}>⚡</div>
          <div style={{
            display: "inline-block",
            background: "linear-gradient(135deg, #f59e0b, #fbbf24)",
            borderRadius: 8, padding: "4px 12px",
            fontSize: 11, fontWeight: 800, color: "#1a1a1a", letterSpacing: "0.1em",
            marginBottom: 12,
          }}>PRO</div>
          <div style={{ color: "white", fontSize: 22, fontWeight: 800 }}>
            Unlock EV Route Pro
          </div>
          <div style={{ color: "#64748b", fontSize: 14, marginTop: 6 }}>
            Plan smarter, charge faster
          </div>
        </div>

        {/* Features */}
        <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 28 }}>
          {[
            { icon: "🗺️", free: "3 routes/day", pro: "Unlimited routes" },
            { icon: "⚡", free: "Basic charger list", pro: "Supercharger priority + fastest route" },
            { icon: "🔋", free: "Standard battery calc", pro: "Accurate real-world estimates" },
            { icon: "📍", free: "—", pro: "Save favourite routes" },
            { icon: "🚀", free: "—", pro: "Early access to new features" },
          ].map(({ icon, free, pro }) => (
            <div key={pro} style={{ display: "flex", gap: 10, alignItems: "center" }}>
              <span style={{ fontSize: 18, flexShrink: 0 }}>{icon}</span>
              <div style={{ flex: 1 }}>
                <div style={{ color: "white", fontSize: 13, fontWeight: 600 }}>{pro}</div>
              </div>
              <div style={{
                fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 99,
                background: "rgba(16,185,129,0.15)", color: "#10b981",
                border: "1px solid rgba(16,185,129,0.3)",
              }}>PRO</div>
            </div>
          ))}
        </div>

        {/* Price */}
        <div style={{
          background: "rgba(255,255,255,0.04)", borderRadius: 16,
          padding: "16px 20px", marginBottom: 20, textAlign: "center",
          border: "1px solid rgba(255,255,255,0.06)",
        }}>
          <div style={{ color: "white", fontSize: 32, fontWeight: 900 }}>
            $4.99
            <span style={{ fontSize: 16, fontWeight: 400, color: "#64748b" }}> / month</span>
          </div>
          <div style={{ color: "#475569", fontSize: 12, marginTop: 4 }}>
            Cancel anytime · Billed monthly
          </div>
        </div>

        {/* CTA */}
        <button
          onClick={handleUpgrade}
          disabled={loading}
          style={{
            width: "100%", padding: "14px", borderRadius: 12, border: "none",
            background: loading ? "#334155" : "linear-gradient(135deg, #059669, #10b981)",
            color: "white", fontSize: 16, fontWeight: 800, cursor: loading ? "not-allowed" : "pointer",
            boxShadow: loading ? "none" : "0 8px 24px rgba(16,185,129,0.35)",
            transition: "all 0.2s ease",
          }}
        >
          {loading ? "Redirecting to checkout..." : "Start Pro — $4.99/month"}
        </button>

        <div style={{ textAlign: "center", color: "#94a3b8", fontSize: 12, marginTop: 12 }}>
          🔒 Secure payment by Stripe
        </div>
      </div>
    </div>
  );
}
