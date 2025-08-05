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
exports.resolveLiquidLocker = void 0;
const ethers_1 = require("ethers");
const multicall_1 = require("../multicall");
function resolveLiquidLocker(boostedSyBalance, llData, blockNumber) {
    return __awaiter(this, void 0, void 0, function* () {
        if (boostedSyBalance.isZero()) {
            return [];
        }
        const users = llData.users;
        const receiptToken = llData.receiptToken;
        const balances = yield (0, multicall_1.getAllERC20Balances)(receiptToken, users, blockNumber);
        const totalReceiptBalance = balances.reduce((a, b) => a.add(b), ethers_1.ethers.BigNumber.from(0));
        if (totalReceiptBalance.isZero()) {
            return [];
        }
        const res = [];
        for (let j = 0; j < users.length; ++j) {
            const user = users[j];
            const receiptBalance = balances[j];
            if (receiptBalance.isZero()) {
                continue;
            }
            const userShare = receiptBalance
                .mul(boostedSyBalance)
                .div(totalReceiptBalance);
            res.push({
                user: user,
                share: userShare
            });
        }
        return res;
    });
}
exports.resolveLiquidLocker = resolveLiquidLocker;
