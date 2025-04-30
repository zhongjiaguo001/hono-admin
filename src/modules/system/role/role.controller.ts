// src/modules/system/role/role.controller.ts
import { Context } from "hono";
import { RoleService } from "./role.service";
import { logger } from "@/utils/logger.utils";
import { ExcelUtils, ExcelColumn } from "@/utils/excel.utils";
import { readFile } from "node:fs/promises";

export class RoleController {
  private roleService: RoleService;

  constructor() {
    this.roleService = new RoleService();
  }

  /**
   * 获取角色列表（分页）
   */
  list = async (c: Context) => {
    try {
      const query = c.get("zod");
      const result = await this.roleService.findAll(query);

      return c.json({
        code: 200,
        data: result,
      });
    } catch (error) {
      return c.json(
        {
          code: 500,
          message: error instanceof Error ? error.message : "查询角色列表失败",
        },
        500
      );
    }
  };

  /**
   * 获取角色详情
   */
  getInfo = async (c: Context) => {
    try {
      const id = Number(c.req.param("id"));

      if (isNaN(id)) {
        return c.json(
          {
            code: 400,
            message: "无效的角色ID",
          },
          400
        );
      }

      const role = await this.roleService.findById(id);

      return c.json({
        code: 200,
        data: role,
      });
    } catch (error) {
      return c.json(
        {
          code: 500,
          message: error instanceof Error ? error.message : "获取角色详情失败",
        },
        500
      );
    }
  };

  /**
   * 创建角色
   */
  create = async (c: Context) => {
    try {
      const data = c.get("zod");
      const role = await this.roleService.create(data);

      return c.json({
        code: 200,
        message: "创建角色成功",
        data: role,
      });
    } catch (error) {
      return c.json(
        {
          code: 500,
          message: error instanceof Error ? error.message : "创建角色失败",
        },
        500
      );
    }
  };

  /**
   * 更新角色
   */
  update = async (c: Context) => {
    try {
      const data = c.get("zod");
      await this.roleService.update(data);

      return c.json({
        code: 200,
        message: "更新角色成功",
      });
    } catch (error) {
      return c.json(
        {
          code: 500,
          message: error instanceof Error ? error.message : "更新角色失败",
        },
        500
      );
    }
  };

  /**
   * 删除角色（支持批量）
   */
  delete = async (c: Context) => {
    try {
      const idParam = c.req.param("ids");
      const ids = idParam.split(",").map(Number);

      if (ids.some(isNaN)) {
        return c.json(
          {
            code: 400,
            message: "无效的角色ID格式",
          },
          400
        );
      }

      await this.roleService.delete(ids);

      return c.json({
        code: 200,
        message: "删除角色成功",
      });
    } catch (error) {
      return c.json(
        {
          code: 500,
          message: error instanceof Error ? error.message : "删除角色失败",
        },
        500
      );
    }
  };

  /**
   * 修改角色状态
   */
  changeStatus = async (c: Context) => {
    try {
      const data = c.get("zod");
      await this.roleService.updateStatus(data.id, data.status);

      return c.json({
        code: 200,
        message: "修改角色状态成功",
      });
    } catch (error) {
      return c.json(
        {
          code: 500,
          message: error instanceof Error ? error.message : "修改角色状态失败",
        },
        500
      );
    }
  };

