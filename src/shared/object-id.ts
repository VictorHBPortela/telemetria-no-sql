import { Types, isValidObjectId } from "mongoose";
import { AppError } from "./app-error.ts";

export const parseObjectId = (value: string, field = "id"): Types.ObjectId => {
  if (!isValidObjectId(value)) {
    throw new AppError(400, `${field} deve ser um ObjectId válido`);
  }
  return new Types.ObjectId(value);
};
