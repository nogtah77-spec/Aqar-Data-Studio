import express from "express";
import cors from "cors";
import { pinoHttp } from "pino-http";
import router from "./routes/index.js";
import { logger } from "./lib/logger.js";

type ExpressAppWithUse = ReturnType<typeof express> & {
  use: (...args: any[]) => ExpressAppWithUse;
};

const app = express() as ExpressAppWithUse;

app.use(
  pinoHttp({
    logger,
    serializers: {
      req(req) {
        return {
          id: req.id,
          method: req.method,
          url: req.url?.split("?")[0],
        };
      },
      res(res) {
        return {
          statusCode: res.statusCode,
        };
      },
    },
  }),
);
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// The Replit/Vercel path router can either preserve the /api prefix or strip
// it before handing the request to this service. Keep the canonical mount
// first, then accept the stripped form as a compatibility fallback so both
// property details and mutation endpoints resolve consistently.
app.use("/api", router);
app.use("/", router);

export default app;
