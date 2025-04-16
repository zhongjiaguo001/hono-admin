// src/modules/system/user/user.controller.ts
import { Context } from "hono";
import { UserService } from "./user.service";
import type {
  CreateUserDto,
  UpdateUserDto,
  UpdatePasswordDto,
  UserQueryParams,
} from "./user.types";

export class UserController {
  private userService: UserService;

  constructor() {
    this.userService = new UserService();
  }

  /**
   * 获取当前用户信息
   */
  getCurrentUser = async (c: Context) => {
    try {
      const user = c.get("user");
      const userInfo = await this.userService.findById(user.id);

      return c.json({
        code: 200,
        data: userInfo,
      });
    } catch (error) {
      return c.json(
        {
          code: 500,
          message: error instanceof Error ? error.message : "获取用户信息失败",
        },
        500
      );
    }
  };

  /**
   * 获取用户列表(分页)
   */
  list = async (c: Context) => {
    try {
      // 获取已验证的查询参数
      const params = c.get("zod") as UserQueryParams;

      const result = await this.userService.paginate(params);

      return c.json({
        code: 200,
        data: result,
      });
    } catch (error) {
      return c.json(
        {
          code: 500,
          message: error instanceof Error ? error.message : "查询用户列表失败",
        },
        500
      );
    }
  };

  /**
   * 获取用户详情
   */
  getById = async (c: Context) => {
    try {
      const id = Number(c.req.param("id"));

      if (isNaN(id)) {
        return c.json(
          {
            code: 400,
            message: "无效的用户ID",
          },
          400
        );
      }

      const user = await this.userService.findById(id);

      return c.json({
        code: 200,
        data: user,
      });
    } catch (error) {
      return c.json(
        {
          code: 500,
          message: error instanceof Error ? error.message : "获取用户详情失败",
        },
        500
      );
    }
  };

  /**
   * 通过用户名查询用户
   */
  getByUsername = async (c: Context) => {
    try {
      const username = c.req.param("username");
      const user = await this.userService.findByUsername(username);

      if (!user) {
        return c.json(
          {
            code: 404,
            message: "用户不存在",
          },
          404
        );
      }

      return c.json({
        code: 200,
        data: user,
      });
    } catch (error) {
      return c.json(
        {
          code: 500,
          message: error instanceof Error ? error.message : "查询用户失败",
        },
        500
      );
    }
  };

  /**
   * 创建用户
   */
  create = async (c: Context) => {
    try {
      // 获取已验证的数据
      const data = c.get("zod") as CreateUserDto;

      const userId = await this.userService.create(data);

      return c.json({
        code: 200,
        message: "创建成功",
        data: { id: userId },
      });
    } catch (error) {
      return c.json(
        {
          code: 500,
          message: error instanceof Error ? error.message : "创建用户失败",
        },
        500
      );
    }
  };

  /**
   * 更新用户
   */
  update = async (c: Context) => {
    try {
      // 获取已验证的数据
      const data = c.get("zod") as UpdateUserDto;

      await this.userService.update(data);

      return c.json({
        code: 200,
        message: "更新成功",
      });
    } catch (error) {
      return c.json(
        {
          code: 500,
          message: error instanceof Error ? error.message : "更新用户失败",
        },
        500
      );
    }
  };

  /**
   * 删除用户
   */
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

      await this.userService.delete(ids);

      return c.json({
        code: 200,
        message: "删除成功",
      });
    } catch (error) {
      return c.json(
        {
          code: 500,
          message: error instanceof Error ? error.message : "删除用户失败",
        },
        500
      );
    }
  };

  /**
   * 修改密码
   */
  updatePassword = async (c: Context) => {
    try {
      // 获取已验证的数据
      const data = c.get("zod") as UpdatePasswordDto;

      const user = c.get("user");
      await this.userService.updatePassword(user.id, data.newPassword);

      return c.json({
        code: 200,
        message: "密码修改成功",
      });
    } catch (error) {
      return c.json(
        {
          code: 500,
          message: error instanceof Error ? error.message : "修改密码失败",
        },
        500
      );
    }
  };

  /**
   * 修改用户状态
   */
  updateStatus = async (c: Context) => {
    try {
      // 获取已验证的数据
      const data = c.get("zod");

      await this.userService.updateStatus(data.id, data.status);

      return c.json({
        code: 200,
        message: "状态修改成功",
      });
    } catch (error) {
      return c.json(
        {
          code: 500,
          message: error instanceof Error ? error.message : "修改用户状态失败",
        },
        500
      );
    }
  };

  /**
   * 获取用户角色
   */
  getUserRoles = async (c: Context) => {
    try {
      const id = Number(c.req.param("id"));

      if (isNaN(id)) {
        return c.json(
          {
            code: 400,
            message: "无效的用户ID",
          },
          400
        );
      }

      const roles = await this.userService.getUserRoles(id);

      return c.json({
        code: 200,
        data: roles,
      });
    } catch (error) {
      return c.json(
        {
          code: 500,
          message: error instanceof Error ? error.message : "获取用户角色失败",
        },
        500
      );
    }
  };

  /**
   * 设置用户角色
   */
  setUserRoles = async (c: Context) => {
    try {
      const id = Number(c.req.param("id"));
      const { roleIds } = await c.req.json();

      if (isNaN(id)) {
        return c.json(
          {
            code: 400,
            message: "无效的用户ID",
          },
          400
        );
      }

      if (!Array.isArray(roleIds)) {
        return c.json(
          {
            code: 400,
            message: "roleIds必须是数组",
          },
          400
        );
      }

      await this.userService.setUserRoles(id, roleIds);

      return c.json({
        code: 200,
        message: "角色设置成功",
      });
    } catch (error) {
      return c.json(
        {
          code: 500,
          message: error instanceof Error ? error.message : "设置用户角色失败",
        },
        500
      );
    }
  };
}
