"use client";

import { useState } from "react";
import Link from "next/link";

import { PageHeader, SectionCard, StatusBadge } from "@/components/ui";
import { useDemoStore } from "@/lib/demo-store";
import { formatIsoDate, getFacilityName } from "@/lib/view-helpers";

export function EquipmentListView() {
  const { filteredEquipment, facilities, getPredictionByEquipmentId } = useDemoStore();
  const [query, setQuery] = useState("");

  const rows = filteredEquipment
    .filter((item) => item.name.toLowerCase().includes(query.toLowerCase()) || item.type.toLowerCase().includes(query.toLowerCase()))
    .map((item) => ({ equipment: item, prediction: getPredictionByEquipmentId(item.id) }))
    .sort((left, right) => left.prediction.healthScore - right.prediction.healthScore);

  return (
    <>
      <PageHeader
        eyebrow="Asset intelligence"
        title="Equipment registry and health ranking"
        description="Browse the monitored fleet by risk, facility, and equipment type with direct drill-down into asset behavior."
        pills={["Health-ranked view", `${rows.length} visible assets`]}
      />

      <SectionCard
        title="Asset register"
        description="Use the search to isolate a machine family or line while keeping risk and health context visible."
        action={<input className="input" onChange={(event) => setQuery(event.target.value)} placeholder="Search by asset or type" value={query} />}
      >
        <table className="table">
          <thead>
            <tr>
              <th>Asset</th>
              <th>Facility</th>
              <th>Type</th>
              <th>Health</th>
              <th>Risk</th>
              <th>Predicted window</th>
              <th>Last maintenance</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.equipment.id}>
                <td>
                  <Link href={`/equipment/${row.equipment.id}`}>{row.equipment.name}</Link>
                </td>
                <td>{getFacilityName(row.equipment.facilityId, facilities)}</td>
                <td>{row.equipment.type}</td>
                <td>{row.prediction.healthScore}</td>
                <td>
                  <StatusBadge value={row.prediction.riskLevel} />
                </td>
                <td>{row.prediction.predictedFailureWindow}</td>
                <td>{formatIsoDate(row.equipment.lastMaintenanceAt)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </SectionCard>
    </>
  );
}
