import { Context, Next } from "hono";
import { verify } from "hono/jwt";
import { redisUtils } from "@/utils/redis.utils";
import { config } from "@/config";
import { logger } from "@/utils/logger.utils"; // 如果您有日志工具

// 定义JWT负载的类型
interface JWTPayload {
  jti: string;
  userId: number;
  username: string;
  iat: number;
  exp: number;
}

// 不需要认证的路径列表
const PUBLIC_PATHS = ["/auth/login", "/auth/register", "/docs", "/health"];

/**
 * 认证中间件 - 验证JWT token并检查Redis中是否存在对应记录
 */
export const authMiddleware = async (c: Context, next: Next) => {
  try {
    // 检查是否为公开路径
    const path = c.req.path;
    if (PUBLIC_PATHS.some((p) => path.startsWith(p))) {
      return next();
    }

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
      // 使用配置中的JWT密钥
      payload = (await verify(
        token,
        config.auth.jwtSecret
      )) as unknown as JWTPayload;
    } catch (error) {
      // 使用日志记录错误
      logger?.warn("JWT验证失败:", { error, path: c.req.path });

      // 区分过期和其他错误
      if (error instanceof Error && error.message.includes("expired")) {
        return c.json(
          {
            code: 401,
            message: "token已过期，请重新登录",
          },
          401
        );
      }

      return c.json(
        {
          code: 401,
          message: "无效的token",
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

    // 6. 检查令牌是否接近过期，如果是则自动刷新（可选）
    const now = Math.floor(Date.now() / 1000);
    const timeRemaining = payload.exp - now;
    const tokenLifetime = payload.exp - payload.iat;
    const refreshThreshold = tokenLifetime * 0.2; // 20%的剩余寿命

    if (timeRemaining < refreshThreshold) {
      // 这里可以添加令牌刷新逻辑
      // 例如生成新令牌并在响应头中返回
      // c.header('X-New-Token', newToken);
    }

    // 继续处理请求
    await next();
  } catch (error) {
    logger?.error("认证中间件错误:", error);
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
