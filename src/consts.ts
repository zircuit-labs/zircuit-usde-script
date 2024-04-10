import { EthChainId } from '@sentio/sdk/eth'


export const CONFIG = {
    BLOCKCHAIN: EthChainId.ETHEREUM,
}

export const MISC_CONSTS = {
    ONE_E18: BigInt("1000000000000000000"),
    ONE_DAY_IN_MINUTE: 60 * 24,
    ZERO_ADDRESS: "0x0000000000000000000000000000000000000000",
    MULTICALL_BATCH: 256,
}


export const PENDLE_POOL_ADDRESSES = {
    SY: "0x293c6937d8d82e05b01335f7b33fba0c8e256e30",
    YT: "0x40357b9f22b4dff0bf56a90661b8ec106c259d29",
    LP: "0x90c98ab215498b72abfec04c651e2e496ba364c0",
    START_BLOCK: 19588116,
    TREASURY: "0x8270400d528c34e1596ef367eedec99080a1b592",
    // PENPIE_RECEIPT_TOKEN: "0x73f8f505245870fd9070c204fe74835dd9c6ac28",
    // STAKEDAO_RECEIPT_TOKEN: "0xdd9df6a77b4a4a07875f55ce5cb6b933e52cb30a",
    MULTICALL: "0xca11bde05977b3631167028862be2a173976ca11",
    LIQUID_LOCKERS: [
        /* {
            // Penpie
            address: "0x6e799758cee75dae3d84e09d40dc416ecf713652",
            receiptToken: "0x73f8f505245870fd9070c204fe74835dd9c6ac28",
        },
        {
            // EQB
            address: '0x64627901dadb46ed7f275fd4fc87d086cff1e6e3',
            receiptToken: "0x787fcbac35c8dbe2ed4c5ef92b0e82b4c63c2371",
        }, */
        // {   // STAKEDAO
        //     address: '0xd8fa8dc5adec503acc5e026a98f32ca5c1fa289a',
        //     receiptToken: '0xdd9df6a77b4a4a07875f55ce5cb6b933e52cb30a',
        // }
    ]
}