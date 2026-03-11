"use client";

import { useState, useEffect } from "react";
import Map from "../components/Map";

export default function Home() {
  const [showMap, setShowMap] = useState(false);

  useEffect(() => {
    // 새로고침해도 지도/폼 상태 유지
    const wasOnMap = localStorage.getItem("ev_on_map") === "true";
    if (wasOnMap) setShowMap(true);
  }, []);

  const handleStart = () => {
    localStorage.setItem("ev_on_map", "true");
    setShowMap(true);
  };

  if (showMap) return <Map />;

  return (
    <main className="min-h-screen bg-linear-to-r from-emerald-600 to-green-500 flex items-center justify-center">
      <div className="text-center text-white max-w-2xl px-6">
        <h1 className="text-5xl font-bold mb-4">
          ⚡ EV Route Pro
        </h1>
        <p className="text-xl mb-3">
          Smart EV trip planner for Australia
        </p>
        <p className="text-emerald-100 mb-8">
          Plan your drive. Optimize charging. Arrive stress-free.
        </p>
        <button
          onClick={handleStart}
          className="bg-white text-emerald-600 font-semibold px-8 py-3 rounded-xl shadow hover:bg-gray-100 transition"
        >
          Start Planning
        </button>
      </div>
    </main>
  );
}
