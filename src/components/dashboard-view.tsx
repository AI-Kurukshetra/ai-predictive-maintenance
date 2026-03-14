"use client";

import Link from "next/link";

import { MetricCard, PageHeader, SectionCard, SparklineChart, StatusBadge } from "@/components/ui";
import { useDemoStore } from "@/lib/demo-store";
import { getFacilityName } from "@/lib/view-helpers";

export function DashboardView() {
  const {
    filteredEquipment,
    filteredAlerts,
    filteredWorkOrders,
    getPredictionByEquipmentId,
    facilities,
    telemetry,
  } = useDemoStore();

  const snapshots = filteredEquipment
    .map((item) => ({ equipment: item, prediction: getPredictionByEquipmentId(item.id) }))
    .sort((left, right) => left.prediction.healthScore - right.prediction.healthScore);

  const averageHealth =
    snapshots.reduce((total, item) => total + item.prediction.healthScore, 0) /
    Math.max(snapshots.length, 1);
  const averageUptime =
    snapshots.reduce((total, item) => total + item.prediction.uptimeProjection, 0) /
    Math.max(snapshots.length, 1);
  const criticalAssets = snapshots.filter((item) => item.prediction.riskLevel === "Critical").length;
  const openAlerts = filteredAlerts.filter((item) => item.status === "Open").length;
  const facilityCards = facilities.map((facility) => {
    const assets = snapshots.filter((item) => item.equipment.facilityId === facility.id);
    const alerts = filteredAlerts.filter((item) => item.facilityId === facility.id && item.status !== "Resolved");
    const workOrders = filteredWorkOrders.filter((item) => item.facilityId === facility.id);
    const health = assets.reduce((total, item) => total + item.prediction.healthScore, 0) / Math.max(assets.length, 1);
    return {
      ...facility,
      assetCount: assets.length,
      alertCount: alerts.length,
      workOrderCount: workOrders.length,
      health: Math.round(health),
    };
  });

  return (
    <>
      <PageHeader
        eyebrow="Operations command"
        title="Fleet-wide predictive maintenance control center"
        description="Track machine health, prioritize failure risk, and move from alert to maintenance action without leaving the platform."
        pills={["Multi-facility scope", `${openAlerts} active alerts`, `${criticalAssets} critical assets`]}
      />

      <div className="grid grid--metrics">
        <MetricCard label="Assets monitored" value={String(filteredEquipment.length)} detail="Seeded across three facilities and multiple production lines." />
        <MetricCard label="Average health" value={`${Math.round(averageHealth)}`} detail="Composite signal from vibration, thermal, acoustic, and pressure telemetry." />
        <MetricCard label="Projected uptime" value={`${averageUptime.toFixed(1)}%`} detail="Forward-looking operating availability estimate from current equipment state." />
        <MetricCard label="Active work orders" value={String(filteredWorkOrders.filter((item) => item.status !== "Completed").length)} detail="Operational response queue spanning triage, scheduling, and execution." />
      </div>

      <div className="hero-grid">
        <SectionCard
          title="Risk-ranked assets"
          description="The most urgent equipment should be the first action conversation in every shift handoff."
          action={<Link className="button button--ghost" href="/equipment">View asset register</Link>}
          strong
        >
          <table className="table">
            <thead>
              <tr>
                <th>Asset</th>
                <th>Facility</th>
                <th>Health</th>
                <th>Risk</th>
                <th>Failure window</th>
              </tr>
            </thead>
            <tbody>
              {snapshots.slice(0, 5).map((item) => (
                <tr key={item.equipment.id}>
                  <td>
                    <Link href={`/equipment/${item.equipment.id}`}>{item.equipment.name}</Link>
                  </td>
                  <td>{getFacilityName(item.equipment.facilityId, facilities)}</td>
                  <td>{item.prediction.healthScore}</td>
                  <td>
                    <StatusBadge value={item.prediction.riskLevel} />
                  </td>
                  <td>{item.prediction.predictedFailureWindow}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </SectionCard>

        <SectionCard
          title="Immediate action queue"
          description="Alerts already contextualized with recommended response paths."
          action={<Link className="button button--ghost" href="/alerts">Open alerts center</Link>}
        >
          <div className="stack">
            {filteredAlerts.slice(0, 4).map((alert) => (
              <div className="list-card" key={alert.id}>
                <div className="split">
                  <StatusBadge value={alert.severity} />
                  <StatusBadge value={alert.status} />
                </div>
                <h3>{alert.title}</h3>
                <p className="subtle">{alert.summary}</p>
                <div className="subtle">{alert.recommendedAction}</div>
              </div>
            ))}
          </div>
        </SectionCard>
      </div>

      <div className="grid grid--two">
        <SectionCard title="Telemetry trend spotlight" description="A single view of the noisiest signal in the monitored fleet.">
          {snapshots[0] ? (
            <>
              <div className="statline">
                <span>{snapshots[0].equipment.name}</span>
                <strong>{snapshots[0].prediction.latest.vibration.toFixed(1)} mm/s</strong>
              </div>
              <SparklineChart
                values={
                  telemetry.find((entry) => entry.equipmentId === snapshots[0].equipment.id)?.points.map((point) => point.vibration) ??
                  []
                }
              />
            </>
          ) : null}
        </SectionCard>

        <SectionCard title="Facility pulse" description="Cross-site health, workload, and risk in one operational strip.">
          <div className="stack stack--lg">
            {facilityCards.map((facility) => (
              <div className="list-card" key={facility.id}>
                <div className="panel__header">
                  <div>
                    <h3>{facility.name}</h3>
                    <div className="subtle">{facility.region} - {facility.lines} production lines</div>
                  </div>
                  <StatusBadge value={facility.health < 60 ? "High" : facility.health < 80 ? "Elevated" : "Stable"} />
                </div>
                <div className="statline">
                  <span>Monitored assets</span>
                  <strong>{facility.assetCount}</strong>
                </div>
                <div className="statline">
                  <span>Open alerts</span>
                  <strong>{facility.alertCount}</strong>
                </div>
                <div className="statline">
                  <span>Work order load</span>
                  <strong>{facility.workOrderCount}</strong>
                </div>
              </div>
            ))}
          </div>
        </SectionCard>
      </div>
    </>
  );
}
