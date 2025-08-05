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
exports.getYTGeneralData = exports.getAllYTInterestData = exports.getAllMarketActiveBalances = exports.getAllERC20Balances = exports.getAllERC20BalancesMultiTokens = exports.tryAggregateMulticall = void 0;
const ethers_1 = require("ethers");
const constants = __importStar(require("./consts"));
function tryAggregateMulticall(callDatas, blockNumber) {
    return __awaiter(this, void 0, void 0, function* () {
        const multicall = constants.Contracts.multicall;
        const result = [];
        for (let start = 0; start < callDatas.length; start += constants.MULTICALL_BATCH_SIZE) {
            const resp = yield multicall.callStatic.tryAggregate(false, callDatas
                .slice(start, start + constants.MULTICALL_BATCH_SIZE)
                .map((c) => [c.target, c.callData]), {
                blockTag: blockNumber
            });
            for (let r of resp) {
                if (r.success === false) {
                    result.push(null);
                }
                else {
                    result.push(r.returnData);
                }
            }
        }
        return result;
    });
}
exports.tryAggregateMulticall = tryAggregateMulticall;
function getAllERC20BalancesMultiTokens(tokens, addresses, blockNumber) {
    return __awaiter(this, void 0, void 0, function* () {
        const callDatas = tokens.map((token, index) => ({
            target: token,
            callData: constants.Contracts.marketInterface.encodeFunctionData('balanceOf', [addresses[index]])
        }));
        const balances = yield tryAggregateMulticall(callDatas, blockNumber);
        return balances.map((b) => b
            ? ethers_1.BigNumber.from(ethers_1.utils.defaultAbiCoder.decode(['uint256'], b)[0])
            : ethers_1.BigNumber.from(0));
    });
}
exports.getAllERC20BalancesMultiTokens = getAllERC20BalancesMultiTokens;
function getAllERC20Balances(token, addresses, blockNumber) {
    return __awaiter(this, void 0, void 0, function* () {
        const callDatas = addresses.map((address) => ({
            target: token,
            callData: constants.Contracts.marketInterface.encodeFunctionData('balanceOf', [address])
        }));
        const balances = yield tryAggregateMulticall(callDatas, blockNumber);
        return balances.map((b) => b
            ? ethers_1.BigNumber.from(ethers_1.utils.defaultAbiCoder.decode(['uint256'], b)[0])
            : ethers_1.BigNumber.from(0));
    });
}
exports.getAllERC20Balances = getAllERC20Balances;
function getAllMarketActiveBalances(market, addresses, blockNumber) {
    return __awaiter(this, void 0, void 0, function* () {
        const callDatas = addresses.map((address) => ({
            target: market,
            callData: constants.Contracts.marketInterface.encodeFunctionData('activeBalance', [address])
        }));
        const balances = yield tryAggregateMulticall(callDatas, blockNumber);
        return balances.map((b) => ethers_1.BigNumber.from(ethers_1.utils.defaultAbiCoder.decode(['uint256'], b)[0]));
    });
}
exports.getAllMarketActiveBalances = getAllMarketActiveBalances;
function getAllYTInterestData(yt, addresses, blockNumber) {
    return __awaiter(this, void 0, void 0, function* () {
        const callDatas = addresses.map((address) => ({
            target: yt,
            callData: constants.Contracts.yieldTokenInterface.encodeFunctionData('userInterest', [address])
        }));
        const interests = yield tryAggregateMulticall(callDatas, blockNumber);
        return interests.map((b) => {
            const rawData = ethers_1.utils.defaultAbiCoder.decode(['uint128', 'uint128'], b);
            return {
                index: ethers_1.BigNumber.from(rawData[0]),
                accrue: ethers_1.BigNumber.from(rawData[1])
            };
        });
    });
}
exports.getAllYTInterestData = getAllYTInterestData;
function getYTGeneralData(ytAddr, blockNumber) {
    return __awaiter(this, void 0, void 0, function* () {
        const callDatas = [
            {
                target: ytAddr,
                callData: constants.Contracts.yieldTokenInterface.encodeFunctionData('isExpired', [])
            },
            {
                target: ytAddr,
                callData: constants.Contracts.yieldTokenInterface.encodeFunctionData('syReserve', [])
            },
            {
                target: ytAddr,
                callData: constants.Contracts.yieldTokenInterface.encodeFunctionData('factory', [])
            }
        ];
        const result = yield tryAggregateMulticall(callDatas, blockNumber);
        const isExpired = ethers_1.utils.defaultAbiCoder.decode(['bool'], result[0])[0];
        const syReserve = ethers_1.BigNumber.from(ethers_1.utils.defaultAbiCoder.decode(['uint256'], result[1])[0]);
        const factory = ethers_1.utils.defaultAbiCoder.decode(['address'], result[2])[0];
        return {
            isExpired,
            syReserve,
            factory
        };
    });
}
exports.getYTGeneralData = getYTGeneralData;
