import { withApiPath } from "../../src/serverless-api.js";

export default function handler(req, res) {
  const id = typeof req.query?.id === "string" ? req.query.id : "";
  return withApiPath(`/api/property-types/${encodeURIComponent(id)}`)(req, res);
}