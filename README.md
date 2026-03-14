# IntelliMaintain Pro

IntelliMaintain Pro is a predictive maintenance platform for industrial operations teams. It combines fleet health monitoring, alerts, work orders, scheduling, inventory, facilities, reporting, telemetry ingestion, and ERP/CMMS connector flows in one Next.js application.

## Current Status

- Broad platform build is implemented
- Supabase-backed auth and persistence are supported
- Demo mode is supported for local development and walkthroughs
- ERP/CMMS connector flows support both live credentials and seeded demo fallback

## Core Product Surface

- Dashboard with fleet health and risk ranking
- Equipment register and equipment detail pages
- Alerts triage workflow
- Work-order creation, editing, and status progression
- Maintenance schedule and rescheduling
- Inventory and ERP comparison workflow
- Multi-facility views
- Reports and CSV export
- Settings, profile management, telemetry ingest, and integration controls

## Stack

- Next.js 16
- React 19
- TypeScript
- Supabase
- Server-side integration adapters for Odoo and Fracttal

## Local Run

From [intellimaintain-pro](C:/Users/Bacancy/Documents/Playground/intellimaintain-pro):

```powershell
npm install
npm run dev -- --hostname 127.0.0.1 --port 3010
```

Open:

```text
http://localhost:3010
```

## Environment Setup

Copy `.env.example` into `.env.local` and fill only what you need.

### Minimum local demo setup

```env
INTEGRATIONS_DEMO_MODE=true
```

### Supabase setup

Required for live auth and persistence:

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
```

### Odoo live connector setup

```env
ODOO_BASE_URL=
ODOO_DATABASE=
ODOO_API_KEY=
ODOO_MAINTENANCE_MODEL=maintenance.request
ODOO_INVENTORY_MODEL=stock.quant
ODOO_EQUIPMENT_ID_MAP_JSON={}
ODOO_PRODUCT_ID_MAP_JSON={}
```

### Fracttal live connector setup

```env
FRACTTAL_BASE_URL=https://api.fracttal.com
FRACTTAL_AUTH_MODE=hawk
FRACTTAL_API_KEY=
FRACTTAL_API_SECRET=
FRACTTAL_WORK_ORDER_ENDPOINT=/api/v2/work-orders/
FRACTTAL_TEST_ENDPOINT=/api/v2/work-orders/?limit=1
FRACTTAL_ASSET_ID_MAP_JSON={}
```

## Useful Commands

```powershell
npm run dev
npm run lint
npm run typecheck
npm run build
npm run seed:sql
npm run seed:supabase
npm run smoke:demo
```

## Supabase Assets

- Migration: [20260314104500_init_intellimaintain.sql](C:/Users/Bacancy/Documents/Playground/intellimaintain-pro/supabase/migrations/20260314104500_init_intellimaintain.sql)
- Seed SQL: [intellimaintain_seed.sql](C:/Users/Bacancy/Documents/Playground/intellimaintain-pro/supabase/seed/intellimaintain_seed.sql)

## Deployment Notes

- Keep `.env.local` out of git
- Use `INTEGRATIONS_DEMO_MODE=true` for demo deploys without third-party credentials
- Set real Odoo/Fracttal credentials only in deployment secrets
- Run `npm run build` before deployment handoff

## Next Phase

The next implementation plan is documented in [PHASE3_ROADMAP.md](C:/Users/Bacancy/Documents/Playground/intellimaintain-pro/PHASE3_ROADMAP.md).
