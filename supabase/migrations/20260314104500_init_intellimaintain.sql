create extension if not exists "pgcrypto";

create table if not exists public.facilities (
  id text primary key,
  name text not null,
  region text not null,
  timezone text not null,
  lines integer not null default 1,
  uptime_target numeric(5,2) not null default 95,
  site_lead text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null unique,
  name text not null,
  role text not null check (role in ('Maintenance Manager', 'Reliability Engineer', 'Plant Director', 'Technician')),
  facility_id text not null references public.facilities(id),
  permissions jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.equipment (
  id text primary key,
  name text not null,
  facility_id text not null references public.facilities(id),
  type text not null,
  model text not null,
  line text not null,
  criticality text not null,
  install_date date not null,
  last_maintenance_at date not null,
  baseline_oee numeric(5,2) not null,
  baseline_power_kw numeric(8,2) not null,
  sensors jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.telemetry_points (
  id uuid primary key default gen_random_uuid(),
  equipment_id text not null references public.equipment(id) on delete cascade,
  timestamp timestamptz not null,
  vibration numeric(8,3) not null,
  temperature numeric(8,3) not null,
  acoustic numeric(8,3) not null default 0,
  pressure numeric(8,3) not null default 0,
  runtime_hours numeric(10,2) not null default 0
);

create table if not exists public.alerts (
  id text primary key,
  equipment_id text not null references public.equipment(id) on delete cascade,
  facility_id text not null references public.facilities(id),
  severity text not null,
  title text not null,
  summary text not null,
  status text not null,
  recommended_action text not null,
  created_at timestamptz not null
);

create table if not exists public.work_orders (
  id text primary key,
  equipment_id text not null references public.equipment(id) on delete cascade,
  facility_id text not null references public.facilities(id),
  source_alert_id text references public.alerts(id),
  title text not null,
  assignee text not null,
  due_date date not null,
  priority text not null,
  status text not null,
  notes text not null,
  parts_required jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.inventory_items (
  id text primary key,
  facility_id text not null references public.facilities(id),
  part_name text not null,
  sku text not null,
  on_hand integer not null default 0,
  reorder_point integer not null default 0,
  linked_equipment_ids jsonb not null default '[]'::jsonb,
  lead_time_days integer not null default 0
);

create table if not exists public.equipment_documents (
  id text primary key,
  equipment_id text not null references public.equipment(id) on delete cascade,
  title text not null,
  category text not null,
  updated_at date not null
);

create table if not exists public.sensor_configurations (
  id text primary key,
  facility_id text not null references public.facilities(id),
  sensor_type text not null,
  coverage integer not null,
  last_calibrated_at date not null,
  gateway_status text not null
);

alter table public.facilities enable row level security;
alter table public.profiles enable row level security;
alter table public.equipment enable row level security;
alter table public.telemetry_points enable row level security;
alter table public.alerts enable row level security;
alter table public.work_orders enable row level security;
alter table public.inventory_items enable row level security;
alter table public.equipment_documents enable row level security;
alter table public.sensor_configurations enable row level security;

create policy "authenticated read facilities" on public.facilities
for select to authenticated using (true);

create policy "authenticated read profiles" on public.profiles
for select to authenticated using (true);

create policy "authenticated read equipment" on public.equipment
for select to authenticated using (true);

create policy "authenticated read telemetry" on public.telemetry_points
for select to authenticated using (true);

create policy "authenticated read alerts" on public.alerts
for select to authenticated using (true);

create policy "authenticated read work orders" on public.work_orders
for select to authenticated using (true);

create policy "authenticated read inventory" on public.inventory_items
for select to authenticated using (true);

create policy "authenticated read documents" on public.equipment_documents
for select to authenticated using (true);

create policy "authenticated read sensor configurations" on public.sensor_configurations
for select to authenticated using (true);
