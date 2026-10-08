/**
 * Fuel-entry sanity checks. Entries that trip a rule are stored with an
 * anomaly code and rendered in red so the owner can review them.
 * Shared by the API (on write) and the UI (live warnings while typing).
 */

export type AnomalyCode = "rate_spike" | "rate_range" | "km_jump" | "km_small" | "total_off";

export const ANOMALY_LABEL_KEY: Record<AnomalyCode, string> = {
  rate_spike: "anomaly.rateSpike",
  rate_range: "anomaly.rateRange",
  km_jump: "anomaly.kmJump",
  km_small: "anomaly.kmSmall",
  total_off: "anomaly.totalOff",
};

/** Plausible pump rates in ₹/unit across diesel, petrol and CNG. */
const RATE_MIN = 40;
const RATE_MAX = 160;
/** Flag when the rate moves more than this vs. the vehicle's last fill-up. */
const RATE_DEVIATION = 0.2;
/** Distance covered between two fill-ups. */
const KM_MAX_JUMP = 4000;
const KM_MIN_GAP = 5;

export type AnomalyInput = {
  fuelRate: number;
  quantityLiters: number;
  totalAmount: number;
  odometerKm: number;
  lastRate: number | null;
  lastOdometerKm: number | null;
};

export function detectAnomalies(input: AnomalyInput): AnomalyCode[] {
  const codes: AnomalyCode[] = [];

  if (input.fuelRate < RATE_MIN || input.fuelRate > RATE_MAX) {
    codes.push("rate_range");
  } else if (input.lastRate && input.lastRate > 0) {
    const deviation = Math.abs(input.fuelRate - input.lastRate) / input.lastRate;
    if (deviation > RATE_DEVIATION) codes.push("rate_spike");
  }

  if (Math.abs(input.fuelRate * input.quantityLiters - input.totalAmount) > 1) {
    codes.push("total_off");
  }

  if (input.lastOdometerKm != null) {
    const delta = input.odometerKm - input.lastOdometerKm;
    if (delta > KM_MAX_JUMP) codes.push("km_jump");
    else if (delta > 0 && delta < KM_MIN_GAP) codes.push("km_small");
  }

  return codes;
}

export function encodeAnomalies(codes: AnomalyCode[]): string | null {
  return codes.length > 0 ? codes.join(",") : null;
}

export function decodeAnomalies(value: string | null): AnomalyCode[] {
  if (!value) return [];
  return value.split(",").filter(Boolean) as AnomalyCode[];
}
