import { Hono } from "hono";
import { zValidator } from "@/middleware/validtor-wrapper";
import { emailService } from "@/utils/email";
import { sendVerificationCodeSchema, verifyCodeSchema } from "./validation";

const email = new Hono();

// 发送验证码
email.post(
  "/verification-code",
  zValidator("json", sendVerificationCodeSchema),
  async (c) => {
    try {
      const { email, purpose } = c.req.valid("json");

      // 调用邮件服务发送验证码
      const result = await emailService.sendVerificationCode(email, purpose);

      if (result.success) {
        return c.json({
          code: 200,
          message: result.message,
        });
      } else {
        return c.json(
          {
            code: 400,
            message: result.message,
          },
          400
        );
      }
    } catch (error) {
      console.error("Send verification code error:", error);
      return c.json(
        {
          code: 500,
          message: "发送验证码失败，服务器内部错误",
        },
        500
      );
    }
  }
);

// 验证验证码
email.post("/verify-code", zValidator("json", verifyCodeSchema), async (c) => {
  try {
    const { email, code, purpose } = c.req.valid("json");

    // 调用邮件服务验证验证码
    const result = await emailService.verifyCode(email, code, purpose);

    return c.json(
      {
        code: result.valid ? 200 : 400,
        message: result.message,
        valid: result.valid,
      },
      result.valid ? 200 : 400
    );
  } catch (error) {
    console.error("Verify code error:", error);
    return c.json(
      {
        code: 500,
        message: "验证码验证失败，服务器内部错误",
      },
      500
    );
  }
});

export default email;
