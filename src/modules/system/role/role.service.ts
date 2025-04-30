// src/modules/system/role/role.service.ts
import { prisma } from "@/db/prisma";
import { logger } from "@/utils/logger.utils";
import {
  CreateRoleDto,
  UpdateRoleDto,
  RoleQueryDto,
  RoleDataScopeDto,
  AllocatedUserQueryDto,
  RoleSelectUserDto,
  RoleMenuDto,
} from "./role.schema";
import { redisUtils } from "@/utils/redis.utils";

export class RoleService {
  /**
   * 创建角色
   */
  async create(data: CreateRoleDto) {
    try {
      const { menuIds, deptIds, ...roleData } = data;

      // 检查角色标识是否已存在
      const existRole = await prisma.role.findFirst({
        where: { key: roleData.key },
      });

      if (existRole) {
        throw new Error(`角色标识 '${roleData.key}' 已存在`);
      }

      // 使用事务创建角色及关联数据
      return await prisma.$transaction(async (tx) => {
        // 创建角色
        const role = await tx.role.create({
          data: {
            ...roleData,
            createBy: "admin", // 可从上下文获取当前用户名
          },
        });

        // 创建角色-菜单关联
        if (menuIds && menuIds.length > 0) {
          await tx.roleMenu.createMany({
            data: menuIds.map((menuId) => ({
              roleId: role.id,
              menuId,
            })),
          });
        }

        // 创建角色-部门关联(数据权限)
        if (deptIds && deptIds.length > 0) {
          await tx.roleDept.createMany({
            data: deptIds.map((deptId) => ({
              roleId: role.id,
              deptId,
            })),
          });
        }

        return role;
      });
    } catch (error) {
      logger.error("创建角色失败:", error);
      throw error;
    }
  }

  /**
   * 更新角色
   */
  async update(data: UpdateRoleDto) {
    try {
      const { id, menuIds, deptIds, ...roleData } = data;

      // 检查角色是否存在
      const role = await prisma.role.findUnique({
        where: { id },
      });

      if (!role) {
        throw new Error("角色不存在");
      }

      // 检查更新的角色标识是否与其他角色冲突
      if (roleData.key) {
        const existRole = await prisma.role.findFirst({
          where: {
            key: roleData.key,
            id: { not: id },
          },
        });

        if (existRole) {
          throw new Error(`角色标识 '${roleData.key}' 已存在`);
        }
      }

      // 使用事务更新角色及关联数据
      return await prisma.$transaction(async (tx) => {
        // 更新角色基本信息
        const updatedRole = await tx.role.update({
          where: { id },
          data: {
            ...roleData,
            updateBy: "admin", // 可从上下文获取当前用户名
          },
        });

        // 更新角色-菜单关联
        if (menuIds !== undefined) {
          // 删除现有关联
          await tx.roleMenu.deleteMany({
            where: { roleId: id },
          });

          // 创建新关联
          if (menuIds.length > 0) {
            await tx.roleMenu.createMany({
              data: menuIds.map((menuId) => ({
                roleId: id,
                menuId,
              })),
            });
          }

          // 清除相关缓存
          await this.clearRoleMenuCache(id);
        }

        // 更新角色-部门关联
        if (deptIds !== undefined) {
          // 删除现有关联
          await tx.roleDept.deleteMany({
            where: { roleId: id },
          });

          // 创建新关联
          if (deptIds.length > 0) {
            await tx.roleDept.createMany({
              data: deptIds.map((deptId) => ({
                roleId: id,
                deptId,
              })),
            });
          }
        }

        return updatedRole;
      });
    } catch (error) {
      logger.error("更新角色失败:", error);
      throw error;
    }
  }

  /**
   * 删除角色(支持批量)
   */
  async delete(ids: number[]) {
    try {
      // 检查是否有用户关联这些角色
      const userRoles = await prisma.userRole.findFirst({
        where: {
          roleId: { in: ids },
        },
      });

      if (userRoles) {
        throw new Error("角色已分配用户，不能删除");
      }

      // 使用事务删除角色及关联数据
      await prisma.$transaction(async (tx) => {
        // 删除角色-菜单关联
        await tx.roleMenu.deleteMany({
          where: { roleId: { in: ids } },
        });

        // 删除角色-部门关联
        await tx.roleDept.deleteMany({
          where: { roleId: { in: ids } },
        });

        // 删除角色
        await tx.role.deleteMany({
          where: { id: { in: ids } },
        });
      });

      // 清除相关缓存
      for (const id of ids) {
        await this.clearRoleMenuCache(id);
      }

      return true;
    } catch (error) {
      logger.error("删除角色失败:", error);
      throw error;
    }
  }

