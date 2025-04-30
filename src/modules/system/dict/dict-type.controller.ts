// src/modules/system/dict/dict-type.controller.ts
import { Context } from "hono";
import { DictTypeService } from "./dict-type.service";
import { logger } from "@/utils/logger.utils";
import { ExcelUtils, ExcelColumn } from "@/utils/excel.utils";
import { readFile } from "node:fs/promises";

export class DictTypeController {
  private dictTypeService: DictTypeService;

  constructor() {
    this.dictTypeService = new DictTypeService();
  }

  /**
   * 获取字典类型列表（分页）
   */
  list = async (c: Context) => {
    try {
      const query = c.get("zod");
      const result = await this.dictTypeService.findAll(query);

      return c.json({
        code: 200,
        data: result,
      });
    } catch (error) {
      return c.json(
        {
          code: 500,
          message:
            error instanceof Error ? error.message : "查询字典类型列表失败",
        },
        500
      );
    }
  };

  /**
   * 获取所有字典类型（不分页）
   */
  optionselect = async (c: Context) => {
    try {
      const types = await this.dictTypeService.findAllTypes();

      return c.json({
        code: 200,
        data: types,
      });
    } catch (error) {
      return c.json(
        {
          code: 500,
          message:
            error instanceof Error ? error.message : "查询字典类型列表失败",
        },
        500
      );
    }
  };

  /**
   * 获取字典类型详情
   */
  getInfo = async (c: Context) => {
    try {
      const id = Number(c.req.param("id"));

      if (isNaN(id)) {
        return c.json(
          {
            code: 400,
            message: "无效的字典类型ID",
          },
          400
        );
      }

      const dictType = await this.dictTypeService.findById(id);

      return c.json({
        code: 200,
        data: dictType,
      });
    } catch (error) {
      return c.json(
        {
          code: 500,
          message:
            error instanceof Error ? error.message : "获取字典类型详情失败",
        },
        500
      );
    }
  };

  /**
   * 创建字典类型
   */
  create = async (c: Context) => {
    try {
      const data = c.get("zod");
      const dictType = await this.dictTypeService.create(data);

      return c.json({
        code: 200,
        message: "创建字典类型成功",
        data: dictType,
      });
    } catch (error) {
      return c.json(
        {
          code: 500,
          message: error instanceof Error ? error.message : "创建字典类型失败",
        },
        500
      );
    }
  };

  /**
   * 更新字典类型
   */
  update = async (c: Context) => {
    try {
      const data = c.get("zod");
      await this.dictTypeService.update(data);

      return c.json({
        code: 200,
        message: "更新字典类型成功",
      });
    } catch (error) {
      return c.json(
        {
          code: 500,
          message: error instanceof Error ? error.message : "更新字典类型失败",
        },
        500
      );
    }
  };

  /**
   * 删除字典类型（支持批量）
   */
  delete = async (c: Context) => {
    try {
      const idParam = c.req.param("ids");
      const ids = idParam.split(",").map(Number);

      if (ids.some(isNaN)) {
        return c.json(
          {
            code: 400,
            message: "无效的字典类型ID格式",
          },
          400
        );
      }

      await this.dictTypeService.delete(ids);

      return c.json({
        code: 200,
        message: "删除字典类型成功",
      });
    } catch (error) {
      return c.json(
        {
          code: 500,
          message: error instanceof Error ? error.message : "删除字典类型失败",
        },
        500
      );
    }
  };

  /**
   * 修改字典类型状态
   */
  changeStatus = async (c: Context) => {
    try {
      const data = c.get("zod");
      await this.dictTypeService.updateStatus(data.id, data.status);

      return c.json({
        code: 200,
        message: "修改字典类型状态成功",
      });
    } catch (error) {
      return c.json(
        {
          code: 500,
          message:
            error instanceof Error ? error.message : "修改字典类型状态失败",
        },
        500
      );
    }
  };

  /**
   * 刷新字典缓存
   */
  refreshCache = async (c: Context) => {
    try {
      await this.dictTypeService.refreshCache();

      return c.json({
        code: 200,
        message: "刷新字典缓存成功",
      });
    } catch (error) {
      return c.json(
        {
          code: 500,
          message: error instanceof Error ? error.message : "刷新字典缓存失败",
        },
        500
      );
    }
  };

  /**
   * 导出字典类型数据
   */
  export = async (c: Context) => {
    try {
      // 获取查询参数
      const params = c.req.query();

      // 转换查询参数
      const query: any = {};
      if (params.name) query.name = params.name;
      if (params.type) query.type = params.type;
      if (params.status) query.status = params.status;

      // 查询字典类型列表
      const types = await this.dictTypeService.exportTypes(query);

      // 定义导出列
      const columns: ExcelColumn[] = [
        { header: "字典名称", key: "name", width: 20 },
        { header: "字典类型", key: "type", width: 20 },
        { header: "状态", key: "statusLabel", width: 10 },
        { header: "创建时间", key: "createdAt", width: 20 },
        { header: "备注", key: "remark", width: 30 },
      ];

      // 导出到Excel
      const filePath = await ExcelUtils.exportToExcel(types, columns, {
        filename: `dict_type_export_${Date.now()}.xlsx`,
        sheetName: "字典类型数据",
      });

      // 设置响应头
      c.header(
        "Content-Type",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
      );
      c.header(
        "Content-Disposition",
        `attachment; filename=dict_type_export.xlsx`
      );

      // 返回文件
      const fileBuffer = await readFile(filePath);
      return c.body(fileBuffer);
    } catch (error) {
      logger.error("导出字典类型数据失败:", error);
      return c.json(
        {
          code: 500,
          message:
            error instanceof Error ? error.message : "导出字典类型数据失败",
        },
        500
      );
    }
  };
}
