"use client";
import { useEffect, useState } from "react";

export default function PWAInstallBanner() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showBanner, setShowBanner] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    // 이미 설치됐으면 숨김
    if (window.matchMedia("(display-mode: standalone)").matches) {
      setIsInstalled(true);
      return;
    }

    // iOS 감지
    const ios = /iphone|ipad|ipod/.test(navigator.userAgent.toLowerCase());
    const safari = /safari/.test(navigator.userAgent.toLowerCase());
    if (ios && safari) {
      setIsIOS(true);
      const dismissed = localStorage.getItem("pwa-banner-dismissed");
      if (!dismissed) setShowBanner(true);
      return;
    }

    // Android / Chrome — beforeinstallprompt
    const handler = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
      const dismissed = localStorage.getItem("pwa-banner-dismissed");
      if (!dismissed) setShowBanner(true);
    };
    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const handleInstall = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === "accepted") setShowBanner(false);
      setDeferredPrompt(null);
    }
  };

  const handleDismiss = () => {
    setShowBanner(false);
    localStorage.setItem("pwa-banner-dismissed", "1");
  };

  if (!showBanner || isInstalled) return null;

  return (
    <div style={{
      position: "fixed", bottom: 0, left: 0, right: 0, zIndex: 9998,
      background: "linear-gradient(135deg, #059669, #10b981)",
      padding: "16px 20px",
      boxShadow: "0 -4px 24px rgba(0,0,0,0.2)",
      display: "flex", alignItems: "center", gap: 14,
    }}>
      {/* 아이콘 */}
      <div style={{
        width: 48, height: 48, borderRadius: 12, flexShrink: 0,
        background: "white", display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: 26,
      }}>⚡</div>

      {/* 텍스트 */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ color: "white", fontWeight: 700, fontSize: 15 }}>
          Add EV Route Pro to Home Screen
        </div>
        <div style={{ color: "rgba(255,255,255,0.8)", fontSize: 12, marginTop: 2 }}>
          {isIOS
            ? 'Tap Share → "Add to Home Screen"'
            : "Install for faster access & offline use"}
        </div>
      </div>

      {/* 버튼들 */}
      <div style={{ display: "flex", gap: 8, flexShrink: 0 }}>
        {!isIOS && (
          <button
            onClick={handleInstall}
            style={{
              background: "white", color: "#059669",
              border: "none", borderRadius: 8, padding: "8px 14px",
              fontWeight: 700, fontSize: 13, cursor: "pointer",
            }}
          >Install</button>
        )}
        <button
          onClick={handleDismiss}
          style={{
            background: "rgba(255,255,255,0.2)", color: "white",
            border: "none", borderRadius: 8, padding: "8px 10px",
            fontWeight: 600, fontSize: 13, cursor: "pointer",
          }}
        >✕</button>
      </div>
    </div>
  );
}
