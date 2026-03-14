import type { SessionUser, UserProfile } from "@/lib/types";

export const rolePermissions: Record<UserProfile["role"], string[]> = {
  "Maintenance Manager": [
    "dashboard:view",
    "equipment:view",
    "alerts:triage",
    "workorders:create",
    "workorders:update",
    "schedule:view",
    "inventory:view",
    "reports:view",
    "facilities:view",
    "settings:manage",
  ],
  "Reliability Engineer": [
    "dashboard:view",
    "equipment:view",
    "alerts:triage",
    "workorders:update",
    "reports:view",
    "facilities:view",
  ],
  "Plant Director": [
    "dashboard:view",
    "equipment:view",
    "reports:view",
    "facilities:view",
    "inventory:view",
    "settings:manage",
  ],
  Technician: [
    "dashboard:view",
    "equipment:view",
    "workorders:update",
    "inventory:view",
    "documents:view",
  ],
};

const routePermissionPairs: Array<[string, string]> = [
  ["/alerts", "alerts:triage"],
  ["/work-orders", "workorders:update"],
  ["/schedule", "schedule:view"],
  ["/inventory", "inventory:view"],
  ["/reports", "reports:view"],
  ["/facilities", "facilities:view"],
];

export function hasPermission(user: SessionUser | null, permission: string) {
  if (!user) return false;
  return user.permissions.includes(permission);
}

export function getRoutePermission(pathname: string) {
  return routePermissionPairs.find(([prefix]) => pathname.startsWith(prefix))?.[1] ?? null;
}
