"use client";

import { ArrowLeftRight } from "lucide-react";
import { EVModel } from "../types/ev";
import { useEffect, useRef, useState } from "react";

type RoutePlannerProps = {
  origin: string;
  setOrigin: (value: string) => void;
  destination: string;
  setDestination: (value: string) => void;
  selectedModel: EVModel | null;
  setSelectedModel: (model: EVModel) => void;
  startBattery: number;
  setStartBattery: (value: number) => void;
  EV_MODELS: EVModel[];
  handleRouteCalculation: () => void;
  stops: string[];
  setStops: (stops: string[]) => void;
  directions?: any;
  stations?: { isUsedAsWaypoint?: boolean; lat: number; lng: number }[];
};

// Google Places Autocomplete 인풋
function AutocompleteInput({
  placeholder,
  value,
  onChange,
  className,
}: {
  placeholder: string;
  value: string;
  onChange: (val: string) => void;
  className?: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const autocompleteRef = useRef<any>(null);

  useEffect(() => {
    const init = () => {
      if (!inputRef.current || !window.google?.maps?.places || autocompleteRef.current) return;
      autocompleteRef.current = new window.google.maps.places.Autocomplete(inputRef.current, {
        componentRestrictions: { country: "au" },
        fields: ["formatted_address", "name"],
      });
      autocompleteRef.current.addListener("place_changed", () => {
        const place = autocompleteRef.current.getPlace();
        onChange(place.formatted_address || place.name || inputRef.current?.value || "");
      });
    };
    init();
    // Google Maps가 아직 안 로드됐을 경우 대비
    const timer = setTimeout(init, 1000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <input
      ref={inputRef}
      placeholder={placeholder}
      value={value}
      onChange={e => onChange(e.target.value)}
      className={className}
    />
  );
}

function AutocompleteStopInput({
  index,
  value,
  onChange,
  onRemove,
}: {
  index: number;
  value: string;
  onChange: (val: string) => void;
  onRemove: () => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const autocompleteRef = useRef<any>(null);

  useEffect(() => {
    const init = () => {
      if (!inputRef.current || !window.google?.maps?.places || autocompleteRef.current) return;
      autocompleteRef.current = new window.google.maps.places.Autocomplete(inputRef.current, {
        componentRestrictions: { country: "au" },
        fields: ["formatted_address", "name"],
      });
      autocompleteRef.current.addListener("place_changed", () => {
        const place = autocompleteRef.current.getPlace();
        onChange(place.formatted_address || place.name || inputRef.current?.value || "");
      });
    };
    init();
    const timer = setTimeout(init, 1000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="flex gap-2 w-full">
      <input
        ref={inputRef}
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={`Stop ${index + 1}`}
        className="flex-1 bg-gray-100 text-black px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
      />
      <button type="button" onClick={onRemove} className="text-red-500 font-bold px-2">✕</button>
    </div>
  );
}

export default function RoutePlanner({
  origin,
  setOrigin,
  destination,
  setDestination,
  selectedModel,
  setSelectedModel,
  startBattery,
  setStartBattery,
  EV_MODELS,
  handleRouteCalculation,
  stops,
  setStops,
  directions,
  stations,
}: RoutePlannerProps) {
  const [isCustomModel, setIsCustomModel] = useState(false);
  const [customName, setCustomName] = useState("");
  const [customBattery, setCustomBattery] = useState(75);
  const [customWhPerKm, setCustomWhPerKm] = useState(180);

  const getBatteryColor = (pct: number) => {
    if (pct >= 60) return "#10b981";
    if (pct >= 30) return "#f59e0b";
    return "#ef4444";
  };

  const handleModelChange = (value: string) => {
    if (value === "__custom__") {
      setIsCustomModel(true);
    } else {
      setIsCustomModel(false);
      const found = EV_MODELS.find(m => m.name === value);
      if (found) setSelectedModel(found);
    }
  };

  const handleCustomApply = () => {
    if (!customName.trim()) return;
    setSelectedModel({ name: customName, batteryKWh: customBattery, whPerKm: customWhPerKm });
    setIsCustomModel(false);
  };

  const color = getBatteryColor(startBattery);

  return (
    <div className="max-w-4xl mx-auto bg-white p-4 rounded-xl shadow-lg mt-4 relative z-10">
      <form
        id="planner-form"
        className="flex gap-3 flex-wrap items-center"
        onSubmit={e => { e.preventDefault(); handleRouteCalculation(); }}
      >
        {/* Origin / Destination */}
        <AutocompleteInput
          placeholder="Origin"
          value={origin}
          onChange={setOrigin}
          className="flex-1 bg-gray-100 text-black px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
        />
        <button
          type="button"
          onClick={() => { const t = origin; setOrigin(destination); setDestination(t); }}
          className="bg-white border border-gray-200 shadow-md hover:bg-gray-50 text-black p-3 rounded-full transition hover:scale-105"
        >
          <ArrowLeftRight size={20} />
        </button>
        <AutocompleteInput
          placeholder="Destination"
          value={destination}
          onChange={setDestination}
          className="flex-1 bg-gray-100 text-black px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
        />

        {/* Stops */}
        {stops.map((stop, index) => (
          <AutocompleteStopInput
            key={index}
            index={index}
            value={stop}
            onChange={val => { const u = [...stops]; u[index] = val; setStops(u); }}
            onRemove={() => setStops(stops.filter((_, i) => i !== index))}
          />
        ))}

        <button
          type="button"
          onClick={() => setStops([...stops, ""])}
          className="text-sm text-emerald-600 hover:underline"
        >
          + Add Stop (Optional - city, landmark, charger)
        </button>

        {/* EV Model + Battery */}
        <div className="flex gap-4 w-full items-start">
          {/* EV Model select */}
          <div className="flex-1 flex flex-col gap-2">
            <select
              className="w-full bg-gray-100 text-gray-900 px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
              value={isCustomModel ? "__custom__" : (selectedModel?.name || "")}
              onChange={e => handleModelChange(e.target.value)}
            >
              <option value="" disabled>Select your EV model</option>
              {EV_MODELS.map((m, idx) => (
                <option key={idx} value={m.name}>{m.name}</option>
              ))}
              <option value="__custom__">✏️ Other</option>
            </select>

            {/* Custom model 입력 패널 */}
            {isCustomModel && (
              <div className="bg-gray-50 border border-emerald-200 rounded-lg p-3 flex flex-col gap-2">
                <div className="text-xs text-gray-500 font-semibold">Enter your EV details</div>
                <input
                  placeholder="Model name (eg BYD Atto 3)"
                  value={customName}
                  onChange={e => setCustomName(e.target.value)}
                  className="bg-white text-gray-900 px-3 py-2 rounded-lg text-sm border border-gray-200 focus:outline-none focus:ring-2 focus:ring-emerald-400"
                />
                <div className="flex gap-2">
                  <div className="flex-1">
                    <div className="text-xs text-gray-400 mb-1">Battery capacity (kWh)</div>
                    <input
                      type="number"
                      value={customBattery}
                      onChange={e => setCustomBattery(Number(e.target.value))}
                      className="w-full bg-white text-black px-3 py-2 rounded-lg text-sm border border-gray-200 focus:outline-none focus:ring-2 focus:ring-emerald-400"
                    />
                  </div>
                  <div className="flex-1">
                    <div className="text-xs text-gray-400 mb-1">Consumption (Wh/km)</div>
                    <input
                      type="number"
                      value={customWhPerKm}
                      onChange={e => setCustomWhPerKm(Number(e.target.value))}
                      className="w-full bg-white text-black px-3 py-2 rounded-lg text-sm border border-gray-200 focus:outline-none focus:ring-2 focus:ring-emerald-400"
                    />
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleCustomApply}
                  className="bg-emerald-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-emerald-700 transition"
                >
                  Apply
                </button>
              </div>
            )}
          </div>

          {/* 배터리 슬라이더 */}
          <div className="w-44 flex flex-col gap-1 pt-1">
            <div className="flex justify-between items-baseline">
              <span className="text-xs text-gray-500 font-semibold">Starting battery</span>
              <span style={{ color, fontWeight: 800, fontSize: 20, lineHeight: 1 }}>
                {startBattery}<span style={{ fontSize: 12, fontWeight: 600 }}>%</span>
              </span>
            </div>
            <input
              type="range"
              min={10}
              max={100}
              step={1}
              value={startBattery}
              onChange={e => setStartBattery(Number(e.target.value))}
              style={{ width: "100%", accentColor: color, cursor: "pointer" }}
            />
            <div className="flex justify-between text-xs text-gray-400">
              <span>10%</span>
              <span>100%</span>
            </div>
          </div>
        </div>

        {/* 버튼 */}
        <div className="flex flex-col md:flex-row gap-4 w-full">
          <button
            type="submit"
            className="bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-4 rounded-lg font-semibold transition"
          >
            Plan route
          </button>
          {directions && (
            <button
              type="button"
              className="flex-1 border-2 border-orange-500 text-orange-500 hover:bg-orange-50 px-6 py-3 rounded-lg font-semibold transition"
              onClick={() => {
                const waypointStr = (stations ?? [])
                  .filter(s => s.isUsedAsWaypoint === true)
                  .map(s => `${s.lat},${s.lng}`)
                  .join("|");
                let url = `https://www.google.com/maps/dir/?api=1&travelmode=driving&origin=${encodeURIComponent(origin)}&destination=${encodeURIComponent(destination)}`;
                if (waypointStr) url += `&waypoints=${encodeURIComponent(waypointStr)}`;
                url += `&dir_action=navigate`;
                window.open(url, "_blank");
              }}
            >
              Open in Google Maps
            </button>
          )}
        </div>
      </form>
    </div>
  );
}
