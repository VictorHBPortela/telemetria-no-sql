import type { RouterContext } from "@koa/router";
import { AppError } from "./app-error.ts";

export type ApiContext = RouterContext;

export const routeParam = (context: ApiContext, name: string): string => {
  const value = context.params[name];
  if (value === undefined || value.length === 0) {
    throw new AppError(400, `Parâmetro ${name} não informado`);
  }
  return value;
};
