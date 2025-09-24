module orion::orion {
    use std::signer;
    use std::vector;
    use std::event;
    use std::string;
    use aptos_framework::coin;
    use aptos_framework::timestamp;
    
    use aptos_std::table;
    

    /// Alias for testnet USDC: 0x1::test_coin::TestCoin
    struct USDC has drop {}

    /// oGOLD and oSILVER fungible tokens (6 decimals)
    struct OGOLD has store, drop {}
    struct OSILVER has store, drop {}

    /// Admin and configuration caps
    struct Admin has key {
        admin: address,
        fee_bps: u64,
        min_usdc_reserve: u64,
        ogold_mint: coin::MintCapability<OGOLD>,
        ogold_burn: coin::BurnCapability<OGOLD>,
        osilver_mint: coin::MintCapability<OSILVER>,
        osilver_burn: coin::BurnCapability<OSILVER>,
    }

    /// Pyth-like oracle configuration. Prices are stored with 6 decimals.
    struct OracleConfig has key {
        xau_feed_id: vector<u8>,
        xag_feed_id: vector<u8>,
        xau_usd_6: u64,
        xag_usd_6: u64,
        last_update_ts: u64,
    }

    /// xy=k AMM pool with LP share ledger
    struct PoolGold has key { token_reserve: coin::Coin<OGOLD>, usdc_reserve: coin::Coin<USDC>, total_lp_shares: u128, shares: table::Table<address, u128> }
    struct PoolSilver has key { token_reserve: coin::Coin<OSILVER>, usdc_reserve: coin::Coin<USDC>, total_lp_shares: u128, shares: table::Table<address, u128> }

    /// Proof-of-reserve: total minted per token; backing is sum of USDC reserves
    struct ProofOfReserve has key {
        total_minted_ogold: u128,
        total_minted_osilver: u128,
    }

    // Events
    #[event]
    struct MintEvent has copy, drop, store { token: vector<u8>, to: address, amount: u64 }
    #[event]
    struct BurnEvent has copy, drop, store { token: vector<u8>, from: address, amount: u64 }
    #[event]
    struct SwapEvent has copy, drop, store {
        token: vector<u8>, user: address, input_is_usdc: bool, input_amount: u64, output_amount: u64, fee_paid: u64
    }
    #[event]
    struct LiquidityAddedEvent has copy, drop, store {
        token: vector<u8>, provider: address, token_amount: u64, usdc_amount: u64, lp_shares_minted: u128
    }
    #[event]
    struct LiquidityRemovedEvent has copy, drop, store {
        token: vector<u8>, provider: address, token_amount: u64, usdc_amount: u64, lp_shares_burned: u128
    }
    #[event]
    struct ProofOfReserveEvent has copy, drop, store { token: vector<u8>, total_minted: u128, usdc_backing: u64, timestamp: u64 }

    // Errors
    const E_NOT_ADMIN: u64 = 1;
    const E_ALREADY_INIT: u64 = 2;
    const E_INVALID_AMOUNT: u64 = 3;
    const E_NO_LP: u64 = 4;
    const E_INSUFFICIENT_LIQUIDITY: u64 = 5;
    const E_POOL_DRY: u64 = 6;
    const E_MIN_RESERVE: u64 = 7;
    const E_ZERO_PRICE: u64 = 8;

    /// Initialize everything. Call once by the deploying address set as `@orion`.
    public entry fun init(admin: &signer, fee_bps: u64, min_usdc_reserve: u64, xau_feed_hex: vector<u8>, xag_feed_hex: vector<u8>) {
        let addr = signer::address_of(admin);
        assert!(!exists<Admin>(addr), E_ALREADY_INIT);

        // Note: Do not register USDC here; USDC is a local alias for demo.

        let (ogold_burn, ogold_freeze, ogold_mint) = coin::initialize<OGOLD>(admin, string::utf8(b"oGOLD"), string::utf8(b"Orion Gold"), 6, false);
        let (osilver_burn, osilver_freeze, osilver_mint) = coin::initialize<OSILVER>(admin, string::utf8(b"oSILVER"), string::utf8(b"Orion Silver"), 6, false);

        move_to(admin, PoolGold { token_reserve: coin::zero<OGOLD>(), usdc_reserve: coin::zero<USDC>(), total_lp_shares: 0, shares: table::new<address, u128>() });
        move_to(admin, PoolSilver { token_reserve: coin::zero<OSILVER>(), usdc_reserve: coin::zero<USDC>(), total_lp_shares: 0, shares: table::new<address, u128>() });

        move_to(admin, OracleConfig { xau_feed_id: xau_feed_hex, xag_feed_id: xag_feed_hex, xau_usd_6: 0, xag_usd_6: 0, last_update_ts: timestamp::now_seconds() });
        move_to(admin, ProofOfReserve { total_minted_ogold: 0, total_minted_osilver: 0 });

        move_to(admin, Admin {
            admin: addr,
            fee_bps,
            min_usdc_reserve,
            ogold_mint,
            ogold_burn,
            osilver_mint,
            osilver_burn,
        });
        coin::destroy_freeze_cap<OGOLD>(ogold_freeze);
        coin::destroy_freeze_cap<OSILVER>(osilver_freeze);
    }

    fun assert_admin(s: &signer) acquires Admin { let a = borrow_global<Admin>(signer::address_of(s)); assert!(a.admin == signer::address_of(s), E_NOT_ADMIN) }
    fun fee_bps_internal(): u64 acquires Admin { borrow_global<Admin>(@orion).fee_bps }
    fun min_usdc_reserve_internal(): u64 acquires Admin { borrow_global<Admin>(@orion).min_usdc_reserve }

    fun mul_div(a: u64, b: u64, c: u64): u64 { ((a as u128) * (b as u128) / (c as u128)) as u64 }
    fun apply_fee(x: u64, fee_bps: u64): (u64, u64) { if (fee_bps == 0) (x, 0) else { let f = mul_div(x, fee_bps, 10_000); (x - f, f) } }
    fun amount_out(dx_after_fee: u64, x_reserve: u64, y_reserve: u64): u64 { let new_x = (x_reserve as u128) + (dx_after_fee as u128); let k = (x_reserve as u128) * (y_reserve as u128); let k_div = (k / new_x) as u64; if (y_reserve <= k_div) 0 else y_reserve - k_div }

    // Admin controls
    public entry fun set_fee_bps(admin: &signer, bps: u64) acquires Admin { assert_admin(admin); borrow_global_mut<Admin>(@orion).fee_bps = bps }
    public entry fun set_min_usdc_reserve(admin: &signer, v: u64) acquires Admin { assert_admin(admin); borrow_global_mut<Admin>(@orion).min_usdc_reserve = v }
    public entry fun admin_set_oracle_prices(admin: &signer, xau_usd_6: u64, xag_usd_6: u64) acquires Admin, OracleConfig { assert_admin(admin); let oc = borrow_global_mut<OracleConfig>(@orion); oc.xau_usd_6 = xau_usd_6; oc.xag_usd_6 = xag_usd_6; oc.last_update_ts = timestamp::now_seconds() }

    /// Pyth-like single-feed updates with basic feed-id verification.
    /// In a real integration, pass Pyth update VAAs and verify on-chain.
    public entry fun update_price_xau_from_pyth(admin: &signer, feed_id: vector<u8>, xau_usd_6: u64) acquires Admin, OracleConfig {
        assert_admin(admin);
        let oc = borrow_global_mut<OracleConfig>(@orion);
        assert!(feed_id == oc.xau_feed_id, E_INVALID_AMOUNT);
        oc.xau_usd_6 = xau_usd_6;
        oc.last_update_ts = timestamp::now_seconds();
    }

    public entry fun update_price_xag_from_pyth(admin: &signer, feed_id: vector<u8>, xag_usd_6: u64) acquires Admin, OracleConfig {
        assert_admin(admin);
        let oc = borrow_global_mut<OracleConfig>(@orion);
        assert!(feed_id == oc.xag_feed_id, E_INVALID_AMOUNT);
        oc.xag_usd_6 = xag_usd_6;
        oc.last_update_ts = timestamp::now_seconds();
    }

    

    // LP add/remove
    public entry fun add_liquidity_xgold(lp: &signer, token_amount: u64, usdc_amount: u64) acquires PoolGold {
        let provider = signer::address_of(lp);
        let pool = borrow_global_mut<PoolGold>(@orion);
        let ta = token_amount; let ua = usdc_amount;
        assert!(ta > 0 && ua > 0, E_INVALID_AMOUNT);
        let mint_shares: u128;
        if (pool.total_lp_shares == 0) { mint_shares = ta as u128 } else {
            let share_a = (pool.total_lp_shares * (ta as u128)) / (coin::value(&pool.token_reserve) as u128);
            let share_b = (pool.total_lp_shares * (ua as u128)) / (coin::value(&pool.usdc_reserve) as u128);
            mint_shares = if (share_a < share_b) share_a else share_b; assert!(mint_shares > 0, E_INVALID_AMOUNT)
        };
        let token_in = coin::withdraw<OGOLD>(lp, ta);
        let usdc_in = coin::withdraw<USDC>(lp, ua);
        coin::merge(&mut pool.token_reserve, token_in); coin::merge(&mut pool.usdc_reserve, usdc_in);
        if (table::contains(&pool.shares, provider)) { let v_ref = table::borrow_mut(&mut pool.shares, provider); *v_ref = *v_ref + mint_shares } else { table::add(&mut pool.shares, provider, mint_shares) };
        pool.total_lp_shares = pool.total_lp_shares + mint_shares;
        event::emit(LiquidityAddedEvent { token: b"oGOLD", provider, token_amount: ta, usdc_amount: ua, lp_shares_minted: mint_shares })
    }
    public entry fun add_liquidity_xsilver(lp: &signer, token_amount: u64, usdc_amount: u64) acquires PoolSilver {
        let provider = signer::address_of(lp);
        let pool = borrow_global_mut<PoolSilver>(@orion);
        let ta = token_amount; let ua = usdc_amount;
        assert!(ta > 0 && ua > 0, E_INVALID_AMOUNT);
        let mint_shares: u128;
        if (pool.total_lp_shares == 0) { mint_shares = ta as u128 } else {
            let share_a = (pool.total_lp_shares * (ta as u128)) / (coin::value(&pool.token_reserve) as u128);
            let share_b = (pool.total_lp_shares * (ua as u128)) / (coin::value(&pool.usdc_reserve) as u128);
            mint_shares = if (share_a < share_b) share_a else share_b; assert!(mint_shares > 0, E_INVALID_AMOUNT)
        };
        let token_in = coin::withdraw<OSILVER>(lp, ta);
        let usdc_in = coin::withdraw<USDC>(lp, ua);
        coin::merge(&mut pool.token_reserve, token_in); coin::merge(&mut pool.usdc_reserve, usdc_in);
        if (table::contains(&pool.shares, provider)) { let v_ref = table::borrow_mut(&mut pool.shares, provider); *v_ref = *v_ref + mint_shares } else { table::add(&mut pool.shares, provider, mint_shares) };
        pool.total_lp_shares = pool.total_lp_shares + mint_shares;
        event::emit(LiquidityAddedEvent { token: b"oSILVER", provider, token_amount: ta, usdc_amount: ua, lp_shares_minted: mint_shares })
    }

    public entry fun remove_liquidity_xgold(lp: &signer, shares: u128) acquires PoolGold {
        let provider = signer::address_of(lp);
        let pool = borrow_global_mut<PoolGold>(@orion);
        assert!(shares > 0 && shares <= pool.total_lp_shares, E_INVALID_AMOUNT);
        assert!(table::contains(&pool.shares, provider), E_INVALID_AMOUNT);
        let user_sh_ref = table::borrow_mut(&mut pool.shares, provider);
        let user_sh = *user_sh_ref; assert!(user_sh >= shares, E_INVALID_AMOUNT);
        let tr = coin::value(&pool.token_reserve) as u128; let ur = coin::value(&pool.usdc_reserve) as u128;
        let token_out = (tr * shares) / pool.total_lp_shares; let usdc_out = (ur * shares) / pool.total_lp_shares;
        *user_sh_ref = user_sh - shares; pool.total_lp_shares = pool.total_lp_shares - shares;
        let token_withdraw = coin::extract(&mut pool.token_reserve, token_out as u64); let usdc_withdraw = coin::extract(&mut pool.usdc_reserve, usdc_out as u64);
        coin::deposit<OGOLD>(provider, token_withdraw); coin::deposit<USDC>(provider, usdc_withdraw);
        event::emit(LiquidityRemovedEvent { token: b"oGOLD", provider, token_amount: token_out as u64, usdc_amount: usdc_out as u64, lp_shares_burned: shares })
    }

    public entry fun remove_liquidity_xsilver(lp: &signer, shares: u128) acquires PoolSilver {
        let provider = signer::address_of(lp);
        let pool = borrow_global_mut<PoolSilver>(@orion);
        assert!(shares > 0 && shares <= pool.total_lp_shares, E_INVALID_AMOUNT);
        assert!(table::contains(&pool.shares, provider), E_INVALID_AMOUNT);
        let user_sh_ref = table::borrow_mut(&mut pool.shares, provider);
        let user_sh = *user_sh_ref; assert!(user_sh >= shares, E_INVALID_AMOUNT);
        let tr = coin::value(&pool.token_reserve) as u128; let ur = coin::value(&pool.usdc_reserve) as u128;
        let token_out = (tr * shares) / pool.total_lp_shares; let usdc_out = (ur * shares) / pool.total_lp_shares;
        *user_sh_ref = user_sh - shares; pool.total_lp_shares = pool.total_lp_shares - shares;
        let token_withdraw = coin::extract(&mut pool.token_reserve, token_out as u64); let usdc_withdraw = coin::extract(&mut pool.usdc_reserve, usdc_out as u64);
        coin::deposit<OSILVER>(provider, token_withdraw); coin::deposit<USDC>(provider, usdc_withdraw);
        event::emit(LiquidityRemovedEvent { token: b"oSILVER", provider, token_amount: token_out as u64, usdc_amount: usdc_out as u64, lp_shares_burned: shares })
    }

    // PoR-guarded mint/burn
    public entry fun mint_xgold(admin: &signer, to: address, amount: u64) acquires Admin, ProofOfReserve, OracleConfig, PoolGold, PoolSilver { assert_admin(admin); assert_por_mint_gold(amount); let a = borrow_global_mut<Admin>(@orion); let c = coin::mint<OGOLD>(amount, &a.ogold_mint); coin::deposit<OGOLD>(to, c); let por = borrow_global_mut<ProofOfReserve>(@orion); por.total_minted_ogold = por.total_minted_ogold + (amount as u128); event::emit(MintEvent { token: b"oGOLD", to, amount }); emit_por_event(b"oGOLD") }
    public entry fun mint_xsilver(admin: &signer, to: address, amount: u64) acquires Admin, ProofOfReserve, OracleConfig, PoolGold, PoolSilver { assert_admin(admin); assert_por_mint_silver(amount); let a = borrow_global_mut<Admin>(@orion); let c = coin::mint<OSILVER>(amount, &a.osilver_mint); coin::deposit<OSILVER>(to, c); let por = borrow_global_mut<ProofOfReserve>(@orion); por.total_minted_osilver = por.total_minted_osilver + (amount as u128); event::emit(MintEvent { token: b"oSILVER", to, amount }); emit_por_event(b"oSILVER") }

    public entry fun burn_xgold_user(user: &signer, amount: u64) acquires Admin, ProofOfReserve, PoolGold, PoolSilver { let a = borrow_global_mut<Admin>(@orion); let c = coin::withdraw<OGOLD>(user, amount); coin::burn<OGOLD>(c, &a.ogold_burn); let por = borrow_global_mut<ProofOfReserve>(@orion); por.total_minted_ogold = por.total_minted_ogold - (amount as u128); let from = signer::address_of(user); event::emit(BurnEvent { token: b"oGOLD", from, amount }); emit_por_event(b"oGOLD") }
    public entry fun burn_xsilver_user(user: &signer, amount: u64) acquires Admin, ProofOfReserve, PoolGold, PoolSilver { let a = borrow_global_mut<Admin>(@orion); let c = coin::withdraw<OSILVER>(user, amount); coin::burn<OSILVER>(c, &a.osilver_burn); let por = borrow_global_mut<ProofOfReserve>(@orion); por.total_minted_osilver = por.total_minted_osilver - (amount as u128); let from = signer::address_of(user); event::emit(BurnEvent { token: b"oSILVER", from, amount }); emit_por_event(b"oSILVER") }

    fun assert_por_mint_gold(amount: u64) acquires OracleConfig, PoolGold, PoolSilver, ProofOfReserve {
        let oc = borrow_global<OracleConfig>(@orion);
        let price = oc.xau_usd_6; assert!(price > 0, E_ZERO_PRICE);
        let backing = total_usdc_reserves();
        let por = borrow_global<ProofOfReserve>(@orion);
        let minted_val = mul_div((por.total_minted_ogold as u64), price, 1_000_000);
        let add_val = mul_div(amount, price, 1_000_000);
        let after = minted_val + add_val;
        assert!(after <= backing, E_INSUFFICIENT_LIQUIDITY)
    }

    fun assert_por_mint_silver(amount: u64) acquires OracleConfig, PoolGold, PoolSilver, ProofOfReserve {
        let oc = borrow_global<OracleConfig>(@orion);
        let price = oc.xag_usd_6; assert!(price > 0, E_ZERO_PRICE);
        let backing = total_usdc_reserves();
        let por = borrow_global<ProofOfReserve>(@orion);
        let minted_val = mul_div((por.total_minted_osilver as u64), price, 1_000_000);
        let add_val = mul_div(amount, price, 1_000_000);
        let after = minted_val + add_val;
        assert!(after <= backing, E_INSUFFICIENT_LIQUIDITY)
    }

    fun total_usdc_reserves(): u64 acquires PoolGold, PoolSilver {
        coin::value(&borrow_global<PoolGold>(@orion).usdc_reserve) + coin::value(&borrow_global<PoolSilver>(@orion).usdc_reserve)
    }

    fun emit_por_event(name: vector<u8>) acquires PoolGold, PoolSilver, ProofOfReserve {
        let por = borrow_global<ProofOfReserve>(@orion);
        let minted = if (vector::length(&name) == 5) por.total_minted_ogold else por.total_minted_osilver;
        event::emit(ProofOfReserveEvent { token: name, total_minted: minted, usdc_backing: total_usdc_reserves(), timestamp: timestamp::now_seconds() })
    }

    // Swaps
    public entry fun buy_token_xgold(user: &signer, usdc_amount: u64) acquires Admin, PoolGold {
        let addr = signer::address_of(user); let pool = borrow_global_mut<PoolGold>(@orion);
        let dx = usdc_amount; assert!(dx > 0, E_INVALID_AMOUNT);
        let (dx_net, fee) = apply_fee(dx, fee_bps_internal());
        let x = coin::value(&pool.usdc_reserve); let y = coin::value(&pool.token_reserve);
        let out = amount_out(dx_net, x, y); assert!(out > 0 && y > out, E_POOL_DRY);
        let usdc_in = coin::withdraw<USDC>(user, dx);
        coin::merge(&mut pool.usdc_reserve, usdc_in);
        let token_out = coin::extract(&mut pool.token_reserve, out); coin::deposit<OGOLD>(addr, token_out);
        event::emit(SwapEvent { token: b"oGOLD", user: addr, input_is_usdc: true, input_amount: dx, output_amount: out, fee_paid: fee })
    }
    public entry fun buy_token_xsilver(user: &signer, usdc_amount: u64) acquires Admin, PoolSilver {
        let addr = signer::address_of(user); let pool = borrow_global_mut<PoolSilver>(@orion);
        let dx = usdc_amount; assert!(dx > 0, E_INVALID_AMOUNT);
        let (dx_net, fee) = apply_fee(dx, fee_bps_internal());
        let x = coin::value(&pool.usdc_reserve); let y = coin::value(&pool.token_reserve);
        let out = amount_out(dx_net, x, y); assert!(out > 0 && y > out, E_POOL_DRY);
        let usdc_in = coin::withdraw<USDC>(user, dx);
        coin::merge(&mut pool.usdc_reserve, usdc_in);
        let token_out = coin::extract(&mut pool.token_reserve, out); coin::deposit<OSILVER>(addr, token_out);
        event::emit(SwapEvent { token: b"oSILVER", user: addr, input_is_usdc: true, input_amount: dx, output_amount: out, fee_paid: fee })
    }

    public entry fun sell_token_xgold(user: &signer, token_amount: u64) acquires Admin, PoolGold {
        let addr = signer::address_of(user); let pool = borrow_global_mut<PoolGold>(@orion);
        let dx = token_amount; assert!(dx > 0, E_INVALID_AMOUNT);
        let (dx_net, fee) = apply_fee(dx, fee_bps_internal());
        let x = coin::value(&pool.token_reserve); let y = coin::value(&pool.usdc_reserve);
        let out = amount_out(dx_net, x, y); assert!(out > 0, E_POOL_DRY);
        let floor = min_usdc_reserve_internal(); let avail = if (y > floor) y - floor else 0; assert!(out <= avail, E_MIN_RESERVE);
        let token_in = coin::withdraw<OGOLD>(user, dx);
        coin::merge(&mut pool.token_reserve, token_in);
        let usdc_out = coin::extract(&mut pool.usdc_reserve, out); coin::deposit<USDC>(addr, usdc_out);
        event::emit(SwapEvent { token: b"oGOLD", user: addr, input_is_usdc: false, input_amount: dx, output_amount: out, fee_paid: fee })
    }

    public entry fun sell_token_xsilver(user: &signer, token_amount: u64) acquires Admin, PoolSilver {
        let addr = signer::address_of(user); let pool = borrow_global_mut<PoolSilver>(@orion);
        let dx = token_amount; assert!(dx > 0, E_INVALID_AMOUNT);
        let (dx_net, fee) = apply_fee(dx, fee_bps_internal());
        let x = coin::value(&pool.token_reserve); let y = coin::value(&pool.usdc_reserve);
        let out = amount_out(dx_net, x, y); assert!(out > 0, E_POOL_DRY);
        let floor = min_usdc_reserve_internal(); let avail = if (y > floor) y - floor else 0; assert!(out <= avail, E_MIN_RESERVE);
        let token_in = coin::withdraw<OSILVER>(user, dx);
        coin::merge(&mut pool.token_reserve, token_in);
        let usdc_out = coin::extract(&mut pool.usdc_reserve, out); coin::deposit<USDC>(addr, usdc_out);
        event::emit(SwapEvent { token: b"oSILVER", user: addr, input_is_usdc: false, input_amount: dx, output_amount: out, fee_paid: fee })
    }

    // Basic transfers
    public entry fun transfer_xgold(from: &signer, to: address, amount: u64) { coin::transfer<OGOLD>(from, to, amount) }
    public entry fun transfer_xsilver(from: &signer, to: address, amount: u64) { coin::transfer<OSILVER>(from, to, amount) }

    // Views
    public fun get_price_xgold(): u64 acquires OracleConfig { borrow_global<OracleConfig>(@orion).xau_usd_6 }
    public fun get_price_xsilver(): u64 acquires OracleConfig { borrow_global<OracleConfig>(@orion).xag_usd_6 }
    public fun get_pool_info_xgold(): (u64, u64, u64, u128) acquires Admin, PoolGold { let p = borrow_global<PoolGold>(@orion); (coin::value(&p.token_reserve), coin::value(&p.usdc_reserve), fee_bps_internal(), p.total_lp_shares) }
    public fun get_pool_info_xsilver(): (u64, u64, u64, u128) acquires Admin, PoolSilver { let p = borrow_global<PoolSilver>(@orion); (coin::value(&p.token_reserve), coin::value(&p.usdc_reserve), fee_bps_internal(), p.total_lp_shares) }
    public fun get_proof_of_reserve_xgold(): (u128, u64) acquires ProofOfReserve, PoolGold, PoolSilver { let por = borrow_global<ProofOfReserve>(@orion); (por.total_minted_ogold, total_usdc_reserves()) }
    public fun get_proof_of_reserve_xsilver(): (u128, u64) acquires ProofOfReserve, PoolGold, PoolSilver { let por = borrow_global<ProofOfReserve>(@orion); (por.total_minted_osilver, total_usdc_reserves()) }

    // Registration helpers
    public entry fun register_usdc(s: &signer) { coin::register<USDC>(s) }
    public entry fun register_xgold(s: &signer) { coin::register<OGOLD>(s) }
    public entry fun register_xsilver(s: &signer) { coin::register<OSILVER>(s) }

    // Admin: deposit USDC directly into pool reserves to provide backing before mint.
    public entry fun admin_back_usdc_gold(admin: &signer, usdc_amount: u64) acquires PoolGold {
        let pool = borrow_global_mut<PoolGold>(@orion);
        let usdc_in = coin::withdraw<USDC>(admin, usdc_amount);
        coin::merge(&mut pool.usdc_reserve, usdc_in);
    }

    public entry fun admin_back_usdc_silver(admin: &signer, usdc_amount: u64) acquires PoolSilver {
        let pool = borrow_global_mut<PoolSilver>(@orion);
        let usdc_in = coin::withdraw<USDC>(admin, usdc_amount);
        coin::merge(&mut pool.usdc_reserve, usdc_in);
    }
    
}


