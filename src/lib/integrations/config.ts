import type { IntegrationSummary } from "@/lib/types";

function parseJsonMap(value: string | undefined) {
  if (!value) {
    return {};
  }

  try {
    const parsed = JSON.parse(value) as Record<string, string>;
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

function normalizeUrl(value: string | undefined) {
  return (value ?? "").trim().replace(/\/+$/, "");
}

export function isIntegrationDemoModeEnabled() {
  return (process.env.INTEGRATIONS_DEMO_MODE ?? "true").trim().toLowerCase() !== "false";
}

export function getOdooIntegrationConfig() {
  const baseUrl = normalizeUrl(process.env.ODOO_BASE_URL);
  const database = (process.env.ODOO_DATABASE ?? "").trim();
  const apiKey = (process.env.ODOO_API_KEY ?? "").trim();
  const maintenanceModel = (process.env.ODOO_MAINTENANCE_MODEL ?? "maintenance.request").trim();
  const inventoryModel = (process.env.ODOO_INVENTORY_MODEL ?? "stock.quant").trim();
  const equipmentMap = parseJsonMap(process.env.ODOO_EQUIPMENT_ID_MAP_JSON);
  const productMap = parseJsonMap(process.env.ODOO_PRODUCT_ID_MAP_JSON);

  return {
    baseUrl,
    database,
    apiKey,
    maintenanceModel,
    inventoryModel,
    equipmentMap,
    productMap,
    demoMode: isIntegrationDemoModeEnabled(),
    configured: Boolean(baseUrl && database && apiKey),
  };
}

export function getFracttalIntegrationConfig() {
  const baseUrl = normalizeUrl(process.env.FRACTTAL_BASE_URL || "https://api.fracttal.com");
  const apiKey = (process.env.FRACTTAL_API_KEY ?? "").trim();
  const apiSecret = (process.env.FRACTTAL_API_SECRET ?? "").trim();
  const authMode = (process.env.FRACTTAL_AUTH_MODE ?? "hawk").trim().toLowerCase() === "bearer" ? "bearer" : "hawk";
  const workOrderEndpoint = (process.env.FRACTTAL_WORK_ORDER_ENDPOINT ?? "/api/v2/work-orders/").trim();
  const testEndpoint = (process.env.FRACTTAL_TEST_ENDPOINT ?? "/api/v2/work-orders/?limit=1").trim();
  const assetMap = parseJsonMap(process.env.FRACTTAL_ASSET_ID_MAP_JSON);

  return {
    baseUrl,
    apiKey,
    apiSecret,
    authMode,
    workOrderEndpoint,
    testEndpoint,
    assetMap,
    demoMode: isIntegrationDemoModeEnabled(),
    configured: Boolean(baseUrl && apiKey && (authMode === "bearer" || apiSecret)),
  };
}

export function getIntegrationSummaries(): IntegrationSummary[] {
  const odoo = getOdooIntegrationConfig();
  const fracttal = getFracttalIntegrationConfig();

  return [
    {
      provider: "odoo",
      label: "Odoo ERP / Maintenance",
      category: "ERP",
      configured: odoo.configured || odoo.demoMode,
      status: odoo.configured ? "Configured" : odoo.demoMode ? "Demo" : "Missing Credentials",
      capabilities: ["Connection test", "Inventory pull", "Maintenance request push"],
      details: odoo.configured
        ? `Connected through ${odoo.baseUrl} using ${odoo.inventoryModel} and ${odoo.maintenanceModel} models.`
        : odoo.demoMode
          ? "Running in seeded demo mode. Add ODOO_BASE_URL, ODOO_DATABASE, and ODOO_API_KEY for live ERP and maintenance syncs."
          : "Set ODOO_BASE_URL, ODOO_DATABASE, and ODOO_API_KEY to enable live ERP and maintenance syncs.",
    },
    {
      provider: "fracttal",
      label: "Fracttal CMMS",
      category: "CMMS",
      configured: fracttal.configured || fracttal.demoMode,
      status: fracttal.configured ? "Configured" : fracttal.demoMode ? "Demo" : "Missing Credentials",
      capabilities: ["Connection test", "Work order push"],
      details: fracttal.configured
        ? `Connected through ${fracttal.baseUrl}${fracttal.workOrderEndpoint} using ${fracttal.authMode.toUpperCase()} authentication.`
        : fracttal.demoMode
          ? "Running in seeded demo mode. Add FRACTTAL_API_KEY and FRACTTAL_API_SECRET to enable live CMMS work-order syncs."
          : "Set FRACTTAL_API_KEY and FRACTTAL_API_SECRET to enable live CMMS work-order syncs.",
    },
  ];
}
