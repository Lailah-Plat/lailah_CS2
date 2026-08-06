import { v4 as uuidv4 } from 'uuid'; // Let's use a simpler unique ID or just a counter to avoid installing 'uuid' package

class RedisCacheService {
  private cache = new Map<string, { value: any; expiresAt: number }>();
  private stats = {
    hits: 0,
    misses: 0,
    writes: 0
  };
  private logs: Array<{
    id: string;
    timestamp: string;
    type: 'HIT' | 'MISS' | 'SET' | 'DEL' | 'FLUSH';
    key: string;
    message: string;
  }> = [];

  private logCounter = 1;

  private addLog(type: 'HIT' | 'MISS' | 'SET' | 'DEL' | 'FLUSH', key: string, message: string) {
    const timestamp = new Date().toLocaleTimeString('ar-EG', { hour12: false });
    this.logs.unshift({
      id: `REDIS-LOG-${String(this.logCounter++).padStart(4, '0')}`,
      timestamp,
      type,
      key,
      message
    });
    // Keep logs small (last 50 logs)
    if (this.logs.length > 50) {
      this.logs.pop();
    }
  }

  get(key: string): any {
    const cached = this.cache.get(key);
    if (!cached) {
      this.stats.misses++;
      this.addLog('MISS', key, `فشل القراءة من الكاش (Cache Miss). القيمة غير موجودة.`);
      return null;
    }

    if (Date.now() > cached.expiresAt) {
      this.cache.delete(key);
      this.stats.misses++;
      this.addLog('MISS', key, `فشل القراءة من الكاش (Cache Miss). القيمة منتهية الصلاحية (Expired TTL).`);
      return null;
    }

    this.stats.hits++;
    this.addLog('HIT', key, `تم القراءة بنجاح من كاش Redis (Cache Hit). القيمة مسترجعة.`);
    return cached.value;
  }

  set(key: string, value: any, ttlSeconds: number = 300): void {
    const expiresAt = Date.now() + ttlSeconds * 1000;
    this.cache.set(key, { value, expiresAt });
    this.stats.writes++;
    this.addLog('SET', key, `تم تخزين القيمة في كاش Redis بنجاح مع وقت صلاحية (TTL) ${ttlSeconds} ثانية.`);
  }

  del(key: string): void {
    if (this.cache.has(key)) {
      this.cache.delete(key);
      this.addLog('DEL', key, `تم إبطال الكاش (Cache Invalidation) وحذف المفتاح.`);
    }
  }

  flush(): void {
    this.cache.clear();
    this.stats = { hits: 0, misses: 0, writes: 0 };
    this.addLog('FLUSH', '*', 'تم مسح ذاكرة الكاش بالكامل (Redis Cache Flushed).');
  }

  getStats() {
    // Filter out expired keys on-the-fly to get active count
    const now = Date.now();
    let activeKeysCount = 0;
    const activeKeys: string[] = [];
    
    for (const [key, cached] of this.cache.entries()) {
      if (now <= cached.expiresAt) {
        activeKeysCount++;
        activeKeys.push(key);
      }
    }

    return {
      stats: {
        ...this.stats,
        size: activeKeysCount,
        totalOperations: this.stats.hits + this.stats.misses + this.stats.writes
      },
      keys: activeKeys,
      logs: this.logs
    };
  }
}

export const redisCache = new RedisCacheService();
