// src/modules/system/user/user.schema.ts
import { z } from "zod";

// 创建用户验证模式
export const createUserSchema = z.object({
  username: z
    .string()
    .min(3, { message: "用户名长度至少为3个字符" })
    .max(20, { message: "用户名长度不能超过20个字符" }),
  password: z
    .string()
    .min(6, { message: "密码长度至少为6个字符" })
    .max(20, { message: "密码长度不能超过20个字符" }),
  nickname: z.string().optional(),
  email: z
    .string()
    .email({ message: "请输入有效的邮箱地址" })
    .optional()
    .nullable(),
  phone: z.string().optional().nullable(),
  qq: z.string().optional().nullable(),
  avatar: z.string().optional().nullable(),
  remark: z.string().optional().nullable(),
  deptId: z.number().optional().nullable(),
  status: z.string().default("1"),
  roleIds: z.array(z.number()).optional(),
});

// 更新用户验证模式
export const updateUserSchema = z.object({
  id: z.number({ required_error: "用户ID不能为空" }),
  nickname: z.string().optional(),
  email: z
    .string()
    .email({ message: "请输入有效的邮箱地址" })
    .optional()
    .nullable(),
  phone: z.string().optional().nullable(),
  qq: z.string().optional().nullable(),
  avatar: z.string().optional().nullable(),
  remark: z.string().optional().nullable(),
  deptId: z.number().optional().nullable(),
  status: z.string().optional(),
  roleIds: z.array(z.number()).optional(),
});

// 重置密码
export const resetPasswordSchema = z.object({
  id: z.number({ required_error: "用户ID不能为空" }),
  newPassword: z
    .string()
    .min(6, { message: "新密码长度至少为6个字符" })
    .max(20, { message: "新密码长度不能超过20个字符" }),
});

// 更新用户状态验证模式
export const updateUserStatusSchema = z.object({
  id: z.number({ required_error: "用户ID不能为空" }),
  status: z
    .string({ required_error: "状态不能为空" })
    .refine((val) => val === "0" || val === "1", {
      message: "状态只能为0或1",
    }),
});

// 查询用户验证模式
export const queryUserSchema = z.object({
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
  username: z.string().optional(),
  status: z
    .string()
    .or(z.number())
    .optional()
    .nullable()
    .transform((val) => (val === undefined || val === null ? null : val)),
  deptId: z
    .string()
    .or(z.number())
    .optional()
    .nullable()
    .transform((val) =>
      val === undefined || val === null ? null : Number(val)
    ),
  startTime: z.string().optional(),
  endTime: z.string().optional(),
});

// 用户个人信息更新验证模式
export const updateProfileSchema = z.object({
  nickname: z.string(),
  email: z.string().email({ message: "请输入有效的邮箱地址" }).nullable(),
  phonenumber: z.string().nullable(),
  sex: z.string().min(0).max(2).optional(),
});

// 修改密码验证模式
export const updatePasswordSchema = z.object({
  oldPassword: z.string().min(1, { message: "旧密码不能为空" }),
  newPassword: z
    .string()
    .min(6, { message: "新密码长度至少为6个字符" })
    .max(20, { message: "新密码长度不能超过20个字符" }),
});

export type ResetPasswordDto = z.infer<typeof resetPasswordSchema>;
export type UpdatePasswordDto = z.infer<typeof updatePasswordSchema>;
export type CreateUserDto = z.infer<typeof createUserSchema>;
export type UpdateUserDto = z.infer<typeof updateUserSchema>;
