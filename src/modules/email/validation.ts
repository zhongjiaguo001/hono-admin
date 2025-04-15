import { z } from "zod";

// 发送验证码请求验证模式
export const sendVerificationCodeSchema = z.object({
  email: z.string().email("邮箱格式不正确"),
  purpose: z.enum(["register", "reset_password", "change_email", "login"], {
    errorMap: () => ({ message: "用途类型不正确" }),
  }),
});

// 验证验证码请求验证模式
export const verifyCodeSchema = z.object({
  email: z.string().email("邮箱格式不正确"),
  code: z
    .string()
    .length(6, "验证码必须是6位数字")
    .regex(/^\d+$/, "验证码必须是数字"),
  purpose: z.enum(["register", "reset_password", "change_email", "login"], {
    errorMap: () => ({ message: "用途类型不正确" }),
  }),
});
