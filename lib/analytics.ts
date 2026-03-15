declare global {
  interface Window {
    gtag: (...args: any[]) => void;
  }
}

export function trackEvent(name: string, params?: Record<string, any>) {
  if (typeof window !== "undefined" && typeof window.gtag === "function") {
    window.gtag("event", name, params);
  }
}

export function trackSignUp(method: "email" | "google") {
  trackEvent("sign_up", { method });
}

export function trackPurchase(planName: string, value: number) {
  trackEvent("purchase", {
    currency: "AUD",
    value,
    items: [{ item_name: planName }],
  });
}

export function trackRouteCalculated(params: { origin: string; destination: string; stops: number; model: string }) {
  trackEvent("route_calculated", params);
}

export function trackChargerClick(chargerName: string) {
  trackEvent("charger_click", { charger_name: chargerName });
}

export function trackNavigationStart() {
  trackEvent("navigation_start");
}

export function trackMapLoaded() {
  trackEvent("map_loaded");
}
