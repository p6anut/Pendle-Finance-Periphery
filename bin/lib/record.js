"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.increaseUserAmounts = exports.increaseUserAmount = void 0;
const ethers_1 = require("ethers");
function increaseUserAmount(result, user, amount) {
    if (result[user]) {
        result[user] = result[user].add(amount);
    }
    else {
        result[user] = ethers_1.ethers.BigNumber.from(amount);
    }
}
exports.increaseUserAmount = increaseUserAmount;
function increaseUserAmounts(result, datas) {
    for (const data of datas) {
        increaseUserAmount(result, data.user, data.share);
    }
}
exports.increaseUserAmounts = increaseUserAmounts;
