// src/modules/role/schemas.ts
import { z } from "zod";

export const createRoleSchema = z.object({
  name: z
    .string()
    .min(2, "角色名称不能少于2个字符")
    .max(50, "角色名称不能超过50个字符"),
  value: z
    .string()
    .min(2, "角色标识不能少于2个字符")
    .max(50, "角色标识不能超过50个字符"),
  remark: z.string().max(200, "备注不能超过200个字符").nullable().optional(),
  status: z.number().int().min(0).max(1).optional(),
  isDefault: z.boolean().optional(),
  orderNo: z
    .number({
      required_error: "显示顺序不能为空",
      invalid_type_error: "显示顺序必须是一个数字",
    })
    .int()
    .min(0),
  menuIds: z.array(z.number().int()).optional(),
});

export const updateRoleSchema = createRoleSchema.partial().extend({
  id: z.number().int(),
});

export const roleIdSchema = z.object({
  id: z.number().int(),
});

export const roleStatusSchema = z.object({
  id: z.number({ required_error: "用户ID不能为空" }),
  status: z
    .number({ required_error: "状态不能为空" })
    .refine((val) => val === 0 || val === 1, {
      message: "状态只能为0或1",
    }),
});

export const rolePageSchema = z.object({
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
  code: z.string().optional(),
  status: z.boolean().optional(),
});

export const roleMenuSchema = z.object({
  roleId: z.number().int(),
  menuIds: z.array(z.number().int()),
});

export type CreateRoleDto = z.infer<typeof createRoleSchema>;
export type UpdateRoleDto = z.infer<typeof updateRoleSchema>;
export type RoleIdDto = z.infer<typeof roleIdSchema>;
export type RoleStatusDto = z.infer<typeof roleStatusSchema>;
export type RolePageDto = z.infer<typeof rolePageSchema>;
export type RoleMenuDto = z.infer<typeof roleMenuSchema>;
