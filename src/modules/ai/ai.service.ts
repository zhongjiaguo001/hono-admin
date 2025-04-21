// src/modules/ai/ai.service.ts
import { prisma } from "@/db/prisma";
import { logger } from "@/utils/logger.utils";
import { AI_API_URL, AI_API_KEY, DEFAULT_MODEL } from "./ai.constants";
import axios from "axios";
import {
  CreateSessionDto,
  MessageInfo,
  SendMessageDto,
  AIModelRequest,
  SessionListParams,
} from "./ai.types";

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
   * 流式发送消息
   */
  async sendMessageStream(
    userId: number,
    dto: SendMessageDto
  ): Promise<AsyncIterable<string>> {
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

      // 调用AI模型API获取流
      const modelId = session.modelId || DEFAULT_MODEL;
      const stream = this.callAIModelStream(
        {
          model: modelId,
          messages: contextMessages,
          stream: true,
          temperature: 0.7,
          // max_tokens: 2048,
        },
        controller.signal
      );

      return this.processStream(stream, sessionId);
    } catch (error) {
      logger.error("初始化流式消息失败:", error);
      throw error;
    }
  }

  /**
   * 处理流式响应
   */
  private async *processStream(
    stream: AsyncIterable<any>,
    sessionId: number
  ): AsyncIterable<string> {
    let fullResponse = "";

    try {
      for await (const chunk of stream) {
        // 剥去data: 前缀
        const cleanData = chunk.toString().replace(/^data: /, "");

        // 处理完成信号
        if (cleanData === "[DONE]") {
          // 保存完整的AI回复
          if (fullResponse.trim()) {
            await prisma.message.create({
              data: {
                sessionId,
                role: "assistant",
                content: fullResponse,
              },
            });

            // 更新会话时间
            await prisma.session.update({
              where: { id: sessionId },
              data: { updatedAt: new Date() },
            });
          }

          // 从活跃生成列表中移除
          activeGenerations.delete(sessionId);

          yield "[DONE]";
          return;
        }

        try {
          // 解析JSON数据
          const data = JSON.parse(cleanData);

          // 提取文本内容
          const content = data.choices?.[0]?.delta?.content || "";

          if (content) {
            fullResponse += content;
            yield content;
          }
        } catch (parseError) {
          logger.debug("无法解析数据块:", cleanData);
          // 跳过无法解析的数据块
        }
      }
    } catch (error) {
      logger.error("处理流式数据失败:", error);

      // 如果是中止错误，则静默处理
      if (error instanceof Error && error.name === "AbortError") {
        logger.info(`会话 ${sessionId} 的生成已被用户取消`);

        // 保存已生成的部分内容
        if (fullResponse.trim()) {
          await prisma.message.create({
            data: {
              sessionId,
              role: "assistant",
              content: fullResponse + "\n[用户已取消]",
            },
          });
        }
      } else {
        // 其他错误则返回错误信息
        yield `处理错误: ${
          error instanceof Error ? error.message : String(error)
        }`;

        // 尝试保存已接收的内容
        if (fullResponse) {
          await prisma.message.create({
            data: {
              sessionId,
              role: "assistant",
              content: fullResponse + "\n[传输中断]",
            },
          });
        }
      }

      // 从活跃生成列表中移除
      activeGenerations.delete(sessionId);
    }
  }

  /**
   * 调用AI模型API(流式)
   */
  private async *callAIModelStream(
    requestData: AIModelRequest,
    signal?: AbortSignal
  ): AsyncIterable<string> {
    try {
      // 打印请求数据，用于调试
      logger.debug("AI API请求数据:", JSON.stringify(requestData, null, 2));

      // 确保请求数据符合API要求
      const sanitizedMessages = requestData.messages.filter(
        (msg) =>
          msg &&
          msg.role &&
          ["user", "assistant", "system"].includes(msg.role) &&
          msg.content
      );

      // 创建符合API要求的请求对象
      const apiRequest = {
        model: requestData.model,
        messages: sanitizedMessages,
        stream: true,
        // temperature: requestData.temperature || 0.7,
        // max_tokens: requestData.max_tokens || 2048,
      };

      // 发送请求到AI API
      const response = await fetch(`${AI_API_URL}/chat/completions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${AI_API_KEY}`,
          // Accept: "text/event-stream", // 修改为正确的流式响应格式
          Accept: "application/json",
        },
        body: JSON.stringify(apiRequest),
        // signal: signal, // 启用信号用于中止请求
      });

      // 检查响应状态
      if (!response.ok) {
        const errorText = await response.text();
        logger.error(
          `API响应错误 ${response.status} ${response.statusText}:`,
          errorText
        );
        throw new Error(
          `API请求失败: ${response.status} ${response.statusText} - ${errorText}`
        );
      }

      if (!response.body) {
        throw new Error("响应体为空");
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        // 解码字节流为文本
        const chunk = decoder.decode(value, { stream: true });
        buffer += chunk;

        // 按行解析SSE数据
        let lineEndIndex;
        while ((lineEndIndex = buffer.indexOf("\n")) !== -1) {
          const line = buffer.substring(0, lineEndIndex).trim();
          buffer = buffer.substring(lineEndIndex + 1);

          if (line && (line.startsWith("data:") || line === "data: [DONE]")) {
            yield line;
          }
        }
      }

      // 处理可能的剩余数据
      if (
        buffer.trim() &&
        (buffer.trim().startsWith("data:") || buffer.trim() === "data: [DONE]")
      ) {
        yield buffer.trim();
      }
    } catch (error) {
      // 向上抛出错误，由调用者处理
      if (error instanceof Error && error.name === "AbortError") {
        logger.info("API请求已被用户中止");
      } else {
        logger.error("流式调用AI模型API失败:", error);
      }
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
      const response = await axios.get(`${AI_API_URL}/models`, {
        headers: {
          Authorization: `Bearer ${AI_API_KEY}`,
        },
      });

      // 检查响应结构
      if (!response.data || !response.data.data) {
        logger.warn("API 模型列表响应格式异常:", response.data);
        return this.getDefaultModels();
      }

      return (
        response.data.data.filter(
          (model: any) =>
            // 只返回支持聊天功能的模型
            model.id &&
            (model.id.includes("gpt") || model.capabilities?.includes("chat"))
        ) || this.getDefaultModels()
      );
    } catch (error) {
      logger.error("获取模型列表失败:", error);
      return this.getDefaultModels();
    }
  }
}
