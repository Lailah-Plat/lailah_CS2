import { Sequelize } from 'sequelize';
import CryptoJS from 'crypto-js';
import { spawnSync } from 'child_process';
import fs from 'fs';
import path from 'path';

const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || 'lailah_default_dev_encryption_key_2026';

export function encrypt(text: string | null): string | null {
  if (!text) return text;
  return CryptoJS.AES.encrypt(text, ENCRYPTION_KEY).toString();
}

export function decrypt(text: string | null): string | null {
  if (!text) return text;
  try {
    const bytes = CryptoJS.AES.decrypt(text, ENCRYPTION_KEY);
    return bytes.toString(CryptoJS.enc.Utf8) || text;
  } catch (e) {
    return text;
  }
}

export function getSecureKey(configKey: string, envKey: string): string {
  try {
    const configPath = path.join(process.cwd(), 'database_config.json');
    if (fs.existsSync(configPath)) {
      const config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
      if (config[configKey]) {
        const dec = decrypt(config[configKey]);
        if (dec) return dec;
      }
    }
  } catch (err) {
    console.warn(`Failed to read secure key ${configKey}:`, err);
  }
  return process.env[envKey] || '';
}

const configFilePath = path.join(process.cwd(), 'database_config.json');

interface DatabaseConfig {
  preFlightCheckEnabled?: boolean;
  preFlightTimeoutMs?: number;
  encryptedDbUrl?: string;
  useEncryptedUrlOnly?: boolean;
  localDatabaseEnabled?: boolean;
}

let dbConfig: DatabaseConfig = {};
try {
  if (fs.existsSync(configFilePath)) {
    dbConfig = JSON.parse(fs.readFileSync(configFilePath, 'utf-8'));
  }
} catch (e) {
  console.error("Failed to read database_config.json:", e);
}

export function checkDatabaseReachable(connectionString: string, timeoutMs: number = 1500): boolean {
  try {
    const script = "const { Client } = require('pg'); const client = new Client({ connectionString: process.env.TEST_DB_URL, ssl: { rejectUnauthorized: false } }); client.connect().then(() => { client.end(); process.exit(0); }).catch((err) => { console.error('Probe error:', err.message || err); process.exit(1); });";
    
    const result = spawnSync('node', ['-e', script], {
      env: { ...process.env, TEST_DB_URL: connectionString, NODE_NO_WARNINGS: '1' },
      timeout: timeoutMs,
      stdio: 'pipe'
    });
    
    if (result.status === 0) {
      return true;
    }
    
    if (result.stderr && result.stderr.length > 0) {
      const lines = result.stderr.toString().split('\n');
      const filtered = lines
        .map((l: string) => l.trim())
        .filter((l: string) => l && !l.includes('Warning: SECURITY WARNING') && !l.includes('node:'))
        .join('\n')
        .trim();
      if (filtered) {
        console.log("ℹ️ Database connection probe completed with notice:", filtered);
      }
    }
    return false;
  } catch (error: any) {
    console.log("ℹ️ Database connection probe completed:", error.message || error);
    return false;
  }
}

let dbUrl = process.env.SUPABASE_DATABASE_URL || process.env.DATABASE_URL;

// Highly secure decrypted DB URL from database_config.json
if (dbConfig.encryptedDbUrl) {
  try {
    const decrypted = decrypt(dbConfig.encryptedDbUrl);
    if (decrypted && (decrypted.startsWith('postgres') || decrypted.startsWith('postgresql'))) {
      dbUrl = decrypted;
      console.log("🔒 Decrypted and loaded highly encrypted SUPABASE_DATABASE_URL from config.");
    }
  } catch (err: any) {
    console.error("Failed to decrypt encryptedDbUrl from config:", err.message || err);
  }
}

// Securely check and ignore any unconfigured default values or placeholders from .env.example
if (dbUrl && (
  dbUrl.includes('[YOUR_PASSWORD]') || 
  dbUrl.includes('[REGION]') || 
  dbUrl.includes('YOUR_PASSWORD') || 
  dbUrl.includes('aws-0-') || 
  dbUrl.includes('placeholder')
)) {
  dbUrl = undefined;
}

let isConnectable = false;
const preFlightTimeout = dbConfig.preFlightTimeoutMs || 3000;

if (dbUrl && !dbConfig.localDatabaseEnabled) {
  console.log(`🔍 Probing PostgreSQL / Supabase server connection (Timeout: ${preFlightTimeout}ms)...`);
  isConnectable = checkDatabaseReachable(dbUrl, preFlightTimeout);
  if (isConnectable) {
    console.log("✅ PostgreSQL / Supabase connection validated. Backend connected.");
  } else {
    console.log("ℹ️ External database check unsuccessful. Utilizing local SQLite database engine.");
  }
} else {
  console.log("ℹ️ Using local SQLite database engine.");
}

export const sequelize = (dbUrl && isConnectable) ? new Sequelize(dbUrl, {
  dialect: 'postgres',
  dialectOptions: {
    ssl: {
      require: true,
      rejectUnauthorized: false
    },
    connectTimeout: preFlightTimeout
  },
  pool: {
    max: 15,
    min: 3,
    acquire: preFlightTimeout,
    idle: 30000
  },
  logging: false
}) : new Sequelize({
  dialect: 'sqlite',
  storage: './database.sqlite',
  pool: {
    max: 1,
    min: 1,
    idle: 10000,
    acquire: 30000
  },
  retry: {
    max: 5,
    match: [
      /SQLITE_BUSY/,
      /database is locked/,
      /Resource deadlock avoided/
    ]
  },
  dialectOptions: {
    busyTimeout: 30000
  },
  logging: false
});

// Enable SQLite Write-Ahead Logging (WAL) mode & busy timeout for concurrent safety
if (!dbUrl || !isConnectable) {
  sequelize.query('PRAGMA journal_mode = WAL;').catch(() => {});
  sequelize.query('PRAGMA busy_timeout = 30000;').catch(() => {});
  sequelize.query('PRAGMA synchronous = NORMAL;').catch(() => {});
}
