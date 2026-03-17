import type { EVModel } from "../types/ev";

export const EV_MODELS: EVModel[] = [
  // Free tier — top 10 in AU
  { name: "Tesla Model Y LR", batteryKWh: 78.1, whPerKm: 170, maxChargeKW: 250 },
  { name: "Tesla Model Y SR", batteryKWh: 60, whPerKm: 165, maxChargeKW: 170 },
  { name: "Tesla Model 3 LR", batteryKWh: 78.1, whPerKm: 160, maxChargeKW: 250 },
  { name: "Tesla Model 3 SR", batteryKWh: 60, whPerKm: 155, maxChargeKW: 170 },
  { name: "BYD Atto 3", batteryKWh: 60.5, whPerKm: 175, maxChargeKW: 80 },
  { name: "MG4", batteryKWh: 64, whPerKm: 158, maxChargeKW: 140 },
  { name: "Kia EV6", batteryKWh: 77.4, whPerKm: 182, maxChargeKW: 233 },
  { name: "Hyundai Ioniq 5", batteryKWh: 72.6, whPerKm: 178, maxChargeKW: 220 },
  { name: "BYD Seal", batteryKWh: 82.6, whPerKm: 165, maxChargeKW: 150 },
  { name: "MG ZS EV", batteryKWh: 51, whPerKm: 172, maxChargeKW: 92 },
  // Pro Plus only — 15 additional models
  { name: "BYD Dolphin", batteryKWh: 44.9, whPerKm: 145, maxChargeKW: 60, proPlus: true },
  { name: "Hyundai Ioniq 6", batteryKWh: 77.4, whPerKm: 148, maxChargeKW: 233, proPlus: true },
  { name: "Polestar 2", batteryKWh: 78, whPerKm: 175, maxChargeKW: 205, proPlus: true },
  { name: "Volvo EX30", batteryKWh: 51, whPerKm: 162, maxChargeKW: 153, proPlus: true },
  { name: "GWM Ora", batteryKWh: 63.1, whPerKm: 165, maxChargeKW: 80, proPlus: true },
  { name: "Tesla Model S", batteryKWh: 100, whPerKm: 185, maxChargeKW: 250, proPlus: true },
  { name: "Tesla Model X", batteryKWh: 100, whPerKm: 210, maxChargeKW: 250, proPlus: true },
  { name: "BYD Shark PHEV", batteryKWh: 26.1, whPerKm: 230, maxChargeKW: 50, proPlus: true },
  { name: "Kia EV9", batteryKWh: 99.8, whPerKm: 215, maxChargeKW: 233, proPlus: true },
  { name: "Mercedes EQA", batteryKWh: 66.5, whPerKm: 185, maxChargeKW: 100, proPlus: true },
  { name: "BMW iX1", batteryKWh: 64.7, whPerKm: 178, maxChargeKW: 130, proPlus: true },
  { name: "Volkswagen ID.4", batteryKWh: 82, whPerKm: 188, maxChargeKW: 135, proPlus: true },
  { name: "Audi Q4 e-tron", batteryKWh: 82, whPerKm: 190, maxChargeKW: 135, proPlus: true },
  { name: "Nissan Leaf", batteryKWh: 40, whPerKm: 155, maxChargeKW: 50, proPlus: true },
  { name: "Nissan Ariya", batteryKWh: 87, whPerKm: 195, maxChargeKW: 130, proPlus: true },
];