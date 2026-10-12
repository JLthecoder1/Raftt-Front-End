(() => {
  'use strict';
  const W = window.solanaWeb3;
  const cfg = window.RafttSolanaConfig;
  const programId = new W.PublicKey(cfg.programId);
  const token = new W.PublicKey('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA');
  const ataProgram = new W.PublicKey('ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL');
  let wallet, connection, idl;
  const observedProviders = new WeakSet();
  const bytes = (s) => new TextEncoder().encode(s);
  const pk = (s) => new W.PublicKey(s);
  const pda = (...seeds) => W.PublicKey.findProgramAddressSync(seeds, programId)[0];
  function u64(value) {
    if (typeof value === 'number' && !Number.isSafeInteger(value))
      throw Error('Use texto ou bigint para IDs u64.');
    const n = BigInt(value);
    if (n < 0n || n > 18446744073709551615n) throw Error('Identificador u64 inválido.');
    const b = new Uint8Array(8);
    new DataView(b.buffer).setBigUint64(0, n, true);
    return b;
  }
  const offeringFor = (authority, offeringId = '0') =>
    pda(bytes('offering'), pk(authority).toBytes(), u64(offeringId));
  const positionFor = (offering, investor) =>
    pda(bytes('position'), pk(offering).toBytes(), pk(investor).toBytes());
  function units(value, decimals) {
    const s = String(value).trim();
    if (!/^\d+(\.\d+)?$/.test(s))
      throw new Error('Informe um valor positivo, usando ponto decimal.');
    const [whole, frac = ''] = s.split('.');
    if (frac.length > decimals) throw new Error(`O token aceita ${decimals} casas decimais.`);
    const n = BigInt(whole) * 10n ** BigInt(decimals) + BigInt(frac.padEnd(decimals, '0') || '0');
    if (n <= 0n || n > 18446744073709551615n) throw new Error('Valor fora do intervalo permitido.');
    return n;
  }
  function format(n, decimals) {
    const s = n.toString().padStart(decimals + 1, '0');
    return decimals ? s.slice(0, -decimals) + '.' + s.slice(-decimals) : s;
  }
  function rpc() {
    const url = new URL(cfg.rpcUrl);
    if (!['localnet', 'devnet'].includes(cfg.network))
      throw new Error('Somente localnet e devnet são permitidas nesta integração de teste.');
    if (cfg.network === 'localnet' && !['localhost', '127.0.0.1', '[::1]'].includes(url.hostname))
      throw new Error('Localnet exige RPC local.');
    if (!connection) connection = new W.Connection(cfg.rpcUrl, 'confirmed');
    return connection;
  }
  const sessionKey = 'raftt-wallet-provider';
  function remember(name) {
    try {
      sessionStorage.setItem(sessionKey, name);
    } catch {}
  }
  function providerFor(name) {
    return name === 'solflare' ? window.solflare : window.phantom?.solana || window.solana;
  }
  function observe(provider) {
    if (observedProviders.has(provider)) return;
    observedProviders.add(provider);
    const changed = () => {
      if (wallet === provider) window.dispatchEvent(new Event('raftt:wallet-change'));
    };
    provider.on?.('accountChanged', changed);
    provider.on?.('disconnect', () => {
      if (wallet !== provider) return;
      wallet = null;
      try {
        sessionStorage.removeItem(sessionKey);
      } catch {}
      window.dispatchEvent(new Event('raftt:wallet-change'));
    });
  }
  async function connect(name = 'phantom', trusted = false) {
    const provider = providerFor(name);
    if (!provider?.connect || !provider?.signTransaction)
      throw new Error(
        'Abra no navegador com Phantom ou Solflare instalada. No celular, use o navegador da carteira.',
      );
    // Only adopt the provider after authorization succeeds.
    await provider.connect(trusted ? { onlyIfTrusted: true } : undefined);
    if (!provider.publicKey) throw new Error('A carteira não disponibilizou um endereço.');
    wallet = provider;
    observe(provider);
    remember(name);
    window.dispatchEvent(new Event('raftt:wallet-change'));
    return wallet.publicKey.toBase58();
  }
  async function restore() {
    let name;
    try {
      name = sessionStorage.getItem(sessionKey);
    } catch {}
    if (!['phantom', 'solflare'].includes(name)) return;
    try {
      return await connect(name, true);
    } catch {
      return;
    }
  }
  async function ready() {
    const c = rpc();
    const genesis = await c.getGenesisHash();
    if (
      genesis === '5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp' ||
      (cfg.network === 'devnet' && genesis !== 'EtWTRABZaYq6iMfeYKouRu166VU2xqa1')
    )
      throw new Error('O RPC não corresponde à rede de teste configurada.');
    const program = await c.getAccountInfo(programId);
    if (!program?.executable)
      throw new Error('Programa não publicado neste RPC. Compile e faça o deploy primeiro.');
    if (!idl) {
      const response = await fetch('/assets/js/solana/raftt.json', { cache: 'no-store' });
      if (!response.ok) throw new Error('Não foi possível carregar o IDL.');
      idl = await response.json();
      if (idl.address !== cfg.programId) {
        idl = null;
        throw new Error('IDL / program ID mismatch');
      }
    }
    return c;
  }
  async function account(address, kind, size) {
    const a = await rpc().getAccountInfo(pk(address));
    if (!a) return null;
    if (!a.owner.equals(programId)) throw new Error('A conta não pertence ao programa RAFTT.');
    const disc = idl.accounts.find((x) => x.name === kind).discriminator;
    if (a.data.length !== size || !disc.every((x, i) => a.data[i] === x))
      throw new Error(
        'Layout do programa diferente do código recebido. Atualize o programa e o IDL; ofertas antigas precisam de migração.',
      );
    return a.data;
  }
  function decodeOffering(b) {
    const view = new DataView(b.buffer, b.byteOffset, b.byteLength);
    return {
      authority: new W.PublicKey(b.slice(8, 40)).toBase58(),
      offeringId: view.getBigUint64(40, true),
      mint: new W.PublicKey(b.slice(48, 80)).toBase58(),
      target: view.getBigUint64(80, true),
      raised: view.getBigUint64(88, true),
      closed: !!b[96],
      failed: !!b[97],
      released: !!b[98],
      vault: new W.PublicKey(b.slice(99, 131)).toBase58(),
    };
  }
  async function mintInfo(mint) {
    const result = await rpc().getParsedAccountInfo(pk(mint));
    const v = result.value;
    if (!v?.owner.equals(token) || v.data?.parsed?.type !== 'mint')
      throw new Error('Mint SPL Token inválido. Token-2022 não é aceito por este contrato.');
    return v.data.parsed.info;
  }
  async function load(authority, offeringId = '0') {
    await ready();
    const address = offeringFor(authority, offeringId);
    const b = await account(address, 'Offering', 132);
    if (!b) throw new Error('Esta carteira ainda não criou uma oferta.');
    const state = decodeOffering(b),
      mint = await mintInfo(state.mint);
    const investor = wallet?.publicKey;
    const pos = investor ? await account(positionFor(address, investor), 'Position', 81) : null;
    const balance = await rpc().getTokenAccountBalance(pk(state.vault));
    return {
      ...state,
      address: address.toBase58(),
      decimals: mint.decimals,
      hasPosition: !!pos,
      investor: investor?.toBase58(),
      position: pos
        ? new DataView(pos.buffer, pos.byteOffset, pos.byteLength).getBigUint64(72, true)
        : 0n,
      vaultBalance: balance.value.amount,
    };
  }
  function instruction(name, accounts, amount) {
    const spec = idl.instructions.find((x) => x.name === name);
    const args = amount == null ? [] : Array.isArray(amount) ? amount : [amount];
    const data = new Uint8Array(8 + args.length * 8);
    data.set(spec.discriminator);
    args.forEach((value, index) => data.set(u64(value), 8 + index * 8));
    const ix = new W.TransactionInstruction({
      programId,
      keys: spec.accounts.map((a) => ({
        pubkey: pk(a.address || accounts[a.name]),
        isSigner: !!a.signer,
        isWritable: !!a.writable,
      })),
      data,
    });
    return ix;
  }
  async function tokenAccount(mint, owner, create) {
    const ata = W.PublicKey.findProgramAddressSync(
      [pk(owner).toBytes(), token.toBytes(), pk(mint).toBytes()],
      ataProgram,
    )[0];
    if (create)
      return {
        address: ata,
        ix: new W.TransactionInstruction({
          programId: ataProgram,
          keys: [
            { pubkey: wallet.publicKey, isSigner: true, isWritable: true },
            { pubkey: ata, isSigner: false, isWritable: true },
            { pubkey: pk(owner), isSigner: false, isWritable: false },
            { pubkey: pk(mint), isSigner: false, isWritable: false },
            { pubkey: W.SystemProgram.programId, isSigner: false, isWritable: false },
            { pubkey: token, isSigner: false, isWritable: false },
          ],
          data: Uint8Array.of(1),
        }),
      };
    const accounts = await rpc().getParsedTokenAccountsByOwner(pk(owner), { mint: pk(mint) });
    const usable = accounts.value.filter(
      (a) => a.account.owner.equals(token) && a.account.data.parsed.info.state === 'initialized',
    );
    usable.sort((a, b) => {
      const x = BigInt(a.account.data.parsed.info.tokenAmount.amount),
        y = BigInt(b.account.data.parsed.info.tokenAmount.amount);
      return x === y ? 0 : x > y ? -1 : 1;
    });
    if (!usable.length)
      throw new Error('A carteira não possui conta deste token. Receba tokens de teste primeiro.');
    return { address: usable[0].pubkey };
  }
  async function send(ixs, expectedOwner) {
    if (!wallet?.publicKey) throw new Error('Connect your wallet first.');
    const owner = wallet.publicKey.toBase58();
    if (expectedOwner && owner !== expectedOwner)
      throw new Error('Carteira alterada. Revise a operação novamente.');
    const c = await ready(),
      block = await c.getLatestBlockhash();
    const tx = new W.Transaction({ feePayer: wallet.publicKey, ...block }).add(...ixs);
    const fee = await c.getFeeForMessage(tx.compileMessage());
    let rent = 0;
    for (const ix of ixs) {
      if (ix.programId.equals(ataProgram) && !(await c.getAccountInfo(ix.keys[1].pubkey)))
        rent += await c.getMinimumBalanceForRentExemption(165);
      if (ix.programId.equals(programId)) {
        const spec = idl.instructions.find((x) =>
          x.discriminator.every((b, i) => ix.data[i] === b),
        );
        for (const [name, size] of spec.name === 'setup_platform'
          ? [['config', 41]]
          : spec.name === 'create_round'
            ? [
                ['round', 294],
                ['vault', 165],
              ]
            : spec.name === 'add_milestone'
              ? [['milestone', 148]]
              : spec.name === 'invest_round'
                ? [['position', 81]]
                : spec.name === 'initialize'
                  ? [
                      ['offering', 132],
                      ['vault', 165],
                    ]
                  : spec.name === 'invest'
                    ? [['position', 81]]
                    : []) {
          const key = ix.keys[spec.accounts.findIndex((x) => x.name === name)].pubkey;
          if (!(await c.getAccountInfo(key)))
            rent += await c.getMinimumBalanceForRentExemption(size);
        }
      }
    }
    if (fee.value == null || (await c.getBalance(wallet.publicKey)) < fee.value + rent)
      throw new Error('Insufficient SOL for transaction fees and account creation.');
    window.dispatchEvent(new CustomEvent('raftt:transaction-phase', { detail: 'wallet' }));
    if (wallet?.publicKey?.toBase58() !== owner)
      throw new Error('Carteira alterada. Revise a operação novamente.');
    const signed = await wallet.signTransaction(tx);
    if (wallet?.publicKey?.toBase58() !== owner)
      throw new Error('Wallet changed. Please review again.');
    window.dispatchEvent(new CustomEvent('raftt:transaction-phase', { detail: 'sending' }));
    const signature = await c.sendRawTransaction(signed.serialize(), { skipPreflight: false });
    window.dispatchEvent(new CustomEvent('raftt:transaction-sent', { detail: signature }));
    window.dispatchEvent(new CustomEvent('raftt:transaction-phase', { detail: 'confirming' }));
    const confirmation = await c.confirmTransaction({ signature, ...block }, 'confirmed');
    if (confirmation.value.err)
      throw new Error('Transação falhou: ' + JSON.stringify(confirmation.value.err));
    return signature;
  }
  async function initialize(mint, target, offeringId = '0') {
    if (!wallet?.publicKey) throw new Error('Connect your wallet first.');
    const creator = wallet.publicKey;
    u64(offeringId);
    await ready();
    if (await rpc().getAccountInfo(offeringFor(creator, offeringId)))
      throw new Error('Este identificador já existe para a carteira criadora.');
    const info = await mintInfo(mint),
      offering = offeringFor(creator, offeringId),
      vault = pda(bytes('vault'), offering.toBytes());
    return send(
      [
        instruction(
          'initialize',
          {
            user: creator,
            mint,
            offering,
            vault,
            system_program: W.SystemProgram.programId,
            token_program: token,
            rent: W.SYSVAR_RENT_PUBKEY,
          },
          [offeringId, units(target, info.decimals)],
        ),
      ],
      creator.toBase58(),
    );
  }
  async function act(name, authority, value, offeringId = '0') {
    if (!wallet?.publicKey) throw new Error('Connect your wallet first.');
    const owner = wallet.publicKey.toBase58();
    const s = await load(authority, offeringId),
      offering = pk(s.address);
    if (s.investor !== wallet?.publicKey?.toBase58())
      throw new Error('Wallet changed. Please review again.');
    if (['release', 'fail_offering'].includes(name) && s.authority !== wallet.publicKey.toBase58())
      throw new Error('Somente a carteira criadora pode executar esta ação.');
    let extra = [],
      accounts = {
        offering,
        authority: wallet.publicKey,
        investor: wallet.publicKey,
        vault: s.vault,
        position: positionFor(offering, wallet.publicKey),
        mint: s.mint,
        token_program: token,
        system_program: W.SystemProgram.programId,
      };
    let amount;
    if (name === 'invest') {
      if (s.closed || s.failed || s.released)
        throw new Error('Oferta indisponível para investimento.');
      amount = units(value, s.decimals);
      if (s.raised + amount > s.target) throw new Error('O aporte ultrapassa a meta restante.');
      accounts.investor_token_account = (
        await tokenAccount(s.mint, wallet.publicKey, false)
      ).address;
      const balance = await rpc().getTokenAccountBalance(accounts.investor_token_account);
      if (BigInt(balance.value.amount) < amount)
        throw new Error('Saldo insuficiente nesta conta de tokens.');
    }
    if (name === 'refund' || name === 'release') {
      if (name === 'refund' && (!s.failed || s.position === 0n))
        throw new Error('Reembolso exige oferta falhada e posição positiva.');
      if (name === 'release' && (s.raised < s.target || s.failed || s.released))
        throw new Error('Liberação exige meta atingida e fundos ainda não liberados.');
      const a = await tokenAccount(s.mint, wallet.publicKey, true);
      extra.push(a.ix);
      accounts[name === 'refund' ? 'investor_token_account' : 'destination'] = a.address;
    }
    if (name === 'fail_offering' && (s.closed || s.failed))
      throw new Error('Oferta já fechada ou falhada.');
    return send([...extra, instruction(name, accounts, amount)], owner);
  }
  window.RafttV2Bridge = {
    W,
    programId,
    token,
    pk,
    pda,
    bytes,
    rpc,
    ready,
    account,
    mintInfo,
    tokenAccount,
    send,
    walletKey: () => wallet?.publicKey,
  };
  window.RafttChain = {
    list: async () => {
      const c = await ready();
      const rows = await c.getProgramAccounts(programId, { filters: [{ dataSize: 132 }] });
      const disc = idl.accounts.find((x) => x.name === 'Offering').discriminator;
      return Promise.all(
        rows
          .filter((x) => disc.every((b, i) => x.account.data[i] === b))
          .map((x) => {
            const row = decodeOffering(x.account.data);
            return load(row.authority, row.offeringId);
          }),
      );
    },
    funds: async (mint) => {
      if (!wallet?.publicKey) throw new Error('Connect your wallet first.');
      const a = await tokenAccount(mint, wallet.publicKey, false);
      return BigInt((await rpc().getTokenAccountBalance(a.address)).value.amount);
    },
    history: async (s) => {
      if (!wallet?.publicKey) return [];
      return rpc().getSignaturesForAddress(positionFor(s.address, wallet.publicKey), { limit: 50 });
    },
    address: () => wallet?.publicKey?.toBase58(),
    connect,
    provider: () => wallet,
    restore,
    initialize,
    act,
    load,
    format,
    units,
    decodeOffering,
    offeringFor,
    u64,
    disconnect: async () => {
      await wallet?.disconnect();
      wallet = null;
      try {
        sessionStorage.removeItem(sessionKey);
      } catch {}
      window.dispatchEvent(new Event('raftt:wallet-change'));
    },
  };
})();
