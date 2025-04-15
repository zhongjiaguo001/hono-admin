import { Context, Next } from "hono";
import { ZodError } from "zod";
import { PrismaClientKnownRequestError } from "@prisma/client/runtime/library";
import { logger } from "../utils/logger.utils";
import { StatusCode } from "hono/utils/http-status";

// 首先定义自定义HTTP错误的接口
interface HttpError extends Error {
  status: number;
}

/**
 * 全局错误处理中间件
 */
export async function errorMiddleware(c: Context, next: Next) {
  try {
    await next();
  } catch (error: unknown) {
    logger.error("Application error:", {
      path: c.req.path,
      method: c.req.method,
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    });

    // 处理 Zod 验证错误 - 只返回第一个错误信息
    if (error instanceof ZodError) {
      const firstError = error.errors[0];
      const message = firstError
        ? `${firstError.path.join(".")}: ${firstError.message}`
        : "请求参数验证失败";

      return c.json(
        {
          code: 400,
          message,
        },
        400
      );
    }

    // 处理 Prisma 错误
    if (error instanceof PrismaClientKnownRequestError) {
      return handlePrismaError(c, error);
    }

    // 处理自定义HTTP错误
    if (
      error !== null &&
      typeof error === "object" &&
      "status" in error &&
      "message" in error
    ) {
      const httpError = error as HttpError;
      // 将数字状态码转换为有效的状态码
      let status: StatusCode;

      switch (httpError.status) {
        case 400:
          status = 400;
          break;
        case 401:
          status = 401;
          break;
        case 403:
          status = 403;
          break;
        case 404:
          status = 404;
          break;
        default:
          status = 500;
      }

      return c.json(
        {
          code: httpError.status,
          message: httpError.message,
        },
        status
      );
    }

    // 处理其他未知错误
    return c.json(
      {
        code: 500,
        message: "服务器内部错误",
      },
      500
    );
  }
}

/**
 * 处理 Prisma 错误
 */
function handlePrismaError(c: Context, error: PrismaClientKnownRequestError) {
  // 常见的 Prisma 错误代码处理
  switch (error.code) {
    case "P2002": // 唯一约束错误
      const target = (error.meta?.target as string[]) || [];
      return c.json(
        {
          code: 400,
          message: `${target.join(", ")} 已存在`,
        },
        400
      );
    case "P2025": // 记录不存在
      return c.json(
        {
          code: 404,
          message: "请求的资源不存在",
        },
        404
      );
    case "P2003": // 外键约束错误
      return c.json(
        {
          code: 400,
          message: "操作失败，存在关联数据",
        },
        400
      );
    default:
      return c.json(
        {
          code: 500,
          message: "数据库操作错误",
        },
        500
      );
  }
}
