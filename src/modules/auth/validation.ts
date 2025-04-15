import { z } from "zod";

export const loginSchema = z.object({
  username: z
    .string()
    .min(2, "用户名至少需要三个字符")
    .max(30, "用户名不能超过三十个字符"),
  password: z.string().min(6, "密码至少需要6个字符"),
  captcha: z
    .string()
    .length(6, "验证码必须是6位")
    .regex(/^\d+$/, "验证码必须是数字"),
});
