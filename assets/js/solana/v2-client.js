(() => {
  'use strict';
  const B = window.RafttV2Bridge,
    C = window.RafttChain;
  const u64 = (n) => {
    if (BigInt(n) < 0n || BigInt(n) > 18446744073709551615n) throw Error('Valor u64 inválido');
    const b = new Uint8Array(8);
    new DataView(b.buffer).setBigUint64(0, BigInt(n), true);
    return b;
  };
  const u16 = (n) => {
    if (!Number.isInteger(n) || n < 0 || n > 65535) throw Error('Índice inválido');
    const b = new Uint8Array(2);
    new DataView(b.buffer).setUint16(0, n, true);
    return b;
  };
  const concat = (...parts) => {
    const out = new Uint8Array(parts.reduce((n, p) => n + p.length, 0));
    let offset = 0;
    for (const p of parts) {
      out.set(p, offset);
      offset += p.length;
    }
    return out;
  };
  const roundFor = (creator, id) => B.pda(B.bytes('round-v2'), B.pk(creator).toBytes(), u64(id));
  const milestoneFor = (round, index) =>
    B.pda(B.bytes('milestone-v2'), B.pk(round).toBytes(), u16(index));
  const positionFor = (round, investor) =>
    B.pda(B.bytes('position-v2'), B.pk(round).toBytes(), B.pk(investor).toBytes());
  const configFor = () => B.pda(B.bytes('platform-v2'));
  const hash = async (text) => {
    if (!text?.trim()) throw Error('Informe o documento ou relatório da análise');
    return new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text)));
  };
  let idl;
  async function ix(name, accounts, ...args) {
    await B.ready();
    idl ||= await (await fetch('/assets/js/solana/raftt.json', { cache: 'no-store' })).json();
    const spec = idl.instructions.find((x) => x.name === name);
    if (!spec) throw Error('IDL sem instrução v2');
    return new B.W.TransactionInstruction({
      programId: B.programId,
      keys: spec.accounts.map((a) => ({
        pubkey: B.pk(a.address || accounts[a.name]),
        isSigner: !!a.signer,
        isWritable: !!a.writable,
      })),
      data: concat(Uint8Array.from(spec.discriminator), ...args),
    });
  }
  const key = () => {
    const k = B.walletKey();
    if (!k) throw Error('Conecte a carteira');
    return k;
  };
  function decodeRound(b) {
    const v = new DataView(b.buffer, b.byteOffset, b.byteLength),
      pub = (o) => B.pk(b.slice(o, o + 32)).toBase58();
    return {
      creator: pub(8),
      platform: pub(40),
      mint: pub(72),
      recipient: pub(104),
      vault: pub(136),
      id: v.getBigUint64(168, true),
      minimum: v.getBigUint64(176, true),
      cap: v.getBigUint64(184, true),
      deadline: Number(v.getBigInt64(192, true)),
      raised: v.getBigUint64(200, true),
      allocated: v.getBigUint64(208, true),
      released: v.getBigUint64(216, true),
      milestoneCount: v.getUint16(224, true),
      nextRelease: v.getUint16(226, true),
      status: b[228],
      planHash: Array.from(b.slice(230, 262), (n) => n.toString(16).padStart(2, '0')).join(''),
      reviewHash: Array.from(b.slice(262, 294), (n) => n.toString(16).padStart(2, '0')).join(''),
    };
  }
  function decodeMilestone(b) {
    const v = new DataView(b.buffer, b.byteOffset, b.byteLength);
    return {
      index: v.getUint16(40, true),
      amount: v.getBigUint64(42, true),
      status: b[50],
      planHash: Array.from(b.slice(51, 83), (n) => n.toString(16).padStart(2, '0')).join(''),
      evidenceHash: Array.from(b.slice(83, 115), (n) => n.toString(16).padStart(2, '0')).join(''),
      reviewHash: Array.from(b.slice(115, 147), (n) => n.toString(16).padStart(2, '0')).join(''),
    };
  }
  async function load(address) {
    await B.ready();
    const b = await B.account(address, 'Round', 294);
    if (!b) throw Error('Rodada v2 não encontrada');
    const s = decodeRound(b),
      mint = await B.mintInfo(s.mint),
      wallet = B.walletKey();
    const p = wallet ? await B.account(positionFor(address, wallet), 'RoundPosition', 81) : null;
    const milestones = [];
    for (let i = 0; i < s.milestoneCount; i++) {
      const m = await B.account(milestoneFor(address, i), 'Milestone', 148);
      if (!m) throw Error('Parcela não encontrada');
      milestones.push(decodeMilestone(m));
    }
    const slot = await B.rpc().getSlot('confirmed'),
      now = await B.rpc().getBlockTime(slot);
    if (now == null) throw Error('Não foi possível consultar o horário da rede');
    return {
      ...s,
      address,
      decimals: mint.decimals,
      milestones,
      now,
      investor: wallet?.toBase58(),
      hasPosition: !!p,
      position: p ? new DataView(p.buffer, p.byteOffset, p.byteLength).getBigUint64(72, true) : 0n,
      vaultBalance: BigInt((await B.rpc().getTokenAccountBalance(B.pk(s.vault))).value.amount),
    };
  }
  async function setup(reviewer) {
    const loader = B.pk('BPFLoaderUpgradeab1e11111111111111111111111');
    const programData = B.W.PublicKey.findProgramAddressSync([B.programId.toBytes()], loader)[0];
    const authority = key();
    return B.send(
      [
        await ix(
          'setup_platform',
          {
            authority,
            config: configFor(),
            program: B.programId,
            program_data: programData,
            system_program: B.W.SystemProgram.programId,
          },
          B.pk(reviewer).toBytes(),
        ),
      ],
      authority.toBase58(),
    );
  }
  async function create({ id, mint, minimum, cap, deadline, recipient, plan }) {
    const creator = key(),
      round = roundFor(creator, id),
      info = await B.mintInfo(mint),
      vault = B.pda(B.bytes('vault-v2'), round.toBytes());
    const seconds = Math.floor(new Date(deadline).getTime() / 1000);
    if (!Number.isSafeInteger(seconds) || seconds <= 0) throw Error('Prazo inválido');
    const signature = await B.send(
      [
        await ix(
          'create_round',
          {
            creator,
            config: configFor(),
            mint,
            round,
            vault,
            system_program: B.W.SystemProgram.programId,
            token_program: B.token,
            rent: B.W.SYSVAR_RENT_PUBKEY,
          },
          u64(id),
          u64(C.units(minimum, info.decimals)),
          u64(C.units(cap, info.decimals)),
          u64(seconds),
          B.pk(recipient).toBytes(),
          await hash(plan),
        ),
      ],
      creator.toBase58(),
    );
    return { signature, address: round.toBase58() };
  }
  async function act(name, address, { amount, index = 0, document: doc } = {}) {
    const signer = key(),
      owner = signer.toBase58(),
      s = await load(address);
    if (signer.toBase58() !== B.walletKey()?.toBase58())
      throw Error('Carteira alterada; consulte novamente');
    const a = {
      round: address,
      creator: signer,
      reviewer: signer,
      signer,
      investor: signer,
      mint: s.mint,
      vault: s.vault,
      position: positionFor(address, signer),
      milestone: milestoneFor(address, index),
      system_program: B.W.SystemProgram.programId,
      token_program: B.token,
    };
    let args = [],
      extra = [];
    if (name === 'add_milestone')
      args = [u16(index), u64(C.units(amount, s.decimals)), await hash(doc)];
    if (['open_round', 'submit_milestone', 'approve_milestone'].includes(name))
      args = [await hash(doc)];
    if (name === 'invest_round') {
      if (s.status !== 1 || s.now >= s.deadline) throw Error('Captação indisponível.');
      args = [u64(C.units(amount, s.decimals))];
      if (C.units(amount, s.decimals) > s.cap - s.raised)
        throw Error('Aporte acima do limite restante.');
      a.investor_token = (await B.tokenAccount(s.mint, signer, false)).address;
      const balance = await B.rpc().getTokenAccountBalance(a.investor_token);
      if (BigInt(balance.value.amount) < C.units(amount, s.decimals))
        throw Error('Saldo de tokens insuficiente.');
    }
    if (
      name === 'cancel_round' &&
      (s.status !== 1 || s.now >= s.deadline - 172800 || C.units(amount, s.decimals) > s.position)
    )
      throw Error('Cancelamento indisponível para este prazo ou valor.');
    if (name === 'refund_round' && (s.status !== 3 || s.position === 0n))
      throw Error('Reembolso exige rodada falhada e posição positiva.');
    if (
      name === 'release_milestone' &&
      (s.status !== 2 || index !== s.nextRelease || s.milestones[index]?.status !== 2)
    )
      throw Error('Parcela ainda não autorizada, fora de ordem ou já paga.');
    if (['cancel_round', 'refund_round', 'release_milestone'].includes(name)) {
      const recipient = name === 'release_milestone' ? s.recipient : signer;
      const ata = await B.tokenAccount(s.mint, recipient, true);
      extra.push(ata.ix);
      a[name === 'release_milestone' ? 'destination' : 'investor_token'] = ata.address;
      if (name === 'cancel_round') args = [u64(C.units(amount, s.decimals))];
    }
    return B.send([...extra, await ix(name, a, ...args)], owner);
  }
  async function list() {
    await B.ready();
    const rows = await B.rpc().getProgramAccounts(B.programId, { filters: [{ dataSize: 294 }] });
    idl ||= await (await fetch('/assets/js/solana/raftt.json', { cache: 'no-store' })).json();
    const discriminator = idl.accounts.find((a) => a.name === 'Round').discriminator;
    return Promise.all(
      rows
        .filter((row) => discriminator.every((byte, i) => row.account.data[i] === byte))
        .map((row) => load(row.pubkey.toBase58())),
    );
  }
  window.RafttV2 = {
    list,
    setup,
    create,
    act,
    load,
    roundFor,
    decodeRound,
    decodeMilestone,
    u64,
    u16,
    hash,
  };
})();
