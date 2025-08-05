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
exports.resolveSilo = void 0;
const multicall_1 = require("../multicall");
const consts_1 = require("../consts");
const SILO_DECIMALS_OFFSET = 1000;
function resolveSilo(syPerOneLP, siloInfos, blockNumber) {
    return __awaiter(this, void 0, void 0, function* () {
        if (siloInfos.length === 0) {
            return [];
        }
        const balances = yield (0, multicall_1.getAllERC20BalancesMultiTokens)(siloInfos.map((s) => s.asset), siloInfos.map((s) => s.user), blockNumber);
        const res = [];
        for (let i = 0; i < siloInfos.length; ++i) {
            res.push({
                user: siloInfos[i].user,
                share: balances[i].mul(syPerOneLP).div(consts_1._1E18).div(SILO_DECIMALS_OFFSET)
            });
        }
        return res;
    });
}
exports.resolveSilo = resolveSilo;
