import { z } from "zod";

export const isoDateSchema = z
  .string()
  .refine((value) => !Number.isNaN(Date.parse(value)), "Data deve estar no formato ISO 8601")
  .transform((value) => new Date(value));

export const positiveNumberSchema = z.number().finite().positive();
export const nonNegativeNumberSchema = z.number().finite().nonnegative();
export const objectIdStringSchema = z
  .string()
  .regex(/^[a-f\d]{24}$/i, "Deve ser um ObjectId válido");
