import { getIntegrationSummaries } from "@/lib/integrations/config";
import { buildOdooInventoryComparison, pullInventoryFromOdoo, pushWorkOrderToOdoo, testOdooConnection } from "@/lib/integrations/odoo";
import { pushWorkOrderToFracttal, testFracttalConnection } from "@/lib/integrations/fracttal";
import type { Equipment, IntegrationActionResult, IntegrationProvider, InventoryItem, WorkOrder } from "@/lib/types";

export function listIntegrations() {
  return getIntegrationSummaries();
}

export async function testIntegration(provider: IntegrationProvider): Promise<IntegrationActionResult> {
  switch (provider) {
    case "odoo":
      return testOdooConnection();
    case "fracttal":
      return testFracttalConnection();
  }
}

export async function syncWorkOrderToProvider(provider: IntegrationProvider, workOrder: WorkOrder, asset: Equipment) {
  switch (provider) {
    case "odoo":
      return pushWorkOrderToOdoo(workOrder, asset);
    case "fracttal":
      return pushWorkOrderToFracttal(workOrder, asset);
  }
}

export async function pullInventoryComparison(provider: IntegrationProvider, localItems: InventoryItem[]) {
  if (provider !== "odoo") {
    throw new Error("Inventory pull is only available for the Odoo ERP connector.");
  }

  const result = await pullInventoryFromOdoo();
  return {
    ...result,
    comparison: buildOdooInventoryComparison(localItems, result.items),
  };
}
