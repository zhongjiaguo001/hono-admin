// src/modules/system/menu/menu.schema.ts
import { z } from "zod";

// 菜单类型: 0-目录 1-菜单 2-按钮
export const MenuTypeEnum = {
  DIRECTORY: 0,
  MENU: 1,
  BUTTON: 2,
};

// 是否缓存: 0-缓存 1-不缓存
export const CacheEnum = {
  YES: 0,
  NO: 1,
};

// 菜单状态: 0-禁用 1-正常
export const StatusEnum = {
  DISABLE: 0,
  NORMAL: 1,
};

// 是否外链: 0-否 1-是
export const IsExtEnum = {
  NO: 0,
  YES: 1,
};

// 外链打开方式: 1-新窗口 2-内嵌
export const ExtOpenModeEnum = {
  NEW_WINDOW: 1,
  IFRAME: 2,
};

// 是否显示: 0-隐藏 1-显示
export const ShowEnum = {
  HIDE: 0,
  SHOW: 1,
};

// 创建菜单校验
export const createMenuSchema = z.object({
  parentId: z.number().int().nullable().optional(),
  name: z.string().min(2, "菜单名称不能少于2个字符"),
  path: z.string().optional().nullable(),
  permission: z.string().optional().nullable(),
  type: z.number().int().min(0).max(2),
  icon: z.string().optional().nullable(),
  component: z.string().optional().nullable(),
  keepAlive: z.number().int().min(0).max(1).default(0),
  show: z.number().int().min(0).max(1).default(1),
  status: z.number().int().min(0).max(1).default(1),
  isExt: z.number().int().min(0).max(1).default(0),
  extOpenMode: z.number().int().min(1).max(2).default(1),
  activeMenu: z.string().optional().nullable(),
  query: z.string().optional().nullable(),
  orderNo: z.number().int().default(0),
});

// 更新菜单校验
export const updateMenuSchema = createMenuSchema.partial().extend({
  id: z.number().int(),
});

// 菜单查询参数校验
export const menuQuerySchema = z.object({
  name: z.string().optional(),
  status: z.number().int().optional(),
  type: z.number().int().optional(),
  permission: z.string().optional(),
  path: z.string().optional(),
});

export type CreateMenuDto = z.infer<typeof createMenuSchema>;
export type UpdateMenuDto = z.infer<typeof updateMenuSchema>;
export type MenuQueryDto = z.infer<typeof menuQuerySchema>;
