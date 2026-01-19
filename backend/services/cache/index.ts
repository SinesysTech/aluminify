import { Redis } from "@upstash/redis";
import RedisTCP from "ioredis";

export class HybridCache {
  private client: Redis | RedisTCP;

  constructor() {
    if (process.env.REDIS_URL?.startsWith("redis://")) {
      this.client = new RedisTCP(process.env.REDIS_URL);
    } else {
      this.client = new Redis({
        url: process.env.UPSTASH_REDIS_REST_URL!,
        token: process.env.UPSTASH_REDIS_REST_TOKEN!,
      });
    }
  }

  async get<T>(key: string): Promise<T | null> {
    if (this.client instanceof RedisTCP) {
      const value = await this.client.get(key);
      return value ? JSON.parse(value) : null;
    }
    return await this.client.get<T>(key);
  }

  async set(key: string, value: unknown, ttlSeconds?: number): Promise<void> {
    if (this.client instanceof RedisTCP) {
      const serialized = JSON.stringify(value);
      if (ttlSeconds) {
        await this.client.setex(key, ttlSeconds, serialized);
      } else {
        await this.client.set(key, serialized);
      }
    } else {
      if (ttlSeconds) {
        await (this.client as Redis).setex(key, ttlSeconds, value);
      } else {
        await (this.client as Redis).set(key, value);
      }
    }
  }

  async del(key: string): Promise<void> {
    await this.client.del(key);
  }

  async delMany(keys: string[]): Promise<void> {
    if (keys.length === 0) return;
    await this.client.del(...keys);
  }
}

export { cacheService } from "./cache.service";
export { courseStructureCacheService } from "./course-structure-cache.service";
export type {
  CourseStructure,
  DisciplineStructure,
  FrenteStructure,
  ModuloStructure,
  AulaStructure,
} from "./course-structure-cache.service";
export { userProfileCacheService } from "./user-profile-cache.service";
export type { UserProfile } from "./user-profile-cache.service";
export { activityCacheService } from "./activity-cache.service";
export type { CachedActivity } from "./activity-cache.service";
export { cacheMonitorService } from "./cache-monitor.service";
