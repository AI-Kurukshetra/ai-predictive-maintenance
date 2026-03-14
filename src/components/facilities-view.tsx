"use client";

import { PageHeader, SectionCard, StatusBadge } from "@/components/ui";
import { useDemoStore } from "@/lib/demo-store";

export function FacilitiesView() {
  const { facilities, equipment, alerts, workOrders, getPredictionByEquipmentId } = useDemoStore();

  return (
    <>
      <PageHeader
        eyebrow="Site operations"
        title="Facility health and maintenance workload"
        description="Compare plants by uptime target, site lead, maintenance volume, and predicted risk concentration."
        pills={["Site-level comparison", `${facilities.length} facilities tracked`]}
      />

      <div className="grid grid--three">
        {facilities.map((facility) => {
          const facilityEquipment = equipment.filter((item) => item.facilityId === facility.id);
          const facilityAlerts = alerts.filter((item) => item.facilityId === facility.id);
          const facilityWorkOrders = workOrders.filter((item) => item.facilityId === facility.id);
          const health =
            facilityEquipment.reduce((sum, item) => sum + getPredictionByEquipmentId(item.id).healthScore, 0) /
            Math.max(facilityEquipment.length, 1);

          return (
            <SectionCard
              key={facility.id}
              title={facility.name}
              description={`${facility.region} - site lead ${facility.siteLead}`}
              action={<StatusBadge value={health < 60 ? "High" : health < 80 ? "Elevated" : "Stable"} />}
            >
              <div className="stack">
                <div className="statline">
                  <span>Lines</span>
                  <strong>{facility.lines}</strong>
                </div>
                <div className="statline">
                  <span>Uptime target</span>
                  <strong>{facility.uptimeTarget}%</strong>
                </div>
                <div className="statline">
                  <span>Monitored assets</span>
                  <strong>{facilityEquipment.length}</strong>
                </div>
                <div className="statline">
                  <span>Active alerts</span>
                  <strong>{facilityAlerts.length}</strong>
                </div>
                <div className="statline">
                  <span>Work order load</span>
                  <strong>{facilityWorkOrders.length}</strong>
                </div>
              </div>
            </SectionCard>
          );
        })}
      </div>
    </>
  );
}
