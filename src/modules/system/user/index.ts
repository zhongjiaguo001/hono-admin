// src/modules/system/user/index.ts
import { Hono } from "hono";
import { authMiddleware } from "@/middleware/auth.middleware";
import { requirePermission } from "@/middleware/permission.middleware";
import { zodValidator } from "@/middleware/validtor-middleware";
import { UserController } from "./user.controller";
import {
  createUserSchema,
  updateUserSchema,
  updatePasswordSchema,
  updateUserStatusSchema,
  queryUserSchema,
} from "./user.schema";

// 创建用户模块路由
export function createUserModule() {
  const router = new Hono();
  const controller = new UserController();

  // 应用认证中间件
  router.use("*", authMiddleware);

  // 注册路由

  // 公共路由 - 不需要额外权限
  router.get("/info", controller.getCurrentUser);
  router.post(
    "/password",
    zodValidator("json", updatePasswordSchema),
    controller.updatePassword
  );

  // 需要权限的路由
  router.get(
    "/list",
    requirePermission("system:user:list"),
    zodValidator("query", queryUserSchema),
    controller.list
  );

  router.get(
    "/info/:id",
    requirePermission("system:user:info"),
    controller.getById
  );
  // src/modules/system/user/index.ts (继续)
  router.get(
    "/infoByUsername/:username",
    requirePermission("system:user:info"),
    controller.getByUsername
  );

  router.post(
    "/",
    requirePermission("system:user:add"),
    zodValidator("json", createUserSchema),
    controller.create
  );

  router.post(
    "/update",
    requirePermission("system:user:update"),
    zodValidator("json", updateUserSchema),
    controller.update
  );

  router.post(
    "/delete",
    requirePermission("system:user:delete"),
    controller.delete
  );

  router.post(
    "/status",
    requirePermission("system:user:update"),
    zodValidator("json", updateUserStatusSchema),
    controller.updateStatus
  );

  router.get(
    "/:id/roles",
    requirePermission("system:user:info"),
    controller.getUserRoles
  );
  router.post(
    "/:id/roles",
    requirePermission("system:user:update"),
    controller.setUserRoles
  );

  return router;
}

// 导出类型和Schema，方便其他模块引用
export * from "./user.types";
export * from "./user.schema";
export * from "./user.service";
export * from "./user.controller";
