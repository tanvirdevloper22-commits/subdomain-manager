const BASE = process.env.VERCEL_API_BASE || "https://api.vercel.com";

export const MARK = "created-by-subdomain-manager";

function buildUrl(path) {
  const u = new URL(BASE + path);
  if (process.env.VERCEL_TEAM_ID) u.searchParams.set("teamId", process.env.VERCEL_TEAM_ID);
  return u;
}

async function call(path, { method = "GET", body, params } = {}) {
  if (!process.env.VERCEL_TOKEN || !process.env.DOMAIN) {
    throw new Error("VERCEL_TOKEN or DOMAIN environment variable is not set");
  }
  const url = buildUrl(path);
  if (params) for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);
  const res = await fetch(url, {
    method,
    headers: {
      Authorization: `Bearer ${process.env.VERCEL_TOKEN}`,
      "Content-Type": "application/json",
    },
    body: body ? JSON.stringify(body) : undefined,
    cache: "no-store",
  });
  const text = await res.text();
  let data = {};
  try {
    data = text ? JSON.parse(text) : {};
  } catch {
    data = { raw: text };
  }
  if (!res.ok) {
    let msg = data?.error?.message || data?.raw || `Vercel API error ${res.status}`;
    if (res.status === 403) {
      msg +=
        " The token must be created under the Vercel account or team that owns the domain, " +
        "and VERCEL_TEAM_ID must match that team (leave it unset for a personal account).";
    }
    const err = new Error(msg);
    err.status = res.status;
    throw err;
  }
  return data;
}

export async function listRecords() {
  const domain = process.env.DOMAIN;
  const all = [];
  let until;
  for (let i = 0; i < 10; i++) {
    const params = { limit: "100" };
    if (until) params.until = String(until);
    const data = await call(`/v4/domains/${domain}/records`, { params });
    const recs = data.records || [];
    all.push(...recs);
    until = data.pagination?.next;
    if (!until || recs.length === 0) break;
  }
  return all;
}

export async function createRecord({ name, type, value, ttl, mxPriority }) {
  const domain = process.env.DOMAIN;
  const body = { name, type, value, ttl: ttl || 60, comment: MARK };
  if (type === "MX") body.mxPriority = mxPriority ?? 10;
  return call(`/v2/domains/${domain}/records`, { method: "POST", body });
}

export async function deleteRecord(id) {
  const domain = process.env.DOMAIN;
  return call(`/v2/domains/${domain}/records/${encodeURIComponent(id)}`, { method: "DELETE" });
}
