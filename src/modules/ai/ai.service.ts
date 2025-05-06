// src/modules/ai/ai.service.ts
import { prisma } from "@/db/prisma";
import { logger } from "@/utils/logger.utils";
import {
  AI_API_KEY,
  DEFAULT_MODEL,
  AVAILABLE_MODELS,
  OPENAI_API_KEY,
  ANTHROPIC_API_KEY,
  GOOGLE_API_KEY,
} from "./ai.constants";
import {
  CreateSessionDto,
  MessageInfo,
  SendMessageDto,
  SessionListParams,
} from "./ai.types";
import { streamText, createDataStream } from "ai";
import { openai } from "@ai-sdk/openai";
import { anthropic } from "@ai-sdk/anthropic";
import { google } from "@ai-sdk/google";

// 存储活跃的生成请求及其取消控制器
const activeGenerations = new Map<number, AbortController>();

export class AIService {
  /**
   * 创建新会话
   */
  async createSession(userId: number, dto: CreateSessionDto): Promise<number> {
    const { title, modelId = DEFAULT_MODEL, firstMessage } = dto;

    try {
      // 使用事务创建会话和首条消息(如果有)
      return await prisma.$transaction(async (tx) => {
        // 创建会话
        const session = await tx.session.create({
          data: {
            userId,
            title,
            modelId,
          },
        });

        // 如果提供了首条消息，则创建消息
        if (firstMessage) {
          await tx.message.create({
            data: {
              sessionId: session.id,
              content: firstMessage,
              role: "user",
            },
          });
        }

        return session.id;
      });
    } catch (error) {
      logger.error("创建会话失败:", error);
      throw error;
    }
  }

  /**
   * 获取用户会话列表
   */
  async getUserSessions(userId: number, params: SessionListParams) {
    const { page = 1, pageSize = 10 } = params;
    const skip = (page - 1) * pageSize;

    try {
      // 获取会话总数
      const total = await prisma.session.count({
        where: { userId },
      });

      // 获取会话列表，并包含最后一条消息
      const sessions = await prisma.session.findMany({
        where: { userId },
        orderBy: { updatedAt: "desc" },
        skip,
        take: pageSize,
        include: {
          _count: {
            select: { messages: true },
          },
          messages: {
            orderBy: { createdAt: "desc" },
            take: 1,
          },
        },
      });

      // 处理返回数据
      const formattedSessions = sessions.map((session) => ({
        id: session.id,
        title: session.title,
        modelId: session.modelId,
        createdAt: session.createdAt,
        updatedAt: session.updatedAt,
        messageCount: session._count.messages,
        lastMessage: session.messages[0]?.content.substring(0, 50) || null,
      }));

      return {
        list: formattedSessions,
        pagination: {
          current: page,
          pageSize,
          total,
        },
      };
    } catch (error) {
      logger.error("获取用户会话列表失败:", error);
      throw error;
    }
  }

  /**
   * 获取会话消息列表
   */
  async getSessionMessages(
    sessionId: number,
    userId: number
  ): Promise<MessageInfo[]> {
    try {
      // 验证会话所有权
      const session = await prisma.session.findFirst({
        where: {
          id: sessionId,
          userId,
        },
      });

      if (!session) {
        throw new Error("会话不存在或无权访问");
      }

      // 获取消息列表
      const messages = await prisma.message.findMany({
        where: { sessionId },
        orderBy: { createdAt: "asc" },
      });

      return messages;
    } catch (error) {
      logger.error("获取会话消息列表失败:", error);
      throw error;
    }
  }

  /**
   * 删除会话
   */
  async deleteSession(sessionId: number, userId: number): Promise<boolean> {
    try {
      // 验证会话所有权
      const session = await prisma.session.findFirst({
        where: {
          id: sessionId,
          userId,
        },
      });

      if (!session) {
        throw new Error("会话不存在或无权访问");
      }

      // 取消该会话可能正在进行的生成
      if (activeGenerations.has(sessionId)) {
        const controller = activeGenerations.get(sessionId);
        controller?.abort();
        activeGenerations.delete(sessionId);
      }

      // 使用级联删除会话和相关消息
      await prisma.$transaction([
        // 先删除会话中的所有消息
        prisma.message.deleteMany({
          where: { sessionId },
        }),
        // 然后删除会话
        prisma.session.delete({
          where: { id: sessionId },
        }),
      ]);

      return true;
    } catch (error) {
      logger.error("删除会话失败:", error);
      throw error;
    }
  }

