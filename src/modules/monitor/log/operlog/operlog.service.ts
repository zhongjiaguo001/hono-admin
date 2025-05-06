// src/modules/monitor/log/operlog/operlog.service.ts

import { prisma } from "@/db/prisma";
import { logger } from "@/utils/logger.utils";
import { OperlogQueryDto } from "./operlog.schema";

export class OperlogService {
  /**
   * 查询操作日志列表
   */
  async findAll(query: OperlogQueryDto) {
    try {
      const {
        page,
        pageSize,
        title,
        operName,
        businessType,
        status,
        operTime,
      } = query;
      const skip = (page - 1) * pageSize;

      // 构建查询条件
      const where: any = {};

      if (title) {
        where.title = { contains: title };
      }

      if (operName) {
        where.operName = { contains: operName };
      }

      if (businessType !== undefined) {
        where.businessType = Number(businessType);
      }

      if (status !== undefined) {
        where.status = Number(status);
      }

      // 处理时间范围查询
      if (operTime && operTime.length === 2) {
        const [startTime, endTime] = operTime;
        if (startTime && endTime) {
          where.operTime = {
            gte: new Date(startTime),
            lte: new Date(endTime),
          };
        }
      }

      // 执行查询
      const [list, total] = await Promise.all([
        prisma.operLog.findMany({
          where,
          skip,
          take: pageSize,
          orderBy: { operTime: "desc" },
          include: {
            user: {
              select: {
                username: true,
              },
            },
          },
        }),
        prisma.operLog.count({ where }),
      ]);

      // 处理返回数据
      const formattedList = list.map((log) => ({
        ...log,
        userName: log.user?.username || "",
      }));

      return {
        list: formattedList,
        total,
        page,
        pageSize,
      };
    } catch (error) {
      logger.error("查询操作日志列表失败:", error);
      throw error;
    }
  }

  /**
   * 删除操作日志
   */
  async delete(ids: number[]) {
    try {
      await prisma.operLog.deleteMany({
        where: { id: { in: ids } },
      });

      return true;
    } catch (error) {
      logger.error("删除操作日志失败:", error);
      throw error;
    }
  }

  /**
   * 清空操作日志
   */
  async clear() {
    try {
      await prisma.operLog.deleteMany({});

      return true;
    } catch (error) {
      logger.error("清空操作日志失败:", error);
      throw error;
    }
  }

  /**
   * 导出操作日志
   */
  async export(query: Partial<OperlogQueryDto> = {}) {
    try {
      // 构建查询条件
      const where: any = {};

      if (query.title) {
        where.title = { contains: query.title };
      }

      if (query.operName) {
        where.operName = { contains: query.operName };
      }

      if (query.businessType !== undefined) {
        where.businessType = Number(query.businessType);
      }

      if (query.status !== undefined) {
        where.status = Number(query.status);
      }

      // 处理时间范围查询
      if (query.operTime && query.operTime.length === 2) {
        const [startTime, endTime] = query.operTime;
        if (startTime && endTime) {
          where.operTime = {
            gte: new Date(startTime),
            lte: new Date(endTime),
          };
        }
      }

      // 执行查询
      const list = await prisma.operLog.findMany({
        where,
        orderBy: { operTime: "desc" },
        include: {
          user: {
            select: {
              username: true,
            },
          },
        },
      });

      // 处理返回数据
      return list.map((log) => ({
        ...log,
        userName: log.user?.username || "",
        statusText: log.status === 0 ? "成功" : "失败",
        operTimeStr: log.operTime ? log.operTime.toLocaleString() : "",
      }));
    } catch (error) {
      logger.error("导出操作日志失败:", error);
      throw error;
    }
  }
}
