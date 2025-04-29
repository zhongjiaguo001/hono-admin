// src/utils/date.utils.ts
import { format, parse, isValid } from "date-fns";

/**
 * 日期格式化工具类
 */
export class DateUtils {
  /**
   * 格式化日期字符串为指定格式
   * @param dateStr 日期字符串
   * @param outputFormat 输出格式 (默认: yyyy-MM-dd HH:mm:ss)
   * @param inputFormat 输入格式 (可选，如果提供会先尝试按此格式解析)
   * @returns 格式化后的日期字符串，如果解析失败则返回原始字符串
   */
  static formatDate(
    dateStr: string | Date | null | undefined,
    outputFormat: string = "yyyy-MM-dd HH:mm:ss",
    inputFormat?: string
  ): string {
    if (!dateStr) return "";

    try {
      let date: Date;

      // 如果已经是Date对象
      if (dateStr instanceof Date) {
        date = dateStr;
      }
      // 如果提供了输入格式，尝试按指定格式解析
      else if (inputFormat) {
        date = parse(dateStr, inputFormat, new Date());
      }
      // 否则使用标准Date构造函数解析
      else {
        date = new Date(dateStr);
      }

      // 检查日期是否有效
      if (!isValid(date)) {
        return String(dateStr);
      }

      return format(date, outputFormat);
    } catch (error) {
      console.error("日期格式化失败:", error);
      return String(dateStr);
    }
  }

  /**
   * 将日期格式化为只有日期部分 (yyyy-MM-dd)
   */
  static formatDateOnly(
    dateStr: string | Date | null | undefined,
    inputFormat?: string
  ): string {
    return this.formatDate(dateStr, "yyyy-MM-dd", inputFormat);
  }

  /**
   * 将日期格式化为时间部分 (HH:mm:ss)
   */
  static formatTimeOnly(
    dateStr: string | Date | null | undefined,
    inputFormat?: string
  ): string {
    return this.formatDate(dateStr, "HH:mm:ss", inputFormat);
  }

  /**
   * 转换为中文日期格式 (yyyy年MM月dd日)
   */
  static formatChineseDate(
    dateStr: string | Date | null | undefined,
    inputFormat?: string
  ): string {
    return this.formatDate(dateStr, "yyyy年MM月dd日", inputFormat);
  }

  /**
   * 转换为包含星期的中文日期格式
   */
  static formatChineseDateWithWeek(
    dateStr: string | Date | null | undefined,
    inputFormat?: string
  ): string {
    const date = dateStr instanceof Date ? dateStr : new Date(String(dateStr));
    const weekDay = ["日", "一", "二", "三", "四", "五", "六"][date.getDay()];
    return this.formatDate(
      dateStr,
      `yyyy年MM月dd日 星期${weekDay}`,
      inputFormat
    );
  }
}
