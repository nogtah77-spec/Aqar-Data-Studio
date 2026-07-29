import { Router } from "express";
import { healthRouter } from "./health.js";
import { propertiesRouter } from "./properties.js";
import { regionsRouter } from "./regions.js";
import { propertyTypesRouter } from "./propertyTypes.js";
import { lookupOptionsRouter } from "./lookupOptions.js";
import { dashboardRouter } from "./dashboard.js";
import { usersRouter } from "./users.js";
import { auditLogsRouter } from "./auditLogs.js";
import { settingsRouter } from "./settings.js";
import { searchRouter } from "./search.js";

export const router = Router();
export default router;

router.use("/", healthRouter);
router.use("/properties", propertiesRouter);
router.use("/regions", regionsRouter);
router.use("/property-types", propertyTypesRouter);
router.use("/lookup-options", lookupOptionsRouter);
router.use("/dashboard", dashboardRouter);
router.use("/users", usersRouter);
router.use("/audit-logs", auditLogsRouter);
router.use("/settings", settingsRouter);
router.use("/search", searchRouter);
