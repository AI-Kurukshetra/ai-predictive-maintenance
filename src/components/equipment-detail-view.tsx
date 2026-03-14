"use client";

import Link from "next/link";

import { EmptyState, KeyValueList, PageHeader, SectionCard, SparklineChart, StatusBadge } from "@/components/ui";
import { useDemoStore } from "@/lib/demo-store";
import { formatDateTime, formatIsoDate, getFacilityName } from "@/lib/view-helpers";

export function EquipmentDetailView({ equipmentId }: { equipmentId: string }) {
  const {
    equipment,
    facilities,
    telemetry,
    alerts,
    workOrders,
    documents,
    createWorkOrderFromAlert,
    getPredictionByEquipmentId,
    getWorkOrderByAlertId,
  } =
    useDemoStore();
  const asset = equipment.find((item) => item.id === equipmentId);

  if (!asset) {
    return <EmptyState title="Asset not found" description="The requested equipment record is not available in the monitored fleet." />;
  }

  const assetTelemetry = telemetry.find((entry) => entry.equipmentId === equipmentId);
  const assetAlerts = alerts.filter((item) => item.equipmentId === equipmentId);
  const assetOrders = workOrders.filter((item) => item.equipmentId === equipmentId);
  const assetDocuments = documents.filter((item) => item.equipmentId === equipmentId);
  const prediction = getPredictionByEquipmentId(equipmentId);
  const anomalyTimeline = (assetTelemetry?.points ?? [])
    .map((point, index, points) => {
      const previous = points[index - 1];
      const reasons = [
        point.vibration > 4.6 ? `Vibration ${point.vibration.toFixed(1)} mm/s` : null,
        point.temperature > 82 ? `Temperature ${point.temperature.toFixed(1)} C` : null,
        point.acoustic > 58 ? `Acoustic ${point.acoustic.toFixed(1)} dB` : null,
        point.pressure > 0 && point.pressure < 108 ? `Pressure ${point.pressure.toFixed(1)} psi` : null,
        previous && point.vibration - previous.vibration > 0.35 ? "Fast vibration delta" : null,
        previous && point.temperature - previous.temperature > 3 ? "Fast thermal delta" : null,
      ].filter(Boolean);
      return reasons.length > 0 ? { timestamp: point.timestamp, reasons } : null;
    })
    .filter((item): item is { timestamp: string; reasons: string[] } => Boolean(item))
    .reverse();

  return (
    <>
      <PageHeader
        eyebrow="Asset detail"
        title={asset.name}
        description={`${asset.type} on ${asset.line} at ${getFacilityName(asset.facilityId, facilities)} with ${asset.sensors.join(", ")} sensor coverage.`}
        pills={[prediction.predictedFailureWindow, `${prediction.anomalyCount} active anomalies`, `Health ${prediction.healthScore}`]}
      />

      <div className="grid grid--metrics">
        <SectionCard title="Risk profile">
          <KeyValueList
            items={[
              { label: "Health score", value: prediction.healthScore },
              { label: "Risk level", value: <StatusBadge value={prediction.riskLevel} /> },
              { label: "Predicted failure window", value: prediction.predictedFailureWindow },
            ]}
          />
        </SectionCard>
        <SectionCard title="Performance drift">
          <KeyValueList
            items={[
              { label: "Projected uptime", value: `${prediction.uptimeProjection}%` },
              { label: "Energy delta", value: `${prediction.energyDeltaPercent}%` },
              { label: "Last maintenance", value: formatIsoDate(asset.lastMaintenanceAt) },
            ]}
          />
        </SectionCard>
        <SectionCard title="Operating context">
          <KeyValueList
            items={[
              { label: "Facility", value: getFacilityName(asset.facilityId, facilities) },
              { label: "Criticality", value: asset.criticality },
              { label: "Baseline OEE", value: `${asset.baselineOee}%` },
            ]}
          />
        </SectionCard>
        <SectionCard title="Recommended action">
          <div className="subtle">{prediction.recommendedAction}</div>
        </SectionCard>
      </div>

      <div className="grid grid--two">
        <SectionCard title="Vibration trend" description="Recent rising vibration intensity across the latest telemetry windows.">
          <SparklineChart values={assetTelemetry?.points.map((point) => point.vibration) ?? []} />
        </SectionCard>
        <SectionCard title="Thermal trend" description="Temperature rise against the normal operating envelope." action={<StatusBadge value={prediction.riskLevel} />}>
          <SparklineChart values={assetTelemetry?.points.map((point) => point.temperature) ?? []} warm />
        </SectionCard>
      </div>

      <div className="grid grid--two">
        <SectionCard title="Anomaly timeline" description="Derived from threshold breaches and sudden telemetry deltas.">
          <div className="stack">
            {anomalyTimeline.length === 0 ? <EmptyState title="No anomalies" description="Recent telemetry remains inside the expected operating envelope." /> : null}
            {anomalyTimeline.map((event) => (
              <div className="list-card" key={event.timestamp}>
                <div className="subtle">{formatDateTime(event.timestamp)}</div>
                <div className="split">
                  {event.reasons.map((reason) => (
                    <span className="pill" key={reason}>
                      {reason}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </SectionCard>

        <SectionCard title="Documentation and maintenance history" description="Procedures and context that keep technician execution tight.">
          <div className="stack">
            {assetDocuments.length === 0 ? <EmptyState title="No documents linked" description="Attach manuals, procedures, and maintenance logs here." /> : null}
            {assetDocuments.map((document) => (
              <div className="list-card" key={document.id}>
                <div className="split">
                  <StatusBadge value={document.category} />
                  <span className="pill">{formatIsoDate(document.updatedAt)}</span>
                </div>
                <h3>{document.title}</h3>
              </div>
            ))}
            <div className="list-card">
              <h3>Linked work orders</h3>
              <div className="stack">
                {assetOrders.length === 0 ? <div className="subtle">No linked work orders yet.</div> : null}
                {assetOrders.map((order) => (
                  <div className="statline" key={order.id}>
                    <span>{order.title}</span>
                    <StatusBadge value={order.status} />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </SectionCard>
      </div>

      <SectionCard title="Linked alerts" description="Active asset-specific risk triggers that can be operationalized immediately.">
        <div className="stack">
          {assetAlerts.length === 0 ? <EmptyState title="No alerts" description="This asset currently has no active alerts." /> : null}
          {assetAlerts.map((alert) => {
            const linkedWorkOrder = getWorkOrderByAlertId(alert.id);

            return (
              <div className="list-card" key={alert.id}>
                <div className="split">
                  <StatusBadge value={alert.severity} />
                  <StatusBadge value={alert.status} />
                  {linkedWorkOrder ? <span className="pill">Work order ready</span> : null}
                </div>
                <h3>{alert.title}</h3>
                <p className="subtle">{alert.summary}</p>
                {linkedWorkOrder ? (
                  <div className="subtle">
                    Linked work order: <strong>{linkedWorkOrder.title}</strong> ({linkedWorkOrder.status})
                  </div>
                ) : null}
                <div className="list-card__actions">
                  {linkedWorkOrder ? (
                    <Link className="button button--ghost" href="/work-orders">
                      View work order
                    </Link>
                  ) : (
                    <button className="button button--ghost" onClick={() => void createWorkOrderFromAlert(alert.id)} type="button">
                      Convert to work order
                    </button>
                  )}
                  <Link className="button button--ghost" href="/alerts">
                    Review in alerts center
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      </SectionCard>
    </>
  );
}
