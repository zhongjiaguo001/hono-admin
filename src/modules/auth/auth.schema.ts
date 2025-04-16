import { z } from "zod";

export const loginSchema = z.object({
  username: z
    .string()
    .min(2, "用户名至少需要三个字符")
    .max(30, "用户名不能超过三十个字符"),
  password: z.string().min(1, "密码不能为空"),
  captcha: z
    .string()
    .length(4, "验证码必须是4位")
    .regex(/^\d+$/, "验证码必须是数字"),
});
