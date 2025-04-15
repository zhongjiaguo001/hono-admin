import { z } from "zod";

// 创建菜单的验证规则
export const createMenuSchema = z.object({
  parentId: z.number().int().optional(), // 父菜单ID
  name: z
    .string()
    .min(2, "菜单名称不能少于2个字符")
    .max(50, "菜单名称不能超过50个字符"),
  path: z.string().max(100, "路由路径不能超过100个字符").optional(),
  component: z.string().max(100, "组件路径不能超过100个字符").optional(),
  permission: z.string().max(100, "权限标识不能超过100个字符").optional(),
  type: z.number().int().min(0).max(2).default(1), // 类型：0目录 1菜单 2按钮
  icon: z.string().max(50, "图标不能超过50个字符").optional(),
  orderNo: z
    .number({
      required_error: "显示顺序不能为空",
      invalid_type_error: "显示顺序必须是一个数字",
    })
    .int()
    .min(0)
    .default(0),
  keepAlive: z.number().int().min(0).max(1).default(0), // 是否缓存：0缓存 1不缓存
  show: z.number().int().min(0).max(1).default(1), // 是否显示：1显示 0隐藏
  status: z.number().int().min(0).max(1).default(1), // 状态：1正常 0禁用
  isExt: z.number().int().min(0).max(1).default(0), // 是否外链：0否 1是
  extOpenMode: z.number().int().min(1).max(2).default(1), // 外链打开方式：1新窗口 2内嵌
  activeMenu: z.string().max(100, "高亮菜单不能超过100个字符").optional(),
});

// 更新菜单的验证规则
export const updateMenuSchema = z.object({
  parentId: z.number().int().optional(), // 父菜单ID
  name: z
    .string()
    .min(2, "菜单名称不能少于2个字符")
    .max(50, "菜单名称不能超过50个字符")
    .optional(),
  path: z.string().max(100, "路由路径不能超过100个字符").optional(),
  component: z.string().max(100, "组件路径不能超过100个字符").optional(),
  permission: z.string().max(100, "权限标识不能超过100个字符").optional(),
  type: z.number().int().min(0).max(2).optional(), // 类型：0目录 1菜单 2按钮
  icon: z.string().max(50, "图标不能超过50个字符").optional(),
  orderNo: z
    .number({
      invalid_type_error: "显示顺序必须是一个数字",
    })
    .int()
    .min(0)
    .optional(),
  keepAlive: z.number().int().min(0).max(1).optional(), // 是否缓存：0缓存 1不缓存
  show: z.number().int().min(0).max(1).optional(), // 是否显示：1显示 0隐藏
  status: z.number().int().min(0).max(1).optional(), // 状态：1正常 0禁用
  isExt: z.number().int().min(0).max(1).optional(), // 是否外链：0否 1是
  extOpenMode: z.number().int().min(1).max(2).optional(), // 外链打开方式：1新窗口 2内嵌
  activeMenu: z.string().max(100, "高亮菜单不能超过100个字符").optional(),
});

// 角色分配菜单权限的验证规则
export const assignMenusSchema = z.object({
  menuIds: z.array(z.number().int()),
});
