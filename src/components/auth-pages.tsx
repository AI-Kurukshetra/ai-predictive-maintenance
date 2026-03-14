"use client";

import Link from "next/link";
import { useState } from "react";

import { facilities, users } from "@/lib/seed-data";

type AuthMode = "demo" | "supabase";

export function LoginPageView({
  authMode,
  defaultPassword,
}: {
  authMode: AuthMode;
  defaultPassword: string;
}) {
  const [email, setEmail] = useState(users[0]?.email ?? "");
  const [password, setPassword] = useState(defaultPassword);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function submitLogin(payload: Record<string, string>) {
    setSubmitting(true);
    setError(null);
    const response = await fetch("/api/auth/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    const body = (await response.json()) as { error?: string };
    if (!response.ok) {
      setError(body.error ?? "Unable to sign in.");
      setSubmitting(false);
      return;
    }

    window.location.assign("/dashboard");
  }

  return (
    <section className="auth-shell">
      <div className="panel panel--strong auth-story">
        <div className="eyebrow">Access Platform</div>
        <h1>Sign in to the reliability workspace</h1>
        <p className="subtle">
          IntelliMaintain Pro keeps fleet risk, maintenance execution, inventory readiness, and reporting aligned for plant
          teams that need to act faster with less noise.
        </p>
        <div className="auth-story__metrics">
          <article>
            <strong>01</strong>
            <span>Fleet health and anomaly visibility</span>
          </article>
          <article>
            <strong>02</strong>
            <span>Alert-to-work-order operating flow</span>
          </article>
          <article>
            <strong>03</strong>
            <span>Reports, facilities, and connector controls</span>
          </article>
        </div>
        <div className="auth-story__note">
          {authMode === "supabase"
            ? `Supabase live mode is active. Seeded personas use password ${defaultPassword}.`
            : "Demo mode is active. Select a seeded persona or sign in with email to create a demo session."}
        </div>
      </div>

      <div className="panel auth-form-card">
        <div className="auth-form-card__header">
          <div>
            <div className="eyebrow">Operator Sign In</div>
            <h2>Continue into the platform</h2>
          </div>
          <span className="pill">{authMode === "supabase" ? "Live auth" : "Demo auth"}</span>
        </div>

        <form
          className="stack"
          onSubmit={(event) => {
            event.preventDefault();
            void submitLogin({ email, password });
          }}
        >
          <input className="input" onChange={(event) => setEmail(event.target.value)} placeholder="Email" value={email} />
          <input className="input" onChange={(event) => setPassword(event.target.value)} placeholder="Password" type="password" value={password} />
          <button className="button" disabled={submitting} type="submit">
            {submitting ? "Signing in..." : "Sign in"}
          </button>
        </form>

        <div className="auth-divider">Seeded personas</div>

        <div className="auth-persona-grid">
          {users.map((user) => (
            <button
              className="auth-persona-card"
              key={user.id}
              onClick={() => {
                void submitLogin(
                  authMode === "supabase"
                    ? { email: user.email, password: defaultPassword }
                    : { demoUserId: user.id, email: user.email },
                );
              }}
              type="button"
            >
              <strong>{user.name}</strong>
              <span>{user.role}</span>
              <small>{user.email}</small>
            </button>
          ))}
        </div>

        {error ? <div className="error-state">{error}</div> : null}

        <div className="subtle">
          Need an account? <Link href="/signup">Create one</Link>
        </div>
      </div>
    </section>
  );
}

export function SignupPageView({ defaultPassword }: { defaultPassword: string }) {
  const [name, setName] = useState("Alex Mercer");
  const [email, setEmail] = useState("alex@intellimaintain.demo");
  const [password, setPassword] = useState(defaultPassword);
  const [role, setRole] = useState<(typeof users)[number]["role"]>("Maintenance Manager");
  const [facilityId, setFacilityId] = useState(facilities[0]?.id ?? "");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  return (
    <section className="auth-shell">
      <div className="panel panel--strong auth-story">
        <div className="eyebrow">Provision Access</div>
        <h1>Set up a new plant operator account</h1>
        <p className="subtle">
          Create a profile for planners, reliability engineers, technicians, or plant leadership. The same surface supports
          demo-mode walkthroughs and live Supabase-backed users.
        </p>
        <div className="auth-story__checklist">
          <div>Role-aware workspace access</div>
          <div>Facility-scoped operations context</div>
          <div>Immediate access to dashboard and execution flows</div>
        </div>
      </div>

      <div className="panel auth-form-card">
        <div className="auth-form-card__header">
          <div>
            <div className="eyebrow">Create Account</div>
            <h2>Provision platform access</h2>
          </div>
          <span className="pill">Secure onboarding</span>
        </div>

        <form
          className="stack"
          onSubmit={(event) => {
            event.preventDefault();
            setSubmitting(true);
            setError(null);
            void fetch("/api/auth/signup", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                name,
                email,
                password,
                role,
                facilityId,
              }),
            })
              .then(async (response) => {
                const body = (await response.json()) as { error?: string };
                if (!response.ok) {
                  throw new Error(body.error ?? "Unable to create account.");
                }
                window.location.assign("/dashboard");
              })
              .catch((signupError: Error) => {
                setError(signupError.message);
                setSubmitting(false);
              });
          }}
        >
          <input className="input" onChange={(event) => setName(event.target.value)} placeholder="Full name" value={name} />
          <input className="input" onChange={(event) => setEmail(event.target.value)} placeholder="Email" value={email} />
          <input className="input" onChange={(event) => setPassword(event.target.value)} placeholder="Password" type="password" value={password} />
          <select className="select" onChange={(event) => setRole(event.target.value as typeof role)} value={role}>
            <option value="Maintenance Manager">Maintenance Manager</option>
            <option value="Reliability Engineer">Reliability Engineer</option>
            <option value="Plant Director">Plant Director</option>
            <option value="Technician">Technician</option>
          </select>
          <select className="select" onChange={(event) => setFacilityId(event.target.value)} value={facilityId}>
            {facilities.map((facility) => (
              <option key={facility.id} value={facility.id}>
                {facility.name}
              </option>
            ))}
          </select>
          <button className="button" disabled={submitting} type="submit">
            {submitting ? "Creating account..." : "Create account"}
          </button>
        </form>

        {error ? <div className="error-state">{error}</div> : null}

        <div className="subtle">
          Already have access? <Link href="/login">Sign in</Link>
        </div>
      </div>
    </section>
  );
}

export function UnauthorizedPageView() {
  return (
    <section className="panel panel--strong auth-card">
      <div className="eyebrow">Access Restricted</div>
      <h1>You do not have permission for that route</h1>
      <p className="subtle">
        The current account is authenticated, but this section requires a different permission set. Move back to the shared
        workspace or switch to a role with broader access.
      </p>
      <div className="split">
        <Link className="button" href="/dashboard">
          Back to dashboard
        </Link>
        <Link className="button button--ghost" href="/login">
          Switch account
        </Link>
      </div>
    </section>
  );
}
