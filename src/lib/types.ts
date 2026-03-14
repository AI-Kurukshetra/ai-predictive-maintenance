export type RiskLevel = "Critical" | "High" | "Elevated" | "Stable";
export type AlertSeverity = "Critical" | "High" | "Medium" | "Low";
export type AlertStatus = "Open" | "Acknowledged" | "Escalated" | "Resolved";
export type WorkOrderStatus = "Open" | "Scheduled" | "In Progress" | "Completed";
export type EquipmentCriticality = "Tier 1" | "Tier 2" | "Tier 3";

export type Facility = {
  id: string;
  name: string;
  region: string;
  timezone: string;
  lines: number;
  uptimeTarget: number;
  siteLead: string;
};

export type Equipment = {
  id: string;
  name: string;
  facilityId: string;
  type: string;
  model: string;
  line: string;
  criticality: EquipmentCriticality;
  installDate: string;
  lastMaintenanceAt: string;
  baselineOee: number;
  baselinePowerKw: number;
  sensors: string[];
};

export type TelemetryPoint = {
  timestamp: string;
  vibration: number;
  temperature: number;
  acoustic: number;
  pressure: number;
  runtimeHours: number;
};

export type EquipmentTelemetry = {
  equipmentId: string;
  points: TelemetryPoint[];
};

export type Alert = {
  id: string;
  equipmentId: string;
  facilityId: string;
  severity: AlertSeverity;
  title: string;
  summary: string;
  status: AlertStatus;
  recommendedAction: string;
  createdAt: string;
};

export type WorkOrder = {
  id: string;
  equipmentId: string;
  facilityId: string;
  sourceAlertId?: string;
  title: string;
  assignee: string;
  dueDate: string;
  priority: AlertSeverity;
  status: WorkOrderStatus;
  notes: string;
  partsRequired: string[];
};

export type InventoryItem = {
  id: string;
  facilityId: string;
  partName: string;
  sku: string;
  onHand: number;
  reorderPoint: number;
  linkedEquipmentIds: string[];
  leadTimeDays: number;
};

export type EquipmentDocument = {
  id: string;
  equipmentId: string;
  title: string;
  category: "Manual" | "Procedure" | "History";
  updatedAt: string;
};

export type UserProfile = {
  id: string;
  name: string;
  email: string;
  role: "Maintenance Manager" | "Reliability Engineer" | "Plant Director" | "Technician";
  facilityId: string;
  permissions: string[];
};

export type SensorConfiguration = {
  id: string;
  facilityId: string;
  sensorType: string;
  coverage: number;
  lastCalibratedAt: string;
  gatewayStatus: "Healthy" | "Needs Attention";
};

export type PredictionSnapshot = {
  equipmentId: string;
  healthScore: number;
  riskLevel: RiskLevel;
  anomalyCount: number;
  predictedFailureWindow: string;
  uptimeProjection: number;
  energyDeltaPercent: number;
  latest: TelemetryPoint;
  previous: TelemetryPoint;
  recommendedAction: string;
};

export type TelemetryIngestPayload = {
  equipmentId: string;
  timestamp: string;
  vibration: number;
  temperature: number;
  acoustic: number;
  pressure: number;
  runtimeHours: number;
};

export type TelemetryIngestResult = {
  point: TelemetryPoint;
  prediction: PredictionSnapshot;
  alert?: Alert;
};

export type IntegrationProvider = "odoo" | "fracttal";
export type IntegrationCategory = "ERP" | "CMMS";
export type IntegrationConnectionStatus = "Configured" | "Missing Credentials" | "Connected" | "Demo" | "Error";

export type IntegrationSummary = {
  provider: IntegrationProvider;
  label: string;
  category: IntegrationCategory;
  configured: boolean;
  status: IntegrationConnectionStatus;
  capabilities: string[];
  details: string;
};

export type IntegrationActionResult = {
  provider: IntegrationProvider;
  ok: boolean;
  message: string;
  details?: Record<string, unknown>;
};

export type DemoState = {
  activeFacilityId: string;
  alerts: Alert[];
  workOrders: WorkOrder[];
  inventory: InventoryItem[];
};

export type RuntimeMode = "demo" | "supabase";

export type SessionUser = {
  id: string;
  name: string;
  email: string;
  role: UserProfile["role"];
  facilityId: string;
  permissions: string[];
};

export type BootstrapPayload = {
  mode: RuntimeMode;
  currentUser: SessionUser | null;
  facilities: Facility[];
  equipment: Equipment[];
  telemetry: EquipmentTelemetry[];
  alerts: Alert[];
  workOrders: WorkOrder[];
  inventory: InventoryItem[];
  documents: EquipmentDocument[];
  users: UserProfile[];
  sensorConfigurations: SensorConfiguration[];
};
