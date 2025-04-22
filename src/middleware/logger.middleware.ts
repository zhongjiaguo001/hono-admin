// logger.middleware.ts
import { Context, Next } from "hono";
import { User } from "@prisma/client"; // Import User type if needed
import { config } from "../config";
import { logger } from "../utils/logger.utils";
import { prisma } from "@/db/prisma";

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
  // const userAgent = c.req.header("user-agent") || ""; // 你模型里没有用到，可以注释掉或添加字段
  const user = c.get("user") as User | undefined; // 类型断言或检查

  // 尝试获取请求参数
  let params: any = {};
  try {
    if (["POST", "PUT", "PATCH"].includes(method)) {
      const contentType = c.req.header("content-type") || "";
      if (contentType.includes("application/json")) {
        const clonedRequest = c.req.raw.clone();
        params = await clonedRequest.json().catch(() => ({}));
      }
      // 可以添加对 form-data 的处理逻辑（如果需要记录）
    } else if (method === "GET") {
      const url = new URL(c.req.url);
      params = Object.fromEntries(url.searchParams.entries());
    }
  } catch (error) {
    logger.debug("Failed to parse request params:", { error });
  }

  try {
    // 继续处理请求
    await next();

    // 记录操作日志
    const duration = Date.now() - startTime;
    // 从响应对象中获取状态码
    const httpStatus = c.res?.status || 200;
    // 将 HTTP 状态码映射为操作状态（0正常 1异常）
    const operationStatus = httpStatus >= 400 ? 1 : 0;
    // 如果需要记录响应结果，可以在这里获取
    // let jsonResult = "";
    // try {
    //   if (c.res && c.res.headers.get('content-type')?.includes('application/json')) {
    //     // 注意：克隆响应可能比较复杂或不可行，取决于 Hono 的实现
    //     // const clonedResponse = c.res.clone();
    //     // jsonResult = JSON.stringify(await clonedResponse.json());
    //     // 简化处理：如果需要记录响应，可能需要在控制器层处理并传递给 context
    //   }
    // } catch (e) {
    //   logger.debug("Failed to parse response body for logging", e);
    // }

    // *** 修改这里：使用正确的字段名 ***
    await logOperation({
      userId: user?.id,
      operIp: ip, // ip -> operIp
      operUrl: path, // path -> operUrl
      requestMethod: method, // method -> requestMethod
      operParam: JSON.stringify(params), // params -> operParam
      status: operationStatus, // 使用映射后的状态
      costTime: duration, // duration -> costTime
      title: getOperationDescription(path, method), // description -> title
      operName: user?.username || "Anonymous", // 尝试获取用户名
      // operLocation: "", // 需要 IP 地址库来获取地理位置
      // deptName: user?.dept?.name || "", // 需要在 user 对象中包含部门信息
      operTime: new Date(), // 记录操作时间
      // jsonResult: jsonResult, // 如果记录了响应结果
    });
  } catch (error) {
    // 记录错误日志
    const duration = Date.now() - startTime;
    const errorMessage = error instanceof Error ? error.message : String(error);

    // *** 修改这里：使用正确的字段名，并将错误信息放入 errorMsg ***
    await logOperation({
      userId: user?.id,
      operIp: ip, // ip -> operIp
      operUrl: path, // path -> operUrl
      requestMethod: method, // method -> requestMethod
      operParam: JSON.stringify(params), // params -> operParam
      status: 1, // 错误状态为 1
      costTime: duration, // duration -> costTime
      title: getOperationDescription(path, method), // description -> title
      errorMsg: errorMessage, // 将错误信息存入 errorMsg
      operName: user?.username || "Anonymous",
      // operLocation: "",
      // deptName: user?.dept?.name || "",
      operTime: new Date(), // 记录操作时间
      // jsonResult: JSON.stringify({ error: errorMessage }), // 也可以在 jsonResult 中记录错误概要
    });

    // 重新抛出错误，以便上层框架处理
    throw error;
  }
}

/**
 * 记录操作日志到数据库
 * data 参数应符合 Prisma OperLogCreateInput 类型 （或至少是其子集）
 */
async function logOperation(data: any) {
  // 可以定义一个更精确的类型
  try {
    // 过滤掉值为 undefined 的字段，避免 Prisma 报错（除非模型允许 null）
    const validData = Object.entries(data).reduce((acc, [key, value]) => {
      if (value !== undefined) {
        acc[key] = value;
      }
      return acc;
    }, {} as any); // 使用 Prisma 的类型会更好 Prisma.OperLogCreateInput

    await prisma.operLog.create({
      data: validData,
    });
  } catch (error) {
    // 确保日志记录失败不会影响主流程，但要记录这个失败
    logger.error("Failed to save operation log:", {
      error:
        error instanceof Error
          ? error.message + (error.stack ? "\n" + error.stack : "")
          : String(error), // 包含堆栈信息可能更有用
      data: data, // 记录原始尝试的数据
    });
  }
}

/**
 * 获取操作描述 (保持不变)
 */
function getOperationDescription(path: string, method: string): string {
  // ... (你的逻辑)
  // 示例增强：可以更具体
  if (path.startsWith("/api/auth/login") && method === "POST")
    return "用户登录";
  if (path.startsWith("/api/user") && method === "GET") return "查询用户列表";
  if (path.startsWith("/api/user") && method === "POST") return "新增用户";
  if (path.startsWith("/api/user") && method === "PUT") return "修改用户";
  if (path.startsWith("/api/user/") && method === "DELETE") return "删除用户"; // 注意路径可能包含 ID
  // ... 其他规则
  return `${method} ${path}`; // 默认描述
}
