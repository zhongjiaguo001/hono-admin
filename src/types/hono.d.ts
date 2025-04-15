// src/types/hono.d.ts
import { User } from "@prisma/client";

declare module "hono" {
  interface ContextVariableMap {
    user: { id: number; username: string };
    zod: any;
  }
}