  /**
   * 查询角色详情
   */
  async findById(id: number) {
    try {
      const role = await prisma.role.findUnique({
        where: { id },
      });

      if (!role) {
        throw new Error("角色不存在");
      }

      // 查询角色关联的菜单ID
      const roleMenus = await prisma.roleMenu.findMany({
        where: { roleId: id },
        select: { menuId: true },
      });

      // 查询角色关联的部门ID
      const roleDepts = await prisma.roleDept.findMany({
        where: { roleId: id },
        select: { deptId: true },
      });

      return {
        ...role,
        menuIds: roleMenus.map((rm) => rm.menuId),
        deptIds: roleDepts.map((rd) => rd.deptId),
      };
    } catch (error) {
      logger.error("查询角色详情失败:", error);
      throw error;
    }
  }

  /**
   * 分页查询角色列表
   */
  async findAll(query: RoleQueryDto) {
    try {
      const { page, pageSize, name, key, status, createTime } = query;
      const skip = (page - 1) * pageSize;

      // 构建查询条件
      const where: any = {};

      if (name) {
        where.name = { contains: name };
      }

      if (key) {
        where.key = { contains: key };
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
        prisma.role.findMany({
          where,
          skip,
          take: pageSize,
          orderBy: { orderNo: "asc" },
        }),
        prisma.role.count({ where }),
      ]);

      return {
        list,
        total,
        page,
        pageSize,
      };
    } catch (error) {
      logger.error("查询角色列表失败:", error);
      throw error;
    }
  }

  /**
   * 更新角色状态
   */
  async updateStatus(id: number, status: string) {
    try {
      return await prisma.role.update({
        where: { id },
        data: { status },
      });
    } catch (error) {
      logger.error("更新角色状态失败:", error);
      throw error;
    }
  }

  /**
   * 设置角色数据权限
   */
  async dataScope(data: RoleDataScopeDto) {
    try {
      const { id, dataScope, deptIds } = data;

      // 使用事务更新数据
      await prisma.$transaction(async (tx) => {
        // 更新角色数据权限范围
        await tx.role.update({
          where: { id },
          data: { dataScope },
        });

        // 如果是自定义数据权限，则更新部门关联
        if (dataScope === "2" && deptIds) {
          // 删除现有关联
          await tx.roleDept.deleteMany({
            where: { roleId: id },
          });

          // 创建新关联
          if (deptIds.length > 0) {
            await tx.roleDept.createMany({
              data: deptIds.map((deptId) => ({
                roleId: id,
                deptId,
              })),
            });
          }
        } else {
          // 非自定义数据权限，删除部门关联
          await tx.roleDept.deleteMany({
            where: { roleId: id },
          });
        }
      });

      return true;
    } catch (error) {
      logger.error("设置角色数据权限失败:", error);
      throw error;
    }
  }

  /**
   * 查询已分配角色的用户列表
   */
  async allocatedUserList(query: AllocatedUserQueryDto) {
    try {
      const { roleId, username, phone, page, pageSize } = query;
      const skip = (page - 1) * pageSize;

      // 构建查询条件
      const where: any = {
        userRoles: {
          some: {
            roleId,
          },
        },
      };

      if (username) {
        where.username = { contains: username };
      }

      if (phone) {
        where.phonenumber = { contains: phone };
      }

      // 执行查询
      const [list, total] = await Promise.all([
        prisma.user.findMany({
          where,
          select: {
            id: true,
            username: true,
            nickname: true,
            email: true,
            phonenumber: true,
            status: true,
            createdAt: true,
            dept: {
              select: {
                name: true,
              },
            },
          },
          skip,
          take: pageSize,
          orderBy: { createdAt: "desc" },
        }),
        prisma.user.count({ where }),
      ]);

      // 格式化返回数据
      const formattedList = list.map((user) => ({
        ...user,
        deptName: user.dept?.name || "",
      }));

      return {
        list: formattedList,
        total,
        page,
        pageSize,
      };
    } catch (error) {
      logger.error("查询已分配角色的用户列表失败:", error);
      throw error;
    }
  }

  /**
   * 查询未分配角色的用户列表
   */
  async unallocatedUserList(query: AllocatedUserQueryDto) {
    try {
      const { roleId, username, phone, page, pageSize } = query;
      const skip = (page - 1) * pageSize;

      // 构建查询条件
      const where: any = {
        userRoles: {
          none: {
            roleId,
          },
        },
      };

      if (username) {
        where.username = { contains: username };
      }

      if (phone) {
        where.phonenumber = { contains: phone };
      }

      // 执行查询
      const [list, total] = await Promise.all([
        prisma.user.findMany({
          where,
          select: {
            id: true,
            username: true,
            nickname: true,
            email: true,
            phonenumber: true,
            status: true,
            createdAt: true,
            dept: {
              select: {
                name: true,
              },
            },
          },
          skip,
          take: pageSize,
          orderBy: { createdAt: "desc" },
        }),
        prisma.user.count({ where }),
      ]);

      // 格式化返回数据
      const formattedList = list.map((user) => ({
        ...user,
        deptName: user.dept?.name || "",
      }));

      return {
        list: formattedList,
        total,
        page,
        pageSize,
      };
    } catch (error) {
      logger.error("查询未分配角色的用户列表失败:", error);
      throw error;
    }
  }

  /**
   * 批量选择用户授权
   */
  async selectUsers(data: RoleSelectUserDto) {
    try {
      const { roleId, userIds } = data;

      if (!userIds || userIds.length === 0) {
        throw new Error("用户ID不能为空");
      }

      // 检查角色是否存在
      const role = await prisma.role.findUnique({
        where: { id: roleId },
      });

      if (!role) {
        throw new Error("角色不存在");
      }

      // 查询已存在的关联关系
      const existUserRoles = await prisma.userRole.findMany({
        where: {
          roleId,
          userId: { in: userIds },
        },
        select: {
          userId: true,
        },
      });

      const existUserIds = existUserRoles.map((ur) => ur.userId);
      const newUserIds = userIds.filter((id) => !existUserIds.includes(id));

      // 批量创建新的关联关系
      if (newUserIds.length > 0) {
        await prisma.userRole.createMany({
          data: newUserIds.map((userId) => ({
            roleId,
            userId,
          })),
          skipDuplicates: true,
        });
      }

      return { success: true, added: newUserIds.length };
    } catch (error) {
      logger.error("批量选择用户授权失败:", error);
      throw error;
    }
  }

  /**
   * 取消授权用户角色
   */
  async cancelAuthUser(userId: number, roleId: number) {
    try {
      // 删除用户角色关联
      await prisma.userRole.deleteMany({
        where: {
          userId,
          roleId,
        },
      });

      // 清除用户权限缓存
      await redisUtils.del(`user:${userId}:permissions`);
      await redisUtils.del(`user:${userId}:menus`);

      return { success: true };
    } catch (error) {
      logger.error("取消授权用户角色失败:", error);
      throw error;
    }
  }

  /**
   * 批量取消授权用户角色
   */
  async cancelAuthUserAll(roleId: number, userIds: number[]) {
    try {
      if (!userIds || userIds.length === 0) {
        throw new Error("用户ID不能为空");
      }

      // 批量删除用户角色关联
      await prisma.userRole.deleteMany({
        where: {
          roleId,
          userId: { in: userIds },
        },
      });

      // 清除用户权限缓存
      for (const userId of userIds) {
        await redisUtils.del(`user:${userId}:permissions`);
        await redisUtils.del(`user:${userId}:menus`);
      }

      return { success: true };
    } catch (error) {
      logger.error("批量取消授权用户角色失败:", error);
      throw error;
    }
  }

  /**
   * 获取角色菜单树
   */
  async getRoleMenuTree(roleId: number) {
    try {
      // 查询所有菜单
      const menus = await prisma.menu.findMany({
        where: { status: 1 },
        orderBy: { orderNo: "asc" },
      });

      // 查询角色已有菜单
      const roleMenus = await prisma.roleMenu.findMany({
        where: { roleId },
        select: { menuId: true },
      });

      const roleMenuIds = roleMenus.map((rm) => rm.menuId);

      // 构建树形结构
      const menuTree = this.buildMenuTree(menus);

      return {
        menus: menuTree,
        checkedKeys: roleMenuIds,
      };
    } catch (error) {
      logger.error("获取角色菜单树失败:", error);
      throw error;
    }
  }

  /**
   * 设置角色菜单权限
   */
  async setRoleMenu(data: RoleMenuDto) {
    try {
      const { roleId, menuIds } = data;

      // 检查角色是否存在
      const role = await prisma.role.findUnique({
        where: { id: roleId },
      });

      if (!role) {
        throw new Error("角色不存在");
      }

      // 更新角色菜单关联
      await prisma.$transaction(async (tx) => {
        // 删除现有关联
        await tx.roleMenu.deleteMany({
          where: { roleId },
        });

        // 创建新关联
        if (menuIds && menuIds.length > 0) {
          await tx.roleMenu.createMany({
            data: menuIds.map((menuId) => ({
              roleId,
              menuId,
            })),
          });
        }
      });

      // 清除相关缓存
      await this.clearRoleMenuCache(roleId);

      return { success: true };
    } catch (error) {
      logger.error("设置角色菜单权限失败:", error);
      throw error;
    }
  }

  /**
   * 清除角色菜单缓存
   */
  private async clearRoleMenuCache(roleId: number) {
    try {
      // 获取拥有该角色的所有用户
      const userRoles = await prisma.userRole.findMany({
        where: { roleId },
        select: { userId: true },
      });

      const userIds = userRoles.map((ur) => ur.userId);

      // 清除这些用户的菜单和权限缓存
      for (const userId of userIds) {
        await redisUtils.del(`user:${userId}:permissions`);
        await redisUtils.del(`user:${userId}:menus`);
      }
    } catch (error) {
      logger.error("清除角色菜单缓存失败:", error);
      // 不抛出异常，避免影响主业务
    }
  }

  /**
   * 构建菜单树结构
   */
  private buildMenuTree(menus: any[], parentId: number | null = null) {
    const result: any[] = [];

    menus.forEach((menu) => {
      // 兼容parentId为null或0的情况
      if (
        (parentId === null &&
          (menu.parentId === null || menu.parentId === 0)) ||
        menu.parentId === parentId
      ) {
        const node = { ...menu };
        const children = this.buildMenuTree(menus, menu.id);

        if (children.length > 0) {
          node.children = children;
        }

        result.push(node);
      }
    });

    return result;
  }

  /**
   * 导出角色数据
   */
  async exportRoles(query: Partial<RoleQueryDto> = {}) {
    try {
      // 构建查询条件
      const where: any = {};

      if (query.name) {
        where.name = { contains: query.name };
      }

      if (query.key) {
        where.key = { contains: query.key };
      }

      if (query.status !== undefined) {
        where.status = query.status;
      }

      // 处理时间范围查询
      if (query.createTime && query.createTime.length === 2) {
        const [startTime, endTime] = query.createTime;
        if (startTime && endTime) {
          where.createdAt = {
            gte: new Date(startTime),
            lte: new Date(endTime),
          };
        }
      }

      // 执行查询
      const roles = await prisma.role.findMany({
        where,
        orderBy: { orderNo: "asc" },
      });

      // 格式化状态显示
      return roles.map((role) => ({
        ...role,
        statusLabel: role.status === "0" ? "正常" : "停用",
        dataScopeLabel: this.getDataScopeLabel(role.dataScope),
      }));
    } catch (error) {
      logger.error("导出角色数据失败:", error);
      throw error;
    }
  }

  /**
   * 获取数据权限范围标签
   */
  private getDataScopeLabel(dataScope: string) {
    const dataScopeMap: Record<string, string> = {
      "1": "全部数据权限",
      "2": "自定义数据权限",
      "3": "本部门数据权限",
      "4": "本部门及以下数据权限",
      "5": "仅本人数据权限",
    };

    return dataScopeMap[dataScope] || "未知权限";
  }
}
