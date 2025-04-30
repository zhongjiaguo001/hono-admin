// src/modules/system/dept/dept.schema.ts
import { z } from "zod";

export const createDeptSchema = z.object({
  parentId: z.number().int().nullable().optional().default(0), // 默认为0表示顶级部门
  name: z
    .string()
    .min(2, "部门名称不能少于2个字符")
    .max(50, "部门名称不能超过50个字符"),
  orderNo: z.number().int().min(0, "显示顺序不能为负数"),
  leader: z.string().optional().nullable(),
  phone: z.string().optional().nullable(),
  email: z.string().email("请输入有效的邮箱地址").optional().nullable(),
  status: z.enum(["0", "1"]).default("0"),
});

export const updateDeptSchema = createDeptSchema.partial().extend({
  id: z.number().int(),
});

export const deptQuerySchema = z.object({
  name: z.string().optional(),
  status: z.enum(["0", "1"]).optional(),
  parentId: z.number().int().optional(),
});

export type CreateDeptDto = z.infer<typeof createDeptSchema>;
export type UpdateDeptDto = z.infer<typeof updateDeptSchema>;
export type DeptQueryDto = z.infer<typeof deptQuerySchema>;
