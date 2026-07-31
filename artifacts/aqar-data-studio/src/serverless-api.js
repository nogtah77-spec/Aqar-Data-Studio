import app from "../../api-server/dist/app.mjs";

export function withApiPath(path) {
  return function handler(req, res) {
    req.url = path;
    return app(req, res);
  };
}

function firstQueryValue(value) {
  return Array.isArray(value) ? value[0] : value;
}

export function withPropertyPath(suffix = "") {
  return function handler(req, res) {
    const rawId = firstQueryValue(req.query?.id);
    if (typeof rawId !== "string" || rawId.trim() === "") {
      return res.status(400).json({ error: "Property identifier is required" });
    }

    req.url = `/api/properties/${encodeURIComponent(rawId)}${suffix}`;
    return app(req, res);
  };
}

export function withCustomerPath(suffix = "") {
  return function handler(req, res) {
    const rawId = firstQueryValue(req.query?.id);
    if (typeof rawId !== "string" || rawId.trim() === "") {
      return res.status(400).json({ error: "Customer identifier is required" });
    }

    req.url = `/api/customers/${encodeURIComponent(rawId)}${suffix}`;
    return app(req, res);
  };
}

export function withCustomerTagPath(suffix = "") {
  return function handler(req, res) {
    const rawId = firstQueryValue(req.query?.id);
    if (typeof rawId !== "string" || rawId.trim() === "") {
      return res.status(400).json({ error: "Customer tag identifier is required" });
    }

    req.url = `/api/customers/tags/${encodeURIComponent(rawId)}${suffix}`;
    return app(req, res);
  };
}

export default function handler(req, res) {
  const url = typeof req.url === "string" ? req.url : "/";

  if (url !== "/api" && !url.startsWith("/api/")) {
    req.url = `/api${url.startsWith("/") ? url : `/${url}`}`;
  }

  return app(req, res);
}