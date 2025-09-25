## Orion

Tokenized metals on Aptos: oGOLD and oSILVER with on‑chain AMM, oracle pricing, and proof‑of‑reserve.

### Deployed (Aptos Testnet)
- Publisher/Module address: `0x2aa2969a01ebf3231144c1100d15a0642533c3ec55e889d0e7c168deb071643d`
- Modules:
  - `orion::orion`
  - `orion::usdc_admin`

### Features
- Tokenized metals: `oGOLD`, `oSILVER` (6 decimals). 1 token ≈ 1 gram of the metal (unitized for UX).
- Oracle pricing: Pyth‑ready oracle config with feed IDs; admin fallback setters for testing.
- Proof‑of‑Reserve (on‑chain): mints are constrained by total pool USDC value at oracle prices.
- AMM pools (xy=k): continuous liquidity for USDC ↔ oGOLD/oSILVER with fee basis points.
- Fees to LPs: swap fees stay in pool reserves, increasing LP share value over time.
- Clean UI (Next.js) + wallet adapter; minimal APIs for balance view and Pyth rates proxy.

### AMM & Fees (concise)
- Constant product AMM: `x * y = k` where `x` and `y` are pool reserves.
- Swaps apply `fee_bps`; net input moves price along the curve; gross input is deposited to reserves.
- Result: fees are retained in the pool and accrue to LPs pro‑rata via `total_lp_shares`.

### App Pages
- `/` overview and live ticker
- `/trade` swap USDC ↔ oGOLD/oSILVER
- `/lp` provide liquidity
- `/admin` mint tokens; back pools with USDC (mock)
- `/set-prices` set oracle prices (admin)

### Contract Highlights
- Admin config: fee bps, min USDC reserve floor, mint/burn caps per token.
- Oracle config: Pyth feed IDs, price storage (6 decimals), last update timestamp.
- Pools: token and USDC reserves, `total_lp_shares`, per‑address LP share table.
- Events: `MintEvent`, `BurnEvent`, `SwapEvent`, `LiquidityAddedEvent`, `LiquidityRemovedEvent`, `ProofOfReserveEvent`.

### Key Entry Functions (selection)
- Swaps: `buy_token_xgold`, `buy_token_xsilver`, `sell_token_xgold`, `sell_token_xsilver`.
- Liquidity: `add_liquidity_xgold`, `add_liquidity_xsilver`, `remove_liquidity_xgold`, `remove_liquidity_xsilver`.
- Mint/Burn: `mint_xgold`, `mint_xsilver`, `burn_xgold_user`, `burn_xsilver_user`.
- Oracle/Admin: `admin_set_oracle_prices`, `update_price_xau_from_pyth`, `update_price_xag_from_pyth`, `set_fee_bps`, `set_min_usdc_reserve`.
- Registration helpers: `register_usdc`, `register_xgold`, `register_xsilver`.

### Future
- Direct Pyth on‑chain updates (automated)
- Real USDC integration and redemptions
- More metals and institutional custody integrations
- Governance and audits
