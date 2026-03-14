"use client";

import { EmptyState, PageHeader, SectionCard, StatusBadge } from "@/components/ui";
import { useDemoStore } from "@/lib/demo-store";
import { getEquipmentName, toDateInputValue } from "@/lib/view-helpers";

export function ScheduleView() {
  const { filteredWorkOrders, equipment, editWorkOrder } = useDemoStore();
  const grouped = Array.from(
    filteredWorkOrders.reduce((map, order) => {
      const current = map.get(order.dueDate) ?? [];
      current.push(order);
      map.set(order.dueDate, current);
      return map;
    }, new Map<string, typeof filteredWorkOrders>()),
  ).sort(([left], [right]) => left.localeCompare(right));

  return (
    <>
      <PageHeader
        eyebrow="Maintenance planning"
        title="Maintenance due dates, rescheduling, and execution windows"
        description="Use the due-date grouping to coordinate interventions with production, then reschedule work without leaving the planning view."
        pills={["Calendar-style grouping", `${filteredWorkOrders.length} due work orders`, "Rescheduling enabled"]}
      />

      <SectionCard title="Due work calendar" description="Grouped by due date so planners can move work across execution windows quickly.">
        <div className="stack">
          {grouped.length === 0 ? <EmptyState title="No due work" description="Create or schedule a work order to populate the calendar." /> : null}
          {grouped.map(([date, orders]) => (
            <div className="list-card" key={date}>
              <div className="panel__header">
                <div>
                  <h3>{date}</h3>
                  <div className="subtle">{orders.length} work orders due</div>
                </div>
              </div>
              <div className="stack">
                {orders.map((order) => (
                  <form
                    className="list-card"
                    key={order.id}
                    onSubmit={(event) => {
                      event.preventDefault();
                      const form = new FormData(event.currentTarget);
                      void editWorkOrder(order.id, {
                        dueDate: String(form.get("dueDate") ?? order.dueDate),
                        assignee: String(form.get("assignee") ?? order.assignee),
                      });
                    }}
                  >
                    <div className="panel__header">
                      <div>
                        <h3>{order.title}</h3>
                        <div className="subtle">{getEquipmentName(order.equipmentId, equipment)}</div>
                      </div>
                      <StatusBadge value={order.status} />
                    </div>
                    <div className="grid grid--three">
                      <input className="input" defaultValue={order.assignee} name="assignee" />
                      <input className="input" defaultValue={toDateInputValue(order.dueDate)} name="dueDate" type="date" />
                      <button className="button button--ghost" type="submit">
                        Reschedule
                      </button>
                    </div>
                  </form>
                ))}
              </div>
            </div>
          ))}
        </div>
      </SectionCard>
    </>
  );
}
