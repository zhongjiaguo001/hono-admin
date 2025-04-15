import { z } from "zod";

// 创建角色的验证规则
export const createRoleSchema = z.object({
  name: z
    .string()
    .min(2, "角色名称不能少于2个字符")
    .max(50, "角色名称不能超过50个字符"),
  value: z
    .string()
    .min(2, "角色标识不能少于2个字符")
    .max(50, "角色标识不能超过50个字符"),
  remark: z.string().max(200, "备注不能超过200个字符").optional(),
  status: z.number().int().min(0).max(1).optional(),
  isDefault: z.boolean().optional(),
  orderNo: z
    .number({
      required_error: "显示顺序不能为空",
      invalid_type_error: "显示顺序必须是一个数字",
    })
    .int()
    .min(0),
});

// 更新角色的验证规则
export const updateRoleSchema = z.object({
  name: z
    .string()
    .min(2, "角色名称不能少于2个字符")
    .max(50, "角色名称不能超过50个字符")
    .optional(),
  value: z
    .string()
    .min(2, "角色标识不能少于2个字符")
    .max(50, "角色标识不能超过50个字符")
    .optional(),
  remark: z.string().max(200, "备注不能超过200个字符").nullish(),
  status: z.number().int().min(0).max(1).optional(),
  isDefault: z.boolean().optional(),
  orderNo: z
    .number({
      required_error: "显示顺序不能为空",
      invalid_type_error: "显示顺序必须是一个数字",
    })
    .int()
    .min(0),
});
