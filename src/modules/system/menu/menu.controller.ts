// src/modules/system/menu/menu.controller.ts
import { Context } from "hono";
import { MenuService } from "./menu.service";

export class MenuController {
  private menuService: MenuService;

  constructor() {
    this.menuService = new MenuService();
  }

  /**
   * 获取菜单树
   */
  getTree = async (c: Context) => {
    try {
      const query = c.get("zod");
      const menus = await this.menuService.findTree(query);

      return c.json({
        code: 200,
        data: menus,
      });
    } catch (error) {
      return c.json(
        {
          code: 500,
          message: error instanceof Error ? error.message : "获取菜单失败",
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
      const data = c.get("zod");
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

      await this.menuService.update(id, data);

      return c.json({
        code: 200,
        message: "更新菜单成功",
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
   * 获取用户菜单
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
          message: error instanceof Error ? error.message : "获取用户菜单失败",
        },
        500
      );
    }
  };

  /**
   * 获取用户权限
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
          message: error instanceof Error ? error.message : "获取用户权限失败",
        },
        500
      );
    }
  };
}
