"use client";

import { useState } from "react";
import Map from "../components/Map";

export default function Home() {

  const [showMap, setShowMap] = useState(false);

  return (
   <main className="min-h-screen bg-linear-to-r from-emerald-600 to-green-500 flex items-center justify-center">

      {!showMap && (
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
            onClick={() => setShowMap(true)}
            className="bg-white text-emerald-600 font-semibold px-8 py-3 rounded-xl shadow hover:bg-gray-100 transition"
          >
            Start Planning
          </button>

        </div>
      )}

      {showMap && <Map />}

    </main>
  );
}