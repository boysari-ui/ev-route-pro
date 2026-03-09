"use client";

import { useState } from "react";
import Map from "../components/Map";

export default function Home() {
  const [showMap, setShowMap] = useState(false);

  return (
    <main className="p-6">
      

      {!showMap && (
        <div className="text-center mt-20">
          <h1 className="text-4xl font-bold mb-4">
            ⚡ EV Route Pro
          </h1>

          <p className="mb-6 text-gray-600">
            Smart EV Trip Planner for Australia
          </p>

          <button
            onClick={() => setShowMap(true)}
            className="bg-emerald-600 text-white px-6 py-3 rounded-lg"
          >
            Start Planning
          </button>
        </div>
      )}

      {showMap && <Map />}

    </main>
  );
}