import { connectDatabase, disconnectDatabase } from "../config/database.ts";
import { loadConfig } from "../config/env.ts";
import { runSeed } from "./seed-data.ts";

let exitCode = 0;

try {
  const config = loadConfig();
  await connectDatabase(config.mongodbUri);
  const counts = await runSeed();
  console.info("Seed concluído sem duplicação:");
  console.table(counts);
} catch (error) {
  exitCode = 1;
  console.error("Falha ao executar o seed", error);
} finally {
  await disconnectDatabase();
}

process.exitCode = exitCode;
