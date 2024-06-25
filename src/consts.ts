import { EthChainId } from "@sentio/sdk/eth";

export const CONFIG = {
  BLOCKCHAIN: EthChainId.ETHEREUM,
};

export const MISC_CONSTS = {
  ONE_E18: BigInt("1000000000000000000"),
  ONE_DAY_IN_MINUTE: 60 * 24,
  ZERO_ADDRESS: "0x0000000000000000000000000000000000000000",
  MULTICALL_BATCH: 256,
};

export const PENDLE_POOL_ADDRESSES = {
  // retrieved from Pendle pool contract readTokens()
  SY: "0xD24Cfe2d0fa81369ca6291c28ac5426e16B6d57a",
  // retrieved from Pendle pool contract readTokens()
  YT: "0x0393e1aBF08f7B80e193e06ca65346FE86A0a189",
  // using new pool contract
  LP: "0xF148a0B15712f5BfeefAdb4E6eF9739239F88b07",
  // the block which the new contract is deployed
  START_BLOCK: 20158751,
  TREASURY: "0x8270400d528c34e1596ef367eedec99080a1b592",
  MULTICALL: "0xca11bde05977b3631167028862be2a173976ca11",
};
