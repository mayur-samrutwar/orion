module orion::usdc_admin {
    use std::string;
    use std::option::{Self, Option};
    use std::signer;
    use aptos_framework::coin;

    use orion::orion::{Self as Orion, USDC};

    /// Stores USDC mint/burn capabilities separately to avoid changing `orion::orion::Admin`.
    struct UsdcCaps has key {
        mint: Option<coin::MintCapability<USDC>>,
        burn: Option<coin::BurnCapability<USDC>>,
        owner: address,
    }

    fun assert_owner(s: &signer) acquires UsdcCaps {
        let caps = borrow_global<UsdcCaps>(signer::address_of(s));
        assert!(caps.owner == signer::address_of(s), 1)
    }

    /// Initialize the mock USDC coin (6 decimals) and store capabilities under publisher account.
    public entry fun init_usdc(publisher: &signer) {
        let (burn, freeze, mint) = coin::initialize<USDC>(
            publisher,
            string::utf8(b"Orion USDC (Mock)"),
            string::utf8(b"USDC"),
            6,
            false
        );
        coin::destroy_freeze_cap<USDC>(freeze);
        move_to(publisher, UsdcCaps { mint: option::some(mint), burn: option::some(burn), owner: signer::address_of(publisher) });
    }

    /// Register USDC for a user.
    public entry fun register_usdc(user: &signer) {
        coin::register<USDC>(user)
    }

    /// Admin mints USDC to any address (for LP/demo).
    public entry fun mint_usdc(admin: &signer, to: address, amount: u64) acquires UsdcCaps {
        assert_owner(admin);
        let caps = borrow_global_mut<UsdcCaps>(signer::address_of(admin));
        let mint_ref = option::borrow(&caps.mint);
        let c = coin::mint<USDC>(amount, mint_ref);
        coin::deposit<USDC>(to, c);
    }

    /// Admin burns USDC from any address.
    public entry fun burn_usdc(admin: &signer, from: address, amount: u64) acquires UsdcCaps {
        assert_owner(admin);
        let caps = borrow_global_mut<UsdcCaps>(signer::address_of(admin));
        let burn_ref = option::borrow(&caps.burn);
        coin::burn_from<USDC>(from, amount, burn_ref);
    }
}


