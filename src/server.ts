import type { Server } from "node:http";
import { createApp } from "./app.ts";
import { connectDatabase, disconnectDatabase } from "./config/database.ts";
import { loadConfig } from "./config/env.ts";

const config = loadConfig();
let server: Server | undefined;

const shutdown = async (signal: string): Promise<void> => {
  console.info(`Recebido ${signal}; encerrando aplicação`);
  if (server !== undefined) {
    await new Promise<void>((resolve, reject) => {
      server?.close((error) => {
        if (error) reject(error);
        else resolve();
      });
    });
  }
  await disconnectDatabase();
};

const start = async (): Promise<void> => {
  await connectDatabase(config.mongodbUri);
  const app = createApp(config);
  server = app.listen(config.port, () => {
    console.info(`API de telemetria disponível na porta ${config.port}`);
  });
};

process.once("SIGINT", () => {
  void shutdown("SIGINT").then(() => process.exit(0));
});
process.once("SIGTERM", () => {
  void shutdown("SIGTERM").then(() => process.exit(0));
});

await start();
