// src/modules/ai/ai.schema.ts
import { z } from "zod";

export const createSessionSchema = z.object({
  title: z
    .string()
    .min(1, "会话标题不能为空")
    .max(100, "会话标题不能超过100个字符"),
  modelId: z.string().optional(),
  firstMessage: z.string().optional(),
});

export const sendMessageSchema = z.object({
  sessionId: z.number().int().positive("会话ID必须是正整数"),
  content: z.string().min(1, "消息内容不能为空"),
});

export const sessionIdParamSchema = z.object({
  id: z.string().transform((val) => parseInt(val, 10)),
});

export const sessionListSchema = z.object({
  page: z
    .string()
    .or(z.number())
    .optional()
    .transform((val) => Number(val) || 1),
  pageSize: z
    .string()
    .or(z.number())
    .optional()
    .transform((val) => Number(val) || 50),
});
