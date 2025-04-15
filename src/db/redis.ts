import Redis from "ioredis";

// Redis配置选项
interface RedisConfig {
  url: string;
  retryStrategy?: (times: number) => number | null;
  maxRetriesPerRequest?: number;
  connectTimeout?: number;
  commandTimeout?: number;
  keepAlive?: number;
  enableReadyCheck?: boolean;
  enableOfflineQueue?: boolean;
}

// 默认配置
const defaultConfig: RedisConfig = {
  url: process.env.REDIS_URL || "redis://localhost:6379",
  retryStrategy: (times) => {
    // 指数退避策略: 1s, 2s, 4s, 8s...
    // 最多重试5次，超过则放弃
    const delay = Math.min(times * 1000, 30000);
    return times <= 5 ? delay : null;
  },
  maxRetriesPerRequest: 3,
  connectTimeout: 10000, // 连接超时: 10秒
  commandTimeout: 5000, // 命令超时: 5秒
  keepAlive: 10000, // 保持连接: 10秒
  enableReadyCheck: true,
  enableOfflineQueue: true,
};

// 创建Redis客户端
const createRedisClient = (config: Partial<RedisConfig> = {}) => {
  const finalConfig = { ...defaultConfig, ...config };
  const { url, ...options } = finalConfig;

  const client = new Redis(url, options);

  // 错误处理
  client.on("error", (err) => {
    console.error("Redis Client Error:", err);
  });

  // 连接成功
  client.on("connect", () => {
    console.log("Redis Client Connected");
  });

  // 重连事件
  client.on("reconnecting", (delay: number) => {
    console.log(`Redis Client Reconnecting in ${delay}ms...`);
  });

  // 连接关闭
  client.on("close", () => {
    console.log("Redis Client Connection Closed");
  });

  return client;
};

// 创建默认Redis客户端实例
const redisClient = createRedisClient();

// Redis工具类 - 封装常用操作
export class RedisUtils {
  private client: Redis;

  constructor(client: Redis = redisClient) {
    this.client = client;
  }

  // 设置键值对，可选过期时间（秒）
  async set(
    key: string,
    value: string | number | object,
    expireSeconds?: number
  ): Promise<string | null> {
    const stringValue =
      typeof value === "object" ? JSON.stringify(value) : String(value);

    if (expireSeconds) {
      return this.client.set(key, stringValue, "EX", expireSeconds);
    }

    return this.client.set(key, stringValue);
  }

  // 获取值
  async get(key: string, parseJson = false): Promise<any> {
    const value = await this.client.get(key);

    if (!value) return null;

    if (parseJson) {
      try {
        return JSON.parse(value);
      } catch (e) {
        return value;
      }
    }

    return value;
  }

  // 删除键
  async del(key: string | string[]): Promise<number> {
    return this.client.del(Array.isArray(key) ? key : [key]);
  }

  // 检查键是否存在
  async exists(key: string): Promise<number> {
    return this.client.exists(key);
  }

  // 设置过期时间（秒）
  async expire(key: string, seconds: number): Promise<number> {
    return this.client.expire(key, seconds);
  }

  // 获取过期时间
  async ttl(key: string): Promise<number> {
    return this.client.ttl(key);
  }

  // 递增
  async incr(key: string): Promise<number> {
    return this.client.incr(key);
  }

  // 递减
  async decr(key: string): Promise<number> {
    return this.client.decr(key);
  }

  // 哈希表操作
  async hset(
    key: string,
    field: string,
    value: string | number | object
  ): Promise<number> {
    const stringValue =
      typeof value === "object" ? JSON.stringify(value) : String(value);
    return this.client.hset(key, field, stringValue);
  }

  async hget(key: string, field: string, parseJson = false): Promise<any> {
    const value = await this.client.hget(key, field);

    if (!value) return null;

    if (parseJson) {
      try {
        return JSON.parse(value);
      } catch (e) {
        return value;
      }
    }

    return value;
  }

  async hdel(key: string, field: string | string[]): Promise<number> {
    return this.client.hdel(key, ...(Array.isArray(field) ? field : [field]));
  }

  // 列表操作
  async lpush(
    key: string,
    ...values: (string | number | object)[]
  ): Promise<number> {
    const stringValues = values.map((v) =>
      typeof v === "object" ? JSON.stringify(v) : String(v)
    );
    return this.client.lpush(key, ...stringValues);
  }

  async rpush(
    key: string,
    ...values: (string | number | object)[]
  ): Promise<number> {
    const stringValues = values.map((v) =>
      typeof v === "object" ? JSON.stringify(v) : String(v)
    );
    return this.client.rpush(key, ...stringValues);
  }

  async lpop(key: string, parseJson = false): Promise<any> {
    const value = await this.client.lpop(key);

    if (!value) return null;

    if (parseJson) {
      try {
        return JSON.parse(value);
      } catch (e) {
        return value;
      }
    }

    return value;
  }

  async rpop(key: string, parseJson = false): Promise<any> {
    const value = await this.client.rpop(key);

    if (!value) return null;

    if (parseJson) {
      try {
        return JSON.parse(value);
      } catch (e) {
        return value;
      }
    }

    return value;
  }

  // 执行自定义命令
  async execute(command: string, ...args: any[]): Promise<any> {
    return this.client.call(command, ...args);
  }
}

// 导出默认Redis客户端实例
export default redisClient;

// 导出Redis工具类实例
export const redisUtils = new RedisUtils(redisClient);
