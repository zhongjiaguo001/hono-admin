// src/modules/system/user/index.ts
import { Hono } from "hono";
import { zodValidator } from "@/middleware/validtor-middleware";
import { AuthController } from "./auth.controller";
import { loginSchema } from "./auth.schema";

// 创建 auth 模块路由
export function createAuthModule() {
  const router = new Hono();
  const controller = new AuthController();

  // 注册路由
  router.post("/login", zodValidator("json", loginSchema), controller.login);
  router.post("/logout", controller.logout);
  router.get("/getCodeImg", controller.getCodeImg);
  return router;
}

// 导出类型和Schema，方便其他模块引用
export * from "./auth.types";
export * from "./auth.schema";
export * from "./auth.service";
export * from "./auth.controller";
