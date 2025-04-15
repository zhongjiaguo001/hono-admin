// src/routes/index.ts
import { Hono } from "hono";
import { createApiRoutes } from "./api.routes";

// 创建主路由
export function createRoutes() {
  const router = new Hono();

  // 注册API路由
  router.route("/api", createApiRoutes());

  // 健康检查接口
  router.get("/health", (c) => {
    return c.json({
      code: 200,
      message: "OK",
      timestamp: new Date().toISOString(),
    });
  });

  return router;
}
