// src/modules/system/menu/menu.schema.ts
import { z } from "zod";

export const createMenuSchema = z.object({
  parentId: z.number().int().nullable().optional(),
  path: z.string().optional().nullable(),
  name: z.string().min(2, "菜单名称不能少于2个字符"),
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

export const updateMenuSchema = createMenuSchema.partial().extend({
  id: z.number().int(),
});

export const menuQuerySchema = z.object({
  name: z.string().optional(),
  path: z.string().optional(),
  permission: z.string().optional(),
  type: z.number().int().optional(),
  status: z.number().int().optional(),
});

export type CreateMenuDto = z.infer<typeof createMenuSchema>;
export type UpdateMenuDto = z.infer<typeof updateMenuSchema>;
export type MenuQueryDto = z.infer<typeof menuQuerySchema>;
