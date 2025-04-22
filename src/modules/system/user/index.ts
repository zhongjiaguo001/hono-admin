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
  updateProfileSchema,
  resetPasswordSchema,
} from "./user.schema";

// 创建用户模块路由
export function createUserModule() {
  const router = new Hono();
  const controller = new UserController();

  // 应用认证中间件
  router.use("*", authMiddleware);

  // 获取用户列表
  router.get(
    "/list",
    requirePermission("system:user:query"),
    zodValidator("query", queryUserSchema),
    controller.list
  );

  // 获取当前登录用户个人信息
  router.get("/profile", controller.getProfile);

  // 根据ID获取用户信息
  router.get("/:id", requirePermission("system:user:info"), controller.getById);

  // 修改当前登录用户个人信息
  router.put(
    "/profile",
    zodValidator("json", updateProfileSchema),
    controller.updateProfile
  );

  // 修改当前登录用户密码
  router.put(
    "/updatePwd",
    zodValidator("json", updatePasswordSchema),
    controller.updatePassword
  );

  // 修改当前登录用户头像
  router.put("/avatar", controller.updateAvatar);

  // 新增用户
  router.post(
    "/",
    requirePermission("system:user:add"),
    zodValidator("json", createUserSchema),
    controller.create
  );

  // 修改用户
  router.put(
    "/",
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

  // 重置用户密码
  router.put(
    "/resetPwd",
    zodValidator("json", resetPasswordSchema),
    controller.resetPassword
  );

  // 修改用户状态（启用/禁用）
  router.put(
    "/changeStatus",
    requirePermission("system:user:update"),
    zodValidator("json", updateUserStatusSchema),
    controller.updateStatus
  );

  // 获取用户关联的角色信息
  router.get(
    "/authRole/:id",
    requirePermission("system:user:query"),
    controller.getUserRoles
  );

  // 给用户分配角色
  router.put(
    "/authRole",
    requirePermission("system:user:update"),
    controller.setUserRoles
  );

  // 导入用户数据
  router.post(
    "/importData",
    requirePermission("system:user:import"),
    controller.importData
  );

  // 下载用户导入模板
  router.post(
    "/importTemplate",
    requirePermission("system:user:import"),
    controller.importTemplate
  );

  // 导出用户数据
  router.post(
    "/export",
    requirePermission("system:user:export"),
    controller.export
  );

  return router;
}

// 导出类型和Schema，方便其他模块引用
export * from "./user.schema";
export * from "./user.service";
export * from "./user.controller";
