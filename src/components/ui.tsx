import Link from "next/link";

import type { RiskLevel } from "@/lib/types";

export function PageHeader({
  eyebrow,
  title,
  description,
  pills = [],
}: {
  eyebrow: string;
  title: string;
  description: string;
  pills?: string[];
}) {
  return (
    <section className="page-header">
      <div className="page-header__signal" />
      <div className="page-header__content">
        <div className="eyebrow">{eyebrow}</div>
        <h1>{title}</h1>
        <p>{description}</p>
      </div>
      {pills.length > 0 ? (
        <div className="page-header__meta">
          {pills.map((pill) => (
            <span className="pill" key={pill}>
              {pill}
            </span>
          ))}
        </div>
      ) : null}
    </section>
  );
}

export function MetricCard({
  label,
  value,
  detail,
  icon,
}: {
  label: string;
  value: string;
  detail: string;
  icon?: React.ReactNode;
}) {
  return (
    <article className="panel metric-card">
      {icon ? <div className="metric-card__icon">{icon}</div> : null}
      <div className="metric-card__label">{label}</div>
      <div className="metric-card__value">{value}</div>
      <div className="metric-card__detail">{detail}</div>
    </article>
  );
}

export function StatusBadge({ value }: { value: string | RiskLevel }) {
  return <span className={`badge badge--${value.replace(/\s+/g, "-")}`}>{value}</span>;
}

export function SectionCard({
  title,
  description,
  action,
  children,
  strong = false,
}: {
  title: string;
  description?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
  strong?: boolean;
}) {
  return (
    <section className={`panel${strong ? " panel--strong" : ""}`}>
      <div className="panel__header">
        <div className="panel__titleblock">
          <h2>{title}</h2>
          {description ? <div className="subtle">{description}</div> : null}
        </div>
        {action}
      </div>
      {children}
    </section>
  );
}

export function SparklineChart({
  values,
  warm = false,
}: {
  values: number[];
  warm?: boolean;
}) {
  if (values.length === 0) {
    return <div className="empty-state">No telemetry available.</div>;
  }

  const maxValue = Math.max(...values);
  const minValue = Math.min(...values);
  const range = Math.max(maxValue - minValue, 1);
  const width = 420;
  const height = 170;
  const step = width / Math.max(values.length - 1, 1);
  const points = values
    .map((value, index) => {
      const x = index * step;
      const y = height - ((value - minValue) / range) * (height - 20) - 10;
      return `${x},${y}`;
    })
    .join(" ");
  const fillPoints = `0,${height} ${points} ${width},${height}`;

  return (
    <div className="chart" aria-hidden="true">
      <svg viewBox={`0 0 ${width} ${height}`} role="img">
        {[0, 1, 2, 3].map((line) => {
          const y = 12 + line * 38;
          return <line className="chart__grid" key={y} x1="0" x2={width} y1={y} y2={y} />;
        })}
        <polygon className="chart__fill" points={fillPoints} />
        <polyline className={`chart__line${warm ? " chart__line--warm" : ""}`} points={points} />
      </svg>
    </div>
  );
}

export function KeyValueList({
  items,
}: {
  items: Array<{ label: string; value: React.ReactNode }>;
}) {
  return (
    <div className="stack">
      {items.map((item) => (
        <div className="statline" key={item.label}>
          <span>{item.label}</span>
          <strong>{item.value}</strong>
        </div>
      ))}
    </div>
  );
}

export function EmptyState({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="empty-state">
      <strong>{title}</strong>
      <div>{description}</div>
    </div>
  );
}

export function InlineLink({
  href,
  label,
}: {
  href: string;
  label: string;
}) {
  return (
    <Link className="button button--ghost" href={href}>
      {label}
    </Link>
  );
}