  /**
   * 删除消息
   */
  async deleteMessage(messageId: number, userId: number): Promise<boolean> {
    try {
      // 验证消息所有权
      const message = await prisma.message.findFirst({
        where: {
          id: messageId,
          session: { userId },
        },
      });

      if (!message) {
        throw new Error("消息不存在或无权访问");
      }

      // 删除消息
      await prisma.message.delete({
        where: { id: messageId },
      });

      return true;
    } catch (error) {
      logger.error("删除消息失败:", error);
      throw error;
    }
  }

  /**
   * 保存用户消息
   */
  async saveUserMessage(
    userId: number,
    sessionId: number,
    content: string,
    fileUrl?: string,
    mimeType?: string
  ): Promise<MessageInfo> {
    try {
      // 验证会话所有权
      const session = await prisma.session.findFirst({
        where: {
          id: sessionId,
          userId,
        },
      });

      if (!session) {
        throw new Error("会话不存在或无权访问");
      }

      // 创建用户消息
      const message = await prisma.message.create({
        data: {
          sessionId,
          role: "user",
          content,
          fileUrl,
          mimeType,
        },
      });

      return message;
    } catch (error) {
      logger.error("保存用户消息失败:", error);
      throw error;
    }
  }

  /**
   * 保存AI回复消息
   */
  private async saveAssistantMessage(
    sessionId: number,
    content: string
  ): Promise<MessageInfo> {
    try {
      const message = await prisma.message.create({
        data: {
          sessionId,
          role: "assistant",
          content,
        },
      });

      // 更新会话时间
      await prisma.session.update({
        where: { id: sessionId },
        data: { updatedAt: new Date() },
      });

      return message;
    } catch (error) {
      logger.error("保存AI回复失败:", error);
      throw error;
    }
  }

