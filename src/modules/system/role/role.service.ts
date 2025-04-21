// src/modules/role/service.ts
import {
  CreateRoleDto,
  UpdateRoleDto,
  RolePageDto,
  RoleMenuDto,
} from "./role.schema";
import { prisma } from "@/db/prisma";
import { logger } from "@/utils/logger.utils";

export class RoleService {
  async create(data: CreateRoleDto) {
    const { menuIds, ...roleData } = data;

    // 开始事务
    return prisma.$transaction(async (tx) => {
      // 创建角色
      const role = await tx.role.create({
        data: roleData,
      });

      // 如果有菜单ID，创建角色-菜单关联
      if (menuIds && menuIds.length > 0) {
        await tx.roleMenu.createMany({
          data: menuIds.map((menuId) => ({
            roleId: role.id,
            menuId,
          })),
        });
      }

      return role;
    });
  }

  async update(data: UpdateRoleDto) {
    const { menuIds, id, ...roleData } = data;

    // 开始事务
    return prisma.$transaction(async (tx) => {
      // 更新角色基本信息
      const role = await tx.role.update({
        where: { id },
        data: roleData,
      });

      // 如果有菜单ID，先删除旧关联，再创建新关联
      if (menuIds) {
        await tx.roleMenu.deleteMany({
          where: { roleId: id },
        });

        if (menuIds.length > 0) {
          await tx.roleMenu.createMany({
            data: menuIds.map((menuId) => ({
              roleId: id,
              menuId,
            })),
          });
        }
      }

      return role;
    });
  }

  async delete(ids: number[]): Promise<boolean> {
    try {
      if (!ids || ids.length === 0) {
        throw new Error("角色ID不能为空");
      }

      // 删除用户
      await prisma.role.deleteMany({
        where: {
          id: { in: ids },
        },
      });

      return true;
    } catch (error) {
      logger?.error("删除用户失败:", error);
      throw error;
    }
  }

  async findById(id: number) {
    return prisma.role.findUnique({
      where: { id },
      include: {
        menus: {
          select: {
            menuId: true,
          },
        },
      },
    });
  }

  async findAll(query: RolePageDto) {
    const { page, pageSize, ...filters } = query;
    const skip = (page - 1) * pageSize;

    // 构建查询条件
    const where: any = {};

    if (filters.name) {
      where.name = {
        contains: filters.name,
      };
    }

    if (filters.code) {
      where.code = {
        contains: filters.code,
      };
    }

    if (filters.status !== undefined) {
      where.status = filters.status;
    }

    // 查询总数
    const total = await prisma.role.count({ where });

    // 查询分页数据
    const list = await prisma.role.findMany({
      where,
      skip,
      take: pageSize,
      orderBy: {
        orderNo: "asc",
      },
    });

    return {
      list,
      total,
      page,
      pageSize,
    };
  }

  async updateStatus(id: number, status: number) {
    if (status !== 0 && status !== 1) {
      throw new Error("状态值无效");
    }

    return prisma.role.update({
      where: { id },
      data: { status },
    });
  }

  async setRoleMenus(data: RoleMenuDto) {
    const { roleId, menuIds } = data;

    return prisma.$transaction(async (tx) => {
      // 删除该角色的所有菜单关联
      await tx.roleMenu.deleteMany({
        where: { roleId },
      });

      // 创建新的关联
      if (menuIds.length > 0) {
        await tx.roleMenu.createMany({
          data: menuIds.map((menuId) => ({
            roleId,
            menuId,
          })),
        });
      }

      return { success: true };
    });
  }

  async getRoleMenus(roleId: number) {
    const roleMenus = await prisma.roleMenu.findMany({
      where: { roleId },
      include: {
        menu: true,
      },
    });

    return roleMenus.map((rm) => rm.menu);
  }

  async getUserRoles(userId: number) {
    const userRoles = await prisma.userRole.findMany({
      where: { userId },
      include: {
        role: true,
      },
    });

    return userRoles.map((ur) => ur.role);
  }

  async getUserPermissions(userId: number) {
    // 获取用户的所有角色ID
    const userRoles = await prisma.userRole.findMany({
      where: { userId },
      select: { roleId: true },
    });

    const roleIds = userRoles.map((ur) => ur.roleId);

    if (roleIds.length === 0) {
      return [];
    }

    // 获取这些角色的所有菜单
    const roleMenus = await prisma.roleMenu.findMany({
      where: {
        roleId: {
          in: roleIds,
        },
      },
      include: {
        menu: {
          select: {
            permission: true,
          },
        },
      },
    });

    // 提取权限标识并过滤掉空值
    const permissions = roleMenus
      .map((rm) => rm.menu.permission)
      .filter((perms) => perms !== null && perms !== undefined && perms !== "");

    // 返回去重后的权限列表
    return [...new Set(permissions)];
  }

  async getUserMenuIds(userId: number) {
    // 获取用户的所有角色ID
    const userRoles = await prisma.userRole.findMany({
      where: { userId },
      select: { roleId: true },
    });

    const roleIds = userRoles.map((ur) => ur.roleId);

    if (roleIds.length === 0) {
      return [];
    }

    // 获取这些角色的所有菜单ID
    const roleMenus = await prisma.roleMenu.findMany({
      where: {
        roleId: {
          in: roleIds,
        },
      },
      select: { menuId: true },
    });

    // 返回去重后的菜单ID列表
    return [...new Set(roleMenus.map((rm) => rm.menuId))];
  }
}
