import { Context } from "hono";
import { RoleService } from "./role.service";
import type { RoleStatusDto } from "./role.schema";

export class RoleController {
  private roleService: RoleService;

  constructor() {
    this.roleService = new RoleService();
  }

  list = async (c: Context) => {
    try {
      const data = c.get("zod");
      const role = await this.roleService.findAll(data);
      return c.json({
        code: 200,
        data: role,
      });
    } catch (error) {
      console.error("获取角色列表失败:", error);
      return c.json({
        code: 500,
        message: "获取角色列表失败",
      });
    }
  };

  create = async (c: Context) => {
    try {
      const data = c.get("zod");
      const role = await this.roleService.create(data);
      return c.json({
        code: 200,
        data: role,
        message: "创建角色成功",
      });
    } catch (error) {
      return c.json(
        {
          code: 500,
          message: "创建角色失败",
        },
        500
      );
    }
  };

  update = async (c: Context) => {
    try {
      const data = c.get("zod");
      const role = await this.roleService.update(data);
      return c.json({
        code: 200,
        data: role,
        message: "更新角色成功",
      });
    } catch (error) {
      return c.json(
        {
          code: 500,
          message: "更新角色失败",
        },
        500
      );
    }
  };

  delete = async (c: Context) => {
    try {
      const id = c.req.param("id");
      const ids = id.split(",").map(Number);

      if (ids.some(isNaN)) {
        return c.json(
          {
            code: 400,
            message: "无效的用户ID格式",
          },
          400
        );
      }

      const role = await this.roleService.delete(ids);

      return c.json({
        code: 200,
        data: role,
        message: "删除角色成功",
      });
    } catch (error) {
      return c.json(
        {
          code: 500,
          message: "删除角色失败",
        },
        500
      );
    }
  };

  updateStatus = async (c: Context) => {
    try {
      const data = c.get("zod") as RoleStatusDto;
      const role = await this.roleService.updateStatus(data.id, data.status);
      return c.json({
        code: 200,
        data: role,
        message: "更新角色状态成功",
      });
    } catch (error) {
      return c.json(
        {
          code: 500,
          message: "更新角色状态失败",
        },
        500
      );
    }
  };
}
