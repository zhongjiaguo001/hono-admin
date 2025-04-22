// src/modules/system/user/user.controller.ts
import { Context } from "hono";
import { UserService } from "./user.service";
import type { UserQueryParams } from "./user.types";
import type {
  UpdateUserDto,
  CreateUserDto,
  ResetPasswordDto,
  UpdatePasswordDto,
} from "./user.schema";
import { logger } from "@/utils/logger.utils";
import { FileUtils } from "@/utils/file.utils";
import { ExcelUtils, ExcelColumn } from "@/utils/excel.utils";
import { config } from "@/config";
import { readFile } from "node:fs/promises";
import { join } from "node:path";

export class UserController {
  private userService: UserService;

  constructor() {
    this.userService = new UserService();
  }
  /**
   * 获取用户列表(分页)
   */
  list = async (c: Context) => {
    try {
      // 获取已验证的查询参数
      const params = c.get("zod") as UserQueryParams;

      const result = await this.userService.paginate(params);

      return c.json({
        code: 200,
        data: result,
      });
    } catch (error) {
      return c.json(
        {
          code: 500,
          message: error instanceof Error ? error.message : "查询用户列表失败",
        },
        500
      );
    }
  };

  /**
   * 获取用户详情
   */
  getById = async (c: Context) => {
    try {
      const id = Number(c.req.param("id"));

      if (isNaN(id)) {
        return c.json(
          {
            code: 400,
            message: "无效的用户ID",
          },
          400
        );
      }

      const user = await this.userService.findById(id);

      return c.json({
        code: 200,
        data: user,
      });
    } catch (error) {
      return c.json(
        {
          code: 500,
          message: error instanceof Error ? error.message : "获取用户详情失败",
        },
        500
      );
    }
  };

  /**
   * 通过用户名查询用户
   */
  getByUsername = async (c: Context) => {
    try {
      const username = c.req.param("username");
      const user = await this.userService.findByUsername(username);

      if (!user) {
        return c.json(
          {
            code: 404,
            message: "用户不存在",
          },
          404
        );
      }

      return c.json({
        code: 200,
        data: user,
      });
    } catch (error) {
      return c.json(
        {
          code: 500,
          message: error instanceof Error ? error.message : "查询用户失败",
        },
        500
      );
    }
  };

  /**
   * 创建用户
   */
  create = async (c: Context) => {
    try {
      // 获取已验证的数据
      const data = c.get("zod") as CreateUserDto;

      const userId = await this.userService.create(data);

      return c.json({
        code: 200,
        message: "创建成功",
        data: { id: userId },
      });
    } catch (error) {
      return c.json(
        {
          code: 500,
          message: error instanceof Error ? error.message : "创建用户失败",
        },
        500
      );
    }
  };

  /**
   * 更新用户
   */
  update = async (c: Context) => {
    try {
      // 获取已验证的数据
      const data = c.get("zod") as UpdateUserDto;

      await this.userService.update(data);

      return c.json({
        code: 200,
        message: "更新成功",
      });
    } catch (error) {
      return c.json(
        {
          code: 500,
          message: error instanceof Error ? error.message : "更新用户失败",
        },
        500
      );
    }
  };

  /**
   * 删除用户
   */
  delete = async (c: Context) => {
    try {
      const id = c.req.param("id");
      const ids = id.split(",").map(Number);

      if (ids.some(isNaN)) {
        return c.json(
          {
            code: 400,
            message: "无效的用户ID格式",
          },
          400
        );
      }

      await this.userService.delete(ids);

      return c.json({
        code: 200,
        message: "删除成功",
      });
    } catch (error) {
      return c.json(
        {
          code: 500,
          message: error instanceof Error ? error.message : "删除用户失败",
        },
        500
      );
    }
  };

  /**
   * 重置用户密码
   */
  resetPassword = async (c: Context) => {
    try {
      // 获取已验证的数据
      const data = c.get("zod") as ResetPasswordDto;
      await this.userService.updatePassword(data.id, data.newPassword);

      return c.json({
        code: 200,
        message: "密码修改成功",
      });
    } catch (error) {
      return c.json(
        {
          code: 500,
          message: error instanceof Error ? error.message : "修改密码失败",
        },
        500
      );
    }
  };

