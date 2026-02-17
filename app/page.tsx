import Map from "@/components/Map";

export default function Home() {
  return (
    <main className="p-4">
      <h1 className="text-2xl font-bold mb-4">
        EV Route Planner MVP
      </h1>
      <Map />
    </main>
  );
}
