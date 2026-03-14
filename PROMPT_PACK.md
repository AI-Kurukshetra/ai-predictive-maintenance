# IntelliMaintain Pro Prompt Pack

This file mirrors the `CODEX PROMPT PACK` generated from the PMBA1 product spec so it can be viewed directly in the terminal.

## CODEX PROMPT 1

Build `IntelliMaintain Pro` as a production-style predictive maintenance web platform using Next.js 15, TypeScript, Tailwind CSS, shadcn/ui, Recharts, and Supabase/PostgreSQL. Implement these screens first: dashboard, equipment list, equipment detail, alerts center, and work orders. Seed realistic manufacturing data for facilities, machines, telemetry, alerts, and work orders. Add a deterministic prediction engine that calculates health scores, risk levels, and anomaly flags from seeded telemetry. Make the UI responsive and business-grade, with clear empty, loading, success, and error states.

## CODEX PROMPT 2

Implement the equipment intelligence layer for `IntelliMaintain Pro`. Create a schema and service layer for facilities, equipment, telemetry, alerts, work orders, and inventory. Build an `equipment/[id]` page that shows asset metadata, health score, predicted failure risk, anomaly timeline, trend charts for vibration and temperature, recent alerts, linked work orders, and attached documentation. Keep the prediction logic isolated in a service so it can later be replaced with real ML.

## CODEX PROMPT 3

Implement the operational workflow for `IntelliMaintain Pro`. Build an alerts center with severity, facility, and asset filters. Allow users to acknowledge alerts and convert them into work orders. Build a work-order management screen with statuses `Open`, `Scheduled`, `In Progress`, and `Completed`, plus assignee, due date, and priority fields. Add a calendar-based maintenance scheduling view and ensure actions update the database consistently.

## CODEX PROMPT 4

Implement the platform expansion surfaces for `IntelliMaintain Pro`: multi-facility support, inventory/spare-parts management, documentation hub, reporting dashboard, and settings for user roles and facility management. Use seeded data where necessary, but design the schema so these modules are integration-ready. Reports should include uptime, MTBF, MTTR, alert response times, and avoided downtime estimates.

## CODEX PROMPT 5

Polish `IntelliMaintain Pro` for demo and stakeholder walkthroughs. Add a global shell, facility switcher, strong visual hierarchy for machine risk, deterministic demo reset, and clean manager-facing reporting visuals. Keep the interface sharp and industrial, not generic SaaS. Ensure the app supports a full story from fleet monitoring to issue detection to maintenance action to ROI reporting.
