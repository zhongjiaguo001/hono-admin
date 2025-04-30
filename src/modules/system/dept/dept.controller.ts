// src/modules/system/dept/dept.controller.ts
import { Context } from "hono";
import { DeptService } from "./dept.service";

export class DeptController {
  private deptService: DeptService;

  constructor() {
    this.deptService = new DeptService();
  }

  /**
   * 获取部门列表(树形结构)
   */
  list = async (c: Context) => {
    try {
      const query = c.get("zod");
      const depts = await this.deptService.findTree(query);

      return c.json({
        code: 200,
        data: depts,
      });
    } catch (error) {
      return c.json(
        {
          code: 500,
          message: error instanceof Error ? error.message : "获取部门列表失败",
        },
        500
      );
    }
  };

  /**
   * 获取部门详情
   */
  getInfo = async (c: Context) => {
    try {
      const id = Number(c.req.param("id"));

      if (isNaN(id)) {
        return c.json(
          {
            code: 400,
            message: "无效的部门ID",
          },
          400
        );
      }

      const dept = await this.deptService.findById(id);

      return c.json({
        code: 200,
        data: dept,
      });
    } catch (error) {
      return c.json(
        {
          code: 500,
          message: error instanceof Error ? error.message : "获取部门详情失败",
        },
        500
      );
    }
  };

  /**
   * 创建部门
   */
  create = async (c: Context) => {
    try {
      const data = c.get("zod");
      const dept = await this.deptService.create(data);

      return c.json({
        code: 200,
        message: "创建部门成功",
        data: dept,
      });
    } catch (error) {
      return c.json(
        {
          code: 500,
          message: error instanceof Error ? error.message : "创建部门失败",
        },
        500
      );
    }
  };

  /**
   * 更新部门
   */
  update = async (c: Context) => {
    try {
      const id = Number(c.req.param("id"));
      const data = c.get("zod");

      if (isNaN(id)) {
        return c.json(
          {
            code: 400,
            message: "无效的部门ID",
          },
          400
        );
      }

      const dept = await this.deptService.update(id, data);

      return c.json({
        code: 200,
        message: "更新部门成功",
        data: dept,
      });
    } catch (error) {
      return c.json(
        {
          code: 500,
          message: error instanceof Error ? error.message : "更新部门失败",
        },
        500
      );
    }
  };

  /**
   * 删除部门
   */
  delete = async (c: Context) => {
    try {
      const id = Number(c.req.param("id"));

      if (isNaN(id)) {
        return c.json(
          {
            code: 400,
            message: "无效的部门ID",
          },
          400
        );
      }

      await this.deptService.delete(id);

      return c.json({
        code: 200,
        message: "删除部门成功",
      });
    } catch (error) {
      return c.json(
        {
          code: 500,
          message: error instanceof Error ? error.message : "删除部门失败",
        },
        500
      );
    }
  };

  /**
   * 获取部门下拉树列表
   */
  treeSelect = async (c: Context) => {
    try {
      const trees = await this.deptService.treeSelect();

      return c.json({
        code: 200,
        data: trees,
      });
    } catch (error) {
      return c.json(
        {
          code: 500,
          message:
            error instanceof Error ? error.message : "获取部门树选择失败",
        },
        500
      );
    }
  };

  /**
   * 获取部门列表（排除节点）
   */
  listExclude = async (c: Context) => {
    try {
      const id = Number(c.req.param("id"));

      if (isNaN(id)) {
        return c.json(
          {
            code: 400,
            message: "无效的部门ID",
          },
          400
        );
      }

      const depts = await this.deptService.listExclude(id);

      return c.json({
        code: 200,
        data: depts,
      });
    } catch (error) {
      return c.json(
        {
          code: 500,
          message: error instanceof Error ? error.message : "获取部门列表失败",
        },
        500
      );
    }
  };
}
