// src/modules/system/dict/dict-data.service.ts
import { prisma } from "@/db/prisma";
import { logger } from "@/utils/logger.utils";
import { redisUtils } from "@/utils/redis.utils";
import {
  CreateDictDataDto,
  UpdateDictDataDto,
  DictDataQueryDto,
} from "./dict-data.schema";

export class DictDataService {
  /**
   * 创建字典数据
   */
  async create(data: CreateDictDataDto) {
    try {
      // 检查字典类型是否存在
      const dictType = await prisma.dictType.findFirst({
        where: { type: data.dictType },
      });

      if (!dictType) {
        throw new Error(`字典类型 '${data.dictType}' 不存在`);
      }

      // 如果是默认值，需要将同类型的其他数据设为非默认
      if (data.isDefault === "Y") {
        await prisma.dictData.updateMany({
          where: { dictType: data.dictType },
          data: { isDefault: "N" },
        });
      }

      // 创建字典数据
      const dictData = await prisma.dictData.create({
        data: {
          ...data,
          createBy: "admin", // 可从上下文获取当前用户名
        },
      });

      // 清除缓存
      await this.clearCache(data.dictType);

      return dictData;
    } catch (error) {
      logger.error("创建字典数据失败:", error);
      throw error;
    }
  }

  /**
   * 更新字典数据
   */
  async update(data: UpdateDictDataDto) {
    try {
      const { id, dictType, isDefault, ...dataInfo } = data;

      // 检查字典数据是否存在
      const dictData = await prisma.dictData.findUnique({
        where: { id },
      });

      if (!dictData) {
        throw new Error("字典数据不存在");
      }

      // 检查字典类型是否存在
      if (dictType && dictType !== dictData.dictType) {
        const typeExists = await prisma.dictType.findFirst({
          where: { type: dictType },
        });

        if (!typeExists) {
          throw new Error(`字典类型 '${dictType}' 不存在`);
        }
      }

      const updateDictType = dictType || dictData.dictType;

      // 如果是默认值，需要将同类型的其他数据设为非默认
      if (isDefault === "Y") {
        await prisma.dictData.updateMany({
          where: {
            dictType: updateDictType,
            id: { not: id },
          },
          data: { isDefault: "N" },
        });
      }

      // 更新字典数据
      const updated = await prisma.dictData.update({
        where: { id },
        data: {
          ...dataInfo,
          dictType,
          isDefault,
          updateBy: "admin", // 可从上下文获取当前用户名
        },
      });

      // 清除缓存
      await this.clearCache(updateDictType);
      if (dictType && dictType !== dictData.dictType) {
        await this.clearCache(dictData.dictType);
      }

      return updated;
    } catch (error) {
      logger.error("更新字典数据失败:", error);
      throw error;
    }
  }

  /**
   * 删除字典数据(支持批量)
   */
  async delete(ids: number[]) {
    try {
      // 获取字典数据的类型，用于清除缓存
      const dictDataList = await prisma.dictData.findMany({
        where: { id: { in: ids } },
        select: { dictType: true },
      });

      if (dictDataList.length === 0) {
        throw new Error("字典数据不存在");
      }

      // 删除字典数据
      await prisma.dictData.deleteMany({
        where: { id: { in: ids } },
      });

      // 清除缓存
      const dictTypes = [...new Set(dictDataList.map((item) => item.dictType))];
      for (const type of dictTypes) {
        await this.clearCache(type);
      }

      return true;
    } catch (error) {
      logger.error("删除字典数据失败:", error);
      throw error;
    }
  }

  /**
   * 查询字典数据详情
   */
  async findById(id: number) {
    try {
      const dictData = await prisma.dictData.findUnique({
        where: { id },
      });

      if (!dictData) {
        throw new Error("字典数据不存在");
      }

      return dictData;
    } catch (error) {
      logger.error("查询字典数据详情失败:", error);
      throw error;
    }
  }

  /**
   * 分页查询字典数据列表
   */
  async findAll(query: DictDataQueryDto) {
    try {
      const { page, pageSize, dictType, dictLabel, status } = query;
      const skip = (page - 1) * pageSize;

      // 构建查询条件
      const where: any = {};

      if (dictType) {
        where.dictType = dictType;
      }

      if (dictLabel) {
        where.label = { contains: dictLabel };
      }

      if (status !== undefined) {
        where.status = status;
      }

      // 执行查询
      const [list, total] = await Promise.all([
        prisma.dictData.findMany({
          where,
          skip,
          take: pageSize,
          orderBy: { sort: "asc" },
        }),
        prisma.dictData.count({ where }),
      ]);

      return {
        list,
        total,
        page,
        pageSize,
      };
    } catch (error) {
      logger.error("查询字典数据列表失败:", error);
      throw error;
    }
  }

  /**
   * 根据字典类型查询字典数据
   */
  async getDictDataByType(dictType: string) {
    try {
      // 尝试从缓存获取
      const cacheKey = `dict:${dictType}`;
      const cached = await redisUtils.get(cacheKey, true);
      if (cached) {
        return cached;
      }

      // 检查字典类型是否存在
      const type = await prisma.dictType.findFirst({
        where: { type: dictType },
      });

      if (!type) {
        throw new Error(`字典类型 '${dictType}' 不存在`);
      }

      // 查询字典数据
      const dictDataList = await prisma.dictData.findMany({
        where: {
          dictType,
          status: "0", // 只查询正常状态的数据
        },
        orderBy: { sort: "asc" },
      });

      // 缓存数据
      await redisUtils.set(cacheKey, dictDataList, 3600); // 缓存1小时

      return dictDataList;
    } catch (error) {
      logger.error("根据字典类型查询字典数据失败:", error);
      throw error;
    }
  }

  /**
   * 更新字典数据状态
   */
  async updateStatus(id: number, status: string) {
    try {
      // 检查字典数据是否存在
      const dictData = await prisma.dictData.findUnique({
        where: { id },
      });

      if (!dictData) {
        throw new Error("字典数据不存在");
      }

      // 更新状态
      const updated = await prisma.dictData.update({
        where: { id },
        data: { status },
      });

      // 清除缓存
      await this.clearCache(dictData.dictType);

      return updated;
    } catch (error) {
      logger.error("更新字典数据状态失败:", error);
      throw error;
    }
  }

  /**
   * 导出字典数据
   */
  async exportData(query: Partial<DictDataQueryDto> = {}) {
    try {
      // 构建查询条件
      const where: any = {};

      if (query.dictType) {
        where.dictType = query.dictType;
      }

      if (query.dictLabel) {
        where.label = { contains: query.dictLabel };
      }

      if (query.status !== undefined) {
        where.status = query.status;
      }

      // 执行查询
      const dataList = await prisma.dictData.findMany({
        where,
        orderBy: { sort: "asc" },
      });

      // 格式化状态显示
      return dataList.map((data) => ({
        ...data,
        statusLabel: data.status === "0" ? "正常" : "停用",
        isDefaultLabel: data.isDefault === "Y" ? "是" : "否",
      }));
    } catch (error) {
      logger.error("导出字典数据失败:", error);
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
