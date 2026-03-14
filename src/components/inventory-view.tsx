"use client";

import { useState } from "react";

import { EmptyState, PageHeader, SectionCard, StatusBadge } from "@/components/ui";
import { useDemoStore } from "@/lib/demo-store";
import { getEquipmentName } from "@/lib/view-helpers";

type InventoryComparisonRow = {
  itemId: string;
  partName: string;
  localOnHand: number;
  externalOnHand: number | null;
  delta: number | null;
};

export function InventoryView() {
  const { filteredInventory, equipment, can } = useDemoStore();
  const [syncMessage, setSyncMessage] = useState<string | null>(null);
  const [comparison, setComparison] = useState<InventoryComparisonRow[]>([]);

  return (
    <>
      <PageHeader
        eyebrow="Maintenance readiness"
        title="Spare parts inventory, linked assets, and ERP comparison"
        description="Track likely stock blockers locally, then compare against live ERP quantities when the Odoo connector is configured."
        pills={[`${filteredInventory.length} tracked parts`, "Reorder threshold monitoring", "ERP pull available"]}
      />

      <SectionCard
        title="Inventory register"
        description="Each part shows stock, lead time, and the equipment families it supports."
        action={
          can("inventory:view") ? (
            <button
              className="button button--ghost"
              onClick={() => {
                setSyncMessage(null);
                void fetch("/api/integrations/odoo/inventory", { cache: "no-store" })
                  .then((response) => response.json())
                  .then((payload: { message?: string; comparison?: InventoryComparisonRow[] }) => {
                    setSyncMessage(payload.message ?? "Inventory pull completed.");
                    setComparison(payload.comparison ?? []);
                  });
              }}
              type="button"
            >
              Pull Odoo inventory
            </button>
          ) : null
        }
      >
        <table className="table">
          <thead>
            <tr>
              <th>Part</th>
              <th>SKU</th>
              <th>On hand</th>
              <th>Reorder point</th>
              <th>Lead time</th>
              <th>Linked assets</th>
            </tr>
          </thead>
          <tbody>
            {filteredInventory.map((item) => (
              <tr key={item.id}>
                <td>{item.partName}</td>
                <td>{item.sku}</td>
                <td>
                  <StatusBadge value={item.onHand <= item.reorderPoint ? "High" : "Stable"} /> {item.onHand}
                </td>
                <td>{item.reorderPoint}</td>
                <td>{item.leadTimeDays} days</td>
                <td>{item.linkedEquipmentIds.map((equipmentId) => getEquipmentName(equipmentId, equipment)).join(", ")}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </SectionCard>

      <SectionCard title="ERP comparison" description="Live Odoo pull results are compared against the local predictive-maintenance inventory model.">
        {syncMessage ? <div className="empty-state">{syncMessage}</div> : null}
        {comparison.length === 0 ? (
          <EmptyState title="No ERP comparison loaded" description="Run the Odoo inventory pull after configuring the connector environment variables." />
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>Part</th>
                <th>Local on hand</th>
                <th>ERP on hand</th>
                <th>Delta</th>
              </tr>
            </thead>
            <tbody>
              {comparison.map((row) => (
                <tr key={row.itemId}>
                  <td>{row.partName}</td>
                  <td>{row.localOnHand}</td>
                  <td>{row.externalOnHand ?? "Unmapped"}</td>
                  <td>{row.delta ?? "Unmapped"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </SectionCard>
    </>
  );
}
