// src/modules/monitor/index.ts
import { Hono } from "hono";
import { createLogModule } from "./log";

// 创建监控模块
export function createMonitorModule() {
  const router = new Hono();

  // 注册日志管理模块
  router.route("/", createLogModule());

  return router;
}

// 导出子模块
export * from "./log";
