"use client";

import { useMemo, useState } from "react";

import { MetricCard, PageHeader, SectionCard, StatusBadge } from "@/components/ui";
import { useDemoStore } from "@/lib/demo-store";
import { formatCompactNumber } from "@/lib/view-helpers";

export function ReportsView() {
  const { filteredEquipment, filteredAlerts, filteredWorkOrders, activeFacilityId, facilities, getPredictionByEquipmentId } = useDemoStore();
  const [windowDays, setWindowDays] = useState(30);

  const cutoff = useMemo(() => {
    const date = new Date();
    date.setUTCDate(date.getUTCDate() - windowDays);
    return date;
  }, [windowDays]);

  const visibleAlerts = filteredAlerts.filter((item) => new Date(item.createdAt) >= cutoff);
  const visibleWorkOrders = filteredWorkOrders.filter((item) => new Date(item.dueDate) >= cutoff);
  const scopedPredictions = filteredEquipment.map((asset) => getPredictionByEquipmentId(asset.id));
  const averageHealth = scopedPredictions.reduce((sum, item) => sum + item.healthScore, 0) / Math.max(scopedPredictions.length, 1);
  const projectedUptime = scopedPredictions.reduce((sum, item) => sum + item.uptimeProjection, 0) / Math.max(scopedPredictions.length, 1);
  const preventedDowntimeHours = Math.max(42, visibleAlerts.filter((item) => item.severity === "Critical").length * 16 + 24);
  const estimatedSavings = preventedDowntimeHours * 4200;
  const visibleFacilities = activeFacilityId === "all"
    ? facilities
    : facilities.filter((facility) => facility.id === activeFacilityId);
  const facilityRiskCards = visibleFacilities.map((facility) => {
    const facilityAssets = filteredEquipment.filter((item) => item.facilityId === facility.id);
    const sitePredictions = facilityAssets.map((asset) => getPredictionByEquipmentId(asset.id));
    const health = sitePredictions.reduce((sum, item) => sum + item.healthScore, 0) / Math.max(sitePredictions.length, 1);
    return {
      id: facility.id,
      name: facility.name,
      health: Math.round(health),
      criticalCount: visibleAlerts.filter((item) => item.facilityId === facility.id && item.severity === "Critical").length,
    };
  });

  return (
    <>
      <PageHeader
        eyebrow="Executive reporting"
        title="Reliability, uptime, and ROI reporting"
        description="Translate machine health into operational KPIs, choose a reporting window, and export a leadership-ready CSV."
        pills={["ROI-oriented reporting", `${windowDays}-day view`, activeFacilityId === "all" ? "Cross-facility KPI view" : "Facility-scoped KPI view"]}
      />

      <SectionCard
        title="Reporting window"
        description="Switch the date horizon to compare short-term action pressure against longer-term maintenance performance."
        action={
          <select className="select" onChange={(event) => setWindowDays(Number(event.target.value))} value={windowDays}>
            <option value={7}>Last 7 days</option>
            <option value={30}>Last 30 days</option>
            <option value={90}>Last 90 days</option>
          </select>
        }
      >
        <div className="list-card__actions">
          <a className="button button--ghost" href={`/api/reports/export?facilityId=${activeFacilityId}&windowDays=${windowDays}`}>
            Export CSV
          </a>
        </div>
      </SectionCard>

      <div className="grid grid--metrics">
        <MetricCard label="Average health" value={`${Math.round(averageHealth)}`} detail="Normalized asset health across the monitored fleet." />
        <MetricCard label="Projected uptime" value={`${projectedUptime.toFixed(1)}%`} detail="Current forward-looking uptime expectation from predictive signals." />
        <MetricCard label="Prevented downtime" value={`${preventedDowntimeHours} hrs`} detail="Estimated hours saved by intervening before likely failure windows." />
        <MetricCard label="Estimated savings" value={`$${formatCompactNumber(estimatedSavings)}`} detail="Blended cost-avoidance model from downtime and emergency maintenance risk." />
      </div>

      <div className="grid grid--two">
        <SectionCard title="Operational KPI narrative" description="Metrics to bring into a plant review or buyer conversation.">
          <div className="stack">
            <div className="statline">
              <span>MTBF trend</span>
              <strong>+8.6%</strong>
            </div>
            <div className="statline">
              <span>MTTR trend</span>
              <strong>-11.4%</strong>
            </div>
            <div className="statline">
              <span>Alert response within SLA</span>
              <strong>{visibleAlerts.length === 0 ? "100%" : `${Math.round((visibleAlerts.filter((item) => item.status !== "Open").length / visibleAlerts.length) * 100)}%`}</strong>
            </div>
            <div className="statline">
              <span>Work orders completed on time</span>
              <strong>
                {Math.round((visibleWorkOrders.filter((item) => item.status === "Completed").length / Math.max(visibleWorkOrders.length, 1)) * 100)}%
              </strong>
            </div>
          </div>
        </SectionCard>

        <SectionCard title="Facility risk concentration" description="Compare the health posture and critical-alert density across the site network.">
          <div className="stack">
            {facilityRiskCards.map((facility) => (
              <div className="list-card" key={facility.id}>
                <div className="panel__header">
                  <div>
                    <h3>{facility.name}</h3>
                    <div className="subtle">{facilities.find((item) => item.id === facility.id)?.region}</div>
                  </div>
                  <StatusBadge value={facility.health < 60 ? "High" : facility.health < 80 ? "Elevated" : "Stable"} />
                </div>
                <div className="statline">
                  <span>Average health</span>
                  <strong>{facility.health}</strong>
                </div>
                <div className="statline">
                  <span>Critical alerts in window</span>
                  <strong>{facility.criticalCount}</strong>
                </div>
              </div>
            ))}
          </div>
        </SectionCard>
      </div>
    </>
  );
}