  /**
   * 修改当前登录用户密码
   */
  updatePassword = async (c: Context) => {
    try {
      const user = c.get("user");
      const userId = user.id;

      // 获取并验证提交的数据
      const { oldPassword, newPassword } = c.get("zod") as UpdatePasswordDto;

      // 验证旧密码是否正确
      const isPasswordValid = await this.userService.verifyPassword(
        userId,
        oldPassword
      );
      if (!isPasswordValid) {
        return c.json(
          {
            code: 400,
            message: "旧密码不正确",
          },
          400
        );
      }

      // 检查新密码是否与旧密码相同
      if (oldPassword === newPassword) {
        return c.json(
          {
            code: 400,
            message: "新密码不能与旧密码相同",
          },
          400
        );
      }

      // 更新密码
      await this.userService.updatePassword(userId, newPassword);

      return c.json({
        code: 200,
        message: "密码修改成功",
      });
    } catch (error) {
      return c.json(
        {
          code: 500,
          message: error instanceof Error ? error.message : "修改密码失败",
        },
        500
      );
    }
  };

  /**
   * 修改用户状态
   */
  updateStatus = async (c: Context) => {
    try {
      // 获取已验证的数据
      const data = c.get("zod");

      await this.userService.updateStatus(data.id, data.status);

      return c.json({
        code: 200,
        message: "状态修改成功",
      });
    } catch (error) {
      return c.json(
        {
          code: 500,
          message: error instanceof Error ? error.message : "修改用户状态失败",
        },
        500
      );
    }
  };

  /**
   * 获取用户角色
   */
  getUserRoles = async (c: Context) => {
    try {
      const id = Number(c.req.param("id"));

      if (isNaN(id)) {
        return c.json(
          {
            code: 400,
            message: "无效的用户ID",
          },
          400
        );
      }

      const roles = await this.userService.getUserRoles(id);

      return c.json({
        code: 200,
        data: roles,
      });
    } catch (error) {
      return c.json(
        {
          code: 500,
          message: error instanceof Error ? error.message : "获取用户角色失败",
        },
        500
      );
    }
  };

  /**
   * 设置用户角色
   */
  setUserRoles = async (c: Context) => {
    try {
      const id = Number(c.req.param("id"));
      const { roleIds } = await c.req.json();

      if (isNaN(id)) {
        return c.json(
          {
            code: 400,
            message: "无效的用户ID",
          },
          400
        );
      }

      if (!Array.isArray(roleIds)) {
        return c.json(
          {
            code: 400,
            message: "roleIds必须是数组",
          },
          400
        );
      }

      await this.userService.setUserRoles(id, roleIds);

      return c.json({
        code: 200,
        message: "角色设置成功",
      });
    } catch (error) {
      return c.json(
        {
          code: 500,
          message: error instanceof Error ? error.message : "设置用户角色失败",
        },
        500
      );
    }
  };

  /**
   * 导出用户数据
   */
  export = async (c: Context) => {
    try {
      // 获取查询参数
      const params = c.req.query();

      // 查询用户列表（不分页）
      const users = await this.userService.findAll(params);

      // 定义导出列
      const columns: ExcelColumn[] = [
        { header: "用户名", key: "username", width: 15 },
        { header: "昵称", key: "nickname", width: 15 },
        { header: "部门", key: "deptName", width: 15 },
        { header: "手机号码", key: "phone", width: 15 },
        { header: "邮箱", key: "email", width: 20 },
        { header: "状态", key: "statusText", width: 10 },
        { header: "创建时间", key: "createdAt", width: 20 },
      ];

      // 处理导出数据
      const exportData = users.map((user) => ({
        ...user,
        deptName: user.dept?.name || "",
        statusText: user.status === 1 ? "正常" : "停用",
        createdAt: user.createdAt
          ? new Date(user.createdAt).toLocaleString()
          : "",
      }));

      // 导出到Excel
      const filePath = await ExcelUtils.exportToExcel(exportData, columns, {
        filename: `user_export_${Date.now()}.xlsx`,
        sheetName: "用户数据",
      });

      // 设置响应头
      c.header(
        "Content-Type",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
      );
      c.header("Content-Disposition", `attachment; filename=user_export.xlsx`);

      // 返回文件
      const fileBuffer = await readFile(filePath);
      return c.body(fileBuffer);
    } catch (error) {
      logger.error("导出用户数据失败:", error);
      return c.json(
        {
          code: 500,
          message: error instanceof Error ? error.message : "导出用户数据失败",
        },
        500
      );
    }
  };

