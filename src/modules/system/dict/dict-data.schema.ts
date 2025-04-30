// src/modules/system/dict/dict-data.schema.ts
import { z } from "zod";

// 创建字典数据验证
export const createDictDataSchema = z.object({
  dictType: z.string().min(1, "字典类型不能为空"),
  label: z
    .string()
    .min(1, "字典标签不能为空")
    .max(100, "字典标签不能超过100个字符"),
  value: z
    .string()
    .min(1, "字典键值不能为空")
    .max(100, "字典键值不能超过100个字符"),
  cssClass: z
    .string()
    .max(100, "样式属性不能超过100个字符")
    .optional()
    .nullable(),
  listClass: z
    .string()
    .max(100, "表格回显样式不能超过100个字符")
    .optional()
    .nullable(),
  sort: z.number().int().min(0, "显示顺序不能为负数").default(0),
  status: z.enum(["0", "1"]).default("0"),
  isDefault: z.enum(["Y", "N"]).default("N"),
  remark: z.string().max(500, "备注不能超过500个字符").optional().nullable(),
});

// 更新字典数据验证
export const updateDictDataSchema = createDictDataSchema.partial().extend({
  id: z.number().int(),
});

// 字典数据查询参数验证
export const dictDataQuerySchema = z.object({
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
  dictType: z.string().optional(),
  dictLabel: z.string().optional(),
  status: z.enum(["0", "1"]).optional(),
});

// 字典数据状态更新验证
export const dictDataStatusSchema = z.object({
  id: z.number().int(),
  status: z.enum(["0", "1"]),
});

export type CreateDictDataDto = z.infer<typeof createDictDataSchema>;
export type UpdateDictDataDto = z.infer<typeof updateDictDataSchema>;
export type DictDataQueryDto = z.infer<typeof dictDataQuerySchema>;
export type DictDataStatusDto = z.infer<typeof dictDataStatusSchema>;
