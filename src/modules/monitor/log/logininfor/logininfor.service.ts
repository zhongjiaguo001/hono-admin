// src/modules/monitor/log/logininfor/logininfor.service.ts
import { prisma } from "@/db/prisma";
import { logger } from "@/utils/logger.utils";
import { LogininforQueryDto } from "./logininfor.schema";
import { RequestUtils } from "@/utils/request.utils";

export class LogininforService {
  /**
   * 查询登录日志列表
   */
  async findAll(query: LogininforQueryDto) {
    try {
      const { page, pageSize, ipaddr, username, status, loginTime } = query;
      const skip = (page - 1) * pageSize;

      // 构建查询条件
      const where: any = {};

      if (ipaddr) {
        where.ipaddr = { contains: ipaddr };
      }

      if (username) {
        where.username = { contains: username };
      }

      if (status !== undefined) {
        where.status = status;
      }

      // 处理时间范围查询
      if (loginTime && loginTime.length === 2) {
        const [startTime, endTime] = loginTime;
        if (startTime && endTime) {
          where.loginTime = {
            gte: new Date(startTime),
            lte: new Date(endTime),
          };
        }
      }

      // 执行查询
      const [list, total] = await Promise.all([
        prisma.loginLog.findMany({
          where,
          skip,
          take: pageSize,
          orderBy: { loginTime: "desc" },
        }),
        prisma.loginLog.count({ where }),
      ]);

      return {
        list,
        total,
        page,
        pageSize,
      };
    } catch (error) {
      logger.error("查询登录日志列表失败:", error);
      throw error;
    }
  }

  /**
   * 删除登录日志
   */
  async delete(ids: number[]) {
    try {
      await prisma.loginLog.deleteMany({
        where: { id: { in: ids } },
      });

      return true;
    } catch (error) {
      logger.error("删除登录日志失败:", error);
      throw error;
    }
  }

  /**
   * 清空登录日志
   */
  async clear() {
    try {
      await prisma.loginLog.deleteMany({});

      return true;
    } catch (error) {
      logger.error("清空登录日志失败:", error);
      throw error;
    }
  }

  /**
   * 解锁用户登录状态
   * 注: 在实际应用中可能需要将Redis中存储的登录失败次数重置
   */
  async unlock(username: string) {
    try {
      // 示例: 可以与 Redis 等缓存集成来实现解锁功能
      // await redisUtils.del(`login:fail:${username}`);

      logger.info(`解锁用户 ${username} 的登录状态`);
      return true;
    } catch (error) {
      logger.error("解锁用户登录状态失败:", error);
      throw error;
    }
  }

  /**
   * 导出登录日志
   */
  async export(query: Partial<LogininforQueryDto> = {}) {
    try {
      // 构建查询条件
      const where: any = {};

      if (query.ipaddr) {
        where.ipaddr = { contains: query.ipaddr };
      }

      if (query.username) {
        where.username = { contains: query.username };
      }

      if (query.status !== undefined) {
        where.status = query.status;
      }

      // 处理时间范围查询
      if (query.loginTime && query.loginTime.length === 2) {
        const [startTime, endTime] = query.loginTime;
        if (startTime && endTime) {
          where.loginTime = {
            gte: new Date(startTime),
            lte: new Date(endTime),
          };
        }
      }

      // 执行查询
      const list = await prisma.loginLog.findMany({
        where,
        orderBy: { loginTime: "desc" },
      });

      // 处理返回数据
      return list.map((log) => ({
        ...log,
        statusText: log.status === "0" ? "成功" : "失败",
        loginTimeStr: log.loginTime.toLocaleString(),
      }));
    } catch (error) {
      logger.error("导出登录日志失败:", error);
      throw error;
    }
  }

  /**
   * 记录登录日志
   */
  async addLoginLog(data: {
    username: string;
    status: string;
    ipaddr: string;
    loginLocation?: string;
    browser?: string;
    os?: string;
    msg?: string;
    userId?: number;
    userAgent?: string; // 新增用户代理字符串
  }) {
    try {
      // 解析用户代理
      let browser = data.browser || "未知";
      let os = data.os || "未知";

      if (data.userAgent) {
        const userAgentInfo = RequestUtils.parseUserAgent(data.userAgent);
        browser = userAgentInfo.browser;
        os = userAgentInfo.os;
      }

      // 解析IP地理位置
      const loginLocation =
        data.loginLocation || (await RequestUtils.getLocationByIp(data.ipaddr));

      // 记录登录日志
      await prisma.loginLog.create({
        data: {
          username: data.username,
          status: data.status,
          ipaddr: data.ipaddr,
          loginLocation: loginLocation,
          browser: browser,
          os: os,
          msg: data.msg || "",
          userId: data.userId,
          loginTime: new Date(),
        },
      });
      return true;
    } catch (error) {
      logger.error("记录登录日志失败:", error);
      return false;
    }
  }
}
