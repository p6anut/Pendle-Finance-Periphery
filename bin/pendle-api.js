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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PendleAPI = void 0;
const axios_1 = __importDefault(require("axios"));
class PendleAPI {
    static queryAllTokens(tokens) {
        return __awaiter(this, void 0, void 0, function* () {
            const allResults = yield Promise.all(tokens.map((token) => this.queryToken(token)));
            const allUniqueUsers = new Set(allResults.flat());
            return Array.from(allUniqueUsers);
        });
    }
    static queryToken(token) {
        return __awaiter(this, void 0, void 0, function* () {
            const resp = yield axios_1.default.get(`https://api-v2.pendle.finance/core/v1/statistics/get-distinct-user-from-token?token=${token.toLowerCase()}`);
            return resp.data.users;
        });
    }
    static queryMarketInfo(chainId, market) {
        return __awaiter(this, void 0, void 0, function* () {
            const resp = yield axios_1.default.get(`https://api-v2.pendle.finance/core/v1/statistics/get-all-related-info-from-lp-and-wlp?chainId=${chainId}&marketAddress=${market}`);
            if (!resp.data.wlpDistinctUsersResponse) {
                return {
                    lpHolders: resp.data.distinctUsers,
                    llDatas: resp.data.liquidLockerPools
                };
            }
            const remapMMHolder = {};
            for (let i = 0; i < resp.data.wlpHolderMappings.length; ++i) {
                remapMMHolder[resp.data.wlpHolderMappings[i].asset.toLowerCase()] = {
                    holder: resp.data.wlpHolderMappings[i].holder.toLowerCase(),
                    type: resp.data.wlpHolderMappings[i].moneyMarket
                };
            }
            let morphoAddress = undefined;
            if (resp.data.wlpDistinctUsersResponse.morphoConfigs.length > 0) {
                morphoAddress =
                    resp.data.wlpDistinctUsersResponse.morphoConfigs[0].morphoAddress.toLowerCase();
            }
            return {
                lpHolders: resp.data.distinctUsers,
                llDatas: resp.data.liquidLockerPools,
                wlpInfo: {
                    wlp: resp.data.wlpDistinctUsersResponse.wlpAddress,
                    wlpHolders: resp.data.wlpDistinctUsersResponse.wlpUsers,
                    morpho: resp.data.wlpDistinctUsersResponse.morphoUsers,
                    euler: resp.data.wlpDistinctUsersResponse.eulerUsers,
                    morphoAddress: morphoAddress,
                    silo: resp.data.wlpDistinctUsersResponse.siloUsers,
                    remapMMHolder
                }
            };
        });
    }
}
exports.PendleAPI = PendleAPI;
