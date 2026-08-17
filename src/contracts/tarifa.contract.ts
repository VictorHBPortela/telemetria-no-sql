import { z } from "zod";
import { isoDateSchema, nonNegativeNumberSchema } from "./common.ts";

const tarifaBaseSchema = z
  .object({
    codigo: z.string().trim().min(1).max(30),
    nome: z.string().trim().min(1).max(100),
    vigenciaInicio: isoDateSchema,
    vigenciaFim: isoDateSchema,
    ativa: z.boolean(),
  })
  .strict();

const tarifaConvencionalSchema = tarifaBaseSchema.extend({
  modalidade: z.literal("CONVENCIONAL"),
  precoKwh: nonNegativeNumberSchema,
});

const tarifaBrancaSchema = tarifaBaseSchema.extend({
  modalidade: z.literal("BRANCA"),
  precosKwh: z
    .object({
      foraPonta: nonNegativeNumberSchema,
      intermediario: nonNegativeNumberSchema,
      ponta: nonNegativeNumberSchema,
    })
    .strict(),
});

const tarifaDemandaSchema = tarifaBaseSchema.extend({
  modalidade: z.literal("DEMANDA"),
  precoKwh: nonNegativeNumberSchema,
  precoDemandaKw: nonNegativeNumberSchema,
});

export const tarifaInputSchema = z
  .discriminatedUnion("modalidade", [
    tarifaConvencionalSchema,
    tarifaBrancaSchema,
    tarifaDemandaSchema,
  ])
  .refine(
    (value) => value.vigenciaFim >= value.vigenciaInicio,
    { message: "vigenciaFim deve ser igual ou posterior a vigenciaInicio", path: ["vigenciaFim"] },
  );

export type TarifaInput = z.infer<typeof tarifaInputSchema>;
export type ModalidadeTarifa = TarifaInput["modalidade"];
