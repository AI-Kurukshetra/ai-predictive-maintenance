"use client";

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
    <section className="panel panel--strong auth-card">
      <div className="eyebrow">Access Platform</div>
      <h1>Sign in to IntelliMaintain Pro</h1>
      <p className="subtle">
        {authMode === "supabase"
          ? `Use the seeded plant personas below or sign in directly with Supabase credentials. Seeded demo users use password ${defaultPassword}.`
          : "Jump into demo mode with one of the seeded plant personas, or sign in by email to create a demo session."}
      </p>

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

      <div className="auth-divider">Demo Personas</div>

      <div className="grid grid--two">
        {users.map((user) => (
          <button
            className="list-card auth-persona"
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
            <span className="subtle">{user.role}</span>
            <span className="subtle">{user.email}</span>
          </button>
        ))}
      </div>

      {error ? <div className="empty-state">{error}</div> : null}
      <div className="subtle">
        Need an account? <a href="/signup">Create one</a>
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
    <section className="panel panel--strong auth-card">
      <div className="eyebrow">Provision Access</div>
      <h1>Create an IntelliMaintain account</h1>
      <p className="subtle">
        This flow creates a Supabase-backed profile when credentials are configured, or a demo session profile otherwise.
      </p>

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

      {error ? <div className="empty-state">{error}</div> : null}
      <div className="subtle">
        Already have access? <a href="/login">Sign in</a>
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
        The current role is authenticated, but it does not include the permission required for this section of the platform.
      </p>
      <div className="split">
        <a className="button" href="/dashboard">
          Back to dashboard
        </a>
        <a className="button button--ghost" href="/login">
          Switch account
        </a>
      </div>
    </section>
  );
}
