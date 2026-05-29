import { z } from "zod";

export const messageIdParamSchema = z.object({
  id: z
    .string()
    .trim()
    .regex(/^c[a-z0-9]{10,}$/i, "Message id must be a valid cuid-style identifier")
});

export const messageQuerySchema = z.object({
  status: z.enum(["OPEN", "REPLIED", "DELETED"]).optional()
});

export const createMessageSchema = z
  .object({
    filmId: z
      .string()
      .trim()
      .regex(/^c[a-z0-9]{10,}$/i, "Film id must be a valid cuid-style identifier"),
    subject: z.string().trim().min(1).max(160),
    body: z.string().trim().min(1).max(5000)
  })
  .strict();

export const replyMessageSchema = z
  .object({
    replyBody: z.string().trim().min(1).max(5000)
  })
  .strict();

export type CreateMessageInput = z.infer<typeof createMessageSchema>;
export type ReplyMessageInput = z.infer<typeof replyMessageSchema>;
export type MessageQueryInput = z.infer<typeof messageQuerySchema>;
