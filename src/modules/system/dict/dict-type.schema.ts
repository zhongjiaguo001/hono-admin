// src/modules/system/dict/dict-type.schema.ts
import { z } from "zod";

// 创建字典类型验证
export const createDictTypeSchema = z.object({
  name: z
    .string()
    .min(2, "字典名称不能少于2个字符")
    .max(100, "字典名称不能超过100个字符"),
  type: z
    .string()
    .min(2, "字典类型不能少于2个字符")
    .max(100, "字典类型不能超过100个字符")
    .regex(/^[a-z0-9_]+$/, "字典类型只能由小写字母、数字和下划线组成"),
  status: z.enum(["0", "1"]).default("0"),
  remark: z.string().max(500, "备注不能超过500个字符").optional().nullable(),
});

// 更新字典类型验证
export const updateDictTypeSchema = createDictTypeSchema.partial().extend({
  id: z.number().int(),
});

// 字典类型查询参数验证
export const dictTypeQuerySchema = z.object({
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
  name: z.string().optional(),
  type: z.string().optional(),
  status: z.enum(["0", "1"]).optional(),
  createTime: z.array(z.string()).optional(),
});

// 字典类型状态更新验证
export const dictTypeStatusSchema = z.object({
  id: z.number().int(),
  status: z.enum(["0", "1"]),
});

export type CreateDictTypeDto = z.infer<typeof createDictTypeSchema>;
export type UpdateDictTypeDto = z.infer<typeof updateDictTypeSchema>;
export type DictTypeQueryDto = z.infer<typeof dictTypeQuerySchema>;
export type DictTypeStatusDto = z.infer<typeof dictTypeStatusSchema>;
