// src/modules/system/menu/menu.controller.ts
import { Context } from "hono";
import { MenuService } from "./menu.service";
import { MenuTypeEnum } from "./menu.schema";

export class MenuController {
  private menuService: MenuService;

  constructor() {
    this.menuService = new MenuService();
  }

  /**
   * 获取菜单列表
   */
  list = async (c: Context) => {
    try {
      const query = c.get("zod");
      const menus = await this.menuService.findAll(query);

      return c.json({
        code: 200,
        data: menus,
      });
    } catch (error) {
      return c.json(
        {
          code: 500,
          message: error instanceof Error ? error.message : "获取菜单列表失败",
        },
        500
      );
    }
  };

  /**
   * 获取菜单树形结构
   */
  treeList = async (c: Context) => {
    try {
      const query = c.get("zod");
      const menuTree = await this.menuService.findTree(query);

      return c.json({
        code: 200,
        data: menuTree,
      });
    } catch (error) {
      return c.json(
        {
          code: 500,
          message:
            error instanceof Error ? error.message : "获取菜单树形结构失败",
        },
        500
      );
    }
  };

  /**
   * 获取菜单详情
   */
  getInfo = async (c: Context) => {
    try {
      const id = Number(c.req.param("id"));

      if (isNaN(id)) {
        return c.json(
          {
            code: 400,
            message: "无效的菜单ID",
          },
          400
        );
      }

      const menu = await this.menuService.findById(id);

      return c.json({
        code: 200,
        data: menu,
      });
    } catch (error) {
      return c.json(
        {
          code: 500,
          message: error instanceof Error ? error.message : "获取菜单详情失败",
        },
        500
      );
    }
  };

  /**
   * 创建菜单
   */
  create = async (c: Context) => {
    try {
      const data = c.get("zod");

      // 校验菜单数据
      this.validateMenuData(data);

      const menu = await this.menuService.create(data);

      return c.json({
        code: 200,
        message: "创建菜单成功",
        data: menu,
      });
    } catch (error) {
      return c.json(
        {
          code: 500,
          message: error instanceof Error ? error.message : "创建菜单失败",
        },
        500
      );
    }
  };

  /**
   * 更新菜单
   */
  update = async (c: Context) => {
    try {
      const id = Number(c.req.param("id"));
      const data = c.get("zod");

      if (isNaN(id)) {
        return c.json(
          {
            code: 400,
            message: "无效的菜单ID",
          },
          400
        );
      }

      // 校验菜单数据
      if (data.type !== undefined) {
        this.validateMenuData({ ...data, type: data.type });
      }

      const menu = await this.menuService.update(id, data);

      return c.json({
        code: 200,
        message: "更新菜单成功",
        data: menu,
      });
    } catch (error) {
      return c.json(
        {
          code: 500,
          message: error instanceof Error ? error.message : "更新菜单失败",
        },
        500
      );
    }
  };

  /**
   * 删除菜单
   */
  delete = async (c: Context) => {
    try {
      const id = Number(c.req.param("id"));

      if (isNaN(id)) {
        return c.json(
          {
            code: 400,
            message: "无效的菜单ID",
          },
          400
        );
      }

      await this.menuService.delete(id);

      return c.json({
        code: 200,
        message: "删除菜单成功",
      });
    } catch (error) {
      return c.json(
        {
          code: 500,
          message: error instanceof Error ? error.message : "删除菜单失败",
        },
        500
      );
    }
  };

  /**
   * 获取菜单下拉树列表
   */
  treeselect = async (c: Context) => {
    try {
      const menuTree = await this.menuService.treeselect();

      return c.json({
        code: 200,
        data: menuTree,
      });
    } catch (error) {
      return c.json(
        {
          code: 500,
          message:
            error instanceof Error ? error.message : "获取菜单下拉树列表失败",
        },
        500
      );
    }
  };

  /**
   * 获取角色菜单树
   */
  roleMenuTreeselect = async (c: Context) => {
    try {
      const roleId = Number(c.req.param("roleId"));

      if (isNaN(roleId)) {
        return c.json(
          {
            code: 400,
            message: "无效的角色ID",
          },
          400
        );
      }

      const result = await this.menuService.roleMenuTreeselect(roleId);

      return c.json({
        code: 200,
        data: result,
      });
    } catch (error) {
      return c.json(
        {
          code: 500,
          message:
            error instanceof Error ? error.message : "获取角色菜单树失败",
        },
        500
      );
    }
  };

  /**
   * 获取用户菜单列表
   */
  getUserMenus = async (c: Context) => {
    try {
      const user = c.get("user");
      const menus = await this.menuService.getUserMenus(user.id);

      return c.json({
        code: 200,
        data: menus,
      });
    } catch (error) {
      return c.json(
        {
          code: 500,
          message:
            error instanceof Error ? error.message : "获取用户菜单列表失败",
        },
        500
      );
    }
  };

  /**
   * 获取用户权限标识列表
   */
  getUserPermissions = async (c: Context) => {
    try {
      const user = c.get("user");
      const permissions = await this.menuService.getUserPermissions(user.id);

      return c.json({
        code: 200,
        data: permissions,
      });
    } catch (error) {
      return c.json(
        {
          code: 500,
          message:
            error instanceof Error ? error.message : "获取用户权限标识列表失败",
        },
        500
      );
    }
  };

  /**
   * 校验菜单数据
   */
  private validateMenuData(data: any) {
    // 根据菜单类型校验必填字段
    switch (data.type) {
      case MenuTypeEnum.DIRECTORY:
        if (!data.path) {
          throw new Error("目录路由地址不能为空");
        }
        if (!data.icon) {
          throw new Error("目录图标不能为空");
        }
        break;
      case MenuTypeEnum.MENU:
        if (!data.path) {
          throw new Error("菜单路由地址不能为空");
        }
        if (!data.component) {
          throw new Error("菜单组件路径不能为空");
        }
        break;
      case MenuTypeEnum.BUTTON:
        if (!data.permission) {
          throw new Error("按钮权限标识不能为空");
        }
        break;
    }
  }
}
