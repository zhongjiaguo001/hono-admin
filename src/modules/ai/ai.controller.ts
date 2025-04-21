// src/modules/ai/ai.controller.ts
import { Context } from "hono";
import { streamText } from "hono/streaming";
import { AIService } from "./ai.service";
import { UPLOAD_DIR, MAX_FILE_SIZE, ALLOWED_FILE_TYPES } from "./ai.constants";
import path from "path";
import fs from "fs";
import { v4 as uuidv4 } from "uuid";

export class AIController {
  private aiService: AIService;

  constructor() {
    this.aiService = new AIService();
    this.ensureUploadDir();
  }

  private ensureUploadDir() {
    try {
      if (!fs.existsSync(UPLOAD_DIR)) {
        fs.mkdirSync(UPLOAD_DIR, { recursive: true });
      }
    } catch (error) {
      console.error("创建上传目录失败:", error);
    }
  }

  // 创建新会话
  createSession = async (c: Context) => {
    try {
      const user = c.get("user");
      const data = c.get("zod");

      const sessionId = await this.aiService.createSession(user.id, data);

      return c.json({
        code: 200,
        message: "会话创建成功",
        data: { id: sessionId },
      });
    } catch (error) {
      return this.handleError(c, error, "创建会话失败");
    }
  };

  // 获取用户会话列表
  getUserSessions = async (c: Context) => {
    try {
      const user = c.get("user");
      const params = c.get("zod");

      const result = await this.aiService.getUserSessions(user.id, params);

      return c.json({
        code: 200,
        data: result,
      });
    } catch (error) {
      return this.handleError(c, error, "获取会话列表失败");
    }
  };

  // 获取会话消息列表
  getSessionMessages = async (c: Context) => {
    try {
      const user = c.get("user");
      const { id } = c.get("zod");

      const messages = await this.aiService.getSessionMessages(id, user.id);

      return c.json({
        code: 200,
        data: messages,
      });
    } catch (error) {
      return this.handleError(c, error, "获取会话消息失败");
    }
  };

  // 删除会话
  deleteSession = async (c: Context) => {
    try {
      const user = c.get("user");
      const { id } = c.get("zod");

      await this.aiService.deleteSession(id, user.id);

      return c.json({
        code: 200,
        message: "会话删除成功",
      });
    } catch (error) {
      return this.handleError(c, error, "删除会话失败");
    }
  };

  // 删除消息
  deleteMessage = async (c: Context) => {
    try {
      const user = c.get("user");
      const { id } = c.get("zod");

      await this.aiService.deleteMessage(id, user.id);

      return c.json({
        code: 200,
        message: "消息删除成功",
      });
    } catch (error) {
      return this.handleError(c, error, "删除消息失败");
    }
  };

  // 流式发送消息(SSE) - 使用 Hono 的 streamSSE
  // 流式发送消息 - 使用 Hono 的 streamText
  streamMessage = async (c: Context) => {
    try {
      const user = c.get("user");

      // 支持 POST 和 GET 请求
      let data;
      if (c.req.method === "GET") {
        const query = c.req.query();
        data = {
          sessionId: parseInt(query.sessionId || "0", 10),
          content: query.content || "",
          fileUrl: query.fileUrl,
          mimeType: query.mimeType,
        };
      } else {
        data = await c.req.json();
      }

      // 使用 Hono 的 streamText
      return streamText(c, async (stream) => {
        try {
          // 获取 AI 流式响应
          const messageStream = await this.aiService.sendMessageStream(
            user.id,
            data
          );

          // 处理流式响应
          for await (const chunk of messageStream) {
            if (chunk === "[DONE]") {
              // 发送完成标记
              await stream.write(
                JSON.stringify({
                  type: "done",
                  status: "completed",
                })
              );
            } else {
              // 发送内容块
              await stream.write(
                JSON.stringify({
                  type: "message",
                  content: chunk,
                })
              );
            }
          }
        } catch (error) {
          // 发送错误信息
          await stream.write(
            JSON.stringify({
              type: "error",
              error: error instanceof Error ? error.message : "发送消息失败",
            })
          );
        }
      });
    } catch (error) {
      return this.handleError(c, error, "初始化流式响应失败");
    }
  };

  // 取消流式生成
  cancelStream = async (c: Context) => {
    try {
      const user = c.get("user");
      const { sessionId } = await c.req.json();

      const result = await this.aiService.cancelStreamingResponse(
        sessionId,
        user.id
      );

      return c.json({
        code: 200,
        message: "已取消生成",
        data: { success: result },
      });
    } catch (error) {
      return this.handleError(c, error, "取消生成失败");
    }
  };

  // 上传文件
  uploadFile = async (c: Context) => {
    try {
      // 解析multipart表单
      const formData = await c.req.formData();
      const file = formData.get("file") as File;

      if (!file) {
        return c.json(
          {
            code: 400,
            message: "未提供文件",
          },
          400
        );
      }

      // 检查文件类型
      if (!ALLOWED_FILE_TYPES.includes(file.type)) {
        return c.json(
          {
            code: 400,
            message: "不支持的文件类型",
          },
          400
        );
      }

      // 检查文件大小
      if (file.size > MAX_FILE_SIZE) {
        return c.json(
          {
            code: 400,
            message: `文件大小不能超过${MAX_FILE_SIZE / 1024 / 1024}MB`,
          },
          400
        );
      }

      // 生成唯一文件名
      const fileExt = path.extname(file.name);
      const fileName = `${uuidv4()}${fileExt}`;
      const filePath = path.join(UPLOAD_DIR, fileName);

      // 保存文件
      const arrayBuffer = await file.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      fs.writeFileSync(filePath, buffer);

      // 构建文件URL
      const fileUrl = `/uploads/ai/${fileName}`;

      return c.json({
        code: 200,
        message: "文件上传成功",
        data: {
          url: fileUrl,
          name: file.name,
          mimeType: file.type,
          size: file.size,
        },
      });
    } catch (error) {
      return this.handleError(c, error, "文件上传失败");
    }
  };

  // 获取可用模型列表
  getModels = async (c: Context) => {
    try {
      const models = await this.aiService.getAvailableModels();

      return c.json({
        code: 200,
        data: models,
      });
    } catch (error) {
      return this.handleError(c, error, "获取模型列表失败");
    }
  };

  // 统一错误处理
  private handleError(c: Context, error: unknown, defaultMessage: string) {
    const errorMessage =
      error instanceof Error ? error.message : defaultMessage;
    return c.json(
      {
        code: 500,
        message: errorMessage,
      },
      500
    );
  }
}
