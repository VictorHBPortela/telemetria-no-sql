import Koa from "koa";
import { bodyParser } from "@koa/bodyparser";
import type { AppConfig } from "./config/env.ts";
import { createControllers } from "./container.ts";
import { createAuthMiddleware } from "./middleware/auth.middleware.ts";
import { errorMiddleware } from "./middleware/error.middleware.ts";
import { statusMiddleware } from "./middleware/status.middleware.ts";
import { createHealthRouter, createRouter } from "./routes.ts";

export const createApp = (config: AppConfig): Koa => {
  const app = new Koa();
  const healthRouter = createHealthRouter();
  const apiRouter = createRouter(createControllers());

  app.use(errorMiddleware);
  app.use(statusMiddleware);
  app.use(createAuthMiddleware(config));
  app.use(bodyParser({ enableTypes: ["json"], jsonLimit: "1mb", jsonStrict: true }));
  app.use(healthRouter.routes());
  app.use(healthRouter.allowedMethods());
  app.use(apiRouter.routes());
  app.use(apiRouter.allowedMethods());

  return app;
};
