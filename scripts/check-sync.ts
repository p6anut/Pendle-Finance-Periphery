import { pool, getSyncStats } from '../src/database';

async function checkSyncStatus() {
  const client = await pool.connect();
  try {
    // 获取同步统计
    const stats = await getSyncStats();
    console.log('同步统计:');
    console.log(`总计: ${stats.total}, 完成: ${stats.completed}, 失败: ${stats.failed}, 待处理: ${stats.pending}`);
    
    // 检查最近7天的同步状态
    const result = await client.query(
      `SELECT sync_date, block_number, status 
       FROM pendle_sync_history 
       WHERE sync_date >= CURRENT_DATE - INTERVAL '7 days'
       ORDER BY sync_date DESC`
    );
    
    console.log('\n最近7天同步状态:');
    result.rows.forEach(row => {
      console.log(`${row.sync_date}: ${row.status} (区块: ${row.block_number})`);
    });
  } finally {
    client.release();
    await pool.end();
  }
}

checkSyncStatus().catch(console.error);
