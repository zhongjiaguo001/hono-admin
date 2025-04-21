// src/modules/ai/index.ts
import { Hono } from "hono";
import { authMiddleware } from "@/middleware/auth.middleware";
import { zodValidator } from "@/middleware/validtor-middleware";
import { AIController } from "./ai.controller";
import {
  createSessionSchema,
  sendMessageSchema,
  sessionIdParamSchema,
  sessionListSchema,
} from "./ai.schema";

// 创建AI对话模块路由
export function createAIModule() {
  const router = new Hono();
  const controller = new AIController();

  // 应用认证中间件
  router.use("*", authMiddleware);

  // 获取会话列表
  router.get(
    "/session",
    zodValidator("query", sessionListSchema),
    controller.getUserSessions
  );

  // 新增会话
  router.post(
    "/session",
    zodValidator("json", createSessionSchema),
    controller.createSession
  );

  // 删除会话
  router.delete(
    "/session/:id",
    zodValidator("param", sessionIdParamSchema),
    controller.deleteSession
  );

  // 获取消息
  router.get(
    "/session/:id/messages",
    zodValidator("param", sessionIdParamSchema),
    controller.getSessionMessages
  );

  // sse发送消息 - 同时支持 POST 和 GET
  router.post(
    "/message/stream",
    zodValidator("json", sendMessageSchema),
    controller.streamMessage
  );

  // 取消消息生成
  router.post("/message/cancel", controller.cancelStream);

  // 删除消息
  router.delete(
    "/message/:id",
    zodValidator("param", sessionIdParamSchema),
    controller.deleteMessage
  );

  // 文件上传
  router.post("/upload", controller.uploadFile);

  // 获取模型列表
  router.get("/models", controller.getModels);

  return router;
}

// 导出类型和函数，方便其他模块引用
export * from "./ai.types";
export * from "./ai.schema";
export * from "./ai.service";
export * from "./ai.controller";
