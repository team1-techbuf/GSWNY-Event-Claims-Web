import cors from "cors";
import express, {NextFunction, Request, Response} from "express";
import {requireAppUser} from "./auth";
import {eventsRouter} from "./routes/events";
import {meRouter} from "./routes/me";
import {schoolsRouter} from "./routes/schools";
import {SheetsService} from "./sheets";
import {ApiError, splitCsv} from "./utils";

export function createApp(): express.Express {
  const app = express();
  const sheets = new SheetsService();
  const protectedRoute = requireAppUser(sheets);
  const router = express.Router();

  app.use(cors({
    origin: corsOrigin,
    credentials: true,
  }));
  app.use(express.json());

  router.get("/health", (_req, res) => {
    res.json({
      ok: true,
      service: "gswny-event-claims-api",
    });
  });

  router.use("/me", protectedRoute, meRouter());
  router.use("/schools", protectedRoute, schoolsRouter(sheets));
  router.use("/events", protectedRoute, eventsRouter(sheets));

  app.use("/", router);
  app.use("/api", router);

  app.use((_req, _res, next) => {
    next(new ApiError(404, "Not found."));
  });

  app.use(errorHandler);

  return app;
}

function corsOrigin(
  origin: string | undefined,
  callback: (err: Error | null, allow?: boolean) => void,
): void {
  const allowedOrigins = new Set([
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    ...splitCsv(process.env.ALLOWED_ORIGINS),
  ]);

  if (!origin || allowedOrigins.has(origin)) {
    callback(null, true);
    return;
  }

  callback(null, false);
}

function errorHandler(
  error: unknown,
  _req: Request,
  res: Response,
  next: NextFunction,
): void {
  void next;
  const status = error instanceof ApiError ? error.status : 500;
  const message = error instanceof Error ? error.message : "Unexpected error.";

  res.status(status).json({
    error: {
      message,
      status,
    },
  });
}
