import type { Middleware } from "koa";
import mongoose, { mongo } from "mongoose";
import { ZodError } from "zod";
import { AppError } from "../shared/app-error.ts";

const zodDetails = (error: ZodError): Record<string, string> => {
  const details: Record<string, string> = {};
  for (const issue of error.issues) {
    const field = issue.path.length === 0 ? "body" : issue.path.join(".");
    details[field] = issue.message;
  }
  return details;
};

export const errorMiddleware: Middleware = async (context, next): Promise<void> => {
  try {
    await next();
  } catch (error) {
    if (error instanceof AppError) {
      context.status = error.status;
      context.body = {
        erro: error.message,
        ...(error.detalhes === undefined ? {} : { detalhes: error.detalhes }),
      };
      return;
    }
    if (error instanceof ZodError) {
      context.status = 400;
      context.body = { erro: "Dados de entrada inválidos", detalhes: zodDetails(error) };
      return;
    }
    if (error instanceof mongo.MongoServerError && error.code === 11_000) {
      context.status = 409;
      context.body = { erro: "Já existe um documento com os campos únicos informados" };
      return;
    }
    if (
      error instanceof mongoose.Error.ValidationError ||
      error instanceof mongoose.Error.StrictModeError ||
      error instanceof SyntaxError
    ) {
      context.status = 400;
      context.body = { erro: "Dados de entrada inválidos" };
      return;
    }
    console.error("Erro interno não tratado", error);
    context.status = 500;
    context.body = { erro: "Erro interno do servidor" };
  }
};
