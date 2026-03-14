// EVModel interface moved to shared/types.ts
export interface EVModel {
  name: string;
  batteryKWh: number;
  whPerKm: number;
  proPlus?: boolean;
}