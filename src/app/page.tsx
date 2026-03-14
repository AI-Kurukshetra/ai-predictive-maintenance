import Link from "next/link";

import { alertsSeed, equipment, facilities, sensorConfigurations, workOrdersSeed } from "@/lib/seed-data";

const platformStats = [
  { label: "Connected assets", value: `${equipment.length}` },
  { label: "Active facilities", value: `${facilities.length}` },
  { label: "Live alerts", value: `${alertsSeed.filter((alert) => alert.status !== "Resolved").length}` },
  { label: "Open work orders", value: `${workOrdersSeed.filter((workOrder) => workOrder.status !== "Completed").length}` },
];

const capabilityCards = [
  {
    title: "Detect operational drift sooner",
    description:
      "Bring machine health, anomaly signals, and risk scoring into one view so plant teams can act before downtime hits production.",
    icon: (
      <svg aria-hidden="true" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" viewBox="0 0 22 22">
        <circle cx="11" cy="11" r="3" />
        <circle cx="11" cy="11" r="7" strokeOpacity="0.3" />
        <path d="M11 1v2M11 19v2M1 11h2M19 11h2" />
      </svg>
    ),
  },
  {
    title: "Move from alert to action",
    description:
      "Convert risky events into structured work orders, technician plans, and parts readiness without switching between disconnected tools.",
    icon: (
      <svg aria-hidden="true" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" viewBox="0 0 22 22">
        <path d="M12.5 2 5.5 12h7L9 20 17 10h-7z" />
      </svg>
    ),
  },
  {
    title: "Explain value to leadership",
    description:
      "Combine uptime, response time, maintenance load, and avoided downtime into reporting that operations leaders can actually use.",
    icon: (
      <svg aria-hidden="true" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" viewBox="0 0 22 22">
        <path d="M2 18 8.5 10.5l4.5 3.5L20 5" />
        <path d="M15 5h5v5" />
      </svg>
    ),
  },
];

const workflow = [
  "Surface fleet risk across facilities and production lines.",
  "Open the equipment workspace to inspect telemetry, anomalies, and recommended next steps.",
  "Create work orders, schedule intervention windows, and keep inventory aligned.",
  "Report progress through ROI and reliability views built for plant leadership.",
];

const integrationPoints = [
  "Supabase-backed auth and persistence",
  "Telemetry ingest endpoints for sensor updates",
  "Odoo ERP and Fracttal CMMS connector flows",
  "Demo-safe seeded mode for stakeholder walkthroughs",
];

