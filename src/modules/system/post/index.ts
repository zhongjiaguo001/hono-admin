// src/modules/system/post/index.ts
import { Hono } from "hono";
import { authMiddleware, zodValidator, requirePermission } from "@/middleware";
import { PostController } from "./post.controller";
import {
  createPostSchema,
  updatePostSchema,
  postQuerySchema,
  postStatusSchema,
} from "./post.schema";

export function createPostModule() {
  const router = new Hono();
  const controller = new PostController();

  // 应用认证中间件
  router.use("*", authMiddleware);

  // 获取岗位列表（分页）
  router.get(
    "/list",
    requirePermission("system:post:list"),
    zodValidator("query", postQuerySchema),
    controller.list
  );

  // 获取所有岗位（不分页）
  router.get(
    "/listAll",
    requirePermission("system:post:list"),
    controller.listAll
  );

  // 获取岗位详情
  router.get(
    "/:id",
    requirePermission("system:post:query"),
    controller.getInfo
  );

  // 新增岗位
  router.post(
    "",
    requirePermission("system:post:add"),
    zodValidator("json", createPostSchema),
    controller.create
  );

  // 修改岗位
  router.put(
    "",
    requirePermission("system:post:edit"),
    zodValidator("json", updatePostSchema),
    controller.update
  );

  // 删除岗位
  router.delete(
    "/:ids",
    requirePermission("system:post:remove"),
    controller.delete
  );

  // 修改岗位状态
  router.put(
    "/changeStatus",
    requirePermission("system:post:edit"),
    zodValidator("json", postStatusSchema),
    controller.changeStatus
  );

  // 导出岗位数据
  router.post(
    "/export",
    requirePermission("system:post:export"),
    controller.export
  );

  return router;
}

export * from "./post.schema";
export * from "./post.service";
export * from "./post.controller";
