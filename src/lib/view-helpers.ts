import { equipment, facilities } from "@/lib/seed-data";
import type { Equipment, Facility } from "@/lib/types";

export function getFacilityName(facilityId: string, facilityList: Facility[] = facilities) {
  return facilityList.find((facility) => facility.id === facilityId)?.name ?? "Unknown facility";
}

export function getEquipmentName(equipmentId: string, equipmentList: Equipment[] = equipment) {
  return equipmentList.find((item) => item.id === equipmentId)?.name ?? "Unknown asset";
}

export function formatIsoDate(value: string) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(value));
}

export function formatCompactNumber(value: number) {
  return new Intl.NumberFormat("en-US", {
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(value);
}

export function formatDateTime(value: string) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(value));
}

export function toDateInputValue(value: string) {
  return new Date(value).toISOString().slice(0, 10);
}
