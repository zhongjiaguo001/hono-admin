// src/modules/monitor/log/operlog/operlog.controller.ts

import { Context } from "hono";
import { OperlogService } from "./operlog.service";
import { logger } from "@/utils/logger.utils";
import { ExcelUtils, ExcelColumn } from "@/utils/excel.utils";
import { readFile } from "node:fs/promises";

export class OperlogController {
  private operlogService: OperlogService;

  constructor() {
    this.operlogService = new OperlogService();
  }

  /**
   * 获取操作日志列表
   */
  list = async (c: Context) => {
    try {
      const query = c.get("zod");
      const result = await this.operlogService.findAll(query);

      return c.json({
        code: 200,
        data: result,
      });
    } catch (error) {
      return c.json(
        {
          code: 500,
          message:
            error instanceof Error ? error.message : "查询操作日志列表失败",
        },
        500
      );
    }
  };

  /**
   * 删除操作日志
   */
  delete = async (c: Context) => {
    try {
      const idParam = c.req.param("ids");
      const ids = idParam.split(",").map(Number);

      if (ids.some(isNaN)) {
        return c.json(
          {
            code: 400,
            message: "无效的日志ID格式",
          },
          400
        );
      }

      await this.operlogService.delete(ids);

      return c.json({
        code: 200,
        message: "删除操作日志成功",
      });
    } catch (error) {
      return c.json(
        {
          code: 500,
          message: error instanceof Error ? error.message : "删除操作日志失败",
        },
        500
      );
    }
  };

  /**
   * 清空操作日志
   */
  clean = async (c: Context) => {
    try {
      await this.operlogService.clear();

      return c.json({
        code: 200,
        message: "清空操作日志成功",
      });
    } catch (error) {
      return c.json(
        {
          code: 500,
          message: error instanceof Error ? error.message : "清空操作日志失败",
        },
        500
      );
    }
  };

  /**
   * 导出操作日志
   */
  export = async (c: Context) => {
    try {
      // 获取查询参数
      const params = c.req.query();

      // 转换查询参数
      const query: any = {};
      if (params.title) query.title = params.title;
      if (params.operName) query.operName = params.operName;
      if (params.businessType) query.businessType = params.businessType;
      if (params.status) query.status = params.status;
      if (params.operTime) {
        query.operTime = params.operTime.split(",");
      }

      // 查询操作日志列表
      const list = await this.operlogService.export(query);

      // 定义导出列
      const columns: ExcelColumn[] = [
        { header: "日志编号", key: "id", width: 10 },
        { header: "模块标题", key: "title", width: 15 },
        { header: "操作人员", key: "operName", width: 15 },
        { header: "请求URL", key: "operUrl", width: 25 },
        { header: "请求方式", key: "requestMethod", width: 10 },
        { header: "操作地址", key: "operIp", width: 15 },
        { header: "操作地点", key: "operLocation", width: 15 },
        { header: "操作状态", key: "statusText", width: 10 },
        { header: "错误消息", key: "errorMsg", width: 20 },
        { header: "操作时间", key: "operTimeStr", width: 20 },
      ];

      // 导出到Excel
      const filePath = await ExcelUtils.exportToExcel(list, columns, {
        filename: `operlog_export_${Date.now()}.xlsx`,
        sheetName: "操作日志",
      });

      // 设置响应头
      c.header(
        "Content-Type",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
      );
      c.header(
        "Content-Disposition",
        `attachment; filename=operlog_export.xlsx`
      );

      // 返回文件
      const fileBuffer = await readFile(filePath);
      return c.body(fileBuffer);
    } catch (error) {
      logger.error("导出操作日志失败:", error);
      return c.json(
        {
          code: 500,
          message: error instanceof Error ? error.message : "导出操作日志失败",
        },
        500
      );
    }
  };
}
