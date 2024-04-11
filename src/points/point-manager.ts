import { LogLevel } from "@sentio/sdk";
import { EthContext } from "@sentio/sdk/eth";
import { MISC_CONSTS, PENDLE_POOL_ADDRESSES } from "../consts.js";
import { EVENT_POINT_INCREASE, POINT_SOURCE, POINT_SOURCE_YT } from "../types.js";

/**
 *
 * @param amountUsdeHolding amount of USDe user holds during the period
 * @param holdingPeriod amount of time user holds the USDe
 * @returns Zircuit point
 *
 * @dev to be reviewed by Zircuit team
 */
function calcPointsFromHolding(
  amountUsdeHolding: bigint,
  holdingPeriod: bigint
): bigint {
  // 20 sats per day
  return amountUsdeHolding * 20n * holdingPeriod / (24n * 3600n);
}

export function updatePoints(
  ctx: EthContext,
  label: POINT_SOURCE,
  account: string,
  amountUsdeHolding: bigint,
  holdingPeriod: bigint,
  updatedAt: number
) {
  const sats = calcPointsFromHolding(
    amountUsdeHolding,
    holdingPeriod
  );

  if (label == POINT_SOURCE_YT) {
    const satsTreasuryFee = calcTreasuryFee(sats);
    increasePoint(
      ctx,
      label,
      account,
      amountUsdeHolding,
      holdingPeriod,
      sats - satsTreasuryFee,
      updatedAt
    );
    increasePoint(
      ctx,
      label,
      PENDLE_POOL_ADDRESSES.TREASURY,
      0n,
      holdingPeriod,
      satsTreasuryFee,
      updatedAt
    );
  } else {
    increasePoint(
      ctx,
      label,
      account,
      amountUsdeHolding,
      holdingPeriod,
      sats,
      updatedAt
    );
  }
}

function increasePoint(
  ctx: EthContext,
  label: POINT_SOURCE,
  account: string,
  amountUsdeHolding: bigint,
  holdingPeriod: bigint,
  sats: bigint,
  updatedAt: number
) {
  ctx.eventLogger.emit(EVENT_POINT_INCREASE, {
    label,
    account: account.toLowerCase(),
    amountUsdeHolding: amountUsdeHolding.scaleDown(18),
    holdingPeriod,
    sats: sats.scaleDown(18),
    updatedAt,
    severity: LogLevel.INFO,
  });
}

function calcTreasuryFee(amount: bigint): bigint {
  return (amount * 3n) / 100n;
}
