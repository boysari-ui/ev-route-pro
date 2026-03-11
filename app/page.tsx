"use client";

import { useState, useEffect } from "react";
import Map from "../components/Map";

export default function Home() {
  const [showMap, setShowMap] = useState<boolean | null>(null);

  useEffect(() => {
    const wasOnMap = localStorage.getItem("ev_on_map") === "true";
    setShowMap(wasOnMap);
  }, []);

  // 로딩 중
  if (showMap === null) return (
    <div style={{
      minHeight: "100vh",
      background: "linear-gradient(to right, #059669, #10b981)",
      display: "flex", alignItems: "center", justifyContent: "center",
    }}>
      <div style={{ fontSize: 48 }}>⚡</div>
    </div>
  );

  if (showMap) return <Map />;

  // 첫 방문 - 랜딩 페이지
  return (
    <main className="min-h-screen bg-linear-to-r from-emerald-600 to-green-500 flex items-center justify-center">
      <div className="text-center text-white max-w-2xl px-6">
        <h1 className="text-5xl font-bold mb-4">⚡ EV Route Pro</h1>
        <p className="text-xl mb-3">Smart EV trip planner for Australia</p>
        <p className="text-emerald-100 mb-8">Plan your drive. Optimize charging. Arrive stress-free.</p>
        <button
          onClick={() => {
            localStorage.setItem("ev_on_map", "true");
            setShowMap(true);
          }}
          className="bg-white text-emerald-600 font-semibold px-8 py-3 rounded-xl shadow hover:bg-gray-100 transition"
        >
          Start Planning
        </button>
      </div>
    </main>
  );
}
