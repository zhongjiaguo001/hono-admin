import { Context, Next } from "hono";

/**
 * 响应增强中间件 - 统一响应格式
 */
export async function responseEnhancer(c: Context, next: Next) {
  await next();

  // 只处理API响应，忽略静态文件等
  const contentType = c.res.headers.get("Content-Type");
  if (!contentType || !contentType.includes("application/json")) {
    return;
  }

  // 获取原始响应数据
  const originalResponse = await c.res.json();

  // 已经是标准格式则不处理
  if (
    originalResponse &&
    typeof originalResponse === "object" &&
    "code" in originalResponse
  ) {
    return c.json(originalResponse);
  }

  // 包装为标准响应格式
  return c.json({
    code: c.res.status,
    data: originalResponse,
    message: getStatusMessage(c.res.status),
  });
}

/**
 * 根据状态码获取消息
 */
function getStatusMessage(status: number): string {
  const messages: Record<number, string> = {
    200: "操作成功",
    201: "创建成功",
    400: "请求参数错误",
    401: "未授权访问",
    403: "权限不足",
    404: "资源不存在",
    500: "服务器内部错误",
  };

  return messages[status] || "操作完成";
}
