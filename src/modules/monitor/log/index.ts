// src/modules/monitor/log/index.ts
import { Hono } from "hono";
import { authMiddleware, zodValidator, requirePermission } from "@/middleware";
import { OperlogController } from "./operlog/operlog.controller";
import { LogininforController } from "./logininfor/logininfor.controller";
import { operlogQuerySchema } from "./operlog/operlog.schema";
import { logininforQuerySchema } from "./logininfor/logininfor.schema";

// 创建日志模块路由
export function createLogModule() {
  const router = new Hono();

  // 操作日志路由
  const operlogRouter = new Hono();
  const operlogController = new OperlogController();

  operlogRouter.use("*", authMiddleware);

  // 查询操作日志列表
  operlogRouter.get(
    "/list",
    requirePermission("monitor:operlog:list"),
    zodValidator("query", operlogQuerySchema),
    operlogController.list
  );

  // 删除操作日志
  operlogRouter.delete(
    "/:ids",
    requirePermission("monitor:operlog:remove"),
    operlogController.delete
  );

  // 清空操作日志
  operlogRouter.delete(
    "/clean",
    requirePermission("monitor:operlog:remove"),
    operlogController.clean
  );

  // 导出操作日志
  operlogRouter.post(
    "/export",
    requirePermission("monitor:operlog:export"),
    operlogController.export
  );

  // 登录日志路由
  const logininforRouter = new Hono();
  const logininforController = new LogininforController();

  logininforRouter.use("*", authMiddleware);

  // 查询登录日志列表
  logininforRouter.get(
    "/list",
    requirePermission("monitor:logininfor:list"),
    zodValidator("query", logininforQuerySchema),
    logininforController.list
  );

  // 删除登录日志
  logininforRouter.delete(
    "/:ids",
    requirePermission("monitor:logininfor:remove"),
    logininforController.delete
  );

  // 清空登录日志
  logininforRouter.delete(
    "/clean",
    requirePermission("monitor:logininfor:remove"),
    logininforController.clean
  );

  // 解锁用户登录状态
  logininforRouter.post(
    "/unlock/:username",
    requirePermission("monitor:logininfor:unlock"),
    logininforController.unlock
  );

  // 导出登录日志
  logininforRouter.post(
    "/export",
    requirePermission("monitor:logininfor:export"),
    logininforController.export
  );

  // 注册路由
  router.route("/operlog", operlogRouter);
  router.route("/logininfor", logininforRouter);

  return router;
}

// 导出类型和函数
export * from "./operlog/operlog.schema";
export * from "./operlog/operlog.service";
export * from "./operlog/operlog.controller";
export * from "./logininfor/logininfor.schema";
export * from "./logininfor/logininfor.service";
export * from "./logininfor/logininfor.controller";
