import { AccountSnapshot } from "../schema/schema.ts"
import {
  PendleYieldTokenContext,
  RedeemInterestEvent,
  TransferEvent,
} from "../types/eth/pendleyieldtoken.js";
import { updatePoints } from "../points/point-manager.js";
import { MISC_CONSTS } from "../consts.js";
import { getUnixTimestamp, isPendleAddress } from "../helper.js";
import { readAllUserERC20Balances, readAllYTPositions } from "../multicall.js";
import { EVENT_USER_SHARE, POINT_SOURCE_YT } from "../types.js";

/**
 * @dev 1 YT USDE is entitled to yields and points
 */

export async function handleYTTransfer(
  evt: TransferEvent,
  ctx: PendleYieldTokenContext
) {
  await processAllYTAccounts(
    ctx,
    [evt.args.from.toLowerCase(), evt.args.to.toLowerCase()],
    false
  );
}

export async function handleYTRedeemInterest(
  evt: RedeemInterestEvent,
  ctx: PendleYieldTokenContext
) {
  await processAllYTAccounts(ctx, [evt.args.user.toLowerCase()], false);
}

export async function processAllYTAccounts(
  ctx: PendleYieldTokenContext,
  addressesToAdd: string[] = [],
  shouldIncludeDb: boolean = true
) {

  if ((await ctx.contract.isExpired())) {
    return;
  }

  const allAddresses = shouldIncludeDb
    ? (await ctx.store.list(AccountSnapshot)).map((x) => x.id.toString())
    : [];
  for (let address of addressesToAdd) {
    address = address.toLowerCase();
    if (!allAddresses.includes(address) && !isPendleAddress(address)) {
      allAddresses.push(address);
    }
  }

  const timestamp = getUnixTimestamp(ctx.timestamp);
  const allYTBalances = await readAllUserERC20Balances(
    ctx,
    allAddresses,
    ctx.contract.address
  );
  const allYTPositions = await readAllYTPositions(ctx, allAddresses);

  for (let i = 0; i < allAddresses.length; i++) {
    const address = allAddresses[i];
    const balance = allYTBalances[i];
    const interestData = allYTPositions[i];

    const snapshot = await await ctx.store.get(AccountSnapshot, address);
    const ts : bigint = BigInt(timestamp).valueOf();
    if (snapshot && snapshot.lastUpdatedAt < ts) {
      updatePoints(
        ctx,
        POINT_SOURCE_YT,
        address.toString(),
        BigInt(snapshot.lastImpliedHolding),
        BigInt(ts.valueOf() - snapshot.lastUpdatedAt.valueOf()),
        timestamp
      );
    }

    if (interestData.lastPYIndex == 0n) continue;

    const impliedHolding =
      (balance * MISC_CONSTS.ONE_E18) / interestData.lastPYIndex +
      interestData.accruedInterest;

    const newSnapshot = new AccountSnapshot({
      id: address,
      lastUpdatedAt: BigInt(timestamp),
      lastImpliedHolding: impliedHolding.toString(),
      lastBalance: snapshot ? snapshot.lastBalance.toString() : ""
    });

    if (BigInt(snapshot ? snapshot.lastImpliedHolding : 0) != impliedHolding) {
      ctx.eventLogger.emit(EVENT_USER_SHARE, {
        label: POINT_SOURCE_YT,
        account: address,
        share: impliedHolding,
      });
    }

    await ctx.store.upsert(newSnapshot);
  }
}
