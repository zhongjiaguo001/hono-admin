// src/routes/api.routes.ts
import { Hono } from "hono";
import { createSystemModule } from "../modules/system";
import { createAuthModule } from "../modules/auth";
import { createAIModule } from "../modules/ai";

// 创建API路由
export function createApiRoutes() {
  const router = new Hono();

  // 注册系统模块
  router.route("/system", createSystemModule());
  // 注册认证模块
  router.route("/auth", createAuthModule());
  // 注册AI对话模块
  router.route("/ai", createAIModule());

  return router;
}
