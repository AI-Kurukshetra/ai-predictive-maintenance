"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

import { useDemoStore } from "@/lib/demo-store";

const navigation = [
  { href: "/dashboard", label: "Dashboard", hint: "Fleet health", permission: "dashboard:view" },
  { href: "/equipment", label: "Equipment", hint: "Asset register", permission: "equipment:view" },
  { href: "/alerts", label: "Alerts", hint: "Risk triage", permission: "alerts:triage" },
  { href: "/work-orders", label: "Work Orders", hint: "Execution board", permission: "workorders:update" },
  { href: "/schedule", label: "Schedule", hint: "Planning windows", permission: "schedule:view" },
  { href: "/inventory", label: "Inventory", hint: "Parts readiness", permission: "inventory:view" },
  { href: "/reports", label: "Reports", hint: "KPI and ROI", permission: "reports:view" },
  { href: "/facilities", label: "Facilities", hint: "Site network", permission: "facilities:view" },
  { href: "/settings", label: "Settings", hint: "Profile and config", permission: "dashboard:view" },
];

function getWorkspaceLabel(pathname: string) {
  if (pathname === "/") {
    return "Dashboard";
  }

  const match = navigation.find((item) => pathname === item.href || pathname.startsWith(`${item.href}/`));
  return match?.label ?? "Workspace";
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [signingOut, setSigningOut] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const {
    activeFacilityId,
    facilities,
    setActiveFacilityId,
    resetDemo,
    alerts,
    workOrders,
    currentUser,
    mode,
    logout,
    can,
    loading,
    error,
    refresh,
  } = useDemoStore();

  const isAuthPage = pathname === "/login" || pathname === "/signup" || pathname === "/unauthorized";
  const visibleNavigation = navigation.filter((item) => can(item.permission));
  const workspaceLabel = getWorkspaceLabel(pathname);
  const openAlerts = alerts.filter((item) => item.status === "Open").length;
  const activeOrders = workOrders.filter((item) => item.status !== "Completed").length;
  const scopedFacilityName =
    activeFacilityId === "all"
      ? "All facilities"
      : facilities.find((facility) => facility.id === activeFacilityId)?.name ?? "Facility scope";

  if (isAuthPage) {
    return <main className="main main--auth"><div className="main__inner">{children}</div></main>;
  }

  if (loading) {
    return (
      <main className="main">
        <div className="main__inner">
          <section className="panel panel--strong auth-card">
            <div className="eyebrow">Initializing Platform</div>
            <h1>Loading IntelliMaintain Pro</h1>
            <p className="subtle">Verifying the session and loading live platform data before the workspace is shown.</p>
          </section>
        </div>
      </main>
    );
  }

  if (error) {
    return (
      <main className="main">
        <div className="main__inner">
          <section className="panel panel--strong auth-card">
            <div className="eyebrow">Bootstrap Failed</div>
            <h1>We could not initialize the platform workspace</h1>
            <p className="subtle">{error}</p>
            <div className="split">
              <button className="button" onClick={() => void refresh()} type="button">
                Retry bootstrap
              </button>
              <button
                className="button button--ghost"
                onClick={() => {
                  setSigningOut(true);
                  void logout().then(() => {
                    window.location.assign("/login");
                  }).finally(() => {
                    setSigningOut(false);
                  });
                }}
                type="button"
              >
                {signingOut ? "Signing Out..." : "Return to login"}
              </button>
            </div>
          </section>
        </div>
      </main>
    );
  }

  return (
    <div className="shell">
      <button
        aria-hidden={!sidebarOpen}
        className={`shell__overlay${sidebarOpen ? " shell__overlay--visible" : ""}`}
        onClick={() => setSidebarOpen(false)}
        tabIndex={sidebarOpen ? 0 : -1}
        type="button"
      />

      <aside className={`sidebar${sidebarOpen ? " sidebar--open" : ""}`}>
        <div className="sidebar__scroll">
          <div className="sidebar__header">
            <div className="brand">
              <div className="brand__eyebrow">Predictive Maintenance</div>
              <h1>IntelliMaintain Pro</h1>
              <p>AI-assisted machine health, maintenance response, and ROI visibility for industrial operations.</p>
              <div className="brand__signal">
                <span className="pill">Control room</span>
                <span className="pill">{scopedFacilityName}</span>
              </div>
            </div>
            <button className="button button--ghost sidebar__close" onClick={() => setSidebarOpen(false)} type="button">
              Close
            </button>
          </div>

          <section className="sidebar__section">
            <div className="eyebrow">Navigate</div>
            <nav className="nav" aria-label="Primary">
              {visibleNavigation.map((item) => {
                const isActive = pathname === item.href || (pathname === "/" && item.href === "/dashboard");
                return (
                  <Link
                    className={`nav__link${isActive ? " nav__link--active" : ""}`}
                    href={item.href}
                    key={item.href}
                    onClick={() => setSidebarOpen(false)}
                  >
                    <span className="nav__icon" aria-hidden="true">
                      {item.label.slice(0, 2).toUpperCase()}
                    </span>
                    <span className="nav__meta">
                      <span className="nav__label">{item.label}</span>
                      <span className="nav__hint">{item.hint}</span>
                    </span>
                  </Link>
                );
              })}
            </nav>
          </section>

          <section className="sidebar__section">
            <div className="eyebrow">Session</div>
            <div className="panel panel--compact">
              <div className="sidebar-profile">
                <div>
                  <strong>{currentUser?.name ?? "No session"}</strong>
                  <div className="subtle">{currentUser?.email ?? "No session"}</div>
                </div>
                <span className="pill">{currentUser?.role ?? "Guest"}</span>
              </div>
              <div className="split">
                <div className="sidebar-stat">
                  <span>Mode</span>
                  <strong>{mode}</strong>
                </div>
                <div className="sidebar-stat">
                  <span>Scope</span>
                  <strong>{activeFacilityId === "all" ? "Global" : "Focused"}</strong>
                </div>
              </div>
              {currentUser ? (
                <Link className="button button--ghost" href="/settings" onClick={() => setSidebarOpen(false)}>
                  Manage profile
                </Link>
              ) : null}
            </div>
          </section>

          <section className="sidebar__section">
            <div className="eyebrow">Facility Scope</div>
            <div className="panel panel--compact">
              <select
                aria-label="Active facility"
                className="select"
                value={activeFacilityId}
                onChange={(event) => setActiveFacilityId(event.target.value)}
              >
                <option value="all">All facilities</option>
                {facilities.map((facility) => (
                  <option key={facility.id} value={facility.id}>
                    {facility.name}
                  </option>
                ))}
              </select>
            </div>
          </section>

          <section className="sidebar__section">
            <div className="eyebrow">Ops Snapshot</div>
            <div className="split split--two">
              <div className="sidebar-stat sidebar-stat--strong">
                <span>Open alerts</span>
                <strong>{openAlerts}</strong>
              </div>
              <div className="sidebar-stat sidebar-stat--strong">
                <span>Active work</span>
                <strong>{activeOrders}</strong>
              </div>
            </div>
          </section>

          <section className="sidebar__section sidebar__footer">
            <button className="button" onClick={resetDemo} type="button">
              Reset demo data
            </button>
            <button
              className="button button--ghost"
              onClick={() => {
                setSigningOut(true);
                void logout().then(() => {
                  window.location.assign("/login");
                }).finally(() => {
                  setSigningOut(false);
                });
              }}
              type="button"
            >
              {signingOut ? "Signing out..." : "Sign out"}
            </button>
            <div className="subtle">Restores alerts, work orders, and inventory to the seeded walkthrough state.</div>
          </section>
        </div>
      </aside>

      <main className="main">
        <div className="main__inner">
          <section className="workspace-bar">
            <div>
              <div className="eyebrow">Control Room</div>
              <h2>{workspaceLabel}</h2>
              <p className="subtle">Monitor plant health, move maintenance work faster, and keep every operational surface aligned in one industrial workspace.</p>
            </div>
            <div className="workspace-bar__meta">
              <button className="button button--ghost button--inline workspace-bar__menu" onClick={() => setSidebarOpen(true)} type="button">
                Menu
              </button>
              <div className="workspace-chip">
                <span>Scope</span>
                <strong>{scopedFacilityName}</strong>
              </div>
              <div className="workspace-chip">
                <span>Mode</span>
                <strong>{mode}</strong>
              </div>
              <div className="workspace-chip">
                <span>Open alerts</span>
                <strong>{openAlerts}</strong>
              </div>
              <div className="workspace-chip">
                <span>Active work</span>
                <strong>{activeOrders}</strong>
              </div>
              <button className="button button--ghost button--inline" onClick={() => void refresh()} type="button">
                Refresh data
              </button>
            </div>
          </section>
          {children}
        </div>
      </main>
    </div>
  );
}
