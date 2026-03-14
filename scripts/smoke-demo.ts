import { seededSupabaseDemoPassword } from "../src/lib/auth/constants.ts";

type HeadersLike = Record<string, string>;

async function request(
  url: string,
  options: RequestInit = {},
  cookie = "",
) {
  const headers = new Headers(options.headers);
  if (cookie) {
    headers.set("cookie", cookie);
  }
  const response = await fetch(url, {
    ...options,
    headers,
    redirect: "manual",
  });
  return response;
}

async function run() {
  const baseUrl = process.env.APP_URL ?? "http://127.0.0.1:3000";

  const loginPage = await request(`${baseUrl}/login`);
  if (loginPage.status !== 200) {
    throw new Error(`Expected /login to return 200, received ${loginPage.status}`);
  }

  const loginAttempts = [
    {
      label: "supabase-seeded-user",
      payload: {
        email: "maya@intellimaintain.demo",
        password: seededSupabaseDemoPassword,
      },
    },
    {
      label: "demo-session-user",
      payload: {
        demoUserId: "usr-1",
        email: "maya@intellimaintain.demo",
      },
    },
  ];

  let loginResponse: Response | null = null;
  const loginFailures: string[] = [];
  for (const attempt of loginAttempts) {
    const response = await request(`${baseUrl}/api/auth/login`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
      } satisfies HeadersLike,
      body: JSON.stringify(attempt.payload),
    });

    if (response.status === 200) {
      loginResponse = response;
      break;
    }

    loginFailures.push(`${attempt.label}:${response.status}`);
  }

  if (!loginResponse) {
    throw new Error(`Expected login to return 200, received failures ${loginFailures.join(", ")}`);
  }

  const setCookie = loginResponse.headers.get("set-cookie");
  if (!setCookie) {
    throw new Error("Login response did not include a session cookie.");
  }
  const cookie = setCookie.split(";")[0];

  const dashboardResponse = await request(`${baseUrl}/dashboard`, {}, cookie);
  if (dashboardResponse.status !== 200) {
    throw new Error(`Expected /dashboard to return 200 after login, received ${dashboardResponse.status}`);
  }

  const bootstrapResponse = await request(`${baseUrl}/api/bootstrap`, {}, cookie);
  const bootstrap = (await bootstrapResponse.json()) as {
    currentUser: { id: string; email?: string } | null;
    alerts: Array<{ id: string; status: string }>;
    workOrders: Array<{ id: string; sourceAlertId?: string }>;
  };

  if (bootstrap.currentUser?.email !== "maya@intellimaintain.demo") {
    throw new Error("Bootstrap did not return the expected signed-in user.");
  }

  const alertId = bootstrap.alerts[0]?.id;
  if (!alertId) {
    throw new Error("Bootstrap returned no alerts to test.");
  }

  const acknowledgeResponse = await request(
    `${baseUrl}/api/alerts/${alertId}`,
    {
      method: "PATCH",
      headers: {
        "content-type": "application/json",
      } satisfies HeadersLike,
      body: JSON.stringify({ status: "Acknowledged" }),
    },
    cookie,
  );
  if (acknowledgeResponse.status !== 200) {
    throw new Error(`Expected alert patch to return 200, received ${acknowledgeResponse.status}`);
  }

  const createWorkOrderResponse = await request(
    `${baseUrl}/api/work-orders`,
    {
      method: "POST",
      headers: {
        "content-type": "application/json",
      } satisfies HeadersLike,
      body: JSON.stringify({ alertId }),
    },
    cookie,
  );
  if (createWorkOrderResponse.status !== 200) {
    throw new Error(`Expected work order creation to return 200, received ${createWorkOrderResponse.status}`);
  }

  const createdWorkOrderPayload = (await createWorkOrderResponse.json()) as {
    workOrder: { id: string; status: string };
  };
  if (!createdWorkOrderPayload.workOrder.id) {
    throw new Error("Work order creation did not return an id.");
  }

  const seededWorkOrderId = bootstrap.workOrders[0]?.id;
  if (!seededWorkOrderId) {
    throw new Error("Bootstrap returned no seeded work orders to patch.");
  }

  const statusUpdateResponse = await request(
    `${baseUrl}/api/work-orders/${seededWorkOrderId}`,
    {
      method: "PATCH",
      headers: {
        "content-type": "application/json",
      } satisfies HeadersLike,
      body: JSON.stringify({ status: "In Progress" }),
    },
    cookie,
  );
  if (statusUpdateResponse.status !== 200) {
    throw new Error(`Expected work order patch to return 200, received ${statusUpdateResponse.status}`);
  }

  console.log("Smoke test passed: login, bootstrap, alert mutation, work-order creation, and work-order status update.");
}

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
