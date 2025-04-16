// src/routes/api.routes.ts
import { Hono } from "hono";
import { createSystemModule } from "../modules/system";
import { createAuthModule } from "../modules/auth";
// 后续导入其他顶级模块如认证、公共功能等

// 创建API路由
export function createApiRoutes() {
  const router = new Hono();

  // 注册系统模块
  router.route("/system", createSystemModule());
  // 注册认证模块
  router.route("/auth", createAuthModule());

  // 后续会注册其他顶级模块

  return router;
}
