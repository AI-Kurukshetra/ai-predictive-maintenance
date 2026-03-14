"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

import { EmptyState, PageHeader, SectionCard, StatusBadge } from "@/components/ui";
import { useDemoStore } from "@/lib/demo-store";
import { formatDateTime, getEquipmentName } from "@/lib/view-helpers";

export function AlertsView() {
  const {
    filteredAlerts,
    filteredEquipment,
    equipment,
    acknowledgeAlert,
    escalateAlert,
    createWorkOrderFromAlert,
    getWorkOrderByAlertId,
  } = useDemoStore();
  const [severityFilter, setSeverityFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All");
  const [equipmentFilter, setEquipmentFilter] = useState("All");

  const alerts = useMemo(
    () =>
      filteredAlerts.filter((alert) => {
        const matchesSeverity = severityFilter === "All" || alert.severity === severityFilter;
        const matchesStatus = statusFilter === "All" || alert.status === statusFilter;
        const matchesEquipment = equipmentFilter === "All" || alert.equipmentId === equipmentFilter;
        return matchesSeverity && matchesStatus && matchesEquipment;
      }),
    [equipmentFilter, filteredAlerts, severityFilter, statusFilter],
  );

  return (
    <>
      <PageHeader
        eyebrow="Alert triage"
        title="Risk alerts, recommended actions, and escalation path"
        description="Every alert carries machine context, severity, operational status, and the next step needed to prevent downtime."
        pills={[`${alerts.length} visible alerts`, "Severity and status filtering", "Action-first workflow"]}
      />

      <SectionCard
        title="Alerts center"
        description="Filter by severity, asset, and workflow state, then move directly into acknowledgement, escalation, or work-order creation."
        action={<span className="pill">{filteredEquipment.length} assets in current scope</span>}
      >
        <div className="grid grid--three" style={{ marginBottom: "1rem" }}>
          <select className="select" onChange={(event) => setSeverityFilter(event.target.value)} value={severityFilter}>
            <option value="All">All severities</option>
            <option value="Critical">Critical</option>
            <option value="High">High</option>
            <option value="Medium">Medium</option>
            <option value="Low">Low</option>
          </select>
          <select className="select" onChange={(event) => setStatusFilter(event.target.value)} value={statusFilter}>
            <option value="All">All statuses</option>
            <option value="Open">Open</option>
            <option value="Acknowledged">Acknowledged</option>
            <option value="Escalated">Escalated</option>
            <option value="Resolved">Resolved</option>
          </select>
          <select className="select" onChange={(event) => setEquipmentFilter(event.target.value)} value={equipmentFilter}>
            <option value="All">All assets</option>
            {filteredEquipment.map((asset) => (
              <option key={asset.id} value={asset.id}>
                {asset.name}
              </option>
            ))}
          </select>
        </div>

        <div className="stack">
          {alerts.length === 0 ? <EmptyState title="No alerts in scope" description="Try widening the facility or alert filters." /> : null}
          {alerts.map((alert) => {
            const linkedWorkOrder = getWorkOrderByAlertId(alert.id);

            return (
              <div className="list-card" key={alert.id}>
                <div className="panel__header">
                  <div>
                    <div className="split">
                      <StatusBadge value={alert.severity} />
                      <StatusBadge value={alert.status} />
                      {linkedWorkOrder ? <span className="pill">Work order ready</span> : null}
                    </div>
                    <h3>{alert.title}</h3>
                    <div className="subtle">{getEquipmentName(alert.equipmentId, equipment)}</div>
                  </div>
                  <div className="subtle">{formatDateTime(alert.createdAt)}</div>
                </div>
                <p className="subtle">{alert.summary}</p>
                <div className="subtle">{alert.recommendedAction}</div>
                {linkedWorkOrder ? (
                  <div className="subtle">
                    Linked work order: <strong>{linkedWorkOrder.title}</strong> ({linkedWorkOrder.status})
                  </div>
                ) : null}
                <div className="list-card__actions">
                  <button className="button button--ghost" disabled={alert.status === "Acknowledged"} onClick={() => void acknowledgeAlert(alert.id)} type="button">
                    Acknowledge
                  </button>
                  <button className="button button--ghost" disabled={alert.status === "Escalated"} onClick={() => void escalateAlert(alert.id)} type="button">
                    Escalate
                  </button>
                  {linkedWorkOrder ? (
                    <Link className="button" href="/work-orders">
                      View work order
                    </Link>
                  ) : (
                    <button className="button" disabled={alert.status === "Resolved"} onClick={() => void createWorkOrderFromAlert(alert.id)} type="button">
                      Create work order
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </SectionCard>
    </>
  );
}
