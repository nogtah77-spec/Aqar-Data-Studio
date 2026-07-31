import app from "../../api-server/dist/app.mjs";

function ensureApiPrefix(req) {
  const url = typeof req.url === "string" ? req.url : "/";

  if (url === "/api" || url.startsWith("/api/")) {
    return;
  }

  req.url = `/api${url.startsWith("/") ? url : `/${url}`}`;
}

export default function handler(req, res) {
  ensureApiPrefix(req);
  return app(req, res);
}