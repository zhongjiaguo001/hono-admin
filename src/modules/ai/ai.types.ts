// src/modules/ai/ai.types.ts
export interface SessionListParams {
  page?: number;
  pageSize?: number;
}

export interface SessionInfo {
  id: number;
  title: string;
  modelId?: string;
  createdAt: Date;
  updatedAt: Date;
  messageCount?: number;
  lastMessage?: string;
}

export interface CreateSessionDto {
  title: string;
  modelId?: string;
  firstMessage?: string;
}

export interface MessageInfo {
  id: number;
  sessionId: number;
  content: string;
  role: "user" | "assistant" | "system";
  fileUrl?: string;
  mimeType?: string;
  tokens?: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface SendMessageDto {
  sessionId: number;
  content: string;
  fileUrl?: string;
  mimeType?: string;
}

// AI模型接口请求参数
export interface AIModelRequest {
  model: string;
  messages: {
    role: "user" | "assistant" | "system";
    content: string;
  }[];
  stream?: boolean;
  temperature?: number;
  max_tokens?: number;
}

// AI模型接口响应
export interface AIModelResponse {
  id: string;
  object: string;
  created: number;
  model: string;
  choices: {
    index: number;
    message: {
      role: string;
      content: string;
    };
    finish_reason: string;
  }[];
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

// SSE流式响应的数据结构
export interface AIStreamData {
  id: string;
  object: string;
  created: number;
  model: string;
  choices: {
    index: number;
    delta: {
      role?: string;
      content?: string;
    };
    finish_reason: string | null;
  }[];
}
