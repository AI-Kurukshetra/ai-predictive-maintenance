"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

import { useDemoStore } from "@/lib/demo-store";

const navigation = [
  {
    href: "/dashboard",
    label: "Dashboard",
    hint: "Fleet health",
    icon: (
      <svg aria-hidden="true" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" viewBox="0 0 16 16">
        <rect height="5" rx="1.2" width="5" x="1.5" y="1.5" /><rect height="5" rx="1.2" width="5" x="9.5" y="1.5" />
        <rect height="5" rx="1.2" width="5" x="1.5" y="9.5" /><rect height="5" rx="1.2" width="5" x="9.5" y="9.5" />
      </svg>
    ),
    permission: "dashboard:view",
  },
  {
    href: "/equipment",
    label: "Equipment",
    hint: "Asset register",
    icon: (
      <svg aria-hidden="true" fill="none" stroke="currentColor" strokeLinecap="round" strokeWidth="1.5" viewBox="0 0 16 16">
        <circle cx="8" cy="8" r="2.2" />
        <path d="M8 1.5V3M8 13V14.5M1.5 8H3M13 8H14.5M3.5 3.5l1.1 1.1M11.4 11.4l1.1 1.1M12.5 3.5l-1.1 1.1M4.6 11.4l-1.1 1.1" />
      </svg>
    ),
    permission: "equipment:view",
  },
  {
    href: "/alerts",
    label: "Alerts",
    hint: "Risk triage",
    icon: (
      <svg aria-hidden="true" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" viewBox="0 0 16 16">
        <path d="M8 1.5a4.5 4.5 0 0 1 4.5 4.5V8.5l1 2H2.5l1-2V6A4.5 4.5 0 0 1 8 1.5z" />
        <path d="M6.5 12a1.5 1.5 0 0 0 3 0" />
      </svg>
    ),
    permission: "alerts:triage",
  },
  {
    href: "/work-orders",
    label: "Work Orders",
    hint: "Execution board",
    icon: (
      <svg aria-hidden="true" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" viewBox="0 0 16 16">
        <rect height="13" rx="1.5" width="11" x="2.5" y="1.5" />
        <path d="M5.5 1.5v1a2.5 2.5 0 0 0 5 0v-1" />
        <path d="M5.5 9l2 2 3.5-3.5" />
      </svg>
    ),
    permission: "workorders:update",
  },
  {
    href: "/schedule",
    label: "Schedule",
    hint: "Planning windows",
    icon: (
      <svg aria-hidden="true" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" viewBox="0 0 16 16">
        <rect height="12" rx="1.5" width="13" x="1.5" y="3" />
        <path d="M1.5 7.5h13M5.5 1.5V4M10.5 1.5V4" />
      </svg>
    ),
    permission: "schedule:view",
  },
  {
    href: "/inventory",
    label: "Inventory",
    hint: "Parts readiness",
    icon: (
      <svg aria-hidden="true" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" viewBox="0 0 16 16">
        <path d="M1.5 5.5 8 9l6.5-3.5L8 2z" />
        <path d="M1.5 9.5 8 13l6.5-3.5M1.5 7.5 8 11l6.5-3.5" />
      </svg>
    ),
    permission: "inventory:view",
  },
  {
    href: "/reports",
    label: "Reports",
    hint: "KPI and ROI",
    icon: (
      <svg aria-hidden="true" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" viewBox="0 0 16 16">
        <path d="M2 13.5h12M4.5 13.5V9.5M8 13.5V6.5M11.5 13.5V2.5" />
      </svg>
    ),
    permission: "reports:view",
  },
  {
    href: "/facilities",
    label: "Facilities",
    hint: "Site network",
    icon: (
      <svg aria-hidden="true" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" viewBox="0 0 16 16">
        <path d="M1.5 14.5h13M3 14.5V5.5l5-3.5 5 3.5v9" />
        <path d="M6.5 14.5v-4h3v4M6.5 8.5h3" />
      </svg>
    ),
    permission: "facilities:view",
  },
  {
    href: "/settings",
    label: "Settings",
    hint: "Profile and config",
    icon: (
      <svg aria-hidden="true" fill="none" strokeLinecap="round" strokeWidth="1.5" viewBox="0 0 16 16">
        <path stroke="currentColor" d="M2 4.5h2.5M6.5 4.5h7.5M2 8h6M10 8h4M2 11.5h4M8 11.5h6" />
        <circle cx="5.5" cy="4.5" r="1.5" stroke="currentColor" />
        <circle cx="9" cy="8" r="1.5" stroke="currentColor" />
        <circle cx="7" cy="11.5" r="1.5" stroke="currentColor" />
      </svg>
    ),
    permission: "dashboard:view",
  },
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
  const isPublicPage = pathname === "/";
  const visibleNavigation = navigation.filter((item) => can(item.permission));
  const workspaceLabel = getWorkspaceLabel(pathname);
  const openAlerts = alerts.filter((item) => item.status === "Open").length;
  const activeOrders = workOrders.filter((item) => item.status !== "Completed").length;
  const scopedFacilityName =
    activeFacilityId === "all"
      ? "All facilities"
      : facilities.find((facility) => facility.id === activeFacilityId)?.name ?? "Facility scope";

  if (isAuthPage || isPublicPage) {
    return (
      <main className={`main ${isAuthPage ? "main--auth" : "main--public"}`}>
        <div className={`main__inner${isPublicPage ? " main__inner--public" : ""}`}>{children}</div>
      </main>
    );
  }

  if (loading) {
    return (
      <main className="main">
        <div className="main__inner">
          <section className="panel panel--strong auth-card">
            <div className="spinner" />
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
              <div className="brand__logo" aria-hidden="true">
                <svg fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 20 20">
                  <path d="M1 10h3l2.5-7L9.5 17l2.5-9 2 5H19" />
                </svg>
              </div>
              <div className="brand__title">
                <strong>IntelliMaintain Pro</strong>
                <span>Predictive Maintenance</span>
              </div>
              <button className="button button--ghost sidebar__close" onClick={() => setSidebarOpen(false)} type="button" style={{ marginLeft: "auto", minHeight: 32, padding: "4px 10px", fontSize: "0.8rem" }}>
                ✕
              </button>
            </div>
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
                    <span className="nav__icon">
                      {item.icon}
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
            <div className="sidebar__upgrade">
              <div className="sidebar__upgrade__icon" aria-hidden="true">
                <svg fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" viewBox="0 0 18 18">
                  <path d="M9 1l2.2 4.5L16 6.4l-3.5 3.4.8 4.8L9 12.3l-4.3 2.3.8-4.8L2 6.4l4.8-.9z" />
                </svg>
              </div>
              <strong>IntelliMaintain Pro</strong>
              <p>Unlock advanced AI predictions, multi-site analytics, and enterprise integrations.</p>
              <button className="button button--inline" type="button">Upgrade plan</button>
            </div>
            <button className="button button--ghost" onClick={resetDemo} type="button">
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
          </section>
        </div>
      </aside>

      <main className="main">
        <div className="main__inner">
          <section className="workspace-bar">
            <div className="workspace-bar__left">
              <button className="button button--ghost button--inline workspace-bar__menu" onClick={() => setSidebarOpen(true)} type="button" style={{ minHeight: 36, padding: "4px 12px", width: "auto" }}>
                <svg aria-hidden="true" fill="none" stroke="currentColor" strokeLinecap="round" strokeWidth="1.8" viewBox="0 0 20 20" width="18" height="18">
                  <path d="M3 5h14M3 10h14M3 15h14" />
                </svg>
              </button>
              <div className="workspace-bar__titles">
                <h2 style={{ margin: 0, fontSize: "1.05rem" }}>{workspaceLabel}</h2>
                <span className="workspace-bar__subtitle">{scopedFacilityName} · {mode} mode</span>
              </div>
            </div>
            <div className="workspace-bar__actions">
              <div className="workspace-chip">
                <span>Alerts</span>
                <strong>{openAlerts}</strong>
              </div>
              <div className="workspace-chip">
                <span>Active work</span>
                <strong>{activeOrders}</strong>
              </div>
              <button className="button button--ghost button--inline" onClick={() => void refresh()} type="button" style={{ minHeight: 36, padding: "4px 12px", width: "auto", fontSize: "0.82rem" }}>
                Refresh
              </button>
              <button className="topbar-bell" aria-label="Notifications" type="button">
                <svg aria-hidden="true" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.6" viewBox="0 0 16 16">
                  <path d="M8 1.5a4.5 4.5 0 0 1 4.5 4.5V8.5l1 2H2.5l1-2V6A4.5 4.5 0 0 1 8 1.5z" />
                  <path d="M6.5 12a1.5 1.5 0 0 0 3 0" />
                </svg>
              </button>
              <div className="topbar-avatar" aria-label={currentUser?.name ?? "User"} title={currentUser?.name ?? "User"}>
                {currentUser?.name ? currentUser.name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase() : "U"}
              </div>
            </div>
          </section>
          {children}
        </div>
      </main>
    </div>
  );
}
