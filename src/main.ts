import { CHAIN, POOL_INFO } from './configuration';
import { _1E18, RPCS } from './consts';
import { resolveMorpho } from './lib/morpho';
import {
  applyLpHolderShares,
  applyLpHolderValuesInSY,
  applyYtHolderShares
} from './logic';
import { tryAggregateMulticall } from './multicall';
import { FullMarketInfo, LiquidLockerData, PendleAPI } from './pendle-api';
import { UserRecord } from './types';
import { ethers } from "ethers";
import * as dotenv from 'dotenv';
import { pool, testConnection, getSyncHistory, markDateAsSynced, markDateAsFailed, getSyncStats } from './database';
import { DateUtils } from './utils/dateUtils';
import { BlockUtils } from './utils/blockUtils';

// 加载环境变量
dotenv.config();

// 配置开始日期（2024年8月5日）
const START_DATE = new Date('2024-08-05T00:00:00Z');

// 确保类型定义
type SnapshotResult = {
  resultYT: UserRecord;
  resultLP: UserRecord;
};

async function fetchUserBalanceSnapshot(
  allYTUsers: string[],
  lpInfos: FullMarketInfo[],
  blockNumber: number
): Promise<SnapshotResult> {
  const resultYT: UserRecord = {};
  const resultLP: UserRecord = {};

  await Promise.all([
    applyYtHolderShares(resultYT, allYTUsers, blockNumber),
    ...lpInfos.map(async (lpInfo, i) => {
      const lp = POOL_INFO.LPs[i];
      if (lp.deployedBlock > blockNumber) return;
      await applyLpHolderShares(resultLP, lp.address, lpInfo, blockNumber);
    })
  ]);

  return {
    resultYT,
    resultLP
  };
}

async function fetchUserLpValueInSYSnapshot(
  lpInfos: FullMarketInfo[],
  blockNumber: number
): Promise<SnapshotResult> {
  const resultLP: UserRecord = {};
  for (let i = 0; i < POOL_INFO.LPs.length; ++i) {
    const lp = POOL_INFO.LPs[i];
    const llData = lpInfos[i].llDatas;
    if (lp.deployedBlock <= blockNumber) {
      await applyLpHolderValuesInSY(
        resultLP,
        lp.address,
        POOL_INFO.YT,
        lpInfos[i].lpHolders,
        llData,
        blockNumber
      );
    }
  }

  return {
    resultYT: {},
    resultLP
  };
}

async function fetchUserBalanceSnapshotBatch(
  blockNumbers: number[],
  fetchingLpValueInSY: boolean = false
): Promise<SnapshotResult[]> {
  const allYTUsers = await PendleAPI.queryToken(POOL_INFO.YT);
  const lpInfos = await Promise.all(
    POOL_INFO.LPs.map((lp) => PendleAPI.queryMarketInfo(CHAIN, lp.address))
  );

  return await Promise.all(
    blockNumbers.map((b) =>
      fetchingLpValueInSY
        ? fetchUserLpValueInSYSnapshot(lpInfos, b)
        : fetchUserBalanceSnapshot(allYTUsers, lpInfos, b)
    )
  );
}

async function saveToDatabase(userBalances: SnapshotResult, blockNumber: number, snapshotDate: string) {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');

    // 保存 YT 余额到 pendle_user_balances 表
    for (const user in userBalances.resultYT) {
      if (userBalances.resultYT[user].eq(0)) continue;
      
      await client.query(
        `INSERT INTO pendle_user_balances (user_address, token_type, balance, block_number, snapshot_date)
         VALUES ($1, $2, $3, $4, $5)
         ON CONFLICT (user_address, token_type, block_number) 
         DO UPDATE SET balance = EXCLUDED.balance, snapshot_date = EXCLUDED.snapshot_date`,
        [user, 'YT', userBalances.resultYT[user].toString(), blockNumber, snapshotDate]
      );
    }

    // 保存 LP 余额到 pendle_user_balances 表
    for (const user in userBalances.resultLP) {
      if (userBalances.resultLP[user].eq(0)) continue;
      
      await client.query(
        `INSERT INTO pendle_user_balances (user_address, token_type, balance, block_number, snapshot_date)
         VALUES ($1, $2, $3, $4, $5)
         ON CONFLICT (user_address, token_type, block_number) 
         DO UPDATE SET balance = EXCLUDED.balance, snapshot_date = EXCLUDED.snapshot_date`,
        [user, 'LP', userBalances.resultLP[user].toString(), blockNumber, snapshotDate]
      );
    }

    await client.query('COMMIT');
    console.log(`数据已保存到数据库，区块高度: ${blockNumber}`);
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('数据库保存失败:', error);
    throw error;
  } finally {
    client.release();
  }
}

async function syncDataForDate(targetDate: Date, blockNumber: number) {
  const dateStr = DateUtils.formatDate(targetDate);
  console.log(`开始同步日期: ${dateStr}, 区块: ${blockNumber}`);
  
  try {
    const res = (await fetchUserBalanceSnapshotBatch([blockNumber]))[0];
    await saveToDatabase(res, blockNumber, dateStr);
    await markDateAsSynced(dateStr, blockNumber, 'completed');
    console.log(`✅ 完成同步日期: ${dateStr}`);
    return true;
  } catch (error) {
    console.error(`❌ 同步日期 ${dateStr} 失败:`, error);
    await markDateAsFailed(dateStr, blockNumber);
    return false;
  }
}

async function main() {
  // 测试数据库连接
  const isConnected = await testConnection();
  if (!isConnected) {
    console.error('无法连接到数据库，程序退出');
    process.exit(1);
  }

  try {
    // 获取同步统计
    const stats = await getSyncStats();
    console.log(`同步统计: 总计 ${stats.total} 条, 完成 ${stats.completed} 条, 失败 ${stats.failed} 条`);
    
    // 获取已同步的日期
    const syncedDates = await getSyncHistory();
    console.log(`已同步 ${syncedDates.size} 个日期的数据`);
    
    // 生成需要同步的日期列表（从开始日期到今天）
    const allDates = DateUtils.getDatesFromStartToToday(START_DATE);
    const datesToSync = allDates.filter(date => {
      const dateStr = DateUtils.formatDate(date);
      return !syncedDates.has(dateStr);
    });
    
    if (datesToSync.length === 0) {
      console.log('所有日期数据已同步，无需处理');
      return;
    }
    
    console.log(`需要同步 ${datesToSync.length} 个日期的数据: ${datesToSync.map(d => DateUtils.formatDate(d)).join(', ')}`);
    
    // 获取所有需要同步日期的区块号
    const dateBlockMap = await BlockUtils.getBlockNumbersForDates(datesToSync);
    
    // 按顺序同步每个日期的数据
    let successCount = 0;
    let failCount = 0;
    
    for (const date of datesToSync) {
      const dateStr = DateUtils.formatDate(date);
      const blockNumber = dateBlockMap.get(dateStr);
      
      if (blockNumber) {
        const success = await syncDataForDate(date, blockNumber);
        if (success) {
          successCount++;
        } else {
          failCount++;
        }
        
        // 添加延迟避免速率限制
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
    
    console.log(`🎉 同步完成: 成功 ${successCount} 个日期, 失败 ${failCount} 个日期`);
    
  } catch (error) {
    console.error('程序执行失败:', error);
  } finally {
    // 关闭数据库连接池
    await pool.end();
  }
}

// 添加优雅关闭处理
process.on('SIGINT', async () => {
  console.log('\n正在关闭程序...');
  await pool.end();
  process.exit(0);
});

main().catch(console.error);
