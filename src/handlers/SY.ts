import { AsyncNedb } from "nedb-async";
import { TransferEvent } from "../types/eth/pendlemarket.js";
import { ERC20Context } from "@sentio/sdk/eth/builtin/erc20";
import { getUnixTimestamp, isPendleAddress } from "../helper.js";
import { updatePoints } from "../points/point-manager.js";

/**
 * @dev 1 SY EZETH = 1 EZETH
 */

const db = new AsyncNedb({
  filename: "/data/pendle-accounts-sy.db",
  autoload: true,
});

type AccountSnapshot = {
  _id: string;
  lastUpdatedAt: number;
  lastBalance: string;
};

export async function handleSYTransfer(evt: TransferEvent, ctx: ERC20Context) {
  await processAccount(evt.args.from, ctx);
  await processAccount(evt.args.to, ctx);
}

export async function processAllAccounts(ctx: ERC20Context) {
  const accountSnapshots = await db.asyncFind<AccountSnapshot>({});
  for (const snapshot of accountSnapshots) {
    await processAccount(snapshot._id, ctx);
  }
}

async function processAccount(account: string, ctx: ERC20Context) {
  if (isPendleAddress(account)) return;
  const timestamp = getUnixTimestamp(ctx.timestamp);

  const snapshot = await db.asyncFindOne<AccountSnapshot>({ _id: account });
  if (snapshot && snapshot.lastUpdatedAt < timestamp) {
    updatePoints(
      ctx,
      "SY",
      account,
      BigInt(snapshot.lastBalance),
      BigInt(timestamp - snapshot.lastUpdatedAt),
      timestamp
    );
  }

  const newSnapshot = {
    _id: account,
    lastUpdatedAt: timestamp,
    lastBalance: (await ctx.contract.balanceOf(account)).toString(),
  };
  await db.asyncUpdate({ _id: account }, newSnapshot, { upsert: true });
}
