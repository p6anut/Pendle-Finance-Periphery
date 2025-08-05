"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const configuration_1 = require("./configuration");
const logic_1 = require("./logic");
const pendle_api_1 = require("./pendle-api");
function fetchUserBalanceSnapshot(allYTUsers, lpInfos, blockNumber) {
    return __awaiter(this, void 0, void 0, function* () {
        const resultYT = {};
        const resultLP = {};
        yield Promise.all([
            (0, logic_1.applyYtHolderShares)(resultYT, allYTUsers, blockNumber),
            ...lpInfos.map((lpInfo, i) => __awaiter(this, void 0, void 0, function* () {
                const lp = configuration_1.POOL_INFO.LPs[i];
                if (lp.deployedBlock > blockNumber)
                    return;
                yield (0, logic_1.applyLpHolderShares)(resultLP, lp.address, lpInfo, blockNumber);
            }))
        ]);
        return {
            resultYT,
            resultLP
        };
    });
}
function fetchUserLpValueInSYSnapshot(lpInfos, blockNumber) {
    return __awaiter(this, void 0, void 0, function* () {
        const resultLP = {};
        for (let i = 0; i < configuration_1.POOL_INFO.LPs.length; ++i) {
            const lp = configuration_1.POOL_INFO.LPs[i];
            const llData = lpInfos[i].llDatas;
            if (lp.deployedBlock <= blockNumber) {
                yield (0, logic_1.applyLpHolderValuesInSY)(resultLP, lp.address, configuration_1.POOL_INFO.YT, lpInfos[i].lpHolders, llData, blockNumber);
            }
        }
        return {
            resultYT: {},
            resultLP
        };
    });
}
function fetchUserBalanceSnapshotBatch(blockNumbers_1) {
    return __awaiter(this, arguments, void 0, function* (blockNumbers, fetchingLpValueInSY = false) {
        const allYTUsers = yield pendle_api_1.PendleAPI.queryToken(configuration_1.POOL_INFO.YT);
        const lpInfos = yield Promise.all(configuration_1.POOL_INFO.LPs.map((lp) => pendle_api_1.PendleAPI.queryMarketInfo(configuration_1.CHAIN, lp.address)));
        return yield Promise.all(blockNumbers.map((b) => fetchingLpValueInSY
            ? fetchUserLpValueInSYSnapshot(lpInfos, b)
            : fetchUserBalanceSnapshot(allYTUsers, lpInfos, b)));
    });
}
function main() {
    return __awaiter(this, void 0, void 0, function* () {
        const block = 22835503;
        const res = (yield fetchUserBalanceSnapshotBatch([block]))[0];
        // for (const user in res.resultYT) {
        //   if (res.resultYT[user].eq(0)) continue;
        //   // console.log(user, res.resultYT[user].toString());
        // }
        // for (const user in res.resultLP) {
        //   if (res.resultLP[user].eq(0)) continue;
        // }
    });
}
main().catch(console.error);
