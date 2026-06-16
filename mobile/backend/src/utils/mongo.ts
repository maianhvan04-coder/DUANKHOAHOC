// backend/src/utils/mongo.ts
import type { Types } from "mongoose";

export type ObjectId = Types.ObjectId;

// Doc tối thiểu có _id
export type WithMongoId = { _id: ObjectId | string };

// Kết quả sau khi convert: bỏ _id, thêm id: string
export type WithId<T> = Omit<T, "_id"> & { id: string };

/**
 * Convert mongoose doc/plain object có _id -> object có id (string)
 * - Copy hết field
 * - id = String(_id)
 * - delete _id
 */
export function toId<T extends WithMongoId>(doc: T): WithId<T> {
  const anyDoc: any = doc as any;

  const id = String(anyDoc._id);
  // nếu doc là mongoose document, đôi khi nó nằm trong _doc
  const plain = anyDoc._doc ? { ...anyDoc._doc } : { ...anyDoc };

  delete plain._id;

  return { ...plain, id };
}

/** Map list */
export function toIds<T extends WithMongoId>(docs: T[]): WithId<T>[] {
  return docs.map((d) => toId(d));
}