// src/modules/system/dept/dept.service.ts
import { prisma } from "@/db/prisma";
import { logger } from "@/utils/logger.utils";
import { CreateDeptDto, UpdateDeptDto, DeptQueryDto } from "./dept.schema";

export class DeptService {
  /**
   * 获取部门列表(树形结构)
   */
  async findTree(query: DeptQueryDto) {
    try {
      const where: any = {};

      if (query.name) {
        where.name = { contains: query.name };
      }

      if (query.status) {
        where.status = query.status;
      }

      if (query.parentId !== undefined) {
        where.parentId = query.parentId;
      }

      // 查询所有部门
      const depts = await prisma.dept.findMany({
        where,
        orderBy: { orderNo: "asc" },
      });

      // 构建树结构
      return this.buildTree(depts);
    } catch (error) {
      logger.error("查询部门列表失败:", error);
      throw error;
    }
  }

  /**
   * 创建部门
   */
  async create(data: CreateDeptDto) {
    try {
      // 处理parentId，如果未提供则设为0而不是null
      const parentId = data.parentId || 0;
      let ancestors = "0";

      // 非顶级部门，需要获取父部门的ancestors
      if (parentId !== 0) {
        const parentDept = await prisma.dept.findUnique({
          where: { id: parentId },
        });

        if (!parentDept) {
          throw new Error("父部门不存在");
        }

        // 拼接ancestors: 父部门的ancestors + 父部门ID
        ancestors = parentDept.ancestors + "," + parentId;
      }

      // 创建部门
      return await prisma.dept.create({
        data: {
          ...data,
          parentId: parentId === 0 ? null : parentId, // 转换为数据库格式
          ancestors: ancestors,
          createBy: "admin", // 可从上下文获取当前用户名
        },
      });
    } catch (error) {
      logger.error("创建部门失败:", error);
      throw error;
    }
  }

  /**
   * 更新部门
   */
  async update(id: number, data: UpdateDeptDto) {
    try {
      // 检查部门是否存在
      const dept = await prisma.dept.findUnique({
        where: { id },
      });

      if (!dept) {
        throw new Error("部门不存在");
      }

      // 处理parentId，如果更新为0则为顶级部门
      let updateData: any = { ...data };
      if (updateData.parentId === 0) {
        updateData.parentId = null;
      }

      // 如果更新了父部门，需要更新ancestors
      if (
        updateData.parentId !== undefined &&
        updateData.parentId !== dept.parentId
      ) {
        // 检查是否将部门修改为其子部门，这是不允许的
        const childDepts = await this.findChildDepts(id);
        if (childDepts.some((d) => d.id === updateData.parentId)) {
          throw new Error("不能将部门修改为其子部门");
        }

        // 更新ancestors
        let ancestors = "0";
        if (updateData.parentId) {
          const parentDept = await prisma.dept.findUnique({
            where: { id: updateData.parentId },
          });
          if (parentDept) {
            ancestors = parentDept.ancestors + "," + updateData.parentId;
          }
        }
        updateData.ancestors = ancestors;

        // 同时更新子部门的ancestors
        await this.updateChildrenAncestors(id, dept.ancestors, ancestors);
      }

      // 更新部门
      return await prisma.dept.update({
        where: { id },
        data: {
          ...updateData,
          updateBy: "admin", // 从上下文获取当前用户
        },
      });
    } catch (error) {
      logger.error("更新部门失败:", error);
      throw error;
    }
  }

  /**
   * 更新子部门的ancestors
   */
  private async updateChildrenAncestors(
    deptId: number,
    oldAncestors: string,
    newAncestors: string
  ) {
    try {
      // 查找所有该部门的子部门
      const childDepts = await prisma.dept.findMany({
        where: { parentId: deptId },
      });

      for (const child of childDepts) {
        // 子部门的新ancestors：替换掉ancestors中的oldAncestors前缀，换成newAncestors
        const childNewAncestors = newAncestors + "," + deptId;

        // 更新子部门的ancestors
        await prisma.dept.update({
          where: { id: child.id },
          data: { ancestors: childNewAncestors },
        });

        // 递归更新子部门的子部门
        await this.updateChildrenAncestors(
          child.id,
          child.ancestors,
          childNewAncestors
        );
      }
    } catch (error) {
      logger.error("更新子部门ancestors失败:", error);
      throw error;
    }
  }

  /**
   * 删除部门
   */
  async delete(id: number) {
    try {
      // 检查是否有子部门
      const childCount = await prisma.dept.count({
        where: { parentId: id },
      });

      if (childCount > 0) {
        throw new Error("存在子部门，不允许删除");
      }

      // 检查是否有关联用户
      const userCount = await prisma.user.count({
        where: { deptId: id },
      });

      if (userCount > 0) {
        throw new Error("部门存在关联用户，不允许删除");
      }

      // 删除部门
      await prisma.dept.delete({
        where: { id },
      });

      return true;
    } catch (error) {
      logger.error("删除部门失败:", error);
      throw error;
    }
  }

  /**
   * 获取部门详情
   */
  async findById(id: number) {
    try {
      return await prisma.dept.findUnique({
        where: { id },
      });
    } catch (error) {
      logger.error("获取部门详情失败:", error);
      throw error;
    }
  }

  /**
   * 获取下拉树列表
   */
  async treeSelect() {
    try {
      const depts = await prisma.dept.findMany({
        where: { status: "0" }, // 只查询正常状态的部门
        orderBy: { orderNo: "asc" },
      });

      return this.buildTreeSelect(depts);
    } catch (error) {
      logger.error("获取部门树选择列表失败:", error);
      throw error;
    }
  }

  /**
   * 查询部门列表（排除节点）
   */
  async listExclude(excludeId: number) {
    try {
      // 查找要排除的部门及其所有子部门
      const excludeDepts = await this.findChildDepts(excludeId);
      const excludeIds = excludeDepts.map((d) => d.id);
      excludeIds.push(excludeId);

      // 查询未被排除的部门
      const depts = await prisma.dept.findMany({
        where: {
          id: { notIn: excludeIds },
        },
        orderBy: { orderNo: "asc" },
      });

      return this.buildTree(depts);
    } catch (error) {
      logger.error("查询部门列表（排除节点）失败:", error);
      throw error;
    }
  }

  /**
   * 构建树结构
   */
  private buildTree(depts: any[]) {
    const deptMap = new Map();
    const result: any[] = [];

    // 创建映射
    depts.forEach((dept) => {
      deptMap.set(dept.id, { ...dept, children: [] });
    });

    // 构建树
    depts.forEach((dept) => {
      const node = deptMap.get(dept.id);

      if (dept.parentId === null || dept.parentId === 0) {
        // 根节点
        result.push(node);
      } else {
        // 子节点，添加到父节点的children
        const parent = deptMap.get(dept.parentId);
        if (parent) {
          parent.children.push(node);
        }
      }
    });

    return result;
  }

  /**
   * 构建下拉树结构
   */
  private buildTreeSelect(depts: any[]) {
    return depts.map((dept) => {
      const node = {
        id: dept.id,
        label: dept.name,
        value: dept.id,
        parentId: dept.parentId,
      };
      return node;
    });
  }

  /**
   * 查找所有子部门
   */
  private async findChildDepts(parentId: number) {
    const allDepts = await prisma.dept.findMany();
    const result: any[] = [];

    // 递归查找子部门
    const findChildren = (pid: number) => {
      const children = allDepts.filter((d) => d.parentId === pid);
      if (children.length > 0) {
        result.push(...children);
        children.forEach((child) => findChildren(child.id));
      }
    };

    findChildren(parentId);
    return result;
  }
}
