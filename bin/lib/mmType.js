"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getMMType = void 0;
let mmInfoInitialized = false;
const mmToTypeMap = new Map();
function getMMType(lpInfo, addr) {
    if (!lpInfo.wlpInfo) {
        return null;
    }
    if (!mmInfoInitialized) {
        initMMAddresses(lpInfo);
    }
    addr = addr.toLowerCase();
    return mmToTypeMap.get(addr) || null;
}
exports.getMMType = getMMType;
function initMMAddresses(lpInfo) {
    mmInfoInitialized = true;
    if (!lpInfo.wlpInfo) {
        return;
    }
    for (const euler of lpInfo.wlpInfo.euler) {
        mmToTypeMap.set(euler.asset.toLowerCase(), 'EULER');
    }
    for (const silo of lpInfo.wlpInfo.silo) {
        mmToTypeMap.set(silo.asset.toLowerCase(), 'SILO');
    }
    if (lpInfo.wlpInfo.morphoAddress) {
        mmToTypeMap.set(lpInfo.wlpInfo.morphoAddress.toLowerCase(), 'MORPHO');
    }
    for (let elem in lpInfo.wlpInfo.remapMMHolder) {
        mmToTypeMap.set(elem.toLowerCase(), lpInfo.wlpInfo.remapMMHolder[elem].type);
    }
}