  /**
   * 流式发送消息
   */
  async sendMessageStream(
    userId: number,
    dto: SendMessageDto
  ): Promise<ReadableStream<Uint8Array>> {
    const { sessionId, content, fileUrl, mimeType } = dto;

    try {
      // 验证会话所有权
      const session = await prisma.session.findFirst({
        where: {
          id: sessionId,
          userId,
        },
        include: {
          messages: {
            orderBy: { createdAt: "asc" },
          },
        },
      });

      if (!session) {
        throw new Error("会话不存在或无权访问");
      }

      // 取消该会话可能正在进行的旧生成
      if (activeGenerations.has(sessionId)) {
        const controller = activeGenerations.get(sessionId);
        controller?.abort();
        activeGenerations.delete(sessionId);
      }

      // 存储用户消息 - 如果在controller中已存储则跳过
      const isMessageExists = await prisma.message.findFirst({
        where: {
          sessionId,
          role: "user",
          content,
          createdAt: {
            gte: new Date(Date.now() - 5000), // 5秒内创建的相同内容消息
          },
        },
      });

      if (!isMessageExists) {
        await this.saveUserMessage(
          userId,
          sessionId,
          content,
          fileUrl,
          mimeType
        );
      }

      // 准备上下文消息
      const contextMessages = session.messages.map((msg) => ({
        role: msg.role as "user" | "assistant" | "system",
        content: msg.content,
      }));

      // 添加当前消息（如果尚未包含在上下文中）
      const lastMessage = contextMessages[contextMessages.length - 1];
      if (
        !lastMessage ||
        lastMessage.role !== "user" ||
        lastMessage.content !== content
      ) {
        contextMessages.push({
          role: "user",
          content: content,
        });
      }

      // 创建新的 AbortController 用于取消请求
      const controller = new AbortController();
      activeGenerations.set(sessionId, controller);

      // 根据选择的模型获取对应的提供商
      const modelInfo =
        AVAILABLE_MODELS.find((m) => m.id === session.modelId) ||
        AVAILABLE_MODELS.find((m) => m.id === DEFAULT_MODEL);

      if (!modelInfo) {
        throw new Error(`未找到模型: ${session.modelId}`);
      }

      // 创建 AI 数据流
      const dataStream = createDataStream({
        execute: async (dataStreamWriter) => {
          try {
            let result;

            // 根据提供商选择不同的 AI 模型
            switch (modelInfo.provider) {
              case "openai":
                if (!OPENAI_API_KEY) throw new Error("未配置 OpenAI API 密钥");
                result = streamText({
                  model: openai(modelInfo.id, { apiKey: OPENAI_API_KEY }),
                  messages: contextMessages.map((msg) => ({
                    role: msg.role,
                    content: msg.content,
                  })),
                });
                break;

              case "anthropic":
                if (!ANTHROPIC_API_KEY)
                  throw new Error("未配置 Anthropic API 密钥");
                result = streamText({
                  model: anthropic(modelInfo.id, { apiKey: ANTHROPIC_API_KEY }),
                  messages: contextMessages.map((msg) => ({
                    role: msg.role,
                    content: msg.content,
                  })),
                });
                break;

              case "google":
                if (!GOOGLE_API_KEY) throw new Error("未配置 Google API 密钥");
                result = streamText({
                  model: google(modelInfo.id, { apiKey: GOOGLE_API_KEY }),
                  messages: contextMessages.map((msg) => ({
                    role: msg.role,
                    content: msg.content,
                  })),
                });
                break;

              default:
                throw new Error(`不支持的模型提供商: ${modelInfo.provider}`);
            }

            // 完整的响应内容
            let fullResponse = "";

            // 合并到数据流
            result.textStream.pipeTo(
              new WritableStream({
                write: async (chunk) => {
                  fullResponse += chunk;
                  dataStreamWriter.writeData(chunk);
                },
                close: async () => {
                  // 流完成时保存完整回复
                  await this.saveAssistantMessage(sessionId, fullResponse);

                  // 从活跃生成列表中移除
                  activeGenerations.delete(sessionId);

                  dataStreamWriter.writeData("[DONE]");
                },
                abort: async (reason) => {
                  logger.error(`流中断: ${reason}`);
                  if (fullResponse) {
                    await this.saveAssistantMessage(
                      sessionId,
                      fullResponse + "\n[传输中断]"
                    );
                  }
                  activeGenerations.delete(sessionId);
                },
              })
            );
          } catch (error) {
            logger.error("AI 生成错误:", error);
            dataStreamWriter.writeData(
              `错误: ${error instanceof Error ? error.message : String(error)}`
            );
            dataStreamWriter.writeData("[DONE]");
            activeGenerations.delete(sessionId);
          }
        },
        onError: (error) => {
          logger.error("数据流错误:", error);
          return error instanceof Error ? error.message : String(error);
        },
      });

      return dataStream;
    } catch (error) {
      logger.error("初始化流式消息失败:", error);
      throw error;
    }
  }

  /**
   * 中断正在进行的流式会话
   */
  async cancelStreamingResponse(
    sessionId: number,
    userId: number
  ): Promise<boolean> {
    try {
      // 验证会话所有权
      const session = await prisma.session.findFirst({
        where: {
          id: sessionId,
          userId,
        },
      });

      if (!session) {
        throw new Error("会话不存在或无权访问");
      }

      // 检查是否有活跃的生成
      if (!activeGenerations.has(sessionId)) {
        return false; // 没有可取消的生成
      }

      // 取消生成
      const controller = activeGenerations.get(sessionId);
      controller?.abort();
      activeGenerations.delete(sessionId);

      logger.info(`用户 ${userId} 已取消会话 ${sessionId} 的生成`);
      return true;
    } catch (error) {
      logger.error("取消会话响应失败:", error);
      throw error;
    }
  }

  /**
   * 获取可用模型列表
   */
  async getAvailableModels() {
    try {
      // 返回内部配置的模型列表
      return AVAILABLE_MODELS;
    } catch (error) {
      logger.error("获取模型列表失败:", error);
      return [];
    }
  }
}
