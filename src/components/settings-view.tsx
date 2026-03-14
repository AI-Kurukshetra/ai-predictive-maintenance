"use client";

import { useEffect, useState } from "react";

import { EmptyState, PageHeader, SectionCard, StatusBadge } from "@/components/ui";
import { useDemoStore } from "@/lib/demo-store";
import { getFacilityName } from "@/lib/view-helpers";
import type { IntegrationActionResult, IntegrationSummary, UserProfile } from "@/lib/types";

export function SettingsView() {
  const {
    currentUser,
    facilities,
    filteredEquipment,
    users,
    sensorConfigurations,
    updateProfile,
    updateManagedUser,
    updateFacility,
    updateSensorConfiguration,
    ingestTelemetry,
    logout,
    can,
    mode,
  } = useDemoStore();
  const [name, setName] = useState("");
  const [facilityId, setFacilityId] = useState("");
  const [role, setRole] = useState<"" | UserProfile["role"]>("");
  const [message, setMessage] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const [telemetryEquipmentId, setTelemetryEquipmentId] = useState("");
  const [telemetryMessage, setTelemetryMessage] = useState<string | null>(null);
  const [integrations, setIntegrations] = useState<IntegrationSummary[]>([]);
  const [integrationMessage, setIntegrationMessage] = useState<string | null>(null);

  useEffect(() => {
    let ignore = false;
    void fetch("/api/integrations", { cache: "no-store" })
      .then(async (response) => {
        if (!response.ok) {
          return;
        }
        const payload = (await response.json()) as { integrations: IntegrationSummary[] };
        if (!ignore) {
          setIntegrations(payload.integrations);
        }
      })
      .catch(() => undefined);

    return () => {
      ignore = true;
    };
  }, []);

  if (!currentUser) {
    return <EmptyState title="No active session" description="Sign in to manage your profile and platform preferences." />;
  }

  const selectedFacilityId = facilityId || currentUser.facilityId;
  const selectedRole = role || currentUser.role;
  const selectedTelemetryEquipmentId = telemetryEquipmentId || filteredEquipment[0]?.id || "";

  return (
    <>
      <PageHeader
        eyebrow="Account and platform"
        title="Profile management, access, configuration, and live ingestion"
        description="Manage your session identity, edit platform operations data, and push fresh telemetry into the reliability model without leaving IntelliMaintain."
        pills={[mode === "supabase" ? "Live profile persistence" : "Demo profile persistence", currentUser.role]}
      />

      <div className="grid grid--two">
        <SectionCard title="My profile" description="This profile is used for the authenticated session, assignment defaults, and facility scope.">
          <form
            className="stack"
            onSubmit={(event) => {
              event.preventDefault();
              setSaving(true);
              setMessage(null);
              void updateProfile({
                name: name || currentUser.name,
                facilityId: selectedFacilityId,
                role: can("settings:manage") ? selectedRole : undefined,
              })
                .then(() => {
                  setMessage("Profile updated successfully.");
                })
                .finally(() => {
                  setSaving(false);
                });
            }}
          >
            <div className="statline">
              <span>Email</span>
              <strong>{currentUser.email}</strong>
            </div>
            <input className="input" onChange={(event) => setName(event.target.value)} placeholder="Full name" value={name || currentUser.name} />
            <select className="select" onChange={(event) => setFacilityId(event.target.value)} value={selectedFacilityId}>
              {facilities.map((facility) => (
                <option key={facility.id} value={facility.id}>
                  {facility.name}
                </option>
              ))}
            </select>
            <select
              className="select"
              disabled={!can("settings:manage")}
              onChange={(event) => setRole(event.target.value as "" | UserProfile["role"])}
              value={selectedRole}
            >
              <option value="Maintenance Manager">Maintenance Manager</option>
              <option value="Reliability Engineer">Reliability Engineer</option>
              <option value="Plant Director">Plant Director</option>
              <option value="Technician">Technician</option>
            </select>
            <div className="subtle">
              {can("settings:manage")
                ? "Admin users can update role and scope directly."
                : "Role changes stay admin-managed. You can update your name and default facility."}
            </div>
            <button className="button" disabled={saving} type="submit">
              {saving ? "Saving profile..." : "Save profile"}
            </button>
            {message ? <div className="empty-state">{message}</div> : null}
          </form>
        </SectionCard>

        <SectionCard title="Session and security" description="Quick access to account identity, mode, permissions, and a clean sign-out path.">
          <div className="stack">
            <div className="list-card">
              <div className="panel__header">
                <div>
                  <h3>{currentUser.name}</h3>
                  <div className="subtle">{currentUser.email}</div>
                </div>
                <StatusBadge value={mode === "supabase" ? "Healthy" : "Elevated"} />
              </div>
              <div className="statline">
                <span>Role</span>
                <strong>{currentUser.role}</strong>
              </div>
              <div className="statline">
                <span>Facility scope</span>
                <strong>{getFacilityName(currentUser.facilityId, facilities)}</strong>
              </div>
              <div className="statline">
                <span>Session mode</span>
                <strong>{mode}</strong>
              </div>
            </div>

            <div className="list-card">
              <h3>Permissions</h3>
              <div className="split">
                {currentUser.permissions.map((permission) => (
                  <span className="pill" key={permission}>
                    {permission}
                  </span>
                ))}
              </div>
            </div>

            <button
              className="button button--ghost"
              disabled={signingOut}
              onClick={() => {
                setSigningOut(true);
                void logout()
                  .then(() => {
                    window.location.assign("/login");
                  })
                  .finally(() => {
                    setSigningOut(false);
                  });
              }}
              type="button"
            >
              {signingOut ? "Signing out..." : "Sign out of this session"}
            </button>
          </div>
        </SectionCard>
      </div>

      <SectionCard title="Telemetry ingestion lab" description="Inject fresh readings into the prediction engine to simulate live gateway traffic and watch the platform respond.">
        <form
          className="stack"
          onSubmit={(event) => {
            event.preventDefault();
            const form = new FormData(event.currentTarget);
            const timestamp = new Date().toISOString();
            void ingestTelemetry({
              equipmentId: selectedTelemetryEquipmentId,
              timestamp,
              vibration: Number(form.get("vibration")),
              temperature: Number(form.get("temperature")),
              acoustic: Number(form.get("acoustic")),
              pressure: Number(form.get("pressure")),
              runtimeHours: Number(form.get("runtimeHours")),
            }).then((result) => {
              setTelemetryMessage(
                `${result.prediction.riskLevel} risk. Health ${result.prediction.healthScore}. ${result.alert ? "A live alert was opened." : "No new alert was required."}`,
              );
            });
          }}
        >
          <div className="grid grid--three">
            <select className="select" onChange={(event) => setTelemetryEquipmentId(event.target.value)} value={selectedTelemetryEquipmentId}>
              {filteredEquipment.map((asset) => (
                <option key={asset.id} value={asset.id}>
                  {asset.name}
                </option>
              ))}
            </select>
            <input className="input" defaultValue="4.9" min="0" name="vibration" step="0.1" type="number" />
            <input className="input" defaultValue="84" min="0" name="temperature" step="0.1" type="number" />
          </div>
          <div className="grid grid--three">
            <input className="input" defaultValue="63" min="0" name="acoustic" step="0.1" type="number" />
            <input className="input" defaultValue="104" min="0" name="pressure" step="0.1" type="number" />
            <input className="input" defaultValue="480" min="0" name="runtimeHours" step="1" type="number" />
          </div>
          <button className="button" disabled={!selectedTelemetryEquipmentId} type="submit">
            Push telemetry snapshot
          </button>
          {telemetryMessage ? <div className="empty-state">{telemetryMessage}</div> : null}
        </form>
      </SectionCard>

      {can("settings:manage") ? (
        <>
          <div className="grid grid--two">
            <SectionCard title="User roles and access" description="Edit persona, facility alignment, and effective permission coverage.">
              <div className="stack">
                {users.map((user) => (
                  <form
                    className="list-card"
                    key={user.id}
                    onSubmit={(event) => {
                      event.preventDefault();
                      const form = new FormData(event.currentTarget);
                      void updateManagedUser(user.id, {
                        name: String(form.get("name") ?? user.name),
                        facilityId: String(form.get("facilityId") ?? user.facilityId),
                        role: String(form.get("role") ?? user.role) as UserProfile["role"],
                      });
                    }}
                  >
                    <div className="panel__header">
                      <div>
                        <h3>{user.email}</h3>
                        <div className="subtle">{user.permissions.join(", ")}</div>
                      </div>
                      <button className="button button--ghost" type="submit">
                        Update user
                      </button>
                    </div>
                    <div className="grid grid--three">
                      <input className="input" defaultValue={user.name} name="name" />
                      <select className="select" defaultValue={user.role} name="role">
                        <option value="Maintenance Manager">Maintenance Manager</option>
                        <option value="Reliability Engineer">Reliability Engineer</option>
                        <option value="Plant Director">Plant Director</option>
                        <option value="Technician">Technician</option>
                      </select>
                      <select className="select" defaultValue={user.facilityId} name="facilityId">
                        {facilities.map((facility) => (
                          <option key={facility.id} value={facility.id}>
                            {facility.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  </form>
                ))}
              </div>
            </SectionCard>

            <SectionCard title="Sensor configuration health" description="Coverage, calibration posture, and gateway status across the facility network.">
              <div className="stack">
                {sensorConfigurations.map((config) => (
                  <form
                    className="list-card"
                    key={config.id}
                    onSubmit={(event) => {
                      event.preventDefault();
                      const form = new FormData(event.currentTarget);
                      void updateSensorConfiguration(config.id, {
                        coverage: Number(form.get("coverage")),
                        lastCalibratedAt: String(form.get("lastCalibratedAt")),
                        gatewayStatus: String(form.get("gatewayStatus")) as "Healthy" | "Needs Attention",
                      });
                    }}
                  >
                    <div className="panel__header">
                      <div>
                        <h3>{config.sensorType}</h3>
                        <div className="subtle">{getFacilityName(config.facilityId, facilities)}</div>
                      </div>
                      <StatusBadge value={config.gatewayStatus} />
                    </div>
                    <div className="grid grid--three">
                      <input className="input" defaultValue={config.coverage} name="coverage" type="number" />
                      <input className="input" defaultValue={config.lastCalibratedAt} name="lastCalibratedAt" type="date" />
                      <select className="select" defaultValue={config.gatewayStatus} name="gatewayStatus">
                        <option value="Healthy">Healthy</option>
                        <option value="Needs Attention">Needs Attention</option>
                      </select>
                    </div>
                    <button className="button button--ghost" type="submit">
                      Update sensor config
                    </button>
                  </form>
                ))}
              </div>
            </SectionCard>
          </div>

          <SectionCard title="Facility operations settings" description="Tune the site metadata that drives cross-facility reporting and operating context.">
            <div className="stack">
              {facilities.map((facility) => (
                <form
                  className="list-card"
                  key={facility.id}
                  onSubmit={(event) => {
                    event.preventDefault();
                    const form = new FormData(event.currentTarget);
                    void updateFacility(facility.id, {
                      name: String(form.get("name") ?? facility.name),
                      region: String(form.get("region") ?? facility.region),
                      timezone: String(form.get("timezone") ?? facility.timezone),
                      lines: Number(form.get("lines")),
                      uptimeTarget: Number(form.get("uptimeTarget")),
                      siteLead: String(form.get("siteLead") ?? facility.siteLead),
                    });
                  }}
                >
                  <div className="panel__header">
                    <div>
                      <h3>{facility.name}</h3>
                      <div className="subtle">{facility.region}</div>
                    </div>
                    <button className="button button--ghost" type="submit">
                      Update facility
                    </button>
                  </div>
                  <div className="grid grid--three">
                    <input className="input" defaultValue={facility.name} name="name" />
                    <input className="input" defaultValue={facility.region} name="region" />
                    <input className="input" defaultValue={facility.timezone} name="timezone" />
                  </div>
                  <div className="grid grid--three">
                    <input className="input" defaultValue={facility.lines} name="lines" type="number" />
                    <input className="input" defaultValue={facility.uptimeTarget} name="uptimeTarget" step="0.1" type="number" />
                    <input className="input" defaultValue={facility.siteLead} name="siteLead" />
                  </div>
                </form>
              ))}
            </div>
          </SectionCard>
        </>
      ) : null}

      <SectionCard title="Connector operations" description="Third-party integrations now support both live credentials and seeded demo fallback. Credentials stay on the server.">
        <div className="stack">
          {integrations.map((integration) => (
            <div className="list-card" key={integration.provider}>
              <div className="panel__header">
                <div>
                  <h3>{integration.label}</h3>
                  <div className="subtle">{integration.details}</div>
                </div>
                <StatusBadge value={integration.status} />
              </div>
              <div className="split">
                {integration.capabilities.map((capability) => (
                  <span className="pill" key={capability}>
                    {capability}
                  </span>
                ))}
              </div>
              {can("settings:manage") ? (
                <div className="list-card__actions">
                  <button
                    className="button button--ghost"
                    disabled={integration.status === "Missing Credentials"}
                    onClick={() => {
                      setIntegrationMessage(null);
                      void fetch(`/api/integrations/${integration.provider}/test`, { method: "POST" })
                        .then((response) => response.json() as Promise<IntegrationActionResult>)
                        .then((result) => {
                          setIntegrationMessage(result.message);
                        });
                    }}
                    type="button"
                  >
                    Test connection
                  </button>
                </div>
              ) : null}
            </div>
          ))}
          {integrationMessage ? <div className="empty-state">{integrationMessage}</div> : null}
        </div>
      </SectionCard>

      <SectionCard title="Integration reference" description="Use these live endpoints to integrate or validate the platform against external systems.">
        <div className="grid grid--three">
          <div className="list-card">
            <h3>Telemetry ingest</h3>
            <p className="subtle">POST live readings to `/api/telemetry/ingest` using the same equipment signal schema as the demo lab.</p>
          </div>
          <div className="list-card">
            <h3>CSV reporting</h3>
            <p className="subtle">Export leadership-ready reports through `/api/reports/export?facilityId=all&windowDays=30`.</p>
          </div>
          <div className="list-card">
            <h3>Connector sync APIs</h3>
            <p className="subtle">Drive outbound work-order and ERP inventory syncs through <code>/api/integrations/[provider]/...</code> routes.</p>
          </div>
        </div>
      </SectionCard>
    </>
  );
}
