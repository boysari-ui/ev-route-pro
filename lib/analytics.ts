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
