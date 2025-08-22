import { ethers } from 'ethers';
import { RPCS } from '../consts';
import { DateUtils } from './dateUtils';

export class BlockUtils {
  // 获取指定日期的区块号
  static async getBlockNumberForDate(date: Date, chainId: number = 56): Promise<number> {
    const provider = new ethers.providers.JsonRpcProvider(RPCS[chainId]);
    const timestamp = DateUtils.getMidnightTimestamp(date) + 12 * 3600; // 中午12点的区块
    
    try {
      const blockNumber = await provider.resolveBlock(timestamp);
      return blockNumber;
    } catch (error) {
      console.warn(`无法获取 ${DateUtils.formatDate(date)} 的精确区块，使用最新区块`);
      return await provider.getBlockNumber();
    }
  }

  // 批量获取多个日期的区块号
  static async getBlockNumbersForDates(dates: Date[], chainId: number = 56): Promise<Map<string, number>> {
    const result = new Map<string, number>();
    const provider = new ethers.providers.JsonRpcProvider(RPCS[chainId]);
    
    for (const date of dates) {
      const dateStr = DateUtils.formatDate(date);
      try {
        const timestamp = DateUtils.getMidnightTimestamp(date) + 12 * 3600;
        const blockNumber = await provider.resolveBlock(timestamp);
        result.set(dateStr, blockNumber);
        console.log(`日期 ${dateStr} 的区块号: ${blockNumber}`);
      } catch (error) {
        console.warn(`获取 ${dateStr} 区块号失败，使用最新区块`);
        const latestBlock = await provider.getBlockNumber();
        result.set(dateStr, latestBlock);
      }
      
      // 添加延迟避免速率限制
      await new Promise(resolve => setTimeout(resolve, 200));
    }
    
    return result;
  }
}
