const parsePort = (value: string): number => {
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed < 1 || parsed > 65_535) {
    throw new Error("PORT deve ser um número inteiro entre 1 e 65535");
  }
  return parsed;
};

export interface AppConfig {
  port: number;
  mongodbUri: string;
  securityUser: string;
  securityPassword: string;
}

export const loadConfig = (): AppConfig => ({
  port: parsePort(Bun.env.PORT ?? "8080"),
  mongodbUri: Bun.env.MONGODB_URI ?? "mongodb://localhost:27017/telemetria",
  securityUser: Bun.env.SECURITY_USER ?? "admin",
  securityPassword: Bun.env.SECURITY_PASSWORD ?? "admin123",
});
