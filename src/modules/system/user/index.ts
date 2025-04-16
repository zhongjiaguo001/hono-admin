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

  // 更新用户密码
  router.patch(
    "/:id/password",
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

  // 根据ID获取用户信息
  router.get(
    "/info/:id",
    requirePermission("system:user:info"),
    controller.getById
  );

  // 根据用户名获取用户信息
  router.get(
    "/infoByUsername/:username",
    requirePermission("system:user:info"),
    controller.getByUsername
  );

  // 创建用户
  router.post(
    "/",
    requirePermission("system:user:add"),
    zodValidator("json", createUserSchema),
    controller.create
  );

  // 更新用户
  router.post(
    "/update",
    requirePermission("system:user:update"),
    zodValidator("json", updateUserSchema),
    controller.update
  );

  // 删除用户
  router.delete(
    "/:id",
    requirePermission("system:user:delete"),
    controller.delete
  );

  // 更新用户状态
  router.post(
    "/status",
    requirePermission("system:user:update"),
    zodValidator("json", updateUserStatusSchema),
    controller.updateStatus
  );

  // 获取用户角色 - 已从用户列表接口获取，无需单独调用
  // 用户列表和用户详情接口已包含角色信息，前端可直接使用

  // 设置用户角色
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
