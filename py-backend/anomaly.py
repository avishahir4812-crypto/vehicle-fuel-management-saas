"""Fuel-entry sanity checks.

Mirrors src/lib/anomaly.ts exactly so both runtimes produce identical codes.
"""

from typing import List, Optional

RATE_MIN = 40.0
RATE_MAX = 160.0
RATE_DEVIATION = 0.20
KM_MAX_JUMP = 4000
KM_MIN_GAP = 5


def detect_anomalies(
    *,
    fuel_rate: float,
    quantity_liters: float,
    total_amount: float,
    odometer_km: int,
    last_rate: Optional[float],
    last_odometer_km: Optional[int],
) -> List[str]:
    codes: List[str] = []

    if fuel_rate < RATE_MIN or fuel_rate > RATE_MAX:
        codes.append("rate_range")
    elif last_rate and last_rate > 0:
        if abs(fuel_rate - last_rate) / last_rate > RATE_DEVIATION:
            codes.append("rate_spike")

    if abs(fuel_rate * quantity_liters - total_amount) > 1:
        codes.append("total_off")

    if last_odometer_km is not None:
        delta = odometer_km - last_odometer_km
        if delta > KM_MAX_JUMP:
            codes.append("km_jump")
        elif 0 < delta < KM_MIN_GAP:
            codes.append("km_small")

    return codes
