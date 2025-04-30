// src/modules/system/dict/dict-data.controller.ts
import { Context } from "hono";
import { DictDataService } from "./dict-data.service";
import { logger } from "@/utils/logger.utils";
import { ExcelUtils, ExcelColumn } from "@/utils/excel.utils";
import { readFile } from "node:fs/promises";

export class DictDataController {
  private dictDataService: DictDataService;

  constructor() {
    this.dictDataService = new DictDataService();
  }

  /**
   * 获取字典数据列表（分页）
   */
  list = async (c: Context) => {
    try {
      const query = c.get("zod");
      const result = await this.dictDataService.findAll(query);

      return c.json({
        code: 200,
        data: result,
      });
    } catch (error) {
      return c.json(
        {
          code: 500,
          message:
            error instanceof Error ? error.message : "查询字典数据列表失败",
        },
        500
      );
    }
  };

  /**
   * 获取字典数据详情
   */
  getInfo = async (c: Context) => {
    try {
      const id = Number(c.req.param("id"));

      if (isNaN(id)) {
        return c.json(
          {
            code: 400,
            message: "无效的字典数据ID",
          },
          400
        );
      }

      const dictData = await this.dictDataService.findById(id);

      return c.json({
        code: 200,
        data: dictData,
      });
    } catch (error) {
      return c.json(
        {
          code: 500,
          message:
            error instanceof Error ? error.message : "获取字典数据详情失败",
        },
        500
      );
    }
  };

  /**
   * 根据字典类型查询字典数据
   */
  type = async (c: Context) => {
    try {
      const dictType = c.req.param("dictType");

      if (!dictType) {
        return c.json(
          {
            code: 400,
            message: "字典类型不能为空",
          },
          400
        );
      }

      const dictData = await this.dictDataService.getDictDataByType(dictType);

      return c.json({
        code: 200,
        data: dictData,
      });
    } catch (error) {
      return c.json(
        {
          code: 500,
          message: error instanceof Error ? error.message : "查询字典数据失败",
        },
        500
      );
    }
  };

  /**
   * 创建字典数据
   */
  create = async (c: Context) => {
    try {
      const data = c.get("zod");
      const dictData = await this.dictDataService.create(data);

      return c.json({
        code: 200,
        message: "创建字典数据成功",
        data: dictData,
      });
    } catch (error) {
      return c.json(
        {
          code: 500,
          message: error instanceof Error ? error.message : "创建字典数据失败",
        },
        500
      );
    }
  };

  /**
   * 更新字典数据
   */
  update = async (c: Context) => {
    try {
      const data = c.get("zod");
      await this.dictDataService.update(data);

      return c.json({
        code: 200,
        message: "更新字典数据成功",
      });
    } catch (error) {
      return c.json(
        {
          code: 500,
          message: error instanceof Error ? error.message : "更新字典数据失败",
        },
        500
      );
    }
  };

  /**
   * 删除字典数据（支持批量）
   */
  delete = async (c: Context) => {
    try {
      const idParam = c.req.param("ids");
      const ids = idParam.split(",").map(Number);

      if (ids.some(isNaN)) {
        return c.json(
          {
            code: 400,
            message: "无效的字典数据ID格式",
          },
          400
        );
      }

      await this.dictDataService.delete(ids);

      return c.json({
        code: 200,
        message: "删除字典数据成功",
      });
    } catch (error) {
      return c.json(
        {
          code: 500,
          message: error instanceof Error ? error.message : "删除字典数据失败",
        },
        500
      );
    }
  };

  /**
   * 修改字典数据状态
   */
  changeStatus = async (c: Context) => {
    try {
      const data = c.get("zod");
      await this.dictDataService.updateStatus(data.id, data.status);

      return c.json({
        code: 200,
        message: "修改字典数据状态成功",
      });
    } catch (error) {
      return c.json(
        {
          code: 500,
          message:
            error instanceof Error ? error.message : "修改字典数据状态失败",
        },
        500
      );
    }
  };

  /**
   * 导出字典数据
   */
  export = async (c: Context) => {
    try {
      // 获取查询参数
      const params = c.req.query();

      // 转换查询参数
      const query: any = {};
      if (params.dictType) query.dictType = params.dictType;
      if (params.dictLabel) query.dictLabel = params.dictLabel;
      if (params.status) query.status = params.status;

      // 查询字典数据列表
      const dataList = await this.dictDataService.exportData(query);

      // 定义导出列
      const columns: ExcelColumn[] = [
        { header: "字典类型", key: "dictType", width: 20 },
        { header: "字典标签", key: "label", width: 20 },
        { header: "字典键值", key: "value", width: 15 },
        { header: "显示顺序", key: "sort", width: 10 },
        { header: "是否默认", key: "isDefaultLabel", width: 10 },
        { header: "状态", key: "statusLabel", width: 10 },
        { header: "创建时间", key: "createdAt", width: 20 },
        { header: "备注", key: "remark", width: 30 },
      ];

      // 导出到Excel
      const filePath = await ExcelUtils.exportToExcel(dataList, columns, {
        filename: `dict_data_export_${Date.now()}.xlsx`,
        sheetName: "字典数据",
      });

      // 设置响应头
      c.header(
        "Content-Type",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
      );
      c.header(
        "Content-Disposition",
        `attachment; filename=dict_data_export.xlsx`
      );

      // 返回文件
      const fileBuffer = await readFile(filePath);
      return c.body(fileBuffer);
    } catch (error) {
      logger.error("导出字典数据失败:", error);
      return c.json(
        {
          code: 500,
          message: error instanceof Error ? error.message : "导出字典数据失败",
        },
        500
      );
    }
  };
}
