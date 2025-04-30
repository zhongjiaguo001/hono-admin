// src/modules/system/role/role.schema.ts
import { z } from "zod";

export const createRoleSchema = z.object({
  name: z
    .string()
    .min(2, "角色名称不能少于2个字符")
    .max(50, "角色名称不能超过50个字符"),
  key: z
    .string()
    .min(2, "角色权限标识不能少于2个字符")
    .max(50, "角色权限标识不能超过50个字符"),
  orderNo: z.number().int().min(0, "显示顺序不能为负数"),
  status: z.enum(["0", "1"]).default("0"),
  remark: z.string().max(500, "备注不能超过500个字符").optional().nullable(),
  menuIds: z.array(z.number().int()).optional(),
  deptIds: z.array(z.number().int()).optional(),
  dataScope: z.enum(["1", "2", "3", "4", "5"]).default("1"),
  menuCheckStrictly: z.number().int().min(0).max(1).default(1),
  deptCheckStrictly: z.number().int().min(0).max(1).default(1),
});

export const updateRoleSchema = createRoleSchema.partial().extend({
  id: z.number().int(),
});

export const roleStatusSchema = z.object({
  id: z.number().int(),
  status: z.enum(["0", "1"]),
});

export const roleQuerySchema = z.object({
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
  key: z.string().optional(),
  status: z.enum(["0", "1"]).optional(),
  createTime: z.array(z.string()).optional(),
});

export const roleIdSchema = z.object({
  id: z.number().int(),
});

// 分配角色数据权限
export const roleDataScopeSchema = z.object({
  id: z.number().int(),
  dataScope: z.enum(["1", "2", "3", "4", "5"]),
  deptIds: z.array(z.number().int()).optional(),
});

// 角色分配用户查询
export const allocatedUserQuerySchema = z.object({
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
  roleId: z.number().int(),
  username: z.string().optional(),
  phone: z.string().optional(),
});

// 角色分配用户操作
export const roleSelectUserSchema = z.object({
  roleId: z.number().int(),
  userIds: z.array(z.number().int()),
});

// 角色菜单关联
export const roleMenuSchema = z.object({
  roleId: z.number().int(),
  menuIds: z.array(z.number().int()),
});

export type CreateRoleDto = z.infer<typeof createRoleSchema>;
export type UpdateRoleDto = z.infer<typeof updateRoleSchema>;
export type RoleStatusDto = z.infer<typeof roleStatusSchema>;
export type RoleQueryDto = z.infer<typeof roleQuerySchema>;
export type RoleIdDto = z.infer<typeof roleIdSchema>;
export type RoleDataScopeDto = z.infer<typeof roleDataScopeSchema>;
export type AllocatedUserQueryDto = z.infer<typeof allocatedUserQuerySchema>;
export type RoleSelectUserDto = z.infer<typeof roleSelectUserSchema>;
export type RoleMenuDto = z.infer<typeof roleMenuSchema>;
