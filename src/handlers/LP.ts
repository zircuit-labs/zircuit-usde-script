import { AccountSnapshot } from "../schema/schema.ts"
import {
  PendleMarketContext,
  RedeemRewardsEvent,
  SwapEvent,
  TransferEvent,
  getPendleMarketContractOnContext,
} from "../types/eth/pendlemarket.js";
import { updatePoints } from "../points/point-manager.js";
import { getUnixTimestamp } from "../helper.js";
import { PENDLE_POOL_ADDRESSES } from "../consts.js";
import { EthContext } from "@sentio/sdk/eth";
import { readAllUserActiveBalances } from "../multicall.js";
import { EVENT_USER_SHARE, POINT_SOURCE_LP } from "../types.js";

/**
 * @dev 1 LP = (X PT + Y SY) where X and Y are defined by market conditions
 * So same as Balancer LPT, we need to update all positions on every swap

 */

export async function handleLPTransfer(
  evt: TransferEvent,
  ctx: PendleMarketContext
) {
  await processAllLPAccounts(ctx, [
    evt.args.from.toLowerCase(),
    evt.args.to.toLowerCase(),
  ]);
}

export async function handleMarketRedeemReward(
  evt: RedeemRewardsEvent,
  ctx: PendleMarketContext
) {
  await processAllLPAccounts(ctx);
}

export async function handleMarketSwap(_: SwapEvent, ctx: PendleMarketContext) {
  await processAllLPAccounts(ctx);
}

export async function processAllLPAccounts(
  ctx: EthContext,
  addressesToAdd: string[] = []
) {
  // might not need to do this on interval since we are doing it on every swap
  const allAddresses = (await ctx.store.list(AccountSnapshot))
    .map((snapshot) => snapshot.id)

  for (let address of addressesToAdd) {
    address = address.toLowerCase()
    if (!allAddresses.includes(address)) {
      allAddresses.push(address)
    }
  }
  const marketContract = getPendleMarketContractOnContext(
    ctx,
    PENDLE_POOL_ADDRESSES.LP
  );

  const [allUserShares, totalShare, state] = await Promise.all([
    readAllUserActiveBalances(ctx, allAddresses.map(id => id.toString())),
    marketContract.totalActiveSupply(),
    marketContract.readState(marketContract.address),
  ]);

  const timestamp = getUnixTimestamp(ctx.timestamp);
  for (let i = 0; i < allAddresses.length; i++) {
    const account = allAddresses[i];
    const impliedSy = (allUserShares[i] * state.totalSy) / totalShare;
    await updateAccount(ctx, account.toString(), impliedSy, timestamp);
  }
}

async function updateAccount(
  ctx: EthContext,
  account: string,
  impliedSy: bigint,
  timestamp: number
) {
  const snapshot = await ctx.store.get(AccountSnapshot, account);
  const ts : bigint = BigInt(timestamp).valueOf();
  
  if (snapshot && snapshot.lastUpdatedAt < timestamp) {
    updatePoints(
      ctx,
      POINT_SOURCE_LP,
      account,
      BigInt(snapshot.lastImpliedHolding),
      BigInt(ts - snapshot.lastUpdatedAt.valueOf()),
      timestamp
    );
  }
  
  const newSnapshot = new AccountSnapshot({
    id: account,
    lastUpdatedAt: ts,
    lastImpliedHolding: impliedSy.toString(),
    lastBalance: snapshot ? snapshot.lastBalance.toString() : ""
  });

  if (BigInt(snapshot ? snapshot.lastImpliedHolding : 0) != impliedSy) {
    ctx.eventLogger.emit(EVENT_USER_SHARE, {
      label: POINT_SOURCE_LP,
      account: account,
      share: impliedSy,
    });
  }

  await ctx.store.upsert(newSnapshot);
}