"use client";
import { useState } from "react";
import { useAuth } from "./useAuth";

interface Props {
  onClose: () => void;
  limitReached?: boolean;
}

export default function ProUpgradeModal({ onClose, limitReached }: Props) {
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();

  const handleUpgrade = async () => {
    setLoading(true);
    try {
      const token = await user?.getIdToken();
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
        body: JSON.stringify({ email: user?.email || "", uid: user?.uid || "" }),
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
          }}>PRO PLUS</div>
          <div style={{ color: "white", fontSize: 22, fontWeight: 800 }}>
            Unlock EV Route Pro <span style={{ color: "#f59e0b" }}>Plus</span>
          </div>
          <div style={{ color: "#64748b", fontSize: 14, marginTop: 6 }}>
            Plan smarter, charge faster
          </div>
          {limitReached && (
            <div style={{
              marginTop: 12, padding: "10px 16px",
              background: "rgba(239,68,68,0.12)", border: "1px solid rgba(239,68,68,0.3)",
              borderRadius: 10, color: "#fca5a5", fontSize: 13, fontWeight: 600,
            }}>
              You've reached the free limit. Upgrade to continue planning EV routes.
            </div>
          )}
        </div>

        {/* Comparison Table */}
        <div style={{ marginBottom: 24 }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", marginBottom: 8, padding: "0 12px" }}>
            <div />
            <div style={{ color: "#64748b", fontSize: 11, fontWeight: 700, textAlign: "center" }}>FREE</div>
            <div style={{ fontSize: 11, fontWeight: 800, textAlign: "center", color: "#fbbf24" }}>PRO PLUS ⚡</div>
          </div>
          {[
            { icon: "🗺️", label: "Route calculations", free: "10 / week", pro: "Unlimited" },
            { icon: "⚡", label: "Charger priority",   free: "Standard",  pro: "Supercharger first" },
            { icon: "🚗", label: "EV models",          free: "10 models", pro: "25 models" },
            { icon: "📍", label: "Save routes",        free: "✕",         pro: "✓" },
          ].map(({ icon, label, free, pro }, i) => (
            <div key={label} style={{
              display: "grid", gridTemplateColumns: "1fr 1fr 1fr",
              alignItems: "center", padding: "10px 12px", borderRadius: 10,
              background: i % 2 === 0 ? "rgba(255,255,255,0.04)" : "transparent",
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <span style={{ fontSize: 14 }}>{icon}</span>
                <span style={{ color: "#94a3b8", fontSize: 12 }}>{label}</span>
              </div>
              <div style={{ textAlign: "center", fontSize: 12, fontWeight: 600, color: free === "✕" ? "#334155" : "#64748b" }}>{free}</div>
              <div style={{ textAlign: "center", fontSize: 12, fontWeight: 700, color: pro === "✕" ? "#334155" : "#10b981" }}>{pro}</div>
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
          {loading ? "Redirecting to checkout..." : "Start Pro Plus — $4.99/month"}
        </button>

        <div style={{ textAlign: "center", color: "#94a3b8", fontSize: 12, marginTop: 12 }}>
          🔒 Secure payment by Stripe
        </div>
      </div>
    </div>
  );
}
