// src/modules/system/post/post.controller.ts
import { Context } from "hono";
import { PostService } from "./post.service";
import { logger } from "@/utils/logger.utils";
import { ExcelUtils, ExcelColumn } from "@/utils/excel.utils";
import { readFile } from "node:fs/promises";

export class PostController {
  private postService: PostService;

  constructor() {
    this.postService = new PostService();
  }

  /**
   * 获取岗位列表（分页）
   */
  list = async (c: Context) => {
    try {
      const query = c.get("zod");
      const result = await this.postService.findAll(query);

      return c.json({
        code: 200,
        data: result,
      });
    } catch (error) {
      return c.json(
        {
          code: 500,
          message: error instanceof Error ? error.message : "查询岗位列表失败",
        },
        500
      );
    }
  };

  /**
   * 获取所有岗位（不分页）
   */
  listAll = async (c: Context) => {
    try {
      const posts = await this.postService.findAllPosts();

      return c.json({
        code: 200,
        data: posts,
      });
    } catch (error) {
      return c.json(
        {
          code: 500,
          message: error instanceof Error ? error.message : "查询岗位列表失败",
        },
        500
      );
    }
  };

  /**
   * 获取岗位详情
   */
  getInfo = async (c: Context) => {
    try {
      const id = Number(c.req.param("id"));

      if (isNaN(id)) {
        return c.json(
          {
            code: 400,
            message: "无效的岗位ID",
          },
          400
        );
      }

      const post = await this.postService.findById(id);

      return c.json({
        code: 200,
        data: post,
      });
    } catch (error) {
      return c.json(
        {
          code: 500,
          message: error instanceof Error ? error.message : "获取岗位详情失败",
        },
        500
      );
    }
  };

  /**
   * 创建岗位
   */
  create = async (c: Context) => {
    try {
      const data = c.get("zod");
      const post = await this.postService.create(data);

      return c.json({
        code: 200,
        message: "创建岗位成功",
        data: post,
      });
    } catch (error) {
      return c.json(
        {
          code: 500,
          message: error instanceof Error ? error.message : "创建岗位失败",
        },
        500
      );
    }
  };

  /**
   * 更新岗位
   */
  update = async (c: Context) => {
    try {
      const data = c.get("zod");
      await this.postService.update(data);

      return c.json({
        code: 200,
        message: "更新岗位成功",
      });
    } catch (error) {
      return c.json(
        {
          code: 500,
          message: error instanceof Error ? error.message : "更新岗位失败",
        },
        500
      );
    }
  };

  /**
   * 删除岗位（支持批量）
   */
  delete = async (c: Context) => {
    try {
      const idParam = c.req.param("ids");
      const ids = idParam.split(",").map(Number);

      if (ids.some(isNaN)) {
        return c.json(
          {
            code: 400,
            message: "无效的岗位ID格式",
          },
          400
        );
      }

      await this.postService.delete(ids);

      return c.json({
        code: 200,
        message: "删除岗位成功",
      });
    } catch (error) {
      return c.json(
        {
          code: 500,
          message: error instanceof Error ? error.message : "删除岗位失败",
        },
        500
      );
    }
  };

  /**
   * 修改岗位状态
   */
  changeStatus = async (c: Context) => {
    try {
      const data = c.get("zod");
      await this.postService.updateStatus(data.id, data.status);

      return c.json({
        code: 200,
        message: "修改岗位状态成功",
      });
    } catch (error) {
      return c.json(
        {
          code: 500,
          message: error instanceof Error ? error.message : "修改岗位状态失败",
        },
        500
      );
    }
  };

  /**
   * 导出岗位数据
   */
  export = async (c: Context) => {
    try {
      // 获取查询参数
      const params = c.req.query();

      // 转换查询参数
      const query: any = {};
      if (params.code) query.code = params.code;
      if (params.name) query.name = params.name;
      if (params.status) query.status = params.status;

      // 查询岗位列表
      const posts = await this.postService.exportPosts(query);

      // 定义导出列
      const columns: ExcelColumn[] = [
        { header: "岗位编码", key: "code", width: 15 },
        { header: "岗位名称", key: "name", width: 15 },
        { header: "显示顺序", key: "sort", width: 10 },
        { header: "状态", key: "statusLabel", width: 10 },
        { header: "创建时间", key: "createdAt", width: 20 },
        { header: "备注", key: "remark", width: 30 },
      ];

      // 导出到Excel
      const filePath = await ExcelUtils.exportToExcel(posts, columns, {
        filename: `post_export_${Date.now()}.xlsx`,
        sheetName: "岗位数据",
      });

      // 设置响应头
      c.header(
        "Content-Type",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
      );
      c.header("Content-Disposition", `attachment; filename=post_export.xlsx`);

      // 返回文件
      const fileBuffer = await readFile(filePath);
      return c.body(fileBuffer);
    } catch (error) {
      logger.error("导出岗位数据失败:", error);
      return c.json(
        {
          code: 500,
          message: error instanceof Error ? error.message : "导出岗位数据失败",
        },
        500
      );
    }
  };
}
