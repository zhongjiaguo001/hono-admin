// src/modules/system/post/post.schema.ts
import { z } from "zod";

// 创建岗位验证
export const createPostSchema = z.object({
  code: z
    .string()
    .min(2, "岗位编码不能少于2个字符")
    .max(50, "岗位编码不能超过50个字符"),
  name: z
    .string()
    .min(2, "岗位名称不能少于2个字符")
    .max(50, "岗位名称不能超过50个字符"),
  sort: z.number().int().min(0, "显示顺序不能为负数"),
  status: z.enum(["0", "1"]).default("0"),
  remark: z.string().max(500, "备注不能超过500个字符").optional().nullable(),
});

// 更新岗位验证
export const updatePostSchema = createPostSchema.partial().extend({
  id: z.number().int(),
});

// 岗位查询参数验证
export const postQuerySchema = z.object({
  page: z
    .string()
    .or(z.number())
    .optional()
    .transform((val) => Number(val) || 1),
  pageSize: z
    .string()
    .or(z.number())
    .optional()
    .transform((val) => Number(val) || 10),
  code: z.string().optional(),
  name: z.string().optional(),
  status: z.enum(["0", "1"]).optional(),
});

// 岗位状态更新验证
export const postStatusSchema = z.object({
  id: z.number().int(),
  status: z.enum(["0", "1"]),
});

export type CreatePostDto = z.infer<typeof createPostSchema>;
export type UpdatePostDto = z.infer<typeof updatePostSchema>;
export type PostQueryDto = z.infer<typeof postQuerySchema>;
export type PostStatusDto = z.infer<typeof postStatusSchema>;
