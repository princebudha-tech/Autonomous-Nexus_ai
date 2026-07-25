import { Router, type IRouter } from "express";
import healthRouter from "./health";
import anthropicRouter from "./anthropic";
import {
  memoryRouter,
  agentsRouter,
  sandboxRouter,
  actionsRouter,
  telemetryRouter,
  logsRouter,
} from "./nexus";

const router: IRouter = Router();

router.use(healthRouter);
router.use(anthropicRouter);
router.use(memoryRouter);
router.use(agentsRouter);
router.use(sandboxRouter);
router.use(actionsRouter);
router.use(telemetryRouter);
router.use(logsRouter);

export default router;
