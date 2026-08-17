import type { Middleware } from "koa";

export const statusMiddleware: Middleware = async (context, next): Promise<void> => {
  await next();
  if (context.status === 404 && context.body === undefined) {
    context.body = { erro: "Rota não encontrada" };
  } else if (context.status === 405) {
    context.body = { erro: "Método HTTP não permitido para esta rota" };
  } else if (context.status === 501) {
    context.body = { erro: "Método HTTP não implementado" };
  }
};
