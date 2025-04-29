// src/modules/system/user/index.ts
import { Hono } from "hono";
import { authMiddleware, requirePermission, zodValidator } from "@/middleware";
import { RoleController } from "./role.controller";
import {
  createRoleSchema,
  rolePageSchema,
  updateRoleSchema,
  roleStatusSchema,
} from "./role.schema";

export function createRoleModule() {
  const router = new Hono();
  const controller = new RoleController();

  router.use("*", authMiddleware);

  // 查询角色列表
  router.get(
    "/list",
    // requirePermission("system:role:list"),
    zodValidator("query", rolePageSchema),
    controller.list
  );

  // 创建角色
  router.post(
    "/create",
    // requirePermission("system:role:create"),
    zodValidator("json", createRoleSchema),
    controller.create
  );

  // 更新角色
  router.put(
    "/update/:id",
    // requirePermission("system:role:update"),
    zodValidator("json", updateRoleSchema),
    controller.update
  );

  // 删除角色
  router.delete(
    "/:id",
    // requirePermission("system:role:delete"),
    controller.delete
  );

  // 更新角色状态
  router.post(
    "/updateStatus",
    // requirePermission("system:role:update"),
    zodValidator("json", roleStatusSchema),
    controller.updateStatus
  );

  return router;
}

export * from "./role.schema";
export * from "./role.service";
export * from "./role.controller";
