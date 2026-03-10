import type { EVModel } from "../types/ev";

export const EV_MODELS: EVModel[] = [
  { name: "Tesla Model 3", batteryKWh: 60, whPerKm: 160 },
  { name: "Tesla Model Y", batteryKWh: 75, whPerKm: 170 },
  { name: "Tesla Model S", batteryKWh: 100, whPerKm: 190 },
  { name: "Hyundai Ioniq 5", batteryKWh: 72.6, whPerKm: 180 },
  { name: "Kia EV6", batteryKWh: 77.4, whPerKm: 185 },
  { name: "Ford Mustang Mach-E", batteryKWh: 98.8, whPerKm: 200 },
  { name: "Volkswagen ID.4", batteryKWh: 82, whPerKm: 190 },
  { name: "Nissan Ariya", batteryKWh: 87, whPerKm: 195 }
];