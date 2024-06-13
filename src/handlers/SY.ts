import { AccountSnapshot } from "../schema/schema.ts"
import { TransferEvent } from "../types/eth/pendlemarket.js";
import { ERC20Context } from "@sentio/sdk/eth/builtin/erc20";
import { getUnixTimestamp, isPendleAddress } from "../helper.js";
import { updatePoints } from "../points/point-manager.js";
import { EVENT_USER_SHARE, POINT_SOURCE_SY } from "../types.js";

/**
 * @dev 1 SY USDE = 1 USDE
 */

export async function handleSYTransfer(evt: TransferEvent, ctx: ERC20Context) {
  await processAccount(evt.args.from, ctx);
  await processAccount(evt.args.to, ctx);
}

export async function processAllAccounts(ctx: ERC20Context) {
  const accountSnapshots = await ctx.store.list(AccountSnapshot);
  await Promise.all(
    accountSnapshots.map((snapshot) => processAccount(snapshot._id, ctx))
  );
}

async function processAccount(account: string, ctx: ERC20Context) {
  if (isPendleAddress(account)) return;
  const timestamp = getUnixTimestamp(ctx.timestamp);
  const ts : BigInt = BigInt(timestamp);

  const snapshot = await ctx.store.get(AccountSnapshot, account);
  if (snapshot && snapshot.lastUpdatedAt < ts) {
    updatePoints(
      ctx,
      POINT_SOURCE_SY,
      account,
      BigInt(snapshot.lastBalance),
      BigInt(BigInt(timestamp) - snapshot.lastUpdatedAt.valueOf()),
      timestamp
    );
  }

  const newBalance = await ctx.contract.balanceOf(account);

  const newSnapshot = new AccountSnapshot({
    _id: account,
    lastUpdatedAt: BigInt(timestamp),
    lastBalance: newBalance.toString(),
  });

  if (BigInt(snapshot ? snapshot.lastBalance : 0) != newBalance) {
    ctx.eventLogger.emit(EVENT_USER_SHARE, {
      label: POINT_SOURCE_SY,
      account,
      share: newBalance,
    })
  }

  await ctx.store.upsert(newSnapshot);
}
