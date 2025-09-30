import { ethers } from 'ethers';
import { RPCS } from '../consts';
import { DateUtils } from './dateUtils';

export class BlockUtils {
  // 获取指定日期的区块号
  static async getBlockNumberForDate(date: Date, chainId: number = 56): Promise<number> {
    // 修复类型错误：添加类型检查
    const rpcUrl = RPCS[chainId as keyof typeof RPCS];
    if (!rpcUrl) {
      throw new Error(`No RPC URL found for chainId: ${chainId}`);
    }
    
    const provider = new ethers.providers.JsonRpcProvider(rpcUrl);
    const timestamp = DateUtils.getMidnightTimestamp(date) + 12 * 3600; // 中午12点的区块
    
    try {
      // 使用 getBlockNumber 和 getBlock 替代 resolveBlock
      const latestBlockNumber = await provider.getBlockNumber();
      let left = 0;
      let right = latestBlockNumber;
      let closestBlock = latestBlockNumber;
      
      // 使用二分查找找到最接近时间戳的区块
      while (left <= right) {
        const mid = Math.floor((left + right) / 2);
        const block = await provider.getBlock(mid);
        
        if (block.timestamp < timestamp) {
          left = mid + 1;
        } else if (block.timestamp > timestamp) {
          right = mid - 1;
        } else {
          closestBlock = mid;
          break;
        }
        
        // 更新最接近的区块
        if (Math.abs(block.timestamp - timestamp) < Math.abs((await provider.getBlock(closestBlock)).timestamp - timestamp)) {
          closestBlock = mid;
        }
      }
      
      return closestBlock;
    } catch (error) {
      console.warn(`无法获取 ${DateUtils.formatDate(date)} 的精确区块，使用最新区块`);
      return await provider.getBlockNumber();
    }
  }

  // 批量获取多个日期的区块号
  static async getBlockNumbersForDates(dates: Date[], chainId: number = 56): Promise<Map<string, number>> {
    const result = new Map<string, number>();
    
    // 修复类型错误：添加类型检查
    const rpcUrl = RPCS[chainId as keyof typeof RPCS];
    if (!rpcUrl) {
      throw new Error(`No RPC URL found for chainId: ${chainId}`);
    }
    
    const provider = new ethers.providers.JsonRpcProvider(rpcUrl);
    
    for (const date of dates) {
      const dateStr = DateUtils.formatDate(date);
      try {
        const timestamp = DateUtils.getMidnightTimestamp(date) + 12 * 3600;
        
        // 使用 getBlockNumber 和 getBlock 替代 resolveBlock
        const latestBlockNumber = await provider.getBlockNumber();
        let left = 0;
        let right = latestBlockNumber;
        let closestBlock = latestBlockNumber;
        
        // 使用二分查找找到最接近时间戳的区块
        while (left <= right) {
          const mid = Math.floor((left + right) / 2);
          const block = await provider.getBlock(mid);
          
          if (block.timestamp < timestamp) {
            left = mid + 1;
          } else if (block.timestamp > timestamp) {
            right = mid - 1;
          } else {
            closestBlock = mid;
            break;
          }
          
          // 更新最接近的区块
          if (Math.abs(block.timestamp - timestamp) < Math.abs((await provider.getBlock(closestBlock)).timestamp - timestamp)) {
            closestBlock = mid;
          }
        }
        
        result.set(dateStr, closestBlock);
        console.log(`日期 ${dateStr} 的区块号: ${closestBlock}`);
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