  /**
   * 下载用户导入模板
   */
  importTemplate = async (c: Context) => {
    try {
      // 定义模板列
      const columns: ExcelColumn[] = [
        { header: "用户名*", key: "username", width: 15 },
        { header: "昵称", key: "nickname", width: 15 },
        { header: "部门编号", key: "deptId", width: 15 },
        { header: "手机号码", key: "phone", width: 15 },
        { header: "邮箱", key: "email", width: 20 },
        { header: "登录密码*", key: "password", width: 15 },
        { header: "用户状态(0=停用,1=正常)", key: "status", width: 20 },
      ];

      // 生成模板
      const filePath = await ExcelUtils.generateTemplate(columns, {
        filename: "user_import_template.xlsx",
        sheetName: "用户导入",
      });

      // 设置响应头
      c.header(
        "Content-Type",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
      );
      c.header(
        "Content-Disposition",
        `attachment; filename=user_import_template.xlsx`
      );

      // 返回文件
      const fileBuffer = await readFile(filePath);
      return c.body(fileBuffer);
    } catch (error) {
      logger.error("获取导入模板失败:", error);
      return c.json(
        {
          code: 500,
          message: error instanceof Error ? error.message : "获取导入模板失败",
        },
        500
      );
    }
  };

  /**
   * 导入用户数据
   */
  importData = async (c: Context) => {
    try {
      const body = await c.req.parseBody();
      const file = body.file;

      if (!file || !(file instanceof File)) {
        return c.json(
          {
            code: 400,
            message: "未上传文件",
          },
          400
        );
      }

      // 检查文件类型
      if (!file.type.includes("spreadsheetml")) {
        return c.json(
          {
            code: 400,
            message: "请上传Excel文件",
          },
          400
        );
      }

      // 保存上传文件
      const fileInfo = await FileUtils.saveFile(file, config.upload.tempDir);

      // 导入Excel处理逻辑...

      // 返回结果
      return c.json({
        code: 200,
        message: `导入成功`,
        data: {
          // 导入结果...
        },
      });
    } catch (error) {
      logger.error("导入用户数据失败:", error);
      return c.json(
        {
          code: 500,
          message: error instanceof Error ? error.message : "导入用户数据失败",
        },
        500
      );
    }
  };

  /**
   * 获取当前登录用户个人信息
   */
  getProfile = async (c: Context) => {
    try {
      const user = c.get("user");
      const userInfo = await this.userService.findById(user.id);

      return c.json({
        code: 200,
        data: userInfo,
      });
    } catch (error) {
      return c.json(
        {
          code: 500,
          message: error instanceof Error ? error.message : "获取个人信息失败",
        },
        500
      );
    }
  };

  /**
   * 修改当前登录用户个人信息
   */
  updateProfile = async (c: Context) => {
    try {
      const user = c.get("user");
      const userId = user.id;

      // 获取并验证提交的数据
      const data = c.get("zod");

      // 封装为更新用户对象
      const updateUserDto: UpdateUserDto = {
        id: userId,
        ...data,
      };

      // 调用更新服务
      await this.userService.update(updateUserDto);

      return c.json({
        code: 200,
        message: "个人信息修改成功",
      });
    } catch (error) {
      return c.json(
        {
          code: 500,
          message: error instanceof Error ? error.message : "修改个人信息失败",
        },
        500
      );
    }
  };

  /**
   * 修改当前登录用户头像
   */
  updateAvatar = async (c: Context) => {
    try {
      const user = c.get("user");
      const userId = user.id;

      // 解析上传的文件
      const body = await c.req.parseBody();
      const avatarFile = body.avatar;

      if (!avatarFile || !(avatarFile instanceof File)) {
        return c.json(
          {
            code: 400,
            message: "未上传头像文件",
          },
          400
        );
      }

      // 验证文件类型
      if (!avatarFile.type.startsWith("image/")) {
        return c.json(
          {
            code: 400,
            message: "请上传图片文件",
          },
          400
        );
      }

      // 保存头像文件
      const avatarDir = join(config.upload.baseDir, "avatar");
      const fileInfo = await FileUtils.saveFile(avatarFile, avatarDir);

      // 更新用户头像
      await this.userService.update({
        id: userId,
        avatar: fileInfo.url,
      });

      return c.json({
        code: 200,
        message: "头像修改成功",
        data: {
          imgUrl: fileInfo.url,
        },
      });
    } catch (error) {
      return c.json(
        {
          code: 500,
          message: error instanceof Error ? error.message : "修改头像失败",
        },
        500
      );
    }
  };
}
