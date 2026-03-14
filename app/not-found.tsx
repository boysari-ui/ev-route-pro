import Link from "next/link";

export default function NotFound() {
  return (
    <div style={{
      minHeight: "100vh",
      background: "linear-gradient(160deg, #0d1117 0%, #0a1628 50%, #0d1117 100%)",
      display: "flex", flexDirection: "column",
      alignItems: "center", justifyContent: "center",
      color: "white", fontFamily: "'Inter', system-ui, sans-serif",
      textAlign: "center", padding: "20px",
    }}>
      <div style={{ fontSize: 64, marginBottom: 16 }}>⚡</div>
      <div style={{ fontSize: 72, fontWeight: 900, color: "#059669", lineHeight: 1 }}>404</div>
      <div style={{ fontSize: 22, fontWeight: 700, marginTop: 12, marginBottom: 8 }}>Page not found</div>
      <div style={{ color: "#64748b", fontSize: 15, marginBottom: 32 }}>
        This route doesn&apos;t exist. Let&apos;s get you back on track.
      </div>
      <Link href="/" style={{
        padding: "12px 28px", borderRadius: 10, border: "none",
        background: "linear-gradient(135deg, #059669, #10b981)",
        color: "white", fontSize: 15, fontWeight: 700,
        textDecoration: "none", display: "inline-block",
      }}>
        Back to EV Route Pro
      </Link>
    </div>
  );
}
