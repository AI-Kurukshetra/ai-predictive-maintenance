import crypto from "node:crypto";

import type { Equipment, IntegrationActionResult, WorkOrder } from "@/lib/types";

import { getFracttalIntegrationConfig } from "@/lib/integrations/config";

function buildHawkHeader(url: URL, method: string, payload?: string) {
  const config = getFracttalIntegrationConfig();
  const ts = Math.floor(Date.now() / 1000).toString();
  const nonce = crypto.randomBytes(4).toString("hex");
  const port = url.port || (url.protocol === "https:" ? "443" : "80");
  const hash = payload
    ? crypto.createHash("sha256").update(`hawk.1.payload\napplication/json\n${payload}\n`).digest("base64")
    : undefined;

  const normalized = [
    "hawk.1.header",
    ts,
    nonce,
    method.toUpperCase(),
    url.pathname + url.search,
    url.hostname,
    port,
    hash ?? "",
    "",
    "",
  ].join("\n");

  const mac = crypto.createHmac("sha256", config.apiSecret).update(`${normalized}\n`).digest("base64");
  const parts = [`id="${config.apiKey}"`, `ts="${ts}"`, `nonce="${nonce}"`, `mac="${mac}"`];
  if (hash) {
    parts.splice(3, 0, `hash="${hash}"`);
  }
  return `Hawk ${parts.join(", ")}`;
}

async function callFracttal(path: string, method: "GET" | "POST", body?: Record<string, unknown>) {
  const config = getFracttalIntegrationConfig();
  if (!config.configured) {
    if (!config.demoMode) {
      throw new Error("Fracttal connector is not configured.");
    }
    return { path, method, body, demo: true };
  }

  const url = new URL(path, config.baseUrl);
  const payload = body ? JSON.stringify(body) : undefined;
  const headers: HeadersInit = {
    "Content-Type": "application/json",
  };

  if (config.authMode === "bearer") {
    headers.Authorization = `Bearer ${config.apiKey}`;
  } else {
    headers.Authorization = buildHawkHeader(url, method, payload);
  }

  const response = await fetch(url, {
    method,
    headers,
    body: payload,
    cache: "no-store",
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(text || `Fracttal request failed with ${response.status}`);
  }

  const text = await response.text();
  return text ? (JSON.parse(text) as unknown) : null;
}

function mapPriority(priority: WorkOrder["priority"]) {
  switch (priority) {
    case "Critical":
      return "critical";
    case "High":
      return "high";
    case "Medium":
      return "medium";
    default:
      return "low";
  }
}

function mapStatus(status: WorkOrder["status"]) {
  switch (status) {
    case "Completed":
      return "done";
    case "In Progress":
      return "in_progress";
    case "Scheduled":
      return "scheduled";
    default:
      return "open";
  }
}

export async function testFracttalConnection(): Promise<IntegrationActionResult> {
  const config = getFracttalIntegrationConfig();
  if (!config.configured && config.demoMode) {
    return {
      provider: "fracttal",
      ok: true,
      message: "Fracttal demo connector is active with seeded work-order responses.",
      details: { mode: "demo", resultCount: 1 },
    };
  }
  const data = await callFracttal(config.testEndpoint, "GET");
  const count = Array.isArray(data)
    ? data.length
    : data && typeof data === "object" && "results" in data && Array.isArray((data as { results?: unknown[] }).results)
      ? (data as { results: unknown[] }).results.length
      : undefined;

  return {
    provider: "fracttal",
    ok: true,
    message: typeof count === "number" ? `Connected to Fracttal and fetched ${count} records.` : "Connected to Fracttal successfully.",
    details: typeof count === "number" ? { resultCount: count } : undefined,
  };
}

export async function pushWorkOrderToFracttal(workOrder: WorkOrder, asset: Equipment): Promise<IntegrationActionResult> {
  const config = getFracttalIntegrationConfig();
  const assetId = config.assetMap[asset.id];
  const payload: Record<string, unknown> = {
    code: workOrder.id,
    title: workOrder.title,
    description: workOrder.notes,
    priority: mapPriority(workOrder.priority),
    status: mapStatus(workOrder.status),
    due_date: workOrder.dueDate,
    source: "IntelliMaintain Pro",
    external_id: workOrder.id,
  };

  if (assetId) {
    payload.asset = assetId;
  }

  if (!config.configured && config.demoMode) {
    return {
      provider: "fracttal",
      ok: true,
      message: `Work order ${workOrder.id} pushed to Fracttal demo CMMS.`,
      details: {
        mode: "demo",
        externalId: `fracttal-demo-${workOrder.id}`,
        assetMapped: Boolean(assetId),
      },
    };
  }

  const data = await callFracttal(config.workOrderEndpoint, "POST", payload);
  return {
    provider: "fracttal",
    ok: true,
    message: `Work order ${workOrder.id} pushed to Fracttal.`,
    details: data && typeof data === "object" ? (data as Record<string, unknown>) : { assetMapped: Boolean(assetId) },
  };
}
