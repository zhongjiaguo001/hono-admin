import ExcelJS from "exceljs";
import { join } from "node:path";
import { FileUtils } from "./file.utils";
import { config } from "@/config";
import { logger } from "./logger.utils";

export interface ExcelColumn {
  header: string;
  key: string;
  width?: number;
  style?: Partial<ExcelJS.Style>;
}

export class ExcelUtils {
  /**
   * 导出数据到Excel
   * @param data 数据列表
   * @param columns 列配置
   * @param options 选项
   * @returns 生成的Excel文件路径
   */
  static async exportToExcel<T>(
    data: T[],
    columns: ExcelColumn[],
    options: {
      filename?: string;
      sheetName?: string;
      headerStyle?: Partial<ExcelJS.Style>;
    } = {}
  ): Promise<string> {
    try {
      const {
        filename = `export_${Date.now()}.xlsx`,
        sheetName = "Sheet1",
        headerStyle = {
          font: { bold: true },
          fill: {
            type: "pattern",
            pattern: "solid",
            fgColor: { argb: "FFE0E0E0" },
          },
        },
      } = options;

      // 创建工作簿和工作表
      const workbook = new ExcelJS.Workbook();
      const sheet = workbook.addWorksheet(sheetName);

      // 设置列
      sheet.columns = columns.map((column) => ({
        header: column.header,
        key: column.key,
        width: column.width || 15,
        style: column.style,
      }));

      // 设置表头样式
      sheet.getRow(1).eachCell((cell) => {
        cell.style = { ...cell.style, ...headerStyle };
      });

      // 添加数据
      sheet.addRows(data);

      // 保存文件
      const filePath = await FileUtils.getTempFilePath(filename);
      await workbook.xlsx.writeFile(filePath);

      return filePath;
    } catch (error) {
      logger.error("导出Excel失败:", error);
      throw new Error(
        `导出Excel失败: ${
          error instanceof Error ? error.message : String(error)
        }`
      );
    }
  }

  /**
   * 从Excel导入数据
   * @param filePath Excel文件路径
   * @param columnMap 列映射 {excel列名: 对象属性名}
   * @param options 选项
   * @returns 导入的数据列表
   */
  static async importFromExcel<T>(
    filePath: string,
    columnMap: Record<string, string>,
    options: {
      sheetIndex?: number;
      startRow?: number;
      validate?: (item: T) => Promise<boolean> | boolean;
      transform?: (item: T) => Promise<T> | T;
    } = {}
  ): Promise<{ data: T[]; errors: Array<{ row: number; message: string }> }> {
    try {
      const {
        sheetIndex = 0,
        startRow = 2, // 默认第2行开始（跳过表头）
        validate,
        transform,
      } = options;

      // 读取工作簿
      const workbook = new ExcelJS.Workbook();
      await workbook.xlsx.readFile(filePath);

      // 获取工作表
      const worksheet = workbook.worksheets[sheetIndex];
      if (!worksheet) {
        throw new Error("找不到工作表");
      }

      // 获取表头
      const headers: Record<number, string> = {};
      worksheet.getRow(1).eachCell((cell, colNumber) => {
        headers[colNumber] = cell.value?.toString() || "";
      });

      // 导入数据
      const result: T[] = [];
      const errors: Array<{ row: number; message: string }> = [];

      for (
        let rowNumber = startRow;
        rowNumber <= worksheet.rowCount;
        rowNumber++
      ) {
        try {
          const row = worksheet.getRow(rowNumber);
          const item = {} as T;

          // 填充数据
          row.eachCell((cell, colNumber) => {
            const header = headers[colNumber];
            if (header && columnMap[header]) {
              item[columnMap[header] as keyof T] = cell.value as any;
            }
          });

          // 验证数据
          if (validate && !(await validate(item))) {
            errors.push({ row: rowNumber, message: "数据验证失败" });
            continue;
          }

          // 转换数据
          const transformedItem = transform ? await transform(item) : item;
          result.push(transformedItem);
        } catch (error) {
          errors.push({
            row: rowNumber,
            message: error instanceof Error ? error.message : String(error),
          });
        }
      }

      return { data: result, errors };
    } catch (error) {
      logger.error("导入Excel失败:", error);
      throw new Error(
        `导入Excel失败: ${
          error instanceof Error ? error.message : String(error)
        }`
      );
    }
  }

  /**
   * 生成导入模板
   * @param columns 列配置
   * @param options 选项
   * @returns 生成的模板文件路径
   */
  static async generateTemplate(
    columns: ExcelColumn[],
    options: {
      filename?: string;
      sheetName?: string;
      headerStyle?: Partial<ExcelJS.Style>;
    } = {}
  ): Promise<string> {
    try {
      const {
        filename = `template_${Date.now()}.xlsx`,
        sheetName = "导入模板",
        headerStyle = {
          font: { bold: true },
          fill: {
            type: "pattern",
            pattern: "solid",
            fgColor: { argb: "FFFFD700" },
          },
        },
      } = options;

      // 创建工作簿和工作表
      const workbook = new ExcelJS.Workbook();
      const sheet = workbook.addWorksheet(sheetName);

      // 设置列
      sheet.columns = columns.map((column) => ({
        header: column.header,
        key: column.key,
        width: column.width || 15,
        style: column.style,
      }));

      // 设置表头样式
      sheet.getRow(1).eachCell((cell) => {
        cell.style = { ...cell.style, ...headerStyle };
      });

      // 保存文件
      const filePath = await FileUtils.getTempFilePath(filename);
      await workbook.xlsx.writeFile(filePath);

      return filePath;
    } catch (error) {
      logger.error("生成导入模板失败:", error);
      throw new Error(
        `生成导入模板失败: ${
          error instanceof Error ? error.message : String(error)
        }`
      );
    }
  }
}
