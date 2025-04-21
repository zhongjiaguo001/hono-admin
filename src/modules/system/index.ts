// src/modules/system/index.ts
import { Hono } from "hono";
import { createUserModule } from "./user";
import { createRoleModule } from "./role";
import { createMenuModule } from "./menu";
// 后续会导入其他模块如角色、菜单、部门等

// 创建系统管理模块
export function createSystemModule() {
  const router = new Hono();

  // 注册用户模块
  router.route("/user", createUserModule());
  // 注册角色模块
  router.route("/role", createRoleModule());
  // 注册菜单模块
  router.route("/menu", createMenuModule());
  // 后续会注册其他子模块，如角色、菜单、部门等

  return router;
}

// 导出类型和模块
export * from "./user";
export * from "./role";
// 后续会导出其他模块
