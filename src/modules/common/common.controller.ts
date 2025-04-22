// src/modules/common/common.controller.ts
import { Context } from "hono";
import { join } from "node:path";
import { stat, readFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { FileUtils } from "@/utils/file.utils";
import { config } from "@/config";
import { logger } from "@/utils/logger.utils";
import { prisma } from "@/db/prisma";

export class CommonController {
  /**
   * 文件上传
   */
  upload = async (c: Context) => {
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

      // 验证文件类型
      if (
        config.upload.allowTypes.length > 0 &&
        !config.upload.allowTypes.includes(file.type)
      ) {
        return c.json(
          {
            code: 400,
            message: `不支持的文件类型: ${file.type}`,
          },
          400
        );
      }

      // 验证文件大小
      if (file.size > config.upload.maxSize) {
        return c.json(
          {
            code: 400,
            message: `文件大小超过限制: ${Math.floor(
              config.upload.maxSize / 1024 / 1024
            )}MB`,
          },
          400
        );
      }

      // 保存文件
      const fileInfo = await FileUtils.saveFile(file);

      // 记录上传信息到数据库
      const user = c.get("user");
      if (user) {
        await prisma.upload.create({
          data: {
            userId: user.id,
            filename: file.name,
            filePath: fileInfo.path,
            mimetype: file.type,
            size: file.size,
          },
        });
      }

      return c.json({
        code: 200,
        message: "上传成功",
        data: {
          name: file.name,
          url: fileInfo.url,
        },
      });
    } catch (error) {
      logger.error("文件上传失败:", error);
      return c.json(
        {
          code: 500,
          message: error instanceof Error ? error.message : "文件上传失败",
        },
        500
      );
    }
  };
  /**
   * 文件下载
   */
  download = async (c: Context) => {
    try {
      const filePath = c.req.query("filePath");
      const fileName = c.req.query("fileName") || "download";

      if (!filePath) {
        return c.json(
          {
            code: 400,
            message: "缺少文件路径参数",
          },
          400
        );
      }

      // 检查文件是否存在
      const fullPath = join(config.upload.baseDir, filePath);
      if (!existsSync(fullPath)) {
        return c.json(
          {
            code: 404,
            message: "文件不存在",
          },
          404
        );
      }

      // 获取文件信息
      const fileStat = await stat(fullPath);
      const fileBuffer = await readFile(fullPath);

      // 设置响应头
      c.header("Content-Type", "application/octet-stream");
      c.header(
        "Content-Disposition",
        `attachment; filename="${encodeURIComponent(fileName)}"`
      );
      c.header("Content-Length", fileStat.size.toString());

      return c.body(fileBuffer);
    } catch (error) {
      logger.error("文件下载失败:", error);
      return c.json(
        {
          code: 500,
          message: error instanceof Error ? error.message : "文件下载失败",
        },
        500
      );
    }
  };

  /**
   * 资源文件下载
   */
  downloadResource = async (c: Context) => {
    try {
      const resource = c.req.query("resource");
      const name = c.req.query("name") || "resource";

      if (!resource) {
        return c.json(
          {
            code: 400,
            message: "缺少资源标识参数",
          },
          400
        );
      }

      // 这里根据resource获取对应的资源文件
      // 例如：根据ID从数据库查询文件信息
      const fileRecord = await prisma.upload.findFirst({
        where: { id: parseInt(resource) },
      });

      if (!fileRecord) {
        return c.json(
          {
            code: 404,
            message: "资源不存在",
          },
          404
        );
      }

      // 检查文件是否存在
      if (!existsSync(fileRecord.filePath)) {
        return c.json(
          {
            code: 404,
            message: "文件不存在",
          },
          404
        );
      }

      // 读取文件
      const fileBuffer = await readFile(fileRecord.filePath);

      // 设置响应头
      c.header("Content-Type", fileRecord.mimetype);
      c.header(
        "Content-Disposition",
        `attachment; filename="${encodeURIComponent(fileRecord.filename)}"`
      );
      c.header("Content-Length", fileRecord.size.toString());

      return c.body(fileBuffer);
    } catch (error) {
      logger.error("资源下载失败:", error);
      return c.json(
        {
          code: 500,
          message: error instanceof Error ? error.message : "资源下载失败",
        },
        500
      );
    }
  };
}
