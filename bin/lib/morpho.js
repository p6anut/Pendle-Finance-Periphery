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
exports.resolveMorpho = void 0;
const ethers_1 = require("ethers");
const multicall_1 = require("../multicall");
const consts_1 = require("../consts");
/// [NOTE]: Skipping interest for now.
function resolveMorpho(syPerOneWLP, morphoAddress, morphoInfos, blockNumber) {
    return __awaiter(this, void 0, void 0, function* () {
        if (morphoInfos.length === 0) {
            return [];
        }
        const callDatas = morphoInfos.map((m) => ({
            target: morphoAddress,
            callData: consts_1.Contracts.morphoBlueInterface.encodeFunctionData('position', [
                m.marketId,
                m.user
            ])
        }));
        const eqWlpBalance = (yield (0, multicall_1.tryAggregateMulticall)(callDatas, blockNumber)).map((b) => {
            if (!b) {
                return ethers_1.ethers.BigNumber.from(0);
            }
            const decoded = consts_1.Contracts.morphoBlueInterface.decodeFunctionResult('position', b);
            return ethers_1.ethers.BigNumber.from(decoded.collateral);
        });
        return eqWlpBalance.map((balance, i) => ({
            user: morphoInfos[i].user,
            share: balance.mul(syPerOneWLP).div(consts_1._1E18)
        }));
    });
}
exports.resolveMorpho = resolveMorpho;
