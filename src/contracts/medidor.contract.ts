import { z } from "zod";
import { objectIdStringSchema } from "./common.ts";

export const statusMedidorSchema = z.enum(["ATIVO", "DESATIVO"]);

export const medidorInputSchema = z
  .object({
    lojaId: objectIdStringSchema,
    numeroSerie: z.string().trim().min(1).max(50),
    status: statusMedidorSchema.default("ATIVO"),
  })
  .strict();

export type MedidorInput = z.infer<typeof medidorInputSchema>;
export type StatusMedidor = z.infer<typeof statusMedidorSchema>;
