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

  // 查询菜单列表
  router.get(
    "/list",
    requirePermission("system:menu:list"),
    zodValidator("query", menuQuerySchema),
    controller.list
  );

  // 查询菜单树列表
  router.get(
    "/treeList",
    requirePermission("system:menu:list"),
    zodValidator("query", menuQuerySchema),
    controller.treeList
  );

  // 获取菜单详情
  router.get(
    "/:id",
    requirePermission("system:menu:query"),
    controller.getInfo
  );

  // 新增菜单
  router.post(
    "",
    requirePermission("system:menu:add"),
    zodValidator("json", createMenuSchema),
    controller.create
  );

  // 修改菜单
  router.put(
    "/:id",
    requirePermission("system:menu:edit"),
    zodValidator("json", updateMenuSchema),
    controller.update
  );

  // 删除菜单
  router.delete(
    "/:id",
    requirePermission("system:menu:remove"),
    controller.delete
  );

  // 获取菜单下拉树选择列表
  router.get("/treeselect", controller.treeselect);

  // 根据角色ID获取菜单下拉树选择列表
  router.get("/roleMenuTreeselect/:roleId", controller.roleMenuTreeselect);

  // 获取当前用户菜单列表
  router.get("/user/menus", controller.getUserMenus);

  // 获取当前用户权限标识列表
  router.get("/user/permissions", controller.getUserPermissions);

  return router;
}

export * from "./menu.schema";
export * from "./menu.service";
export * from "./menu.controller";
