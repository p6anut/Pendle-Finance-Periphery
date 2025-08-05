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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Contracts = exports.ABIs = exports.MULTICALL_ADDRESS = exports.PROVIDER = exports._1E18 = exports.ONE_YEAR = exports.ORACLE_INTERVAL = exports.MULTICALL_BATCH_SIZE = exports.PENDLE_ORACLE = exports.PENDLE_TREASURY = void 0;
const ethers_1 = require("ethers");
const zod_1 = __importDefault(require("zod"));
const config = __importStar(require("./configuration"));
const dotenv = __importStar(require("dotenv"));
const Multicall_json_1 = __importDefault(require("../abis/Multicall.json"));
const PendleYieldToken_json_1 = __importDefault(require("../abis/PendleYieldToken.json"));
const PendleMarket_json_1 = __importDefault(require("../abis/PendleMarket.json"));
const PendleYieldContractFactory_json_1 = __importDefault(require("../abis/PendleYieldContractFactory.json"));
const PendleOracle_json_1 = __importDefault(require("../abis/PendleOracle.json"));
const Morphoblue_json_1 = __importDefault(require("../abis/Morphoblue.json"));
dotenv.config();
const envSchema = zod_1.default.object({
    ETH_RPC: zod_1.default.string().optional(),
    ARBITRUM_RPC: zod_1.default.string().optional(),
    BSC_RPC: zod_1.default.string().optional(),
    OPTIMISM_RPC: zod_1.default.string().optional(),
    MANTLE_RPC: zod_1.default.string().optional(),
    BASE_RPC: zod_1.default.string().optional(),
    SONIC_RPC: zod_1.default.string().optional(),
    BERACHAIN_RPC: zod_1.default.string().optional()
});
const env = envSchema.parse(process.env);
const RPCS = {
    1: env.ETH_RPC || 'https://eth.llamarpc.com',
    42161: env.ARBITRUM_RPC || 'https://arbitrum-one-rpc.publicnode.com',
    56: env.BSC_RPC || 'https://binance.llamarpc.com',
    5000: env.MANTLE_RPC || 'https://rpc.mantle.xyz',
    8453: env.BASE_RPC || 'https://base.llamarpc.com',
    146: env.SONIC_RPC || 'https://rpc.soniclabs.com',
    80094: env.BERACHAIN_RPC || 'https://berachain.drpc.org'
};
const MULTICALLS = {
    1: '0xcA11bde05977b3631167028862bE2a173976CA11',
    42161: '0xcA11bde05977b3631167028862bE2a173976CA11',
    56: '0xcA11bde05977b3631167028862bE2a173976CA11',
    5000: '0xcA11bde05977b3631167028862bE2a173976CA11',
    8453: '0xcA11bde05977b3631167028862bE2a173976CA11',
    146: '0xcA11bde05977b3631167028862bE2a173976CA11',
    80094: '0xcA11bde05977b3631167028862bE2a173976CA11'
};
exports.PENDLE_TREASURY = '0xc328dfcd2c8450e2487a91daa9b75629075b7a43';
exports.PENDLE_ORACLE = '0x9a9fa8338dd5e5b2188006f1cd2ef26d921650c2';
exports.MULTICALL_BATCH_SIZE = 500;
exports.ORACLE_INTERVAL = 15;
exports.ONE_YEAR = 86400 * 365;
exports._1E18 = ethers_1.ethers.BigNumber.from(10).pow(18);
exports.PROVIDER = new ethers_1.ethers.providers.JsonRpcProvider(RPCS[config.CHAIN]);
exports.MULTICALL_ADDRESS = MULTICALLS[config.CHAIN];
exports.ABIs = {
    multicall: Multicall_json_1.default,
    pendleYieldToken: PendleYieldToken_json_1.default,
    pendleMarket: PendleMarket_json_1.default,
    pendleYieldContractFactory: PendleYieldContractFactory_json_1.default,
    pendleOracle: PendleOracle_json_1.default,
    morphoBlue: Morphoblue_json_1.default
};
exports.Contracts = {
    multicall: new ethers_1.ethers.Contract(exports.MULTICALL_ADDRESS, exports.ABIs.multicall, exports.PROVIDER),
    oracle: new ethers_1.ethers.Contract(exports.PENDLE_ORACLE, exports.ABIs.pendleOracle, exports.PROVIDER),
    yieldTokenInterface: new ethers_1.ethers.utils.Interface(exports.ABIs.pendleYieldToken),
    marketInterface: new ethers_1.ethers.utils.Interface(exports.ABIs.pendleMarket),
    morphoBlueInterface: new ethers_1.ethers.utils.Interface(exports.ABIs.morphoBlue)
};
