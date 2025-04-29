// src/modules/system/menu/index.ts
import { Hono } from "hono";
import { authMiddleware, zodValidator, requirePermission } from "@/middleware";
import { MenuController } from "./menu.controller";
import {
  createMenuSchema,
  updateMenuSchema,
  menuQuerySchema,
} from "./menu.schema";

export function createMenuModule() {
  const router = new Hono();
  const controller = new MenuController();

  // 应用认证中间件
  router.use("*", authMiddleware);

  // 注册路由
  router.get(
    "/tree",
    zodValidator("query", menuQuerySchema),
    controller.getTree
  );

  router.post(
    "/",
    requirePermission("system:menu:create"),
    zodValidator("json", createMenuSchema),
    controller.create
  );

  router.put(
    "/:id",
    requirePermission("system:menu:update"),
    zodValidator("json", updateMenuSchema),
    controller.update
  );

  router.delete(
    "/:id",
    requirePermission("system:menu:delete"),
    controller.delete
  );

  router.get("/:id", requirePermission("system:menu:read"), controller.getInfo);

  router.get("/user/menus", controller.getUserMenus);

  router.get("/user/permissions", controller.getUserPermissions);

  return router;
}

export * from "./menu.schema";
export * from "./menu.service";
export * from "./menu.controller";
