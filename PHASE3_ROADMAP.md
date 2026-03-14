# Phase 3 Roadmap

This roadmap turns the remaining advanced differentiator work into an execution-ready sequence.

## Goal

Move IntelliMaintain Pro from a strong platform and demo product into a more differentiated reliability product with deeper intelligence and more operational automation.

## Phase 3 Scope

### 1. Acoustic Intelligence

- Add dedicated acoustic anomaly scoring instead of treating acoustic as only one field in the composite score
- Add an acoustic-focused visualization on equipment detail
- Add anomaly reasons tied specifically to acoustic drift and pattern change

### 2. Root-Cause Suggestions

- Expand heuristic recommendations into structured root-cause hypotheses
- Output top probable causes with confidence bands
- Add recommended validation steps for technicians

### 3. Predictive Parts Ordering

- Link failure prediction to spare-part demand risk
- Recommend reorder actions when predicted work would exhaust stock
- Surface “parts at risk” cards on dashboard and inventory views

### 4. Energy Optimization Insights

- Add a focused energy-performance module
- Identify assets with rising energy delta but non-critical failure risk
- Recommend load balancing, calibration, or maintenance actions to reduce waste

### 5. Natural-Language Operations Query

- Add a query surface such as:
  - “Which facility has the highest maintenance risk this week?”
  - “Show me machines likely to fail within 48 hours”
  - “What inventory is at risk if all open work orders execute?”
- Start with rule-based query interpretation over current app data

## Recommended Build Order

1. Acoustic intelligence
2. Root-cause suggestions
3. Predictive parts ordering
4. Energy optimization insights
5. Natural-language operations query

## Suggested File Targets

- `src/lib/prediction.ts`
- `src/lib/types.ts`
- `src/lib/view-helpers.ts`
- `src/components/dashboard-view.tsx`
- `src/components/equipment-detail-view.tsx`
- `src/components/inventory-view.tsx`
- `src/components/reports-view.tsx`
- `src/components/settings-view.tsx`

## Acceptance Criteria

- Acoustic signals produce visible anomaly output distinct from vibration and temperature
- Equipment detail shows top suspected causes, not just a generic recommendation
- Inventory view shows predicted stock exposure from likely maintenance demand
- Dashboard includes energy risk and parts risk summaries
- A user can ask a natural-language operations question and receive a deterministic answer from current app data

## Out of Scope For This Phase

- True ML training infrastructure
- Real DSP or audio-file processing pipeline
- LLM-backed conversational orchestration
- Digital twin simulation

## Definition of Done

- Each Phase 3 area has visible UI output
- The app still passes `lint`, `typecheck`, and `build`
- Phase 3 features work in both Supabase mode and demo mode
