import { Context, Next } from "hono";
import { verify } from "hono/jwt";
import { redisUtils } from "@/db/redis";

// JWT密钥，与登录时使用的相同
const JWT_SECRET = process.env.JWT_SECRET as string;

// 定义JWT负载的类型
interface JWTPayload {
  jti: string;
  userId: number;
  username: string;
  iat: number;
  exp: number;
}

/**
 * 认证中间件 - 验证JWT token并检查Redis中是否存在对应记录
 */
export const authMiddleware = async (c: Context, next: Next) => {
  try {
    // 1. 从请求头中获取Authorization
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

    // 2. 提取token
    const token = authHeader.split(" ")[1];

    // 3. 验证token
    let payload: JWTPayload;
    try {
      payload = (await verify(token, JWT_SECRET)) as unknown as JWTPayload;
    } catch (error) {
      return c.json(
        {
          code: 401,
          message: "无效的token或token已过期",
        },
        401
      );
    }

    // 4. 检查Redis中是否存在对应的token记录
    const redisKey = `user:${payload.userId}`;
    const storedToken = await redisUtils.get(redisKey);

    if (!storedToken || storedToken !== token) {
      return c.json(
        {
          code: 401,
          message: "token已失效，请重新登录",
        },
        401
      );
    }

    // 5. 将用户信息添加到上下文中，供后续路由处理程序使用
    c.set("user", {
      id: payload.userId,
      username: payload.username,
    });

    // 继续处理请求
    await next();
  } catch (error) {
    console.error("Auth middleware error:", error);
    return c.json(
      {
        code: 500,
        message: "服务器内部错误",
      },
      500
    );
  }
};

/**
 * 获取当前登录用户信息的辅助函数
 */
export const getCurrentUser = (c: Context) => {
  return c.get("user");
};
