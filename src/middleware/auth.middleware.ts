import { timingSafeEqual } from "node:crypto";
import type { Middleware } from "koa";
import type { AppConfig } from "../config/env.ts";

const WRITE_METHODS = new Set(["POST", "PUT", "PATCH", "DELETE"]);

const secureEqual = (leftValue: string, rightValue: string): boolean => {
  const left = Buffer.from(leftValue);
  const right = Buffer.from(rightValue);
  return left.length === right.length && timingSafeEqual(left, right);
};

export const createAuthMiddleware = (config: AppConfig): Middleware =>
  async (context, next): Promise<void> => {
    if (!WRITE_METHODS.has(context.method)) {
      await next();
      return;
    }

    const authorization = context.get("authorization");
    const encoded = authorization.startsWith("Basic ") ? authorization.slice(6) : "";
    const decoded = encoded.length > 0 ? Buffer.from(encoded, "base64").toString("utf8") : "";
    const separatorIndex = decoded.indexOf(":");
    const username = separatorIndex >= 0 ? decoded.slice(0, separatorIndex) : "";
    const password = separatorIndex >= 0 ? decoded.slice(separatorIndex + 1) : "";

    if (
      !secureEqual(username, config.securityUser) ||
      !secureEqual(password, config.securityPassword)
    ) {
      context.set("WWW-Authenticate", 'Basic realm="telemetria"');
      context.status = 401;
      context.body = { erro: "Credenciais inválidas ou ausentes" };
      return;
    }

    await next();
  };
