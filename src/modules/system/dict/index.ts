// src/modules/system/dict/index.ts
import { Hono } from "hono";
import { authMiddleware, zodValidator, requirePermission } from "@/middleware";
import { DictTypeController } from "./dict-type.controller";
import { DictDataController } from "./dict-data.controller";
import {
  createDictTypeSchema,
  updateDictTypeSchema,
  dictTypeQuerySchema,
  dictTypeStatusSchema,
} from "./dict-type.schema";
import {
  createDictDataSchema,
  updateDictDataSchema,
  dictDataQuerySchema,
  dictDataStatusSchema,
} from "./dict-data.schema";

export function createDictModule() {
  const router = new Hono();

  // 创建字典类型路由
  const typeRouter = new Hono();
  const typeController = new DictTypeController();

  // 应用认证中间件
  typeRouter.use("*", authMiddleware);

  // 获取字典类型列表（分页）
  typeRouter.get(
    "/list",
    requirePermission("system:dict:list"),
    zodValidator("query", dictTypeQuerySchema),
    typeController.list
  );

  // 获取所有字典类型（不分页，下拉选择用）
  typeRouter.get(
    "/optionselect",
    requirePermission("system:dict:list"),
    typeController.optionselect
  );

  // 获取字典类型详情
  typeRouter.get(
    "/:id",
    requirePermission("system:dict:query"),
    typeController.getInfo
  );

  // 新增字典类型
  typeRouter.post(
    "",
    requirePermission("system:dict:add"),
    zodValidator("json", createDictTypeSchema),
    typeController.create
  );

  // 修改字典类型
  typeRouter.put(
    "",
    requirePermission("system:dict:edit"),
    zodValidator("json", updateDictTypeSchema),
    typeController.update
  );

  // 删除字典类型
  typeRouter.delete(
    "/:ids",
    requirePermission("system:dict:remove"),
    typeController.delete
  );

  // 修改字典类型状态
  typeRouter.put(
    "/changeStatus",
    requirePermission("system:dict:edit"),
    zodValidator("json", dictTypeStatusSchema),
    typeController.changeStatus
  );

  // 导出字典类型数据
  typeRouter.post(
    "/export",
    requirePermission("system:dict:export"),
    typeController.export
  );

  // 刷新字典缓存
  typeRouter.delete(
    "/refreshCache",
    requirePermission("system:dict:edit"),
    typeController.refreshCache
  );

  // 创建字典数据路由
  const dataRouter = new Hono();
  const dataController = new DictDataController();

  // 应用认证中间件
  dataRouter.use("*", authMiddleware);

  // 获取字典数据列表（分页）
  dataRouter.get(
    "/list",
    requirePermission("system:dict:list"),
    zodValidator("query", dictDataQuerySchema),
    dataController.list
  );

  // 根据字典类型查询字典数据
  dataRouter.get("/type/:dictType", dataController.type);

  // 获取字典数据详情
  dataRouter.get(
    "/:id",
    requirePermission("system:dict:query"),
    dataController.getInfo
  );

  // 新增字典数据
  dataRouter.post(
    "",
    requirePermission("system:dict:add"),
    zodValidator("json", createDictDataSchema),
    dataController.create
  );

  // 修改字典数据
  dataRouter.put(
    "",
    requirePermission("system:dict:edit"),
    zodValidator("json", updateDictDataSchema),
    dataController.update
  );

  // 删除字典数据
  dataRouter.delete(
    "/:ids",
    requirePermission("system:dict:remove"),
    dataController.delete
  );

  // 修改字典数据状态
  dataRouter.put(
    "/changeStatus",
    requirePermission("system:dict:edit"),
    zodValidator("json", dictDataStatusSchema),
    dataController.changeStatus
  );

  // 导出字典数据
  dataRouter.post(
    "/export",
    requirePermission("system:dict:export"),
    dataController.export
  );

  // 注册到主路由
  router.route("/type", typeRouter);
  router.route("/data", dataRouter);

  return router;
}

export * from "./dict-type.schema";
export * from "./dict-data.schema";
export * from "./dict-type.service";
export * from "./dict-data.service";
export * from "./dict-type.controller";
export * from "./dict-data.controller";
