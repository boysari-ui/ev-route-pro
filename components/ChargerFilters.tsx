"use client";

interface Props {
  visibleTypes: Set<string>;
  toggleType: (type: string) => void;
}

export default function ChargerFilters({ visibleTypes, toggleType }: Props) {

  const filters = [
    { label: "Selected Stop", color: "#3b82f6", type: "Selected Stop" },
    { label: "Fast Charger", color: "#ef4444", type: "Fast Charger" },
    { label: "Standard Charger", color: "#22c55e", type: "Standard" },
  ];

  return (
    <div className="absolute top-4 left-3 flex flex-col gap-2 z-20">

      {filters.map(({ label, color, type }) => {

        const active = visibleTypes.has(type);

        return (
          <button
            key={type}
            onClick={() => toggleType(type)}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              padding: "6px 12px",
              borderRadius: 20,
              border: `2px solid ${color}`,
              background: active ? color : "rgba(255,255,255,0.9)",
              color: active ? "white" : "#333",
              fontSize: 12,
              fontWeight: 600,
              cursor: "pointer",
              boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
              transition: "all 0.15s ease"
            }}
          >
            <span
              style={{
                width: 10,
                height: 10,
                borderRadius: "50%",
                background: active ? "white" : color,
                flexShrink: 0
              }}
            />
            {label}
          </button>
        );

      })}
      
    </div>
  );
}