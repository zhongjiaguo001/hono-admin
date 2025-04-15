import { Context, Next } from "hono";
import { PrismaClient } from "@prisma/client";
import { config } from "../config";
import { logger } from "../utils/logger.utils";

const prisma = new PrismaClient();

/**
 * 操作日志中间件
 */
export async function operationLogMiddleware(c: Context, next: Next) {
  // 检查是否启用操作日志
  if (!config.logger.operation.enabled) {
    return next();
  }

  const startTime = Date.now();
  const path = c.req.path;
  const method = c.req.method;
  const ip =
    c.req.header("x-forwarded-for") || c.req.header("x-real-ip") || "127.0.0.1";
  const userAgent = c.req.header("user-agent") || "";
  const user = c.get("user");

  // 尝试获取请求参数
  let params: any = {};
  try {
    if (["POST", "PUT", "PATCH"].includes(method)) {
      const contentType = c.req.header("content-type") || "";
      if (contentType.includes("application/json")) {
        // 克隆请求以避免消费正文
        const clonedRequest = c.req.raw.clone();
        params = await clonedRequest.json().catch(() => ({}));
      }
    } else if (method === "GET") {
      const url = new URL(c.req.url);
      params = Object.fromEntries(url.searchParams.entries());
    }
  } catch (error) {
    // 忽略解析错误
    logger.debug("Failed to parse request params:", { error });
  }

  try {
    // 继续处理请求
    await next();

    // 记录操作日志
    const duration = Date.now() - startTime;
    // 从响应对象中获取状态码
    const status = c.res?.status || 200;

    await logOperation({
      userId: user?.id,
      ip,
      path,
      method,
      params: JSON.stringify(params),
      // userAgent,
      status,
      duration,
      description: getOperationDescription(path, method),
    });

    return;
  } catch (error) {
    // 记录错误日志
    const duration = Date.now() - startTime;

    // 安全地处理错误信息
    const errorMessage = error instanceof Error ? error.message : String(error);

    await logOperation({
      userId: user?.id,
      ip,
      path,
      method,
      params: JSON.stringify(params),
      // userAgent,
      status: 500,
      duration,
      description: getOperationDescription(path, method),
      result: JSON.stringify({ message: errorMessage }),
    });

    throw error;
  }
}

/**
 * 记录操作日志到数据库
 */
async function logOperation(data: any) {
  try {
    await prisma.operationLog.create({ data });
  } catch (error) {
    logger.error("Failed to save operation log:", {
      error: error instanceof Error ? error.message : String(error),
      data,
    });
  }
}

/**
 * 获取操作描述
 */
function getOperationDescription(path: string, method: string): string {
  // 根据路径和方法推断操作描述
  if (path.includes("/user")) {
    if (method === "GET") return "查询用户信息";
    if (method === "POST" && path.includes("/delete")) return "删除用户";
    if (method === "POST") return "创建/更新用户";
  } else if (path.includes("/role")) {
    if (method === "GET") return "查询角色信息";
    if (method === "POST" && path.includes("/delete")) return "删除角色";
    if (method === "POST") return "创建/更新角色";
  }
  // 可以继续添加更多路径匹配

  return `${method} ${path}`;
}
