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
exports.getLpToSyRate = void 0;
const ethers_1 = require("ethers");
const constants = __importStar(require("../consts"));
function getLpToSyRate(lpToken, ytToken, blockNumber) {
    return __awaiter(this, void 0, void 0, function* () {
        const market = new ethers_1.ethers.Contract(lpToken, constants.ABIs.pendleMarket, constants.PROVIDER);
        const yt = new ethers_1.ethers.Contract(ytToken, constants.ABIs.pendleYieldToken, constants.PROVIDER);
        const storage = yield market.readState(lpToken, { blockTag: blockNumber });
        const ptToAssetRate = getExchangeRateFromLnImpliedRate(storage.lastLnImpliedRate, storage.expiry.toNumber() - (yield getBlockTimestamp(blockNumber)));
        const ptToSyRate = ptToAssetRate
            .mul(constants._1E18)
            .div(yield yt.callStatic.pyIndexCurrent({ blockTag: blockNumber }));
        const totalValueInSy = storage.totalSy.add(storage.totalPt.mul(ptToSyRate).div(constants._1E18));
        return totalValueInSy.mul(constants._1E18).div(storage.totalLp);
    });
}
exports.getLpToSyRate = getLpToSyRate;
function getExchangeRateFromLnImpliedRate(lnImpliedRate, timeToExpiry) {
    const normalizedRate = (weiToF(lnImpliedRate) * timeToExpiry) / constants.ONE_YEAR;
    return ethers_1.ethers.utils.parseUnits(Math.exp(normalizedRate).toString(), 18);
}
function getBlockTimestamp(blockNumber) {
    return __awaiter(this, void 0, void 0, function* () {
        const block = yield constants.PROVIDER.getBlock(blockNumber);
        if (!block || !block.timestamp) {
            throw new Error(`Block ${blockNumber} not found or has no timestamp`);
        }
        return block.timestamp;
    });
}
function weiToF(wei) {
    return parseFloat(ethers_1.ethers.utils.formatUnits(wei, 18));
}
