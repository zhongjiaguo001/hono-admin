// src/modules/system/user/user.service.ts
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { redisUtils } from "@/utils/redis.utils";
import { logger } from "@/utils/logger.utils"; // 假设有日志工具
import {
  UserInfo,
  CreateUserDto,
  UpdateUserDto,
  UserQueryParams,
  PaginatedResult,
} from "./user.types";

const prisma = new PrismaClient();

export class UserService {
  /**
   * 通过ID查找用户
   */
  async findById(id: number): Promise<UserInfo> {
    try {
      const user = await prisma.user.findUnique({
        where: { id },
        include: {
          dept: true,
          userRoles: {
            include: {
              role: true,
            },
          },
        },
      });

      if (!user) {
        throw new Error("用户不存在");
      }

      // 转换为 UserInfo 结构并去除敏感信息
      const { password, psalt, ...userInfo } = user;

      // 处理角色信息
      const roles = user.userRoles.map((ur) => ({
        id: ur.role.id,
        name: ur.role.name,
        value: ur.role.value,
      }));

      return {
        ...userInfo,
        roles,
        dept: user.dept
          ? {
              id: user.dept.id,
              name: user.dept.name,
            }
          : undefined,
      } as unknown as UserInfo;
    } catch (error) {
      logger?.error("查询用户详情失败:", error);
      throw error;
    }
  }

  /**
   * 通过用户名查找用户
   */
  async findByUsername(username: string): Promise<UserInfo | null> {
    try {
      const user = await prisma.user.findUnique({
        where: { username },
      });

      if (!user) {
        return null;
      }

      // 删除敏感信息
      const { password, psalt, ...userInfo } = user;
      return userInfo as unknown as UserInfo;
    } catch (error) {
      logger?.error("通过用户名查询用户失败:", error);
      throw error;
    }
  }

