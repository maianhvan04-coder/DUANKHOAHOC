import { z } from "zod";

const objectIdSchema = z
  .string()
  .trim()
  .regex(/^[0-9a-fA-F]{24}$/, "ID không hợp lệ");

const quantitySchema = z.coerce
  .number()
  .int("quantity phải là số nguyên")
  .min(1, "quantity phải >= 1");

const booleanLikeSchema = z
  .union([
    z.boolean(),
    z.literal("true"),
    z.literal("false"),
    z.literal("1"),
    z.literal("0"),
  ])
  .transform((value) => {
    if (typeof value === "boolean") return value;
    return value === "true" || value === "1";
  });

export const addItemSchema = z.object({
  body: z.object({
    courseId: objectIdSchema,
    quantity: quantitySchema.default(1),
  }),
});

export const updateItemQuantitySchema = z.object({
  params: z.object({
    courseId: objectIdSchema,
  }),
  body: z.object({
    quantity: quantitySchema,
  }),
});

export const toggleItemSelectedSchema = z.object({
  params: z.object({
    courseId: objectIdSchema,
  }),
  body: z.object({
    selected: booleanLikeSchema,
  }),
});

export const selectAllItemsSchema = z.object({
  body: z.object({
    selected: booleanLikeSchema,
  }),
});

export const removeItemSchema = z.object({
  params: z.object({
    courseId: objectIdSchema,
  }),
});

export type AddItemBody = z.infer<typeof addItemSchema>["body"];
export type UpdateItemQuantityBody = z.infer<
  typeof updateItemQuantitySchema
>["body"];
export type ToggleItemSelectedBody = z.infer<
  typeof toggleItemSelectedSchema
>["body"];
export type SelectAllItemsBody = z.infer<typeof selectAllItemsSchema>["body"];
export type RemoveItemParams = z.infer<typeof removeItemSchema>["params"];