  /**
   * 设置角色数据权限
   */
  dataScope = async (c: Context) => {
    try {
      const data = c.get("zod");
      await this.roleService.dataScope(data);

      return c.json({
        code: 200,
        message: "设置角色数据权限成功",
      });
    } catch (error) {
      return c.json(
        {
          code: 500,
          message:
            error instanceof Error ? error.message : "设置角色数据权限失败",
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
      const id = Number(c.req.param("id"));

      if (isNaN(id)) {
        return c.json(
          {
            code: 400,
            message: "无效的角色ID",
          },
          400
        );
      }

      const result = await this.roleService.getRoleMenuTree(id);

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
   * 分配角色菜单权限
   */
  assignRoleMenu = async (c: Context) => {
    try {
      const data = c.get("zod");
      await this.roleService.setRoleMenu(data);

      return c.json({
        code: 200,
        message: "分配角色菜单权限成功",
      });
    } catch (error) {
      return c.json(
        {
          code: 500,
          message:
            error instanceof Error ? error.message : "分配角色菜单权限失败",
        },
        500
      );
    }
  };

  /**
   * 查询已分配角色的用户列表
   */
  allocatedList = async (c: Context) => {
    try {
      const query = c.get("zod");
      const result = await this.roleService.allocatedUserList(query);

      return c.json({
        code: 200,
        data: result,
      });
    } catch (error) {
      return c.json(
        {
          code: 500,
          message:
            error instanceof Error
              ? error.message
              : "查询已分配角色的用户列表失败",
        },
        500
      );
    }
  };

  /**
   * 查询未分配角色的用户列表
   */
  unallocatedList = async (c: Context) => {
    try {
      const query = c.get("zod");
      const result = await this.roleService.unallocatedUserList(query);

      return c.json({
        code: 200,
        data: result,
      });
    } catch (error) {
      return c.json(
        {
          code: 500,
          message:
            error instanceof Error
              ? error.message
              : "查询未分配角色的用户列表失败",
        },
        500
      );
    }
  };

  /**
   * 批量选择用户授权
   */
  selectAll = async (c: Context) => {
    try {
      const data = c.get("zod");
      const result = await this.roleService.selectUsers(data);

      return c.json({
        code: 200,
        message: "批量选择用户授权成功",
        data: result,
      });
    } catch (error) {
      return c.json(
        {
          code: 500,
          message:
            error instanceof Error ? error.message : "批量选择用户授权失败",
        },
        500
      );
    }
  };

  /**
   * 取消授权用户角色
   */
  cancelAuthUser = async (c: Context) => {
    try {
      const { userId, roleId } = await c.req.json();

      if (!userId || !roleId) {
        return c.json(
          {
            code: 400,
            message: "用户ID和角色ID不能为空",
          },
          400
        );
      }

      await this.roleService.cancelAuthUser(Number(userId), Number(roleId));

      return c.json({
        code: 200,
        message: "取消授权用户角色成功",
      });
    } catch (error) {
      return c.json(
        {
          code: 500,
          message:
            error instanceof Error ? error.message : "取消授权用户角色失败",
        },
        500
      );
    }
  };

  /**
   * 批量取消授权用户角色
   */
  cancelAll = async (c: Context) => {
    try {
      const { roleId, userIds } = await c.req.json();

      if (
        !roleId ||
        !userIds ||
        !Array.isArray(userIds) ||
        userIds.length === 0
      ) {
        return c.json(
          {
            code: 400,
            message: "角色ID和用户ID不能为空",
          },
          400
        );
      }

      await this.roleService.cancelAuthUserAll(
        Number(roleId),
        userIds.map(Number)
      );

      return c.json({
        code: 200,
        message: "批量取消授权用户角色成功",
      });
    } catch (error) {
      return c.json(
        {
          code: 500,
          message:
            error instanceof Error ? error.message : "批量取消授权用户角色失败",
        },
        500
      );
    }
  };

  /**
   * 导出角色数据
   */
  export = async (c: Context) => {
    try {
      // 获取查询参数
      const params = c.req.query();

      // 转换查询参数
      const query: any = {};
      if (params.name) query.name = params.name;
      if (params.key) query.key = params.key;
      if (params.status) query.status = params.status;

      // 查询角色列表
      const roles = await this.roleService.exportRoles(query);

      // 定义导出列
      const columns: ExcelColumn[] = [
        { header: "角色名称", key: "name", width: 15 },
        { header: "权限标识", key: "key", width: 15 },
        { header: "显示顺序", key: "orderNo", width: 10 },
        { header: "数据范围", key: "dataScopeLabel", width: 15 },
        { header: "状态", key: "statusLabel", width: 10 },
        { header: "创建时间", key: "createdAt", width: 20 },
        { header: "备注", key: "remark", width: 30 },
      ];

      // 导出到Excel
      const filePath = await ExcelUtils.exportToExcel(roles, columns, {
        filename: `role_export_${Date.now()}.xlsx`,
        sheetName: "角色数据",
      });

      // 设置响应头
      c.header(
        "Content-Type",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
      );
      c.header("Content-Disposition", `attachment; filename=role_export.xlsx`);

      // 返回文件
      const fileBuffer = await readFile(filePath);
      return c.body(fileBuffer);
    } catch (error) {
      logger.error("导出角色数据失败:", error);
      return c.json(
        {
          code: 500,
          message: error instanceof Error ? error.message : "导出角色数据失败",
        },
        500
      );
    }
  };
}
