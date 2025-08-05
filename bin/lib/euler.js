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
exports.resolveEuler = void 0;
const multicall_1 = require("../multicall");
const consts_1 = require("../consts");
/// [NOTE]: Skipping interest for now.
function resolveEuler(syPerOneWLP, eulerInfos, blockNumber) {
    return __awaiter(this, void 0, void 0, function* () {
        if (eulerInfos.length === 0) {
            return [];
        }
        const balances = yield (0, multicall_1.getAllERC20BalancesMultiTokens)(eulerInfos.map((e) => e.asset), eulerInfos.map((e) => e.user), blockNumber);
        const res = [];
        for (let i = 0; i < eulerInfos.length; ++i) {
            res.push({
                user: eulerInfos[i].user,
                share: balances[i].mul(syPerOneWLP).div(consts_1._1E18)
            });
        }
        return res;
    });
}
exports.resolveEuler = resolveEuler;
