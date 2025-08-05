import { CHAIN, POOL_INFO } from './configuration';
import {_1E18, RPCS} from './consts';
import { resolveMorpho } from './lib/morpho';
import {
  applyLpHolderShares,
  applyLpHolderValuesInSY,
  applyYtHolderShares
} from './logic';
import { tryAggregateMulticall } from './multicall';
import { FullMarketInfo, LiquidLockerData, PendleAPI } from './pendle-api';
import { UserRecord } from './types';
import {ethers} from "ethers";
import path from "path";
import * as fs from "fs";

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

async function main() {
    const now = new Date();
    const dateStr = now.toISOString().split('T')[0]; // 格式: YYYY-MM-DD

    // 创建按日期组织的目录结构
    const outputDir = path.join(__dirname, 'output', now.getFullYear().toString(), (now.getMonth() + 1).toString().padStart(2, '0'));
    if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
    }

    // 创建带日期的CSV文件
    const ytCsvPath = path.join(outputDir, `yt_balances_${dateStr}.csv`);
    const lpCsvPath = path.join(outputDir, `lp_balances_${dateStr}.csv`);

    // 写入CSV表头
    fs.writeFileSync(ytCsvPath, 'user,balance,date\n');
    fs.writeFileSync(lpCsvPath, 'user,balance,date\n');

    const block = await (new ethers.providers.JsonRpcProvider(RPCS[56])).getBlockNumber();
    const res = (await fetchUserBalanceSnapshotBatch([block]))[0];

    // 保存YT余额
    for (const user in res.resultYT) {
        if (res.resultYT[user].eq(0)) continue;
        const balance = res.resultYT[user].toString();
        fs.appendFileSync(ytCsvPath, `${user},${balance},${dateStr}\n`);
    }

    // 保存LP余额
    for (const user in res.resultLP) {
        if (res.resultLP[user].eq(0)) continue;
        const balance = res.resultLP[user].toString();
        fs.appendFileSync(lpCsvPath, `${user},${balance},${dateStr}\n`);
    }

    console.log(`[${new Date().toISOString()}] 数据已保存到: ${outputDir}`);
}

main().catch(console.error);
