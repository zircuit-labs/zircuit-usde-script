import { AsyncNedb } from "nedb-async";
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

const db = new AsyncNedb({
  filename: "/data/pendle-accounts-yt.db",
  autoload: true,
});

db.persistence.setAutocompactionInterval(60 * 1000);


type AccountSnapshot = {
  _id: string;
  lastUpdatedAt: number;
  lastImpliedHolding: string;
};

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
    ? (await db.asyncFind<AccountSnapshot>({})).map((x) => x._id)
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

    const snapshot = await db.asyncFindOne<AccountSnapshot>({ _id: address });
    if (snapshot && snapshot.lastUpdatedAt < timestamp) {
      updatePoints(
        ctx,
        POINT_SOURCE_YT,
        address,
        BigInt(snapshot.lastImpliedHolding),
        BigInt(timestamp - snapshot.lastUpdatedAt),
        timestamp
      );
    }

    if (interestData.lastPYIndex == 0n) continue;

    const impliedHolding =
      (balance * MISC_CONSTS.ONE_E18) / interestData.lastPYIndex +
      interestData.accruedInterest;

    const newSnapshot = {
      _id: address,
      lastUpdatedAt: timestamp,
      lastImpliedHolding: impliedHolding.toString(),
    };

    if (snapshot.share != impliedHolding) {
      ctx.eventLogger.emit(EVENT_USER_SHARE, {
        label: POINT_SOURCE_YT,
        account: address,
        share: impliedHolding,
      });
    }

    await db.asyncUpdate({ _id: address }, newSnapshot, { upsert: true });
  }
}
