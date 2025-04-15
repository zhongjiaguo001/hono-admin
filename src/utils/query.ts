import { format } from "date-fns";

export interface PageQuery {
  pageNum?: string | number;
  pageSize?: string | number;
  [key: string]: any;
}

export interface PageInfo {
  pageNum: number;
  pageSize: number;
  total: number;
  list: any[];
}

export interface QueryOptions {
  // 需要进行模糊查询的字段
  fuzzyFields?: string[];
  // 需要进行精确匹配的字段
  exactFields?: string[];
  // 需要进行数值类型转换的字段
  numberFields?: string[];
  // 需要进行日期范围查询的字段
  dateRangeFields?: string[];
  // 排序字段和方向
  orderBy?:
    | Record<string, "asc" | "desc">
    | Array<Record<string, "asc" | "desc">>;
  // 选择返回的字段
  select?: any;
}

export class QueryBuilder {
  /**
   * 处理分页参数
   * @param query 查询参数对象
   * @returns 处理后的分页参数
   */
  static getPageParams(query: PageQuery): {
    pageNum: number;
    pageSize: number;
  } {
    const pageNum = Math.max(1, parseInt(query.pageNum?.toString() || "1"));
    const pageSize = Math.max(
      1,
      Math.min(100, parseInt(query.pageSize?.toString() || "10"))
    );
    return { pageNum, pageSize };
  }

  /**
   * 构建查询条件
   * @param query 查询参数
   * @param options 查询选项
   * @returns Prisma 查询条件对象
   */
  static buildWhere(
    query: Record<string, any>,
    options: QueryOptions = {}
  ): any {
    const {
      fuzzyFields = [],
      exactFields = [],
      numberFields = [],
      dateRangeFields = [],
    } = options;
    const conditions: any[] = [];

    // 处理模糊查询字段
    fuzzyFields.forEach((field) => {
      if (query[field]) {
        conditions.push({
          [field]: { contains: query[field] },
        });
      }
    });

    // 处理精确匹配字段
    exactFields.forEach((field) => {
      if (query[field] !== undefined && query[field] !== "") {
        conditions.push({
          [field]: query[field],
        });
      }
    });

    // 处理数值类型字段
    numberFields.forEach((field) => {
      if (query[field] !== undefined && query[field] !== "") {
        conditions.push({
          [field]: parseInt(query[field]),
        });
      }
    });

    // 处理日期范围字段
    dateRangeFields.forEach((field) => {
      const startTime = query.startTime;
      const endTime = query.endTime;
      if (startTime && endTime) {
        // 将日期字符串转换为UTC时间
        const startDateTime = new Date(startTime + "T00:00:00Z");
        const endDateTime = new Date(endTime + "T23:59:59Z");
        conditions.push({
          [field]: {
            gte: startDateTime,
            lte: endDateTime,
          },
        });
      }
    });

    return conditions.length > 0 ? { AND: conditions } : {};
  }

  /**
   * 执行分页查询
   * @param model Prisma 模型
   * @param query 查询参数
   * @param options 查询选项
   * @returns 分页结果
   */
  static async paginate<T extends any>(
    model: any,
    query: PageQuery,
    options: QueryOptions = {}
  ): Promise<PageInfo> {
    const { pageNum, pageSize } = this.getPageParams(query);
    const where = this.buildWhere(query, options);

    // 设置默认select选项，包含所有基础字段
    const select = options.select;

    const [total, list] = await Promise.all([
      model.count({ where }),
      model.findMany({
        where,
        skip: (pageNum - 1) * pageSize,
        take: pageSize,
        select,
        orderBy: Array.isArray(options.orderBy)
          ? options.orderBy
          : [options.orderBy || { createdAt: "desc" }],
      }),
    ]);

    // 格式化日期字段
    const formattedList = list.map((item) => {
      const formatted = { ...item };
      if (formatted.createdAt) {
        formatted.createdAt = format(
          formatted.createdAt.toISOString(),
          "yyyy-MM-dd HH:mm:ss"
        );
      }
      if (formatted.updatedAt) {
        formatted.updatedAt = format(
          formatted.updatedAt.toISOString(),
          "yyyy-MM-dd HH:mm:ss"
        );
      }
      return formatted;
    });

    return {
      pageNum,
      pageSize,
      total,
      list: formattedList,
    };
  }
}