export default function HomePage() {
  return (
    <div className="public-page">
      <header className="public-topbar">
        <Link className="public-brand" href="/">
          <span className="public-brand__mark">
            <svg aria-hidden="true" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 20 20">
              <path d="M1 10h3l2.5-7L9.5 17l2.5-9 2 5H19" />
            </svg>
          </span>
          <span>
            <strong>IntelliMaintain Pro</strong>
            <small>Predictive maintenance operations platform</small>
          </span>
        </Link>
        <nav aria-label="Public" className="public-nav">
          <a href="#platform">Platform</a>
          <a href="#workflow">Workflow</a>
          <a href="#integrations">Integrations</a>
        </nav>
        <div className="public-actions">
          <Link className="button button--ghost button--inline" href="/login">
            Sign in
          </Link>
          <Link className="button button--inline" href="/signup">
            Launch demo
          </Link>
        </div>
      </header>

      <section className="public-hero">
        <div className="public-hero__content">
          <div className="eyebrow">Production Health Platform</div>
          <h1>Predict machine failures earlier and coordinate maintenance without dashboard noise.</h1>
          <p className="public-hero__copy">
            IntelliMaintain Pro gives industrial teams one operational layer for machine health, alert triage, work execution,
            inventory readiness, and leadership reporting. The experience is built for reliability teams, planners, and plant
            directors who need signal, not clutter.
          </p>
          <div className="public-actions public-actions--hero">
            <Link className="button button--inline" href="/login">
              Open workspace
            </Link>
            <a className="button button--ghost button--inline" href="#platform">
              Explore platform
            </a>
          </div>
          <div className="public-stat-ribbon">
            {platformStats.map((stat) => (
              <article className="public-stat" key={stat.label}>
                <strong>{stat.value}</strong>
                <span>{stat.label}</span>
              </article>
            ))}
          </div>
        </div>

        <div className="public-showcase panel panel--strong">
          <div className="panel__header">
            <div className="panel__titleblock">
              <div className="eyebrow">Live operations snapshot</div>
              <h2>Purpose-built for industrial decision velocity</h2>
            </div>
            <span className="pill">Market-ready UX</span>
          </div>
          <div className="public-showcase__metrics">
            <div className="public-kpi">
              <span>Sensor coverage</span>
              <strong>{sensorConfigurations.length} streams</strong>
            </div>
            <div className="public-kpi">
              <span>Facility scope</span>
              <strong>Cross-site visibility</strong>
            </div>
            <div className="public-kpi">
              <span>Action path</span>
              <strong>Alert to work order</strong>
            </div>
          </div>
          <div className="public-showcase__board">
            <div className="public-board-card">
              <span className="eyebrow">Risk board</span>
              <strong>3 critical assets need intervention</strong>
              <p>Ranking combines telemetry drift, anomaly pressure, and maintenance exposure across the plant network.</p>
            </div>
            <div className="public-board-card">
              <span className="eyebrow">Execution board</span>
              <strong>Maintenance is tracked in the same workspace</strong>
              <p>Planners can assign, reschedule, and close work while inventory and reporting stay aligned.</p>
            </div>
          </div>
        </div>
      </section>

      <section className="public-section" id="platform">
        <div className="public-section__intro">
          <div className="eyebrow">Platform coverage</div>
          <h2>Built for the full maintenance operating loop</h2>
          <p>
            The product does not stop at alerts. It connects monitoring, diagnosis, execution, planning, inventory, and
            reporting in one coherent surface.
          </p>
        </div>
        <div className="public-card-grid">
          {capabilityCards.map((card) => (
            <article className="public-feature-card" key={card.title}>
              <div className="public-feature-card__icon">{card.icon}</div>
              <h3>{card.title}</h3>
              <p>{card.description}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="public-section public-section--split" id="workflow">
        <div className="public-section__intro">
          <div className="eyebrow">Operational workflow</div>
          <h2>How teams use the workspace day to day</h2>
          <p>
            Every surface is designed to reduce context switching and keep maintenance teams moving from detection through
            execution with a consistent data model.
          </p>
        </div>
        <div className="public-timeline">
          {workflow.map((step, index) => (
            <article className="public-timeline__item" key={step}>
              <span>{`0${index + 1}`}</span>
              <p>{step}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="public-section public-section--split" id="integrations">
        <div className="public-section__intro">
          <div className="eyebrow">Integration-ready foundation</div>
          <h2>Designed to demo fast and scale into real operations</h2>
          <p>
            The current build already supports live Supabase persistence and seeded or live connector flows, which keeps the
            demo reliable without blocking enterprise rollout work.
          </p>
        </div>
        <div className="public-list-card">
          {integrationPoints.map((item) => (
            <div className="public-list-row" key={item}>
              <span className="public-list-row__dot" aria-hidden="true" />
              <div>{item}</div>
            </div>
          ))}
        </div>
      </section>

      <section className="public-cta panel panel--strong">
        <div>
          <div className="eyebrow">Ready to review</div>
          <h2>Start with the production-style workspace, then iterate on deeper intelligence layers.</h2>
          <p className="subtle">
            Sign in to the live application, inspect the plant operations surfaces, and continue the next design or product
            pass from a stronger baseline.
          </p>
        </div>
        <div className="public-actions">
          <Link className="button button--inline" href="/login">
            Enter platform
          </Link>
          <Link className="button button--ghost button--inline" href="/signup">
            Create account
          </Link>
        </div>
      </section>
    </div>
  );
}
