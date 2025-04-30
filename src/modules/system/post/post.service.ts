// src/modules/system/post/post.service.ts
import { prisma } from "@/db/prisma";
import { logger } from "@/utils/logger.utils";
import { CreatePostDto, UpdatePostDto, PostQueryDto } from "./post.schema";

export class PostService {
  /**
   * 创建岗位
   */
  async create(data: CreatePostDto) {
    try {
      // 检查岗位编码是否已存在
      const existPost = await prisma.post.findFirst({
        where: { code: data.code },
      });

      if (existPost) {
        throw new Error(`岗位编码 '${data.code}' 已存在`);
      }

      // 创建岗位
      return await prisma.post.create({
        data: {
          ...data,
          createBy: "admin", // 可从上下文获取当前用户名
        },
      });
    } catch (error) {
      logger.error("创建岗位失败:", error);
      throw error;
    }
  }

  /**
   * 更新岗位
   */
  async update(data: UpdatePostDto) {
    try {
      const { id, ...postData } = data;

      // 检查岗位是否存在
      const post = await prisma.post.findUnique({
        where: { id },
      });

      if (!post) {
        throw new Error("岗位不存在");
      }

      // 检查岗位编码是否与其他岗位冲突
      if (postData.code) {
        const existPost = await prisma.post.findFirst({
          where: {
            code: postData.code,
            id: { not: id },
          },
        });

        if (existPost) {
          throw new Error(`岗位编码 '${postData.code}' 已存在`);
        }
      }

      // 更新岗位
      return await prisma.post.update({
        where: { id },
        data: {
          ...postData,
          updateBy: "admin", // 可从上下文获取当前用户名
        },
      });
    } catch (error) {
      logger.error("更新岗位失败:", error);
      throw error;
    }
  }

  /**
   * 删除岗位(支持批量)
   */
  async delete(ids: number[]) {
    try {
      // 检查岗位是否已分配用户
      const userPosts = await prisma.userPost.findFirst({
        where: {
          postId: { in: ids },
        },
      });

      if (userPosts) {
        throw new Error("岗位已分配用户，不能删除");
      }

      // 删除岗位
      await prisma.post.deleteMany({
        where: { id: { in: ids } },
      });

      return true;
    } catch (error) {
      logger.error("删除岗位失败:", error);
      throw error;
    }
  }

  /**
   * 查询岗位详情
   */
  async findById(id: number) {
    try {
      const post = await prisma.post.findUnique({
        where: { id },
      });

      if (!post) {
        throw new Error("岗位不存在");
      }

      return post;
    } catch (error) {
      logger.error("查询岗位详情失败:", error);
      throw error;
    }
  }

  /**
   * 分页查询岗位列表
   */
  async findAll(query: PostQueryDto) {
    try {
      const { page, pageSize, code, name, status } = query;
      const skip = (page - 1) * pageSize;

      // 构建查询条件
      const where: any = {};

      if (code) {
        where.code = { contains: code };
      }

      if (name) {
        where.name = { contains: name };
      }

      if (status !== undefined) {
        where.status = status;
      }

      // 执行查询
      const [list, total] = await Promise.all([
        prisma.post.findMany({
          where,
          skip,
          take: pageSize,
          orderBy: { sort: "asc" },
        }),
        prisma.post.count({ where }),
      ]);

      return {
        list,
        total,
        page,
        pageSize,
      };
    } catch (error) {
      logger.error("查询岗位列表失败:", error);
      throw error;
    }
  }

  /**
   * 查询所有岗位（不分页）
   */
  async findAllPosts() {
    try {
      return await prisma.post.findMany({
        where: { status: "0" }, // 只查询正常状态的岗位
        orderBy: { sort: "asc" },
      });
    } catch (error) {
      logger.error("查询所有岗位失败:", error);
      throw error;
    }
  }

  /**
   * 更新岗位状态
   */
  async updateStatus(id: number, status: string) {
    try {
      return await prisma.post.update({
        where: { id },
        data: { status },
      });
    } catch (error) {
      logger.error("更新岗位状态失败:", error);
      throw error;
    }
  }

  /**
   * 查询用户所属岗位
   */
  async getUserPosts(userId: number) {
    try {
      const userPosts = await prisma.userPost.findMany({
        where: { userId },
        include: {
          post: true,
        },
      });

      return userPosts.map((up) => up.post);
    } catch (error) {
      logger.error("查询用户所属岗位失败:", error);
      throw error;
    }
  }

  /**
   * 设置用户岗位
   */
  async setUserPosts(userId: number, postIds: number[]) {
    try {
      // 检查用户是否存在
      const user = await prisma.user.findUnique({
        where: { id: userId },
      });

      if (!user) {
        throw new Error("用户不存在");
      }

      // 使用事务更新用户岗位关联
      await prisma.$transaction(async (tx) => {
        // 删除现有关联
        await tx.userPost.deleteMany({
          where: { userId },
        });

        // 创建新关联
        if (postIds && postIds.length > 0) {
          await tx.userPost.createMany({
            data: postIds.map((postId) => ({
              userId,
              postId,
            })),
          });
        }
      });

      return true;
    } catch (error) {
      logger.error("设置用户岗位失败:", error);
      throw error;
    }
  }

  /**
   * 导出岗位数据
   */
  async exportPosts(query: Partial<PostQueryDto> = {}) {
    try {
      // 构建查询条件
      const where: any = {};

      if (query.code) {
        where.code = { contains: query.code };
      }

      if (query.name) {
        where.name = { contains: query.name };
      }

      if (query.status !== undefined) {
        where.status = query.status;
      }

      // 执行查询
      const posts = await prisma.post.findMany({
        where,
        orderBy: { sort: "asc" },
      });

      // 格式化状态显示
      return posts.map((post) => ({
        ...post,
        statusLabel: post.status === "0" ? "正常" : "停用",
      }));
    } catch (error) {
      logger.error("导出岗位数据失败:", error);
      throw error;
    }
  }
}
