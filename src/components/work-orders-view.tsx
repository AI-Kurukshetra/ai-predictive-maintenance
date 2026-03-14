"use client";

import { useMemo, useState } from "react";

import { EmptyState, PageHeader, SectionCard, StatusBadge } from "@/components/ui";
import { useDemoStore } from "@/lib/demo-store";
import type { WorkOrderStatus } from "@/lib/types";
import { getEquipmentName, toDateInputValue } from "@/lib/view-helpers";

const statuses: WorkOrderStatus[] = ["Open", "Scheduled", "In Progress", "Completed"];

export function WorkOrdersView() {
  const { filteredWorkOrders, filteredEquipment, equipment, createWorkOrder, editWorkOrder, updateWorkOrderStatus, can } = useDemoStore();
  const [equipmentId, setEquipmentId] = useState(filteredEquipment[0]?.id ?? "");
  const [title, setTitle] = useState("");
  const [assignee, setAssignee] = useState("");
  const [dueDate, setDueDate] = useState("2026-03-16");
  const [priority, setPriority] = useState<"Critical" | "High" | "Medium" | "Low">("High");
  const [notes, setNotes] = useState("");
  const [partsRequired, setPartsRequired] = useState("");
  const [syncMessage, setSyncMessage] = useState<string | null>(null);
  const selectedEquipmentId = equipmentId || filteredEquipment[0]?.id || "";

  const laneMap = useMemo(
    () =>
      statuses.map((status) => ({
        status,
        orders: filteredWorkOrders.filter((item) => item.status === status),
      })),
    [filteredWorkOrders],
  );

  return (
    <>
      <PageHeader
        eyebrow="Maintenance execution"
        title="Work order board, edits, and direct creation"
        description="Convert risk into planned maintenance work, update owners and due dates, and move execution through a controlled board."
        pills={[`${filteredWorkOrders.length} work orders in scope`, "Manual creation enabled", "Inline editing"]}
      />

      {can("workorders:create") ? (
        <SectionCard title="Create work order" description="Use this when planners need to create work directly without starting from an alert.">
          <form
            className="stack"
            onSubmit={(event) => {
              event.preventDefault();
              void createWorkOrder({
                equipmentId: selectedEquipmentId,
                title,
                assignee,
                dueDate,
                priority,
                notes,
                partsRequired: partsRequired
                  .split(",")
                  .map((item) => item.trim())
                  .filter(Boolean),
              }).then(() => {
                setTitle("");
                setAssignee("");
                setNotes("");
                setPartsRequired("");
              });
            }}
          >
            <div className="grid grid--three">
              <select className="select" onChange={(event) => setEquipmentId(event.target.value)} value={selectedEquipmentId}>
                {filteredEquipment.map((asset) => (
                  <option key={asset.id} value={asset.id}>
                    {asset.name}
                  </option>
                ))}
              </select>
              <input className="input" onChange={(event) => setTitle(event.target.value)} placeholder="Work order title" required value={title} />
              <input className="input" onChange={(event) => setAssignee(event.target.value)} placeholder="Assignee" value={assignee} />
            </div>
            <div className="grid grid--three">
              <input className="input" onChange={(event) => setDueDate(event.target.value)} required type="date" value={dueDate} />
              <select className="select" onChange={(event) => setPriority(event.target.value as typeof priority)} value={priority}>
                <option value="Critical">Critical</option>
                <option value="High">High</option>
                <option value="Medium">Medium</option>
                <option value="Low">Low</option>
              </select>
              <input className="input" onChange={(event) => setPartsRequired(event.target.value)} placeholder="Parts, comma-separated" value={partsRequired} />
            </div>
            <textarea className="input" onChange={(event) => setNotes(event.target.value)} placeholder="Execution notes and checklist" rows={3} value={notes} />
            <button className="button" disabled={!selectedEquipmentId || !title.trim()} type="submit">
              Create work order
            </button>
          </form>
        </SectionCard>
      ) : null}

      <div className="grid grid--two">
        {laneMap.map(({ status, orders }) => (
          <SectionCard key={status} title={status} description={`${orders.length} work orders`}>
            <div className="stack">
              {orders.length === 0 ? <EmptyState title={`No ${status.toLowerCase()} work`} description="This lane is currently clear." /> : null}
              {orders.map((order) => (
                <div className="list-card" key={order.id}>
                  <div className="panel__header">
                    <div>
                      <StatusBadge value={order.priority} />
                      <h3>{order.title}</h3>
                      <div className="subtle">{getEquipmentName(order.equipmentId, equipment)}</div>
                    </div>
                    <StatusBadge value={order.status} />
                  </div>

                  <form
                    className="stack"
                    onSubmit={(event) => {
                      event.preventDefault();
                      const form = new FormData(event.currentTarget);
                      void editWorkOrder(order.id, {
                        assignee: String(form.get("assignee") ?? order.assignee),
                        dueDate: String(form.get("dueDate") ?? order.dueDate),
                        priority: String(form.get("priority") ?? order.priority) as typeof order.priority,
                        notes: String(form.get("notes") ?? order.notes),
                        partsRequired: String(form.get("partsRequired") ?? "")
                          .split(",")
                          .map((item) => item.trim())
                          .filter(Boolean),
                      });
                    }}
                  >
                    <div className="grid grid--three">
                      <input className="input" defaultValue={order.assignee} name="assignee" />
                      <input className="input" defaultValue={toDateInputValue(order.dueDate)} name="dueDate" type="date" />
                      <select className="select" defaultValue={order.priority} name="priority">
                        <option value="Critical">Critical</option>
                        <option value="High">High</option>
                        <option value="Medium">Medium</option>
                        <option value="Low">Low</option>
                      </select>
                    </div>
                    <textarea className="input" defaultValue={order.notes} name="notes" rows={3} />
                    <input className="input" defaultValue={order.partsRequired.join(", ")} name="partsRequired" />
                    <div className="list-card__actions">
                      <button className="button button--ghost" type="submit">
                        Save details
                      </button>
                      <button
                        className="button button--ghost"
                        onClick={() => {
                          setSyncMessage(null);
                          void fetch(`/api/integrations/odoo/sync/work-orders/${order.id}`, { method: "POST" })
                            .then((response) => response.json())
                            .then((payload: { message?: string }) => {
                              setSyncMessage(payload.message ?? `Work order ${order.id} synced to Odoo.`);
                            });
                        }}
                        type="button"
                      >
                        Push to Odoo
                      </button>
                      <button
                        className="button button--ghost"
                        onClick={() => {
                          setSyncMessage(null);
                          void fetch(`/api/integrations/fracttal/sync/work-orders/${order.id}`, { method: "POST" })
                            .then((response) => response.json())
                            .then((payload: { message?: string }) => {
                              setSyncMessage(payload.message ?? `Work order ${order.id} synced to Fracttal.`);
                            });
                        }}
                        type="button"
                      >
                        Push to Fracttal
                      </button>
                      {statuses.map((nextStatus) => (
                        <button
                          className="button button--ghost"
                          disabled={nextStatus === order.status}
                          key={nextStatus}
                          onClick={() => void updateWorkOrderStatus(order.id, nextStatus)}
                          type="button"
                        >
                          Mark {nextStatus}
                        </button>
                      ))}
                    </div>
                  </form>
                </div>
              ))}
            </div>
          </SectionCard>
        ))}
      </div>
      {syncMessage ? <div className="empty-state">{syncMessage}</div> : null}
    </>
  );
}
