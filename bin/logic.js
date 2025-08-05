"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
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
exports.applyLpHolderValuesInSY = exports.applyLpHolderShares = exports.applyYtHolderShares = void 0;
const ethers_1 = require("ethers");
const multicall_1 = require("./multicall");
const configuration_1 = require("./configuration");
const constants = __importStar(require("./consts"));
const lp_price_1 = require("./libs/lp-price");
const record_1 = require("./lib/record");
const liquid_locker_1 = require("./lib/liquid-locker");
const mmType_1 = require("./lib/mmType");
const euler_1 = require("./lib/euler");
const silo_1 = require("./lib/silo");
const morpho_1 = require("./lib/morpho");
function applyYtHolderShares(result, allUsers, blockNumber) {
    return __awaiter(this, void 0, void 0, function* () {
        const generalData = yield (0, multicall_1.getYTGeneralData)(configuration_1.POOL_INFO.YT, blockNumber);
        if (generalData.isExpired) {
            (0, record_1.increaseUserAmount)(result, constants.PENDLE_TREASURY, generalData.syReserve);
            return;
        }
        const [balancesRaw, allInterestsRaw] = yield Promise.all([
            (0, multicall_1.getAllERC20Balances)(configuration_1.POOL_INFO.YT, allUsers, blockNumber),
            (0, multicall_1.getAllYTInterestData)(configuration_1.POOL_INFO.YT, allUsers, blockNumber)
        ]);
        const balances = balancesRaw.map((v, i) => {
            return {
                user: allUsers[i],
                balance: v
            };
        });
        const allInterests = allInterestsRaw.map((v, i) => {
            return {
                user: allUsers[i],
                userIndex: v.index,
                amount: v.accrue
            };
        });
        const YTIndex = allInterests
            .map((v) => v.userIndex)
            .reduce((a, b) => {
            return a.gt(b) ? a : b;
        });
        const YTBalances = {};
        const factoryContract = new ethers_1.ethers.Contract(generalData.factory, constants.ABIs.pendleYieldContractFactory, constants.PROVIDER);
        const feeRate = yield factoryContract.rewardFeeRate({
            blockTag: blockNumber
        });
        for (const b of balances) {
            const impliedBalance = constants._1E18.mul(b.balance).div(YTIndex);
            const feeShare = impliedBalance.mul(feeRate).div(constants._1E18);
            const remaining = impliedBalance.sub(feeShare);
            (0, record_1.increaseUserAmount)(result, b.user, remaining);
            (0, record_1.increaseUserAmount)(result, constants.PENDLE_TREASURY, feeShare);
            YTBalances[b.user] = b.balance;
        }
        for (const i of allInterests) {
            if (i.user == configuration_1.POOL_INFO.YT) {
                continue;
            }
            if (i.userIndex.eq(0)) {
                continue;
            }
            const pendingInterest = YTBalances[i.user]
                .mul(YTIndex.sub(i.userIndex))
                .mul(constants._1E18)
                .div(YTIndex.mul(i.userIndex));
            const totalInterest = pendingInterest.add(i.amount);
            (0, record_1.increaseUserAmount)(result, i.user, totalInterest);
        }
    });
}
exports.applyYtHolderShares = applyYtHolderShares;
function applyLpHolderShares(result, lpToken, lpInfo, blockNumber) {
    return __awaiter(this, void 0, void 0, function* () {
        const totalSy = (yield (0, multicall_1.getAllERC20Balances)(configuration_1.POOL_INFO.SY, [lpToken], blockNumber))[0];
        const allActiveBalances = yield (0, multicall_1.getAllMarketActiveBalances)(lpToken, lpInfo.lpHolders, blockNumber);
        const totalActiveSupply = allActiveBalances.reduce((a, b) => a.add(b), ethers_1.ethers.BigNumber.from(0));
        for (let i = 0; i < lpInfo.lpHolders.length; ++i) {
            const holder = lpInfo.lpHolders[i];
            const boostedSyBalance = allActiveBalances[i]
                .mul(totalSy)
                .div(totalActiveSupply);
            if (lpInfo.wlpInfo &&
                holder.toLowerCase() === lpInfo.wlpInfo.wlp.toLowerCase()) {
                yield applyWlpHolderShares(result, lpInfo, blockNumber, boostedSyBalance);
                continue;
            }
            const llIndex = lpInfo.llDatas.findIndex((data) => data.lpHolder.toLowerCase() === holder.toLowerCase());
            if (llIndex === -1) {
                (0, record_1.increaseUserAmount)(result, holder, boostedSyBalance);
            }
            else {
                (0, record_1.increaseUserAmounts)(result, yield (0, liquid_locker_1.resolveLiquidLocker)(boostedSyBalance, lpInfo.llDatas[llIndex], blockNumber));
            }
        }
    });
}
exports.applyLpHolderShares = applyLpHolderShares;
function applyLpHolderValuesInSY(result, lpToken, ytToken, allUsers, llDatas, blockNumber) {
    return __awaiter(this, void 0, void 0, function* () {
        const balances = yield (0, multicall_1.getAllERC20Balances)(lpToken, allUsers, blockNumber);
        const price = yield (0, lp_price_1.getLpToSyRate)(lpToken, ytToken, blockNumber);
        yield Promise.all(allUsers.map((holder, i) => __awaiter(this, void 0, void 0, function* () {
            holder = allUsers[i];
            const llIndex = llDatas.findIndex((data) => data.lpHolder.toLowerCase() === holder.toLowerCase());
            if (llIndex === -1) {
                (0, record_1.increaseUserAmount)(result, holder, balances[i].mul(price).div(constants._1E18));
            }
            else {
                const llData = llDatas[llIndex];
                const users = llData.users;
                const receiptToken = llData.receiptToken;
                const receiptBalances = yield (0, multicall_1.getAllERC20Balances)(receiptToken, users, blockNumber);
                if (!receiptBalances) {
                    return;
                }
                const totalReceiptBalance = receiptBalances.reduce((a, b) => a.add(b), ethers_1.ethers.BigNumber.from(0));
                for (let j = 0; j < users.length; ++j) {
                    const user = users[j];
                    const receiptBalance = receiptBalances[j];
                    if (receiptBalance.isZero()) {
                        continue;
                    }
                    const userShare = receiptBalance
                        .mul(balances[i])
                        .mul(price)
                        .div(totalReceiptBalance)
                        .div(constants._1E18);
                    (0, record_1.increaseUserAmount)(result, user, userShare);
                }
            }
        })));
    });
}
exports.applyLpHolderValuesInSY = applyLpHolderValuesInSY;
function applyWlpHolderShares(result, lpInfo, blockNumber, boostedSyBalance) {
    return __awaiter(this, void 0, void 0, function* () {
        if (!lpInfo.wlpInfo) {
            return;
        }
        const balances = yield (0, multicall_1.getAllERC20Balances)(lpInfo.wlpInfo.wlp, lpInfo.wlpInfo.wlpHolders, blockNumber);
        const totalSupply = balances.reduce((a, b) => a.add(b), ethers_1.ethers.BigNumber.from(0));
        const syPerOneWLP = boostedSyBalance.mul(constants._1E18).div(totalSupply);
        let totalMMShares = new Map();
        for (let i = 0; i < lpInfo.wlpInfo.wlpHolders.length; ++i) {
            const holder = lpInfo.wlpInfo.wlpHolders[i];
            const wlpBalance = balances[i];
            const userShare = wlpBalance.mul(syPerOneWLP).div(constants._1E18);
            let mmType = (0, mmType_1.getMMType)(lpInfo, holder);
            if (mmType) {
                totalMMShares.set(mmType, (totalMMShares.get(mmType) || ethers_1.ethers.BigNumber.from(0)).add(userShare));
                continue;
            }
            (0, record_1.increaseUserAmount)(result, holder, userShare);
        }
        const [eulerShares, siloShares, morphoShares] = yield Promise.all([
            (0, euler_1.resolveEuler)(syPerOneWLP, lpInfo.wlpInfo.euler, blockNumber),
            (0, silo_1.resolveSilo)(syPerOneWLP, lpInfo.wlpInfo.silo, blockNumber),
            lpInfo.wlpInfo.morphoAddress
                ? (0, morpho_1.resolveMorpho)(syPerOneWLP, lpInfo.wlpInfo.morphoAddress, lpInfo.wlpInfo.morpho, blockNumber)
                : []
        ]);
        softCheck(eulerShares, totalMMShares.get('EULER') || ethers_1.ethers.BigNumber.from(0));
        softCheck(siloShares, totalMMShares.get('SILO') || ethers_1.ethers.BigNumber.from(0));
        softCheck(morphoShares, totalMMShares.get('MORPHO') || ethers_1.ethers.BigNumber.from(0));
        (0, record_1.increaseUserAmounts)(result, eulerShares);
        (0, record_1.increaseUserAmounts)(result, siloShares);
        (0, record_1.increaseUserAmounts)(result, morphoShares);
    });
}
function softCheck(shares, upperbound) {
    const total = shares.reduce((a, b) => a.add(b.share), ethers_1.ethers.BigNumber.from(0));
    if (total.gt(upperbound)) {
        throw new Error(`Total shares ${total.toString()} exceeds upper bound ${upperbound.toString()}`);
    }
}
