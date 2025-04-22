import { mkdir, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { join } from "node:path";
import { randomUUID } from "node:crypto";
import { config } from "@/config";
import { logger } from "./logger.utils";

export class FileUtils {
  /**
   * 创建目录
   * @param dir 目录路径
   */
  static async ensureDir(dir: string): Promise<void> {
    if (!existsSync(dir)) {
      try {
        await mkdir(dir, { recursive: true });
      } catch (error) {
        logger.error(`创建目录失败: ${dir}`, error);
        throw new Error(
          `创建目录失败: ${
            error instanceof Error ? error.message : String(error)
          }`
        );
      }
    }
  }

  /**
   * 保存上传文件
   * @param file 文件对象
   * @param dir 保存目录
   * @returns 保存的文件信息
   */
  static async saveFile(
    file: File,
    dir: string = config.upload.baseDir
  ): Promise<{
    filename: string;
    originalName: string;
    mimetype: string;
    size: number;
    path: string;
    url: string;
  }> {
    try {
      // 确保目录存在
      await this.ensureDir(dir);

      // 生成唯一文件名
      const ext = file.name.substring(file.name.lastIndexOf("."));
      const filename = `${randomUUID()}${ext}`;
      const filepath = join(dir, filename);

      // 保存文件
      const buffer = await file.arrayBuffer();
      await writeFile(filepath, Buffer.from(buffer));

      // 构建访问URL
      const relativePath = filepath.replace(config.upload.baseDir, "");
      const url = `${config.upload.urlPrefix}${relativePath}`;

      return {
        filename,
        originalName: file.name,
        mimetype: file.type,
        size: file.size,
        path: filepath,
        url,
      };
    } catch (error) {
      logger.error(`保存文件失败:`, error);
      throw new Error(
        `保存文件失败: ${
          error instanceof Error ? error.message : String(error)
        }`
      );
    }
  }

  /**
   * 生成临时文件路径
   * @param filename 文件名
   * @returns 临时文件路径
   */
  static async getTempFilePath(filename: string): Promise<string> {
    const tempDir = config.upload.tempDir;
    await this.ensureDir(tempDir);
    return join(tempDir, filename);
  }
}
