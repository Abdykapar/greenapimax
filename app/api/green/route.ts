// Server-side proxy to GREEN-API. The browser cannot call GREEN-API directly
// because of CORS, so the client sends credentials + method name here.

const ALLOWED_METHODS: Record<string, "GET" | "POST" | "DELETE"> = {
  getStateInstance: "GET",
  checkAccount: "POST",
  sendMessage: "POST",
  receiveNotification: "GET",
  deleteNotification: "DELETE",
};

type ProxyRequest = {
  apiUrl?: unknown;
  idInstance?: unknown;
  apiTokenInstance?: unknown;
  method?: unknown;
  pathSuffix?: unknown;
  query?: unknown;
  body?: unknown;
};

function badRequest(reason: string) {
  return Response.json({ error: reason }, { status: 400 });
}

// GREEN-API serves instances from both domains, e.g. https://7107.api.greenapi.com
const ALLOWED_DOMAINS = ["green-api.com", "greenapi.com"];

function isGreenApiHost(value: string) {
  try {
    const url = new URL(value);
    return (
      url.protocol === "https:" &&
      ALLOWED_DOMAINS.some((domain) => url.hostname === domain || url.hostname.endsWith(`.${domain}`))
    );
  } catch {
    return false;
  }
}

export async function POST(request: Request) {
  let payload: ProxyRequest;
  try {
    payload = await request.json();
  } catch {
    return badRequest("Invalid JSON");
  }

  const { apiUrl, idInstance, apiTokenInstance, method, pathSuffix, query, body } = payload;

  if (typeof apiUrl !== "string" || !isGreenApiHost(apiUrl)) {
    return badRequest("apiUrl must be an https://*.green-api.com or https://*.greenapi.com URL");
  }
  if (typeof idInstance !== "string" || !/^\d{4,20}$/.test(idInstance)) {
    return badRequest("idInstance must be numeric");
  }
  if (typeof apiTokenInstance !== "string" || !/^[A-Za-z0-9]{10,100}$/.test(apiTokenInstance)) {
    return badRequest("apiTokenInstance has invalid format");
  }
  if (typeof method !== "string" || !(method in ALLOWED_METHODS)) {
    return badRequest("Method is not allowed");
  }
  if (pathSuffix !== undefined && (typeof pathSuffix !== "string" || !/^\d+$/.test(pathSuffix))) {
    return badRequest("pathSuffix must be numeric");
  }

  const base = apiUrl.replace(/\/+$/, "");
  let target = `${base}/waInstance${idInstance}/${method}/${apiTokenInstance}`;
  if (pathSuffix) target += `/${pathSuffix}`;
  if (query && typeof query === "object") {
    const params = new URLSearchParams();
    for (const [key, value] of Object.entries(query)) {
      if (typeof value === "string" || typeof value === "number") params.set(key, String(value));
    }
    const qs = params.toString();
    if (qs) target += `?${qs}`;
  }

  const httpMethod = ALLOWED_METHODS[method];
  try {
    const upstream = await fetch(target, {
      method: httpMethod,
      headers: httpMethod === "POST" ? { "Content-Type": "application/json" } : undefined,
      body: httpMethod === "POST" ? JSON.stringify(body ?? {}) : undefined,
      cache: "no-store",
      signal: AbortSignal.timeout(70_000),
    });
    const text = await upstream.text();
    return new Response(text || "null", {
      status: upstream.status,
      headers: { "Content-Type": "application/json" },
    });
  } catch {
    return Response.json({ error: "GREEN-API is unreachable" }, { status: 502 });
  }
}
