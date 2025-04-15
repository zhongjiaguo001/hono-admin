// src/modules/auth/auth.controller.ts
import { Context } from "hono";
import { AuthService } from "./auth.service";
import { LoginDto } from "./auth.types";

export class AuthController {
  private authService: AuthService;

  constructor() {
    this.authService = new AuthService();
  }

  /**
   * 获取验证码
   */
  getCodeImg = async (c: Context) => {
    try {
      const clientIP =
        c.req.header("x-forwarded-for") ||
        c.req.header("x-real-ip") ||
        "unknown";

      const imageBase64 = await this.authService.getCodeImg(clientIP);

      return c.json({
        code: 200,
        message: "获取验证码成功",
        data: imageBase64,
      });
    } catch (error) {
      return c.json(
        {
          code: 500,
          message: error instanceof Error ? error.message : "获取验证码失败",
        },
        500
      );
    }
  };

  /**
   * 用户登录
   */
  login = async (c: Context) => {
    try {
      const loginDto = (await c.req.json()) as LoginDto;
      const clientIP =
        c.req.header("x-forwarded-for") ||
        c.req.header("x-real-ip") ||
        "unknown";

      const token = await this.authService.login(loginDto, clientIP);

      return c.json({
        code: 200,
        message: "登录成功",
        data: token,
      });
    } catch (error) {
      return c.json(
        {
          code: 500,
          message: error instanceof Error ? error.message : "登录失败",
        },
        500
      );
    }
  };

  /**
   * 退出登录
   */
  logout = async (c: Context) => {
    try {
      const authHeader = c.req.header("Authorization");

      if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return c.json(
          {
            code: 401,
            message: "未授权，请先登录",
          },
          401
        );
      }

      const token = authHeader.split(" ")[1];
      await this.authService.logout(token);

      return c.json({
        code: 200,
        message: "退出登录成功",
      });
    } catch (error) {
      return c.json(
        {
          code: 500,
          message: error instanceof Error ? error.message : "退出登录失败",
        },
        500
      );
    }
  };
}