  /**
   * 创建用户
   */
  async create(data: CreateUserDto): Promise<number> {
    try {
      const { username, password, deptId, roleIds, ...rest } = data;

      // 检查用户名是否存在
      const exists = await prisma.user.findUnique({
        where: { username },
      });

      if (exists) {
        throw new Error("用户名已存在");
      }

      // 生成密码盐和加密密码
      const psalt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password, psalt);

      // 使用事务创建用户及关联角色
      const result = await prisma.$transaction(async (tx) => {
        // 创建用户
        const user = await tx.user.create({
          data: {
            username,
            password: hashedPassword,
            psalt,
            deptId,
            ...rest,
          },
        });

        // 如果有角色ID，创建用户角色关联
        if (roleIds && roleIds.length > 0) {
          await Promise.all(
            roleIds.map((roleId) =>
              tx.userRole.create({
                data: {
                  userId: user.id,
                  roleId,
                },
              })
            )
          );
        }

        return user.id;
      });

      return result;
    } catch (error) {
      logger?.error("创建用户失败:", error);
      throw error;
    }
  }

  /**
   * 更新用户
   */
  async update(data: UpdateUserDto): Promise<boolean> {
    try {
      const { id, deptId, roleIds, ...rest } = data;

      // 检查用户是否存在
      const user = await prisma.user.findUnique({
        where: { id },
      });

      if (!user) {
        throw new Error("用户不存在");
      }

      // 使用事务更新用户及关联角色
      await prisma.$transaction(async (tx) => {
        // 更新用户基本信息
        await tx.user.update({
          where: { id },
          data: {
            ...rest,
            deptId,
          },
        });

        // 如果提供了角色ID，更新用户角色关联
        if (roleIds) {
          // 删除当前用户角色关联
          await tx.userRole.deleteMany({
            where: { userId: id },
          });

          // 创建新的用户角色关联
          if (roleIds.length > 0) {
            await Promise.all(
              roleIds.map((roleId) =>
                tx.userRole.create({
                  data: {
                    userId: id,
                    roleId,
                  },
                })
              )
            );
          }
        }
      });

      // 清除用户缓存
      await this.clearUserCache(id);

      return true;
    } catch (error) {
      logger?.error("更新用户失败:", error);
      throw error;
    }
  }

  /**
   * 删除用户
   */
  async delete(ids: number[]): Promise<boolean> {
    try {
      if (!ids || ids.length === 0) {
        throw new Error("用户ID不能为空");
      }

      // 删除用户
      await prisma.user.deleteMany({
        where: {
          id: { in: ids },
        },
      });

      // 清除用户缓存
      for (const id of ids) {
        await this.clearUserCache(id);
      }

      return true;
    } catch (error) {
      logger?.error("删除用户失败:", error);
      throw error;
    }
  }

  /**
   * 更新用户密码
   */
  async updatePassword(
    userId: number,
    oldPassword: string,
    newPassword: string
  ): Promise<boolean> {
    try {
      // 获取用户
      const user = await prisma.user.findUnique({
        where: { id: userId },
      });

      if (!user) {
        throw new Error("用户不存在");
      }

      // 验证旧密码
      const isValid = await bcrypt.compare(oldPassword, user.password);
      if (!isValid) {
        throw new Error("原密码错误");
      }

      // 生成新的密码盐和加密密码
      const psalt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(newPassword, psalt);

      // 更新密码
      await prisma.user.update({
        where: { id: userId },
        data: {
          password: hashedPassword,
          psalt,
        },
      });

      // 清除用户缓存
      await this.clearUserCache(userId);

      return true;
    } catch (error) {
      logger?.error("更新用户密码失败:", error);
      throw error;
    }
  }

  /**
   * 更新用户状态
   */
  async updateStatus(id: number, status: number): Promise<boolean> {
    try {
      if (status !== 0 && status !== 1) {
        throw new Error("状态值无效");
      }

      await prisma.user.update({
        where: { id },
        data: { status },
      });

      // 清除用户缓存
      await this.clearUserCache(id);

      return true;
    } catch (error) {
      logger?.error("更新用户状态失败:", error);
      throw error;
    }
  }

  /**
   * 获取用户角色
   */
  async getUserRoles(
    userId: number
  ): Promise<{ id: number; name: string; value: string }[]> {
    try {
      const userRoles = await prisma.userRole.findMany({
        where: { userId },
        include: { role: true },
      });

      return userRoles.map((ur) => ({
        id: ur.role.id,
        name: ur.role.name,
        value: ur.role.value,
      }));
    } catch (error) {
      logger?.error("获取用户角色失败:", error);
      throw error;
    }
  }

  /**
   * 设置用户角色
   */
  async setUserRoles(userId: number, roleIds: number[]): Promise<boolean> {
    try {
      // 检查用户是否存在
      const user = await prisma.user.findUnique({
        where: { id: userId },
      });

      if (!user) {
        throw new Error("用户不存在");
      }

      await prisma.$transaction(async (tx) => {
        // 删除当前用户角色关联
        await tx.userRole.deleteMany({
          where: { userId },
        });

        // 创建新的用户角色关联
        if (roleIds && roleIds.length > 0) {
          await Promise.all(
            roleIds.map((roleId) =>
              tx.userRole.create({
                data: {
                  userId,
                  roleId,
                },
              })
            )
          );
        }
      });

      // 清除用户缓存
      await this.clearUserCache(userId);
      // 清除用户权限缓存
      await redisUtils.del(`permissions:${userId}`);

      return true;
    } catch (error) {
      logger?.error("设置用户角色失败:", error);
      throw error;
    }
  }

  /**
   * 分页查询用户
   */
  async paginate(params: UserQueryParams): Promise<PaginatedResult<UserInfo>> {
    try {
      const {
        page = 1,
        pageSize = 10,
        username,
        status,
        deptId,
        startTime,
        endTime,
      } = params;

      const skip = (Number(page) - 1) * Number(pageSize);
      const take = Number(pageSize);

      // 构建查询条件
      const where: any = {};

      if (username) {
        where.username = { contains: username };
      }

      if (status !== undefined && status !== null) {
        where.status = Number(status);
      }

      if (deptId) {
        where.deptId = Number(deptId);
      }

      if (startTime && endTime) {
        where.createdAt = {
          gte: new Date(startTime),
          lte: new Date(endTime),
        };
      }

      // 执行查询
      const [list, total] = await Promise.all([
        prisma.user.findMany({
          where,
          include: {
            dept: true,
            userRoles: {
              include: {
                role: true,
              },
            },
          },
          skip,
          take,
          orderBy: { createdAt: "desc" },
        }),
        prisma.user.count({ where }),
      ]);

      // 处理返回数据，移除敏感信息
      const users = list.map((user) => {
        const { password, psalt, ...rest } = user;
        return {
          ...rest,
          dept: user.dept
            ? {
                id: user.dept.id,
                name: user.dept.name,
              }
            : undefined,
          roles: user.userRoles.map((ur) => ({
            id: ur.role.id,
            name: ur.role.name,
            value: ur.role.value,
          })),
        };
      });

      return {
        list: users as unknown as UserInfo[],
        pagination: {
          current: Number(page),
          pageSize: Number(pageSize),
          total,
        },
      };
    } catch (error) {
      logger?.error("分页查询用户失败:", error);
      throw error;
    }
  }

  /**
   * 清除用户缓存
   */
  private async clearUserCache(userId: number): Promise<void> {
    try {
      await Promise.all([
        redisUtils.del(`user:${userId}`),
        redisUtils.del(`permissions:${userId}`),
      ]);
    } catch (error) {
      logger?.error("清除用户缓存失败:", error);
      // 不抛出异常，避免影响主业务流程
    }
  }
}
