import type { Equipment, IntegrationActionResult, InventoryItem, WorkOrder } from "@/lib/types";

import { getOdooIntegrationConfig } from "@/lib/integrations/config";

async function callOdoo(model: string, method: string, payload: Record<string, unknown>) {
  const config = getOdooIntegrationConfig();
  if (!config.configured) {
    if (!config.demoMode) {
      throw new Error("Odoo connector is not configured.");
    }
    return { model, method, payload, demo: true };
  }

  const response = await fetch(`${config.baseUrl}/json/2/${model}/${method}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `bearer ${config.apiKey}`,
      "X-Odoo-Database": config.database,
    },
    body: JSON.stringify(payload),
    cache: "no-store",
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(text || `Odoo request failed with ${response.status}`);
  }

  const text = await response.text();
  return text ? (JSON.parse(text) as unknown) : null;
}

export async function testOdooConnection(): Promise<IntegrationActionResult> {
  const config = getOdooIntegrationConfig();
  if (!config.configured && config.demoMode) {
    return {
      provider: "odoo",
      ok: true,
      message: "Odoo demo connector is active with seeded company and inventory responses.",
      details: { mode: "demo", companyName: "Demo Manufacturing Group" },
    };
  }

  const payload = {
    domain: [],
    fields: ["id", "name"],
    limit: 1,
  };

  const data = await callOdoo("res.company", "search_read", payload);
  const company = Array.isArray(data) && data[0] && typeof data[0] === "object" ? (data[0] as { id?: number; name?: string }) : null;

  return {
    provider: "odoo",
    ok: true,
    message: company?.name ? `Connected to Odoo company ${company.name}.` : "Connected to Odoo successfully.",
    details: company?.id ? { companyId: company.id, companyName: company.name } : undefined,
  };
}

export async function pushWorkOrderToOdoo(workOrder: WorkOrder, asset: Equipment): Promise<IntegrationActionResult> {
  const config = getOdooIntegrationConfig();
  const externalEquipmentId = config.equipmentMap[asset.id];
  const payload: Record<string, unknown> = {
    name: workOrder.title,
    description: `${workOrder.notes}\n\nSource Work Order: ${workOrder.id}\nAsset: ${asset.name}\nPriority: ${workOrder.priority}\nDue: ${workOrder.dueDate}`,
    maintenance_type: "corrective",
    request_date: workOrder.dueDate,
    x_intellimaintain_work_order_ref: workOrder.id,
  };

  if (externalEquipmentId) {
    payload.equipment_id = Number(externalEquipmentId);
  }

  if (!config.configured && config.demoMode) {
    return {
      provider: "odoo",
      ok: true,
      message: `Work order ${workOrder.id} pushed to Odoo demo maintenance queue.`,
      details: {
        mode: "demo",
        externalId: `odoo-demo-${workOrder.id}`,
        equipmentMapped: Boolean(externalEquipmentId),
      },
    };
  }

  const id = await callOdoo(config.maintenanceModel, "create", payload);
  return {
    provider: "odoo",
    ok: true,
    message: `Work order ${workOrder.id} pushed to Odoo maintenance.`,
    details: { externalId: id, equipmentMapped: Boolean(externalEquipmentId) },
  };
}

export async function pullInventoryFromOdoo(): Promise<IntegrationActionResult & { items: Array<Record<string, unknown>> }> {
  const config = getOdooIntegrationConfig();
  if (!config.configured && config.demoMode) {
    const items = [
      { id: 101, product_id: ["demo-inv-1", "Lubrication filter"], available_quantity: 8, x_intellimaintain_item_ref: "inv-1" },
      { id: 102, product_id: ["demo-inv-2", "Fan blade set"], available_quantity: 1, x_intellimaintain_item_ref: "inv-2" },
      { id: 103, product_id: ["demo-inv-3", "Bearing kit BK-42"], available_quantity: 3, x_intellimaintain_item_ref: "inv-3" },
      { id: 104, product_id: ["demo-inv-4", "Alignment shim set"], available_quantity: 6, x_intellimaintain_item_ref: "inv-4" },
    ];

    return {
      provider: "odoo",
      ok: true,
      message: `Pulled ${items.length} inventory rows from Odoo demo ERP.`,
      details: { mode: "demo", count: items.length },
      items,
    };
  }

  const data = await callOdoo(config.inventoryModel, "search_read", {
    domain: [],
    fields: ["id", "product_id", "available_quantity", "quantity", "location_id"],
    limit: 50,
  });

  const items = Array.isArray(data) ? data : [];
  return {
    provider: "odoo",
    ok: true,
    message: `Pulled ${items.length} inventory rows from Odoo.`,
    details: { count: items.length },
    items: items as Array<Record<string, unknown>>,
  };
}

export function buildOdooInventoryComparison(localItems: InventoryItem[], externalItems: Array<Record<string, unknown>>) {
  const config = getOdooIntegrationConfig();

  return localItems.map((item) => {
    const externalProductId = config.productMap[item.id];
    const matched = externalItems.find((candidate) => {
      if (candidate.x_intellimaintain_item_ref === item.id) {
        return true;
      }
      const productId = Array.isArray(candidate.product_id) ? candidate.product_id[0] : candidate.product_id;
      return externalProductId ? String(productId) === externalProductId : false;
    });

    return {
      itemId: item.id,
      partName: item.partName,
      localOnHand: item.onHand,
      externalOnHand:
        typeof matched?.available_quantity === "number"
          ? matched.available_quantity
          : typeof matched?.quantity === "number"
            ? matched.quantity
            : null,
      delta:
        typeof matched?.available_quantity === "number"
          ? Number(matched.available_quantity) - item.onHand
          : typeof matched?.quantity === "number"
            ? Number(matched.quantity) - item.onHand
            : null,
    };
  });
}
