import { revalidateTag } from "next/cache";

export const dataCacheTags = {
  company: (companyId: string) => `company-data-${companyId}`,
  driver: (driverId: string) => `driver-data-${driverId}`,
  vehicle: (vehicleId: string) => `vehicle-data-${vehicleId}`,
};

export function invalidateCompanyCache(companyId: string) {
  revalidateTag(dataCacheTags.company(companyId), { expire: 0 });
}

export function invalidateDriverCache(driverId: string) {
  revalidateTag(dataCacheTags.driver(driverId), { expire: 0 });
}

export function invalidateVehicleCache(vehicleId: string) {
  revalidateTag(dataCacheTags.vehicle(vehicleId), { expire: 0 });
}
