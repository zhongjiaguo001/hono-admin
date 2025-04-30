// src/modules/system/dict/dict-type.service.ts
import { prisma } from "@/db/prisma";
import { logger } from "@/utils/logger.utils";
import { redisUtils } from "@/utils/redis.utils";
import {
  CreateDictTypeDto,
  UpdateDictTypeDto,
  DictTypeQueryDto,
} from "./dict-type.schema";

export class DictTypeService {
  /**
   * 创建字典类型
   */
  async create(data: CreateDictTypeDto) {
    try {
      // 检查字典类型是否已存在
      const existType = await prisma.dictType.findFirst({
        where: { type: data.type },
      });

      if (existType) {
        throw new Error(`字典类型 '${data.type}' 已存在`);
      }

      // 创建字典类型
      return await prisma.dictType.create({
        data: {
          ...data,
          createBy: "admin", // 可从上下文获取当前用户名
        },
      });
    } catch (error) {
      logger.error("创建字典类型失败:", error);
      throw error;
    }
  }

  /**
   * 更新字典类型
   */
  async update(data: UpdateDictTypeDto) {
    try {
      const { id, type, ...typeData } = data;

      // 检查字典类型是否存在
      const dictType = await prisma.dictType.findUnique({
        where: { id },
      });

      if (!dictType) {
        throw new Error("字典类型不存在");
      }

      // 检查字典类型是否与其他记录冲突
      if (type && type !== dictType.type) {
        const existType = await prisma.dictType.findFirst({
          where: {
            type,
            id: { not: id },
          },
        });

        if (existType) {
          throw new Error(`字典类型 '${type}' 已存在`);
        }
      }

      // 更新字典类型
      const updated = await prisma.dictType.update({
        where: { id },
        data: {
          ...typeData,
          type,
          updateBy: "admin", // 可从上下文获取当前用户名
        },
      });

      // 如果修改了字典类型，需要同步更新字典数据的dictType字段
      if (type && type !== dictType.type) {
        await prisma.dictData.updateMany({
          where: { dictType: dictType.type },
          data: { dictType: type },
        });
      }

      // 清除缓存
      await this.clearCache(type || dictType.type);

      return updated;
    } catch (error) {
      logger.error("更新字典类型失败:", error);
      throw error;
    }
  }

  /**
   * 删除字典类型(支持批量)
   */
  async delete(ids: number[]) {
    try {
      // 获取要删除的字典类型
      const dictTypes = await prisma.dictType.findMany({
        where: { id: { in: ids } },
      });

      if (dictTypes.length === 0) {
        throw new Error("字典类型不存在");
      }

      const typeValues = dictTypes.map((dict) => dict.type);

      // 检查字典类型是否有关联的字典数据
      const dataCount = await prisma.dictData.count({
        where: { dictType: { in: typeValues } },
      });

      if (dataCount > 0) {
        throw new Error("存在关联的字典数据，不能删除");
      }

      // 删除字典类型
      await prisma.dictType.deleteMany({
        where: { id: { in: ids } },
      });

      // 清除缓存
      for (const type of typeValues) {
        await this.clearCache(type);
      }

      return true;
    } catch (error) {
      logger.error("删除字典类型失败:", error);
      throw error;
    }
  }

  /**
   * 查询字典类型详情
   */
  async findById(id: number) {
    try {
      const dictType = await prisma.dictType.findUnique({
        where: { id },
      });

      if (!dictType) {
        throw new Error("字典类型不存在");
      }

      return dictType;
    } catch (error) {
      logger.error("查询字典类型详情失败:", error);
      throw error;
    }
  }

  /**
   * 分页查询字典类型列表
   */
  async findAll(query: DictTypeQueryDto) {
    try {
      const { page, pageSize, name, type, status, createTime } = query;
      const skip = (page - 1) * pageSize;

      // 构建查询条件
      const where: any = {};

      if (name) {
        where.name = { contains: name };
      }

      if (type) {
        where.type = { contains: type };
      }

      if (status !== undefined) {
        where.status = status;
      }

      // 处理时间范围查询
      if (createTime && createTime.length === 2) {
        const [startTime, endTime] = createTime;
        if (startTime && endTime) {
          where.createdAt = {
            gte: new Date(startTime),
            lte: new Date(endTime),
          };
        }
      }

      // 执行查询
      const [list, total] = await Promise.all([
        prisma.dictType.findMany({
          where,
          skip,
          take: pageSize,
          orderBy: { id: "asc" },
        }),
        prisma.dictType.count({ where }),
      ]);

      return {
        list,
        total,
        page,
        pageSize,
      };
    } catch (error) {
      logger.error("查询字典类型列表失败:", error);
      throw error;
    }
  }

  /**
   * 获取所有字典类型（不分页）
   */
  async findAllTypes() {
    try {
      return await prisma.dictType.findMany({
        where: { status: "0" }, // 只查询正常状态的字典类型
        orderBy: { id: "asc" },
      });
    } catch (error) {
      logger.error("查询所有字典类型失败:", error);
      throw error;
    }
  }

  /**
   * 更新字典类型状态
   */
  async updateStatus(id: number, status: string) {
    try {
      const dictType = await prisma.dictType.findUnique({
        where: { id },
      });

      if (!dictType) {
        throw new Error("字典类型不存在");
      }

      const updated = await prisma.dictType.update({
        where: { id },
        data: { status },
      });

      // 清除缓存
      await this.clearCache(dictType.type);

      return updated;
    } catch (error) {
      logger.error("更新字典类型状态失败:", error);
      throw error;
    }
  }

  /**
   * 刷新字典缓存
   */
  async refreshCache() {
    try {
      // 清除所有字典缓存
      const dictCacheKeys = await redisUtils.execute("KEYS", "dict:*");
      if (dictCacheKeys.length > 0) {
        await redisUtils.del(dictCacheKeys);
      }

      return true;
    } catch (error) {
      logger.error("刷新字典缓存失败:", error);
      throw error;
    }
  }

  /**
   * 导出字典类型数据
   */
  async exportTypes(query: Partial<DictTypeQueryDto> = {}) {
    try {
      // 构建查询条件
      const where: any = {};

      if (query.name) {
        where.name = { contains: query.name };
      }

      if (query.type) {
        where.type = { contains: query.type };
      }

      if (query.status !== undefined) {
        where.status = query.status;
      }

      // 执行查询
      const types = await prisma.dictType.findMany({
        where,
        orderBy: { id: "asc" },
      });

      // 格式化状态显示
      return types.map((type) => ({
        ...type,
        statusLabel: type.status === "0" ? "正常" : "停用",
      }));
    } catch (error) {
      logger.error("导出字典类型数据失败:", error);
      throw error;
    }
  }

  /**
   * 清除字典缓存
   */
  private async clearCache(dictType: string) {
    try {
      // 清除特定字典类型的缓存
      await redisUtils.del(`dict:${dictType}`);
    } catch (error) {
      logger.error("清除字典缓存失败:", error);
      // 不抛出异常，避免影响主业务
    }
  }
}
