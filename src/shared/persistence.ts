import type { Types } from "mongoose";

export interface PersistedDocument {
  _id: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}
