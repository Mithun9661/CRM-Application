const baseUrl = (process.env.BASE_URL || "https://crm-application-ahkr.onrender.com").replace(/\/$/, "");

async function check(name, url, expectedStatuses) {
  const response = await fetch(url, { redirect: "manual" });
  if (!expectedStatuses.includes(response.status)) {
    throw new Error(`${name} failed: expected ${expectedStatuses.join("/")}, got ${response.status}`);
  }
  console.log(`✓ ${name}: ${response.status}`);
  return response;
}

async function run() {
  console.log(`Running EnterpriseFlow CRM smoke checks against ${baseUrl}`);

  const healthResponse = await check("Health endpoint", `${baseUrl}/health`, [200]);
  const health = await healthResponse.json();
  if (health.status !== "ok" || health.database !== "connected") {
    throw new Error(`Health check degraded: ${JSON.stringify(health)}`);
  }

  await check("API root", `${baseUrl}/`, [200]);
  await check("Swagger docs", `${baseUrl}/api-docs/`, [200, 301, 302]);
  await check(
    "Protected dashboard rejects anonymous access",
    `${baseUrl}/crm/api/v1/dashboard`,
    [401, 403]
  );
  await check("Unknown route returns 404", `${baseUrl}/crm/api/v1/does-not-exist`, [404]);

  console.log("✓ Production smoke checks passed");
}

run().catch((error) => {
  console.error(`✗ Smoke test failed: ${error.message}`);
  process.exit(1);
});
