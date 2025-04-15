// src/modules/users/user.validation.ts
import { z } from "zod";

// 创建用户的校验 Schema
export const createUserSchema = z
  .object({
    username: z
      .string({
        required_error: "用户名是必填项",
        invalid_type_error: "用户名必须是字符串",
      })
      .min(2, "用户名至少需要三个字符")
      .max(30, "用户名不能超过三十个字符"),
    password: z
      .string({
        required_error: "密码是必填项",
      })
      .min(6, "密码至少需要6个字符"),
    nickname: z.string().optional(), // 昵称是可选的
    email: z.string().email("邮箱格式不正确").nullish(), // 邮箱可以是undefined或null，如果提供值则必须符合email格式
    phone: z
      .string()
      .regex(/^\d{11}$/, "手机号码格式无效（必须为 11 位数）")
      .nullish(), // 手机号可以是undefined或null，如果提供值则必须是11位数字
    // status 字段通常由后端设置，不从客户端接收
  })
  .strict(); // 使用 .strict() 确保不会有多余的字段传入

// 更新用户的校验 Schema
export const updateUserSchema = z
  .object({
    id: z.number({
      required_error: "用户ID是必填项",
      invalid_type_error: "用户ID必须是数字",
    }),
    username: z
      .string({
        required_error: "用户名是必填项",
        invalid_type_error: "用户名必须是字符串",
      })
      .min(2, "用户名至少需要三个字符")
      .max(30, "用户名不能超过三十个字符"),
    nickname: z.string().optional(), // 昵称是可选的
    email: z.string().email("邮箱格式不正确").nullish(), // 邮箱可以是undefined或null，如果提供值则必须符合email格式
    phone: z
      .string()
      .regex(/^\d{11}$/, "手机号码格式无效（必须为 11 位数）")
      .nullish(), // 手机号可以是undefined或null，如果提供值则必须是11位数字
    status: z.number().int().min(0).max(1).default(1), // 状态：1正常 0禁用
    dept: z
      .object({
        id: z.number(),
      })
      .nullish(), // 部门对象可以为null
    roles: z
      .array(
        z.object({
          id: z.number(),
        })
      )
      .nullish(), // 角色对象数组，可以为null
  })
  .strict();
// 用户状态切换的校验 Schema
export const toggleUserStatusSchema = z
  .object({
    status: z
      .number()
      .int()
      .min(0, "状态值必须是0或1")
      .max(1, "状态值必须是0或1")
      .describe("用户状态：1正常 0禁用"),
  })
  .strict();

// 重置密码的校验 Schema
export const resetPasswordSchema = z
  .object({
    newPassword: z
      .string({
        required_error: "新密码是必填项",
      })
      .min(6, "新密码至少需要6个字符")
      .max(30, "新密码不能超过30个字符"),
  })
  .strict();

// 分配角色的校验 Schema
export const assignRolesSchema = z
  .object({
    roleIds: z
      .array(
        z.number({
          required_error: "角色ID必须是数字",
          invalid_type_error: "角色ID必须是数字",
        })
      )
      .min(1, "至少需要分配一个角色"),
  })
  .strict();
