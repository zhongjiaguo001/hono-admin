// src/modules/ai/ai.constants.ts
export const AI_API_URL =
  process.env.AI_API_URL || "https://302ai.apifox.cn/api";
export const AI_API_KEY =
  process.env.AI_API_KEY ||
  "sk-tk1lMixHsEXIeNhy09HJ4fP2YqaxOM2h48UMOOak50rXRF4n";

export const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
export const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;
export const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY;

export const DEFAULT_MODEL = "gpt-4o";
export const AVAILABLE_MODELS = [
  {
    id: "gpt-4o",
    name: "GPT-4o",
    provider: "openai",
    description: "OpenAI's most capable model",
    maxTokens: 4096,
  },
  {
    id: "gpt-4-turbo",
    name: "GPT-4 Turbo",
    provider: "openai",
    description:
      "Powerful OpenAI model with good balance of capability and cost",
    maxTokens: 8192,
  },
  {
    id: "gpt-3.5-turbo",
    name: "GPT-3.5 Turbo",
    provider: "openai",
    description: "Efficient and cost-effective OpenAI model",
    maxTokens: 4096,
  },
  {
    id: "claude-3-opus",
    name: "Claude 3 Opus",
    provider: "anthropic",
    description: "Anthropic's most powerful model",
    maxTokens: 4096,
  },
  {
    id: "claude-3-sonnet",
    name: "Claude 3 Sonnet",
    provider: "anthropic",
    description: "Balanced Anthropic model for most tasks",
    maxTokens: 4096,
  },
  {
    id: "claude-3-haiku",
    name: "Claude 3 Haiku",
    provider: "anthropic",
    description: "Fast and efficient Anthropic model",
    maxTokens: 4096,
  },
  {
    id: "gemini-1.5-pro",
    name: "Gemini 1.5 Pro",
    provider: "google",
    description: "Google's advanced model with long context",
    maxTokens: 8192,
  },
  {
    id: "gemini-1.5-flash",
    name: "Gemini 1.5 Flash",
    provider: "google",
    description: "Fast and efficient Google model",
    maxTokens: 4096,
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
