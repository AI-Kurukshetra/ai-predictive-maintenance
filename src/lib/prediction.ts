import type { Equipment, EquipmentTelemetry, PredictionSnapshot, RiskLevel, TelemetryPoint } from "@/lib/types";

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function getRiskLevel(healthScore: number): RiskLevel {
  if (healthScore < 45) return "Critical";
  if (healthScore < 62) return "High";
  if (healthScore < 80) return "Elevated";
  return "Stable";
}

function getRecommendedAction(riskLevel: RiskLevel, equipmentName: string) {
  switch (riskLevel) {
    case "Critical":
      return `Dispatch an immediate inspection team to ${equipmentName} and stage replacement parts before the next production block.`;
    case "High":
      return `Create a scheduled intervention for ${equipmentName} within the next operating shift.`;
    case "Elevated":
      return `Monitor ${equipmentName} closely and align preventive maintenance during the next low-load window.`;
    default:
      return `${equipmentName} is stable. Continue with routine maintenance cadence.`;
  }
}

function getPredictedFailureWindow(riskLevel: RiskLevel) {
  switch (riskLevel) {
    case "Critical":
      return "12-24 hours";
    case "High":
      return "2-5 days";
    case "Elevated":
      return "1-2 weeks";
    default:
      return "No immediate failure predicted";
  }
}

function calculateAnomalies(latest: TelemetryPoint, previous: TelemetryPoint) {
  let anomalies = 0;
  if (latest.vibration > 4.6) anomalies += 1;
  if (latest.temperature > 82) anomalies += 1;
  if (latest.acoustic > 58) anomalies += 1;
  if (latest.pressure > 0 && latest.pressure < 108) anomalies += 1;
  if (latest.vibration - previous.vibration > 0.35) anomalies += 1;
  if (latest.temperature - previous.temperature > 3) anomalies += 1;
  return anomalies;
}

export function buildPredictionSnapshot(
  targetEquipment: Equipment,
  telemetryCollection: EquipmentTelemetry[],
): PredictionSnapshot {
  const equipmentTelemetry = telemetryCollection.find((entry) => entry.equipmentId === targetEquipment.id);
  if (!equipmentTelemetry) {
    throw new Error(`Missing telemetry for equipment ${targetEquipment.id}`);
  }

  const latest = equipmentTelemetry.points.at(-1);
  const previous = equipmentTelemetry.points.at(-2);

  if (!latest || !previous) {
    throw new Error(`Incomplete telemetry for equipment ${targetEquipment.id}`);
  }

  const vibrationRisk = clamp(((latest.vibration - 1.5) / 4.5) * 100, 0, 100);
  const temperatureRisk = clamp(((latest.temperature - 52) / 38) * 100, 0, 100);
  const acousticRisk = clamp(((latest.acoustic - 28) / 42) * 100, 0, 100);
  const pressureRisk = latest.pressure > 0 ? clamp(((120 - latest.pressure) / 18) * 100, 0, 100) : 0;
  const trendPenalty = clamp(
    (latest.vibration - previous.vibration) * 16 + (latest.temperature - previous.temperature) * 2,
    0,
    18,
  );

  const compositeRisk =
    vibrationRisk * 0.34 +
    temperatureRisk * 0.28 +
    acousticRisk * 0.2 +
    pressureRisk * 0.12 +
    trendPenalty;
  const healthScore = Math.round(clamp(100 - compositeRisk, 22, 98));
  const riskLevel = getRiskLevel(healthScore);
  const anomalyCount = calculateAnomalies(latest, previous);
  const uptimeProjection = Number((targetEquipment.baselineOee - compositeRisk * 0.08).toFixed(1));
  const energyDeltaPercent = Number(
    (((latest.temperature - 55) * 0.35) + (latest.vibration - 1.4) * 1.9).toFixed(1),
  );

  return {
    equipmentId: targetEquipment.id,
    healthScore,
    riskLevel,
    anomalyCount,
    predictedFailureWindow: getPredictedFailureWindow(riskLevel),
    uptimeProjection,
    energyDeltaPercent,
    latest,
    previous,
    recommendedAction: getRecommendedAction(riskLevel, targetEquipment.name),
  };
}

export function getAllPredictionSnapshots(
  equipmentCollection: Equipment[],
  telemetryCollection: EquipmentTelemetry[],
) {
  return equipmentCollection.map((item) => buildPredictionSnapshot(item, telemetryCollection));
}

export function formatPercent(value: number) {
  return `${value.toFixed(1)}%`;
}
