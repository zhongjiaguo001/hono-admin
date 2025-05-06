// src/modules/monitor/log/logininfor/logininfor.controller.ts

import { Context } from "hono";
import { LogininforService } from "./logininfor.service";
import { logger } from "@/utils/logger.utils";
import { ExcelUtils, ExcelColumn } from "@/utils/excel.utils";
import { readFile } from "node:fs/promises";

export class LogininforController {
  private logininforService: LogininforService;

  constructor() {
    this.logininforService = new LogininforService();
  }

  /**
   * 获取登录日志列表
   */
  list = async (c: Context) => {
    try {
      const query = c.get("zod");
      const result = await this.logininforService.findAll(query);

      return c.json({
        code: 200,
        data: result,
      });
    } catch (error) {
      return c.json(
        {
          code: 500,
          message:
            error instanceof Error ? error.message : "查询登录日志列表失败",
        },
        500
      );
    }
  };

  /**
   * 删除登录日志
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

      await this.logininforService.delete(ids);

      return c.json({
        code: 200,
        message: "删除登录日志成功",
      });
    } catch (error) {
      return c.json(
        {
          code: 500,
          message: error instanceof Error ? error.message : "删除登录日志失败",
        },
        500
      );
    }
  };

  /**
   * 清空登录日志
   */
  clean = async (c: Context) => {
    try {
      await this.logininforService.clear();

      return c.json({
        code: 200,
        message: "清空登录日志成功",
      });
    } catch (error) {
      return c.json(
        {
          code: 500,
          message: error instanceof Error ? error.message : "清空登录日志失败",
        },
        500
      );
    }
  };

  /**
   * 解锁用户账号
   */
  unlock = async (c: Context) => {
    try {
      const username = c.req.param("username");

      if (!username) {
        return c.json({
          code: 400,
          message: "用户名不能为空",
        });
      }

      await this.logininforService.unlock(username);

      return c.json({
        code: 200,
        message: `用户${username}解锁成功`,
      });
    } catch (error) {
      return c.json({
        code: 500,
        message: error instanceof Error ? error.message : "解锁用户失败",
      });
    }
  };

  /**
   * 导出登录日志
   */
  export = async (c: Context) => {
    try {
      // 获取查询参数
      const params = c.req.query();

      // 转换查询参数
      const query: any = {};
      if (params.ipaddr) query.ipaddr = params.ipaddr;
      if (params.username) query.username = params.username;
      if (params.status) query.status = params.status;
      if (params.loginTime) {
        query.loginTime = params.loginTime.split(",");
      }

      // 查询登录日志列表
      const list = await this.logininforService.export(query);

      // 定义导出列
      const columns: ExcelColumn[] = [
        { header: "访问编号", key: "id", width: 10 },
        { header: "用户名称", key: "username", width: 15 },
        { header: "登录地址", key: "ipaddr", width: 15 },
        { header: "登录地点", key: "loginLocation", width: 15 },
        { header: "浏览器", key: "browser", width: 15 },
        { header: "操作系统", key: "os", width: 15 },
        { header: "登录状态", key: "statusText", width: 10 },
        { header: "提示消息", key: "msg", width: 20 },
        { header: "访问时间", key: "loginTimeStr", width: 20 },
      ];

      // 导出到Excel
      const filePath = await ExcelUtils.exportToExcel(list, columns, {
        filename: `logininfor_export_${Date.now()}.xlsx`,
        sheetName: "登录日志",
      });

      // 设置响应头
      c.header(
        "Content-Type",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
      );
      c.header(
        "Content-Disposition",
        `attachment; filename=logininfor_export.xlsx`
      );

      // 返回文件
      const fileBuffer = await readFile(filePath);
      return c.body(fileBuffer);
    } catch (error) {
      logger.error("导出登录日志失败:", error);
      return c.json(
        {
          code: 500,
          message: error instanceof Error ? error.message : "导出登录日志失败",
        },
        500
      );
    }
  };
}
