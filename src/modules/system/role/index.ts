// src/modules/system/role/index.ts
import { Hono } from "hono";
import { authMiddleware, zodValidator, requirePermission } from "@/middleware";
import { RoleController } from "./role.controller";
import {
  createRoleSchema,
  updateRoleSchema,
  roleQuerySchema,
  roleStatusSchema,
  roleDataScopeSchema,
  allocatedUserQuerySchema,
  roleSelectUserSchema,
  roleMenuSchema,
} from "./role.schema";

export function createRoleModule() {
  const router = new Hono();
  const controller = new RoleController();

  // 应用认证中间件
  router.use("*", authMiddleware);

  // 获取角色列表
  router.get(
    "/list",
    requirePermission("system:role:list"),
    zodValidator("query", roleQuerySchema),
    controller.list
  );

  // 获取角色详情
  router.get(
    "/:id",
    requirePermission("system:role:query"),
    controller.getInfo
  );

  // 新增角色
  router.post(
    "",
    requirePermission("system:role:add"),
    zodValidator("json", createRoleSchema),
    controller.create
  );

  // 修改角色
  router.put(
    "",
    requirePermission("system:role:edit"),
    zodValidator("json", updateRoleSchema),
    controller.update
  );

  // 删除角色
  router.delete(
    "/:ids",
    requirePermission("system:role:remove"),
    controller.delete
  );

  // 修改角色状态
  router.put(
    "/changeStatus",
    requirePermission("system:role:edit"),
    zodValidator("json", roleStatusSchema),
    controller.changeStatus
  );

  // 设置角色数据权限
  router.put(
    "/dataScope",
    requirePermission("system:role:edit"),
    zodValidator("json", roleDataScopeSchema),
    controller.dataScope
  );

  // 获取角色菜单树
  router.get(
    "/roleMenuTreeselect/:id",
    requirePermission("system:role:query"),
    controller.roleMenuTreeselect
  );

  // 分配角色菜单权限
  router.put(
    "/menu",
    requirePermission("system:role:edit"),
    zodValidator("json", roleMenuSchema),
    controller.assignRoleMenu
  );

  // 查询已分配角色的用户列表
  router.get(
    "/authUser/allocatedList",
    requirePermission("system:role:list"),
    zodValidator("query", allocatedUserQuerySchema),
    controller.allocatedList
  );

  // 查询未分配角色的用户列表
  router.get(
    "/authUser/unallocatedList",
    requirePermission("system:role:list"),
    zodValidator("query", allocatedUserQuerySchema),
    controller.unallocatedList
  );

  // 批量选择用户授权
  router.put(
    "/authUser/selectAll",
    requirePermission("system:role:edit"),
    zodValidator("json", roleSelectUserSchema),
    controller.selectAll
  );

  // 取消授权用户角色
  router.put(
    "/authUser/cancel",
    requirePermission("system:role:edit"),
    controller.cancelAuthUser
  );

  // 批量取消授权用户角色
  router.put(
    "/authUser/cancelAll",
    requirePermission("system:role:edit"),
    controller.cancelAll
  );

  // 导出角色数据
  router.post(
    "/export",
    requirePermission("system:role:export"),
    controller.export
  );

  return router;
}

export * from "./role.schema";
export * from "./role.service";
export * from "./role.controller";
