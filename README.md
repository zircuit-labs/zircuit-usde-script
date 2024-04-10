# Pendle USDe Balance Tracking 

Pendle system wraps `USDe` into an ERC5115 token `SY`.

`SY` can then be used in Pendle's system to:
- Tokenize into `PT` and `YT`, where `YT` holders are entitled to all interests and rewards.
- Supply into Pendle's AMM to receive `LP` token.

Pendle charges $3\%$ of all yields/rewards with assets on the platform. This is equivalent to receiving $3\%$ yield shares from all `YT` holders.

## Todo

To modify the `calcPointsFromHolding` function in `./src/points/point-manager.ts` which returns the amount of points earned by users for holding `amountUsdeHolding` USDe in `holdingPeriod` seconds.