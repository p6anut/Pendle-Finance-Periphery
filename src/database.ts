import { Pool } from 'pg';
import { Client } from 'pg';

// PostgreSQL 配置
const dbConfig = {
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'sigma-dev.ctsuamic89ks.us-east-2.rds.amazonaws.com',
  database: process.env.DB_NAME || 'sigma-prod-202508052000',
  password: process.env.DB_PASSWORD || 'XrKACE3OADCBzXDbluzz',
  port: parseInt(process.env.DB_PORT || '5432'),
};

// 创建连接池
export const pool = new Pool(dbConfig);

// 测试连接
export async function testConnection() {
  try {
    const client = await pool.connect();
    console.log('Database connected successfully');
    client.release();
    return true;
  } catch (error) {
    console.error('Database connection failed:', error);
    return false;
  }
}

// 同步状态管理函数
export async function getSyncHistory(): Promise<Set<string>> {
  const client = await pool.connect();
  try {
    const result = await client.query('SELECT sync_date FROM pendle_sync_history WHERE status = $1', ['completed']);
    const syncedDates = new Set(result.rows.map(row => row.sync_date));
    return syncedDates;
  } finally {
    client.release();
  }
}

export async function markDateAsSynced(date: string, blockNumber: number, status: string = 'completed') {
  const client = await pool.connect();
  try {
    await client.query(
      `INSERT INTO pendle_sync_history (sync_date, block_number, status)
       VALUES ($1, $2, $3)
       ON CONFLICT (sync_date)
       DO UPDATE SET block_number = EXCLUDED.block_number, status = EXCLUDED.status, updated_at = CURRENT_TIMESTAMP`,
      [date, blockNumber, status]
    );
  } finally {
    client.release();
  }
}

export async function markDateAsFailed(date: string, blockNumber: number) {
  await markDateAsSynced(date, blockNumber, 'failed');
}

// 获取同步状态统计
export async function getSyncStats(): Promise<{
  total: number;
  completed: number;
  failed: number;
  pending: number;
}> {
  const client = await pool.connect();
  try {
    const result = await client.query(`
      SELECT
        COUNT(*) as total,
        COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed,
        COUNT(CASE WHEN status = 'failed' THEN 1 END) as failed,
        COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending
      FROM pendle_sync_history
    `);

    return result.rows[0];
  } finally {
    client.release();
  }
}
