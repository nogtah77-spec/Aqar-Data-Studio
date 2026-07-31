import app from "../../api-server/dist/app.mjs";

export function withApiPath(path) {
  return function handler(req, res) {
    req.url = path;
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