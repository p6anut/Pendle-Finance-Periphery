import {CHAINS, PoolConfiguration} from './types';

export const CHAIN = CHAINS.BNB;

export const POOL_INFO: PoolConfiguration = {
    SY: '0x30ccf4bbee313fcd19f3e295b3ba2920a24e2f62',
    // YT: '0x365e24398c0c0f03ab1c5423d3e665ede408198d',
    YT: '0x697e53575cb42271d400446552dd5cd986410237',
    LPs: [
        // {
        //     address: '0x9edac81bac78a2c06b59514d6eb62dd7a57adf21',
        //     deployedBlock: 55823452,
        //
        // },
        {
            address: '0xdb46d65ac78c11e794517bb6924833a420814bfc',
            deployedBlock: 60909097,
        }
    ]
};
