// src/modules/system/dept/index.ts
import { Hono } from "hono";
import { authMiddleware, zodValidator, requirePermission } from "@/middleware";
import { DeptController } from "./dept.controller";
import {
  createDeptSchema,
  updateDeptSchema,
  deptQuerySchema,
} from "./dept.schema";

export function createDeptModule() {
  const router = new Hono();
  const controller = new DeptController();

  // 应用认证中间件
  router.use("*", authMiddleware);

  // 查询部门列表
  router.get(
    "/list",
    requirePermission("system:dept:list"),
    zodValidator("query", deptQuerySchema),
    controller.list
  );

  // 获取部门详情
  router.get(
    "/:id",
    requirePermission("system:dept:query"),
    controller.getInfo
  );

  // 创建部门
  router.post(
    "/",
    requirePermission("system:dept:add"),
    zodValidator("json", createDeptSchema),
    controller.create
  );

  // 更新部门
  router.put(
    "/:id",
    requirePermission("system:dept:edit"),
    zodValidator("json", updateDeptSchema),
    controller.update
  );

  // 删除部门
  router.delete(
    "/:id",
    requirePermission("system:dept:remove"),
    controller.delete
  );

  // 获取部门树选择列表
  router.get("/treeselect", controller.treeSelect);

  // 获取部门列表（排除节点）
  router.get(
    "/list/exclude/:id",
    requirePermission("system:dept:list"),
    controller.listExclude
  );

  return router;
}

export * from "./dept.schema";
export * from "./dept.service";
export * from "./dept.controller";
