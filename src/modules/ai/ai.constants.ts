// src/modules/ai/ai.constants.ts
export const AI_API_URL =
  process.env.AI_API_URL || "https://302ai.apifox.cn/api";
export const AI_API_KEY =
  process.env.AI_API_KEY ||
  "sk-tk1lMixHsEXIeNhy09HJ4fP2YqaxOM2h48UMOOak50rXRF4n";

export const DEFAULT_MODEL = "gemini-2.5-pro-preview-03-25";
export const AVAILABLE_MODELS = [
  {
    id: "gemini-2.5-pro-preview-03-25",
    name: "gemini-2.5-pro-preview-03-25",
    description: "适用于一般对话和任务",
    // maxTokens: 4096,
  },
  {
    id: "gpt-4",
    name: "GPT-4",
    description: "更强大的大语言模型",
    maxTokens: 8192,
  },
];

export const UPLOAD_DIR = "uploads/ai";
export const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
export const ALLOWED_FILE_TYPES = [
  "image/jpeg",
  "image/png",
  "image/gif",
  "application/pdf",
  "text/plain",
];
