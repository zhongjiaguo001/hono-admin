// src/modules/system/index.ts
import { Hono } from "hono";
import { createUserModule } from "./user";
import { createRoleModule } from "./role";
import { createMenuModule } from "./menu";
import { createDeptModule } from "./dept";
import { createPostModule } from "./post";
import { createDictModule } from "./dict";

// 创建系统管理模块
export function createSystemModule() {
  const router = new Hono();

  // 注册用户模块
  router.route("/user", createUserModule());
  // 注册角色模块
  router.route("/role", createRoleModule());
  // 注册菜单模块
  router.route("/menu", createMenuModule());
  // 注册部门模块
  router.route("/dept", createDeptModule());
  // 注册岗位模块
  router.route("/post", createPostModule());
  // 注册字典模块
  router.route("/dict", createDictModule());

  return router;
}

// 导出类型和模块
export * from "./user";
export * from "./role";
export * from "./menu";
export * from "./dept";
export * from "./post";
export * from "./dict";
