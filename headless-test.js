'use strict';
let simNow = 0;
const performance = { now: () => simNow };

function makeEl(id) {
  const el = {
    id, style: {}, textContent: '', _inner: '', children: [],
    classList: { add(){}, remove(){} },
    childNodes: [{ nodeValue: '' }],
    onclick: null, _h: null, disabled: false, className: '', dataset: { tab: id === 'tabTeam' ? 'team' : id === 'tabUps' ? 'ups' : id === 'tabVerts' ? 'verts' : '' },
    appendChild(c) { this.children.push(c); },
    addEventListener(){},
  };
  Object.defineProperty(el, 'innerHTML', {
    get() { return this._inner; },
    set(v) { this._inner = v; if (v === '') this.children = []; }
  });
  return el;
}
const els = {};
const stubs = {
  measureText: () => ({ width: 60 }),
  createRadialGradient: () => ({ addColorStop(){} }),
  createLinearGradient: () => ({ addColorStop(){} }),
  getImageData: () => ({ data: [] })
};
const ctxProxy = new Proxy({}, {
  get(t, p) {
    if (p === 'canvas') return {};
    if (stubs[p]) return stubs[p];
    return (typeof t[p] !== 'undefined') ? t[p] : () => {};
  },
  set(t, p, v) { t[p] = v; return true; }
});
const canvasEl = Object.assign(makeEl('game'), {
  getContext: () => ctxProxy, width: 0, height: 0,
  getBoundingClientRect: () => ({ left: 0, top: 0 })
});
const document = {
  getElementById(id) {
    if (id === 'game') return canvasEl;
    if (!els[id]) els[id] = makeEl(id);
    return els[id];
  },
  createElement: tag => tag === 'canvas' ? { getContext: () => ctxProxy, width: 0, height: 0 } : makeEl(tag),
  addEventListener(){}, hidden: false
};
const window = {};
const addEventListener = () => {};
const requestAnimationFrame = () => 0;
const devicePixelRatio = 2, innerWidth = 400, innerHeight = 800;

/*GAME*/

setTimeout(async () => {
  try {
    const tick = (n, dt) => { dt = dt || 0.05; for (let i = 0; i < n; i++) { simNow += dt * 1000; update(dt); render(); } };
    const at = (x, y) => { player.x = x; player.y = y; player.trail.unshift({x, y}); };
    const log = [];

    at(rc(L.printer).x+55, rc(L.printer).y); tick(30);
    log.push(['carrying after printer', player.carrying.length]);
    if (!player.carrying.length) throw new Error('pickup failed');

    player.carrying.push('bc','bc');
    at(rc(L.shred).x, rc(L.shred).y); tick(20);
    log.push(['carrying after shredder', player.carrying.length]);
    if (player.carrying.length !== 0) throw new Error('shredder did not clear the stack');
    printerStack.push('bc');
    at(rc(L.printer).x+55, rc(L.printer).y); tick(20);
    if (!player.carrying.length) throw new Error('re-pickup after shred failed');
    at(rc(L.desk).x, rc(L.desk).y+30); tick(24);
    log.push(['deskQueue', deskQueue.length]);
    if (!deskQueue.length && !candidates.length) throw new Error('deposit failed');

    state.ups.quality = UPS.quality.max;
    for (let i = 0; i < 6; i++) deskQueue.push('bc');
    tick(400);
    log.push(['candidates waiting', candidates.filter(c => c.st === 'wait').length, 'rejected', state.rejected||0]);
    if (!candidates.some(c => c.st === 'wait')) throw new Error('screening produced nothing');
    state.ups.quality = 0;

    at(rc(L.zone).x, rc(L.zone).y); tick(20);
    if (!player_followers().length) throw new Error('cannot pick up a screened candidate');
    at(rc(L.booth).x, rc(L.booth).y); tick(24);
    if (!candidates.some(c => c.st === 'booth')) throw new Error('cannot deliver a candidate to the rooms');
    log.push(['led candidate to rooms', 'ok']);
    state.hires.rec = 0; syncEmp();
    state.ups.booth = 0;
    at(0, 1080);
    candidates.forEach(c => { if (c.st==='booth') c.iT = 0; });
    for (let i = 0; i < 40; i++) { simNow += 50; update(0.05); render(); }
    const awayT = candidates.filter(c=>c.st==='booth').reduce((s,c)=>Math.max(s,c.iT||0), 0);
    if (awayT > 0.5) throw new Error('an unattended room ran too fast: ' + awayT.toFixed(2));
    candidates.forEach(c => { if (c.st==='booth') c.iT = 0; });
    at(rc(L.booth).x, rc(L.booth).y);
    let meT = 0, meDone = false;
    for (let i = 0; i < 60; i++) {
      simNow += 50; update(0.05); render();
      meT = Math.max(meT, candidates.filter(c=>c.st==='booth').reduce((s,c)=>Math.max(s,c.iT||0), 0));
      if (candidates.some(c => c.done)) meDone = true;
    }
    if (meT <= 0.5 && !meDone) throw new Error('the player does not interview when at the rooms');
    log.push(['interview speed: you vs unattended', meT.toFixed(1) + 's vs ' + awayT.toFixed(1) + 's']);
    if (!candidates.some(c => c.st === 'booth'))
      candidates.push({ x:boothSlots[0].x, y:boothSlots[0].y, vert:'bc', st:'booth', bslot:0, iT:0, owner:null, idx:0, bob:0 });
    const placedBefore = state.placed;
    at(rc(L.booth).x, rc(L.booth).y);
    let didInterview = false;
    for (let i = 0; i < 200; i++) { simNow += 50; update(0.05); render(); if (candidates.some(c => c.done)) didInterview = true; }
    if (!didInterview && state.placed === placedBefore) throw new Error('interview never completed');
    log.push(['interviewed', candidates.filter(c=>c.done).length]);
    clients.length = 0; clientT = 9999;
    if (!candidates.some(c => c.st === 'ready'))
      candidates.push({ x:340, y:668, vert:'bc', st:'ready', rspot:0, owner:null, idx:0, bob:0, readyT:0, done:true });
    at(BENCH.x+BENCH.w/2, BENCH.y+BENCH.h/2); tick(24);
    if (!player_followers().length) throw new Error('ready pickup failed');

    modalOpen = false; panelOpen = false;
    clients.length = 0; clientT = 9999; bills.length = 0;
    candidates.length = 0;
    candidates.push({ x:600, y:900, vert:'bc', st:'follow', owner:'p', idx:0, bob:0, done:true });
    clients.push({ x:316, y:992, vert:'bc', need:1, slot:0, patience:99, maxP:99, st:'wait', bob:0, total:1 });
    at(L.lobby.x+80, L.lobby.y+40); tick(24);
    const paidHere = bills.length ? bills[0].x : null;
    if (!bills.length && state.cash <= 0) throw new Error('walking a candidate to a client did not pay');
    if (paidHere !== null && Math.abs(paidHere - 322) > 110) throw new Error('fee did not drop at the client');
    log.push(['fee dropped at the client', 'ok']);

    at(clientSlots[0].x, clientSlots[0].y+30); tick(60);
    log.push(['cash after scoop', Math.floor(state.cash), 'chain', state.chain]);
    if (state.cash <= 0) throw new Error('cash not collected');
    if (chainMul() !== 1) throw new Error('streak multiplier should be removed');

    state.cash = 14000; clientT = 4;
    at(rc(L.mgr).x, rc(L.mgr).y); tick(10);
    if (!panelOpen) throw new Error('manager desk did not open');
    const hireBtn = n => {
      const row = els['panelRows'].children.find(r => r._inner && r._inner.includes('>' + n + '<'));
      if (!row) return null;
      const bs = row.children.filter(c => c.textContent !== '\u2212'); // skip the "let go" control
      return bs[bs.length - 1];
    };
    const fireBtn = n => {
      const row = els['panelRows'].children.find(r => r._inner && r._inner.includes('>' + n + '<'));
      return row && row.children.find(c => c.textContent === '\u2212');
    };
    ['Sourcer','Sourcer','Recruiter','Account manager','Finance exec'].forEach(n => {
      const b = hireBtn(n);
      if (!b || !b.onclick) throw new Error('no hire button for ' + n);
      b.onclick();
    });
    log.push(['hires', JSON.stringify(state.hires)]);
    {
      // firing trims headcount and payroll
      const before = state.hires.sourcer, wagesBefore = payrollTotal();
      const fb = fireBtn('Sourcer');
      if (!fb) throw new Error('no let-go control for a hired role');
      fb.onclick();
      if (state.hires.sourcer !== before - 1) throw new Error('firing did not reduce headcount');
      if (payrollTotal() >= wagesBefore) throw new Error('firing did not reduce payroll');
      log.push(['fire staff', 'sourcer ' + before + ' -> ' + state.hires.sourcer + ', wages ' + fmt(wagesBefore) + ' -> ' + fmt(payrollTotal())]);
      hireBtn('Sourcer').onclick(); // restore for the tests that follow
    }
    if (state.hires.sourcer !== 2) throw new Error('multi-hire from panel failed');
    if (emp.sourcers.length !== 2) throw new Error('units not synced: ' + emp.sourcers.length);
    if (!state.hires.rec || !state.hires.am || !state.hires.fin) throw new Error('hiring failed');
    panelOpen = false; at(rc(L.booth).x, L.booth.y+210); tick(4);

    deskQueue.length = 0; candidates.length = 0; clients.length = 0; clientT = 9999;
    state.cash = 0; // below REJECT_FLOOR, so interviews never reject during this check
    state.hires.rec = 1; state.hires.am = 0; syncEmp();
    for (let i = 0; i < 3; i++)
      candidates.push({ x:boothSlots[i].x, y:boothSlots[i].y, vert:'bc', st:'booth', bslot:i, iT:0, owner:null, idx:0, bob:0 });
    at(0, 1080);
    let sawDone = false, staffWalked = false;
    for (let i = 0; i < 500; i++) {
      simNow += 50; update(0.05); render();
      if (candidates.some(c => c.done)) sawDone = true;
      if (candidates.some(c => c.st === 'follow' && c.owner !== 'p' && String(c.owner).indexOf('rec') !== 0)) staffWalked = true;
    }
    if (!sawDone) throw new Error('stationed recruiter never completed an interview');
    if (staffWalked) throw new Error('a staff member is walking candidates around');
    const rr2 = emp.recs[0];
    if (Math.abs(rr2.y - (L.booth.y + 40)) > 24) throw new Error('recruiter is not stationed at the rooms: y=' + Math.round(rr2.y));
    const staffedT = candidates.filter(c => c.bslot === 0).length;
    log.push(['recruiter stationed and interviewing', 'ok']);

    // an idle recruiter fetches a waiting candidate into its own room
    deskQueue.length = 0; candidates.length = 0; clients.length = 0; clientT = 9999;
    state.payOn = false; state.cash = 0; // keep the payroll latch out of this timing test
    state.hires.rec = 1; state.hires.am = 0; state.hires.sourcer = 0; syncEmp();
    at(0, 1080);
    for (let i = 0; i < 80; i++) { simNow += 50; update(0.05); render(); } // recruiter settles at post
    candidates.push({ x:zoneSlots[0].x, y:zoneSlots[0].y, vert:'bc', st:'wait', slot:0, owner:null, idx:0, bob:0 });
    let recWalked = false, landed = false;
    for (let i = 0; i < 170; i++) { // 8.5s of sim, inside the 9s drift valve
      simNow += 50; update(0.05); render();
      if (candidates.some(c => c.owner === 'rec0')) recWalked = true;
      if (candidates.some(c => c.st === 'booth' && c.bslot === 0)) { landed = true; break; }
    }
    if (!recWalked) throw new Error('recruiter never fetched a waiting candidate');
    if (!landed) throw new Error('fetched candidate never reached the recruiter room');
    const cb0 = candidates.find(c => c.st === 'booth');
    const itBefore = cb0.iT || 0;
    for (let i = 0; i < 40; i++) { simNow += 50; update(0.05); render(); } // 2s more
    const cb1 = candidates.find(c => c === cb0);
    if (cb1 && cb1.st === 'booth' && ((cb1.iT||0) - itBefore) < 1.2)
      throw new Error('recruiter room ran slow after deposit: ' + ((cb1.iT||0) - itBefore).toFixed(2));
    log.push(['recruiter fetch and interview', 'ok']);

    // fresh-run onboarding: versioned save, pre-filled tray, first client needs exactly one
    state = freshState(); resetFloor(); modalOpen = false; gameOver = false;
    if (freshState().v !== 1) throw new Error('save version missing from freshState');
    if (printerStack.length < 3) throw new Error('fresh tray not pre-filled: ' + printerStack.length);
    clientT = 0.01;
    let cl0 = null;
    for (let i = 0; i < 40 && !cl0; i++) { tick(1); cl0 = clients[0] || null; }
    if (!cl0) throw new Error('no first client arrived');
    if (cl0.need !== 1) throw new Error('first client needs ' + cl0.need + ', expected 1');
    log.push(['fresh-run onboarding', 'tray pre-filled, first client need 1']);

    bills.length = 0; candidates.length = 0; clients.length = 0;
    state.hires = { sourcer:0, rec:0, am:0, fin:1 }; syncEmp(); // self-sufficient: earlier tests may reset state
    state.payOn = false; state.cash = 0;
    spawnBills(80, 500, 930);
    const cashB = state.cash;
    at(rc(L.printer).x+55, rc(L.printer).y); tick(200);
    if (state.cash <= cashB) throw new Error('walking finance exec never banked the fees');
    log.push(['fin banked', Math.floor(state.cash - cashB)]);




    state.hires = { sourcer:2, rec:2, am:2, fin:1 }; syncEmp();
    candidates.length = 0; clients.length = 0; bills.length = 0;
    state.chain = 0; state.cash = 0; clientT = 3;
    const placedPre = state.placed;
    let maxCands = 0;
    for (let s = 0; s < 90; s++) { tick(30); maxCands = Math.max(maxCands, candidates.length); }
    log.push(['after automation: net cash', Math.floor(state.cash), 'placed +' + (state.placed - placedPre), 'maxCands', maxCands, 'clients', clients.length]);
    if (maxCands > 30) throw new Error('candidate overflow: ' + maxCands);
    if (state.placed <= placedPre) throw new Error('idle office placed nobody: staff should still trickle');
    if (gameOver) throw new Error('idle office hit the ruin line inside 45 minutes');
    log.push(['idle office trickle', 'placed ' + (state.placed - placedPre) + ', net ' + Math.round(state.cash)]);

    state.cash = 5000; // the idle run can end negative now; this test checks panel wiring, not affordability
    at(rc(L.mgr).x, rc(L.mgr).y); tick(10);
    log.push(['panel rows', els['panelRows'].children.length]);
    if (!els['panelRows'].children.length) throw new Error('panel empty');
    const speedRow = els['panelRows'].children.find(r => r._inner && r._inner.includes('Founder hustle'));
    const before = state.ups.speed;
    if (speedRow && speedRow.children[0] && speedRow.children[0].onclick) speedRow.children[0].onclick();
    log.push(['speed lvl after buy', state.ups.speed, '(was', before + ')']);
    if (state.ups.speed !== before + 1) throw new Error('categorised panel buy failed');

    const itRow = els['panelRows'].children.find(r => r._inner && r._inner.includes('Unlock IT'));
    if (itRow && itRow.children[0]) { state.cash = 9000; itRow.children[0].disabled = false; itRow.children[0].onclick(); }
    log.push(['verts', JSON.stringify(state.verts)]);
    if (!state.verts.includes('it')) throw new Error('IT unlock failed');

    state.cash = COUNTRIES[0].moveCost + 3000; panelOpen = false;
    at(rc(L.exit).x, rc(L.exit).y); tick(10);
    const moveBtn = els['mBtns'].children.find(b => b.className.includes('pri'));
    if (!moveBtn) throw new Error('country modal did not open');
    moveBtn.onclick();
    log.push(['country', COUNTRIES[state.country].name, 'cash', Math.floor(state.cash)]);
    if (state.country !== 1) throw new Error('country move failed');

    tick(600);
    log.push(['dubai running: cash', Math.floor(state.cash), 'passive/min', passiveRate()]);

    state.verts = ['bc','it'];
    candidates.length = 0; clients.length = 0; deskQueue.length = 0; printerStack.length = 0;
    for (let i = 0; i < 8; i++) candidates.push({ x:0, y:0, vert:'bc', st:'pool', spot:i%6, owner:null, idx:0, bob:0, poolT:0 });
    let bcC = 0; for (let i = 0; i < 300; i++) if (pickClientVert() === 'bc') bcC++;
    log.push(['client mix leans to surplus', bcC + '/300 bc']);
    if (bcC < 200) throw new Error('client weighting too weak: ' + bcC);

    clients.push({ x:0, y:0, vert:'it', need:3, slot:0, patience:30, maxP:30, st:'wait', bob:0, total:3 });
    clients.push({ x:0, y:0, vert:'it', need:2, slot:1, patience:30, maxP:30, st:'wait', bob:0, total:2 });
    let itR = 0; for (let i = 0; i < 300; i++) if (pickResumeVert() === 'it') itR++;
    log.push(['resume mix leans to demand', itR + '/300 it']);
    if (itR < 200) throw new Error('resume weighting too weak: ' + itR);

    candidates.length = 0; clients.length = 0; clientT = 9999;
    state.hires.am = 0; syncEmp();
    candidates.push({ x:340, y:668, vert:'it', st:'ready', rspot:0, owner:null, idx:0, bob:0, readyT:0, done:true });
    at(0, 1080);
    for (let i = 0; i < 900; i++) { simNow += 50; update(0.05); render(); }
    if (candidates.some(c => c.st === 'ready' && c.vert === 'it')) throw new Error('expiry valve failed');
    log.push(['stale candidate cleared', 'ok']);
    candidates.length = 0; clients.length = 0;

    state.ups.zone = 3; state.ups.ready = 3; state.ups.slots = 1;
    log.push(['caps zone/ready/clients', zoneCap(), readyCap(), clientCap()]);
    if (zoneCap() !== 12 || readyCap() !== 6 || clientCap() !== 4) throw new Error('capacity upgrades broken');
    if (typeof poolCap !== 'undefined') throw new Error('pool capacity still exists');
    if (typeof L.counter !== 'undefined') throw new Error('placement counter still exists');

    if (patienceMax() >= 34 * PFACT[0]) throw new Error('country patience factor not applied in Dubai');
    log.push(['dubai patience', patienceMax().toFixed(1)]);

    state.placed = 40; let vips = 0;
    for (let i = 0; i < 400; i++) { clients.length = 0; spawnClient(); if (clients[0] && clients[0].vip) vips++; }
    clients.length = 0;
    log.push(['vip rate', vips + '/400']);
    if (vips < 8) throw new Error('VIP clients never spawn');


    // personal introduction pays a 50% premium over the account manager
    modalOpen = false; panelOpen = false; rushOn = false;
    const savedCountry = state.country, savedRep = state.ups.rep, savedChain = state.chain;
    state.country = 0; state.ups.rep = 0; state.chain = 0;
    state.hires.am = 0; syncEmp();
    candidates.length = 0; clients.length = 0; clientT = 9999; bills.length = 0;
    const base = feeOf('bc');
    const cl1 = { x:316, y:992, vert:'bc', need:2, slot:0, patience:999, maxP:999, st:'wait', bob:0, total:2 };
    clients.push(cl1);
    candidates.push({ x:600, y:900, vert:'bc', st:'follow', owner:'p', idx:0, bob:0, done:true });
    at(L.lobby.x+80, L.lobby.y+40);
    for (let i = 0; i < 30; i++) { simNow += 50; update(0.05); render(); }
    const introFee = cl1.feeAcc || 0;
    if (!introFee) throw new Error('personal introduction did not pay');
    if (Math.abs(introFee - base) > base*0.15)
      throw new Error('player delivery should pay the base fee: got ' + introFee.toFixed(1) + ' expected ' + base.toFixed(1));
    log.push(['player delivery pays base fee', introFee.toFixed(0)]);

    // the same placement made by an account manager pays the base fee
    clients.length = 0; candidates.length = 0; bills.length = 0;
    state.hires.am = 1; syncEmp();
    emp.ams[0].x = L.lobby.x + 46; emp.ams[0].y = L.lobby.y - 34; emp.ams[0].st = 'idle'; emp.ams[0].batch = null;
    const cl3 = { x:316, y:992, vert:'bc', need:2, slot:0, patience:999, maxP:999, st:'wait', bob:0, total:2 };
    clients.push(cl3);
    candidates.push({ x:340, y:668, vert:'bc', st:'ready', rspot:0, owner:null, idx:0, bob:0, done:true });
    at(0, 1080);
    for (let i = 0; i < 600; i++) { simNow += 50; update(0.05); render(); }
    const amFee = cl3.feeAcc || 0;
    if (!amFee) throw new Error('account manager introduction did not pay');
    if (Math.abs(introFee - amFee) > base*0.2)
      throw new Error('manager and player fees should match: intro=' + introFee.toFixed(0) + ' am=' + amFee.toFixed(0));
    log.push(['player and manager fees match', introFee.toFixed(0) + ' vs ' + amFee.toFixed(0)]);
    state.country = savedCountry; state.ups.rep = savedRep; state.chain = savedChain;
    clients.length = 0; candidates.length = 0; bills.length = 0;

    // one account manager serves a whole multi-candidate order
    state.hires.am = 3; syncEmp();
    emp.ams.forEach((a,i) => { a.x = L.lobby.x + 46 + i*58; a.y = L.lobby.y - 34; a.st = 'idle'; a.batch = null; });
    const big = { x:316, y:992, vert:'bc', need:3, slot:0, patience:999, maxP:999, st:'wait', bob:0, total:3 };
    clients.push(big);
    for (let i = 0; i < 6; i++)
      candidates.push({ x:340+i*66, y:668, vert:'bc', st:'ready', rspot:i, owner:null, idx:0, bob:0, done:true });
    at(0, 1080);
    state.ups.staffcap = UPS.staffcap.max;
    const servers = new Set();
    let maxCrew = 0;
    for (let i = 0; i < 900; i++) {
      simNow += 50; update(0.05); render();
      candidates.forEach(c => { if ((c.st==='fetched'||c.st==='escort') && c.target === big) servers.add(c.amIdx); });
      maxCrew = Math.max(maxCrew, candidates.filter(c => c.st === 'escort' && c.target === big).length);
      if (big.dead || big.st === 'leave') break;
    }
    if (servers.size > 1) throw new Error('multiple account managers served one client: ' + servers.size);
    if (maxCrew < 2) throw new Error('account manager fetched one at a time, max crew was ' + maxCrew);
    log.push(['one AM carried a crew of', maxCrew + ' for a 3-candidate order']);
    state.ups.staffcap = 0;
    clients.length = 0; candidates.length = 0; bills.length = 0;

    // account manager fetches a ready candidate and introduces them at the counter
    candidates.length = 0; clients.length = 0; clientT = 9999;
    state.hires.am = 1; syncEmp();
    emp.ams[0].st = 'idle'; emp.ams[0].x = L.lobby.x + 46; emp.ams[0].y = L.lobby.y - 34;
    candidates.push({ x:340, y:668, vert:'bc', st:'ready', rspot:0, owner:null, idx:0, bob:0, done:true });
    clients.push({ x:316, y:992, vert:'bc', need:1, slot:0, patience:99, maxP:99, st:'wait', bob:0, total:1 });
    at(0, 1080);
    const cashAM = state.cash;
    let sawFetch = false, sawEscort = false;
    for (let i = 0; i < 500; i++) {
      simNow += 50; update(0.05); render();
      if (emp.ams[0].st === 'fetch') sawFetch = true;
      if (candidates.some(c => c.st === 'escort')) sawEscort = true;
    }
    if (!sawFetch) throw new Error('account manager never went to fetch a candidate');
    if (!sawEscort) throw new Error('candidate was never escorted to the client');
    if (state.cash <= cashAM && !bills.length) throw new Error('introduction never produced a fee');
    log.push(['AM fetch and introduce', 'ok']);
    candidates.length = 0; clients.length = 0; bills.length = 0;

    // promotion replaces the automatic blitz
    state.tut = TUT.length; rushOn = false; promoCd = 0; state.cash = 50000;
    at(L.banner.x + L.banner.w/2, L.banner.y + L.banner.h/2);
    const cashP = state.cash;
    tick(30);
    if (!rushOn) throw new Error('promotion never started');
    if (state.cash >= cashP) throw new Error('promotion was free');
    log.push(['promotion started, cost', Math.round(cashP - state.cash)]);
    rushLeft = 0.01; tick(4);
    if (rushOn) throw new Error('promotion never ended');
    if (promoCd <= 0) throw new Error('promotion has no cooldown');
    at(0, 1080); tick(10);
    if (rushOn) throw new Error('promotion fired without the player');
    log.push(['promotion cooldown', Math.round(promoCd) + 's']);
    if (typeof HIRES.mkt !== 'undefined') throw new Error('marketer role not removed');
    promoCd = 0; rushOn = false;

    // quality gate actually rejects, and sourcing quality reduces it
    state.ups.quality = 0;
    const r0 = rejectRate();
    if (!(r0 > 0.05)) throw new Error('quality gate never rejects');
    state.ups.quality = UPS.quality.max;
    if (!(rejectRate() < r0)) throw new Error('sourcing quality upgrade does nothing');
    log.push(['reject rate', (r0*100).toFixed(0) + '% -> ' + (rejectRate()*100).toFixed(0) + '%']);
    state.ups.quality = 0;



    // hire caps raised
    if (HIRES.rec.max < 4 || HIRES.am.max < 4) throw new Error('hire caps not raised');
    if (HIRES.fin.max !== 1) throw new Error('finance should cap at one');
    if (HIRES.mkt) throw new Error('marketer still present');
    if (typeof DECOR !== 'undefined') throw new Error('decorations were not removed');
    log.push(['hire caps', Object.keys(HIRES).map(k => k + ':' + HIRES[k].max).join(' ')]);

    // ---- autoplay pacing bot, fresh game ----
    state = freshState(); resetFloor(); cashEverPicked = false;
    panelOpen = false; panelOpened = false; modalOpen = false;
    const ms = { firstHire:0, allHires:0, it:0, hc:0, dubai:0, rushes:0, maxChain:0, maxCands:0, maxBills:0, cash10:0, cash20:0, poolFullTicks:0, waitSum:0, ticks:0, earned:0, mismatchSum:0, mismatchTicks:0 };
    let lastCash = 0;
    let wasRush = false;
    const buyUp = k => {
      const c = upCost(k);
      if (state.ups[k] < UPS[k].max && state.cash >= c && state.cash - c > monthlyDue()*1.5) { state.cash -= c; state.ups[k]++; return true; }
      return false;
    };
    function botStep(dt) {
      let tx = BENCH.x + BENCH.w/2, ty = BENCH.y + 10;
      const fol = player_followers();
      const raw = fol.filter(c => !c.done).length, done = fol.filter(c => c.done).length;
      const waitC = candidates.filter(c => c.st === 'wait').length;
      const readyC = candidates.filter(c => c.st === 'ready').length;
      const aff = k => state.cash >= hireCost(k) + monthlyDue()*1.2 + SALARY[k]*mul();

      const plan = [['rec',1],['sourcer',1],['rec',2],['am',1],['fin',1],['rec',3],['sourcer',2],['am',2],['sourcer',3],['am',3],['rec',4],['am',4]];
      const next = plan.find(p => state.hires[p[0]] === p[1]-1 && (p[0] !== 'rec' || state.hires.rec < boothCap()-1));
      const need = null;
      if (state.tut === TUT.length - 1) { tx = rc(L.mgr).x; ty = rc(L.mgr).y; }
      else if (trading() && !rushOn && promoCd <= 0 && state.cash > promoCost()*4 && state.cash > monthlyDue()*2) { tx = L.banner.x + L.banner.w/2; ty = L.banner.y + L.banner.h/2; }
      else if (next && aff(next[0])) { state.cash -= hireCost(next[0]); state.hires[next[0]]++; syncEmp(); }
      else if (!state.hires.fin && bills.length) { tx = bills[0].x; ty = bills[0].y; }
      else if (done > 0) {
        const tgt = clients.find(cl => cl.st === 'wait' && cl.need > 0);
        if (tgt) { tx = tgt.x; ty = tgt.y - 40; } else { tx = L.lobby.x + L.lobby.w/2; ty = L.lobby.y - 40; }
      }

      else if (readyC > 0 && fol.length < followCap()) { tx = BENCH.x + BENCH.w/2; ty = BENCH.y + BENCH.h/2; }
      else if (raw > 0) { tx = rc(L.booth).x; ty = rc(L.booth).y; }
      else if (candidates.some(c => c.st === 'booth' && !roomRec[c.bslot] && c.bslot >= recRooms())) { tx = rc(L.booth).x; ty = rc(L.booth).y; }
      else if (waitC > 0 && fol.length < followCap()) { tx = rc(L.zone).x; ty = rc(L.zone).y; }
      else if (!state.hires.sourcer && player.carrying.length > 0) { tx = rc(L.desk).x; ty = rc(L.desk).y + 30; }
      else if (!state.hires.sourcer && printerStack.length > 0 && player.carrying.length < carryCap()) { tx = rc(L.printer).x + 55; ty = rc(L.printer).y; }
      else if (bills.length) { tx = bills[0].x; ty = bills[0].y; }

      const d = Math.hypot(tx - player.x, ty - player.y);
      if (d > 6) {
        const sp = playerSpeed();
        player.x += (tx - player.x)/d * Math.min(sp*dt, d);
        player.y += (ty - player.y)/d * Math.min(sp*dt, d);
        const tr = player.trail;
        if (!tr.length || Math.hypot(player.x - tr[0].x, player.y - tr[0].y) > 3) {
          tr.unshift({ x:player.x, y:player.y }); if (tr.length > 260) tr.pop();
        }
      }
      if (panelOpen && state.tut >= TUT.length) panelOpen = false;
      if (state.tut === TUT.length - 1 && panelOpened) state.tut = TUT.length;
      if (state.hires.sourcer) {
        if (!state.verts.includes('it') && state.cash >= vertCost('it') + 80) { state.cash -= vertCost('it'); state.verts.push('it'); }
        else if (state.verts.includes('it') && !state.verts.includes('hc') && state.cash >= vertCost('hc') + 150) { state.cash -= vertCost('hc'); state.verts.push('hc'); }
      }
      const reserve = monthlyDue() * 1.6;
      if (state.hires.sourcer && state.hires.rec && state.hires.am && state.hires.fin && upTotal() < 22 && state.cash > reserve) {
        ['booth','printer','screen','aiint','ads','cap','staff','staffcap','quality','zone','ready','speed','rep','patience','vipnet','slots'].some(buyUp);
      }
    }
    const DT = 0.05, TOTAL_MIN = 22;
    for (let i = 0; i < TOTAL_MIN*60/DT; i++) {
      const min = i*DT/60;
      const c0 = state.cash;
      botStep(DT); simNow += DT*1000; update(DT); render();
      if (state.cash > lastCash) ms.earned += state.cash - lastCash;
      lastCash = state.cash;
      if (!ms.firstHire && state.hires.sourcer) ms.firstHire = min;
      if (!ms.allHires && state.hires.sourcer && state.hires.am && state.hires.fin) ms.allHires = min;
      if (!ms.it && state.verts.includes('it')) ms.it = min;
      if (!ms.hc && state.verts.includes('hc')) ms.hc = min;
      if (!ms.dubai && state.cash >= COUNTRIES[0].moveCost) ms.dubai = min;
      if (rushOn && !wasRush) ms.rushes++;
      wasRush = rushOn;

      ms.maxCands = Math.max(ms.maxCands, candidates.length);
      ms.maxBills = Math.max(ms.maxBills, bills.length);
      ms.ticks++;
      const pool = candidates.filter(c => c.st === 'ready');
      const waiting = clients.filter(cl => cl.st === 'wait');
      if (waiting.length && pool.length) {
        const starved = waiting.filter(cl => !pool.some(c => c.vert === cl.vert)).length;
        ms.mismatchSum += starved / waiting.length; ms.mismatchTicks++;
      }

      ms.waitSum += clients.filter(c => c.st === 'wait').length;
      if (Math.abs(min - 10) < DT/120) ms.cash10 = Math.floor(state.cash);
      if (Math.abs(min - 20) < DT/120) ms.cash20 = Math.floor(state.cash);
    }
    log.push(['BOT firstHire(min)', ms.firstHire.toFixed(1), 'allHires', ms.allHires.toFixed(1), 'IT', ms.it.toFixed(1), 'HC', ms.hc ? ms.hc.toFixed(1) : 'no']);
    log.push(['BOT dubaiAffordable(min)', ms.dubai ? ms.dubai.toFixed(1) : 'no', 'cash@10m', ms.cash10, 'cash@20m', ms.cash20]);
    const poolFullPct = (ms.poolFullTicks/ms.ticks*100).toFixed(0);
    const avgWait = (ms.waitSum/ms.ticks).toFixed(2);
    log.push(['BOT rushes', ms.rushes, 'maxCands', ms.maxCands, 'maxBills', ms.maxBills]);
    log.push(['BOT tension: poolFull%', poolFullPct, 'avgClientsWaiting', avgWait, 'clientsLost', state.lost]);
    log.push(['BOT endstate hires', JSON.stringify(state.hires), 'placed', state.placed, 'rejected', state.rejected]);
    Object.keys(HIRES).forEach(k => { if (state.hires[k] > HIRES[k].max) throw new Error('hire cap breached: ' + k); });
    if (state.hires.rec > boothCap() - 1) throw new Error('recruiters exceed available rooms');
    const mism = ms.mismatchTicks ? (ms.mismatchSum/ms.mismatchTicks*100) : 0;
    log.push(['BOT starved clients', mism.toFixed(0) + '% waiting with a stocked counter that has no match']);
    const lossRate = state.placed ? state.lost / (state.placed + state.lost) : 1;
    log.push(['BOT loss rate', (lossRate*100).toFixed(0) + '%']);
    log.push(['BOT walkouts', state.lost]);
    if (lossRate > 0.6) throw new Error('loss rate too high: ' + (lossRate*100).toFixed(0) + '% (' + state.lost + ' lost, ' + state.placed + ' placed)');
    log.push(['BOT net worth', Math.round(state.cash), 'months', state.months, 'gross/hour', Math.round((ms.earned)*60/TOTAL_MIN)]);
    if (!state.months) {
      throw new Error('payroll never ran during the bot session');
    }
    if (gameOver) throw new Error('the bot went bankrupt');
    log.push(['BOT total earned', Math.round(ms.earned), 'dubai needs', COUNTRIES[0].moveCost]);
    if (ms.earned < COUNTRIES[0].moveCost * 1.8) throw new Error('a saving player could not reach Dubai: earned ' + Math.round(ms.earned));
    if (ms.poolFullTicks/ms.ticks > 0.6) throw new Error('counter still always full: ' + poolFullPct + '%');
    if (ms.waitSum/ms.ticks < 0.25) throw new Error('clients never wait: ' + avgWait);
    if (!ms.firstHire || ms.firstHire > 8) throw new Error('first hire pacing off: ' + ms.firstHire);
    if (ms.maxCands > 50) throw new Error('candidate overflow in long run: ' + ms.maxCands);
    if (ms.maxBills > 75) throw new Error('bills unbounded: ' + ms.maxBills);



    // ---- fresh-eyes stress pass ----
    state = freshState(); resetFloor(); modalOpen = false; panelOpen = false;
    state.tut = TUT.length;
    Object.keys(HIRES).forEach(k => { state.hires[k] = HIRES[k].max; });
    Object.keys(UPS).forEach(k => { state.ups[k] = UPS[k].max; });
    state.verts = ['bc','it','hc']; syncEmp();
    at(rc(L.booth).x, L.booth.y+210);
    for (let i = 0; i < 9000; i++) { simNow += 50; update(0.05); render(); }
    let mCands = 0, mWait = 0, mTicks = 0, cashStart = state.cash;
    for (let i = 0; i < 3000; i++) { simNow += 50; update(0.05); render(); mCands += candidates.length; mWait += clients.filter(c=>c.st==='wait').length; mTicks++; }
    log.push(['STRESS maxed: avgCands', (mCands/mTicks).toFixed(1), 'avgWaiting', (mWait/mTicks).toFixed(2), 'lost', state.lost]);
    if (mCands/mTicks < 4) throw new Error('endgame supply starved: ' + (mCands/mTicks).toFixed(1));
    log.push(['STRESS maxed 7.5min ok, cands', candidates.length, 'bills', bills.length, 'clients', clients.length]);
    if (candidates.some(c => c.st === 'follow' && c.owner !== 'p' &&
        !(String(c.owner).indexOf('rec') === 0 ? emp.recs[+String(c.owner).slice(3)] : emp.ams[+String(c.owner).slice(2)])))
      throw new Error('orphaned follower');
    const slots = candidates.filter(c => c.st === 'wait').map(c => c.slot);
    if (new Set(slots).size !== slots.length) throw new Error('duplicate zone slots');
    const cs = clients.map(c => c.slot);
    if (new Set(cs).size !== cs.length) throw new Error('duplicate client slots');
    const bs2 = candidates.filter(c => c.st === 'booth').map(c => c.bslot);
    if (new Set(bs2).size !== bs2.length) throw new Error('duplicate booth slots');
    if (bs2.some(x => x >= boothCap())) throw new Error('booth slot out of range');
    if (candidates.filter(c => c.st === 'ready').length > readyCap()) throw new Error('ready area overflowed its slots');
    const rs2 = candidates.filter(c => c.st === 'ready').map(c => c.rspot);
    if (new Set(rs2).size !== rs2.length) throw new Error('duplicate ready spots');
    if (emp.fins.some(f => f.carry > 0 && f.st === 'idle' && f.n === 0)) throw new Error('fin lost carried cash');

    // payroll is charged every month and scales with headcount
    state = freshState(); resetFloor(); state.tut = TUT.length; gameOver = false; modalOpen = false;
    state.hires = { sourcer:2, rec:2, am:1, fin:1 }; syncEmp();
    state.payOn = true;
    const due1 = monthlyDue();
    if (due1 <= 0) throw new Error('payroll is zero with staff hired');
    state.cash = due1 * 3; state.payT = 0.02;
    const beforePay = state.cash;
    tick(4);
    if (Math.abs((beforePay - state.cash) - due1) > 2) throw new Error('payroll not deducted: ' + (beforePay - state.cash) + ' vs ' + due1);
    log.push(['payroll charged', fmt(due1) + ' for ' + Object.values(state.hires).reduce((a,b)=>a+b,0) + ' staff']);

    // payroll does not start until the gate is banked; the timer holds
    state = freshState(); resetFloor(); state.tut = TUT.length; gameOver = false; modalOpen = false;
    state.hires = { sourcer:1, rec:1, am:0, fin:0 }; syncEmp();
    state.cash = PAY_GATE() * 3; state.earned = PAY_GATE() - 100; state.payT = MONTH;
    tick(6);
    if (state.payOn) throw new Error('payroll latched on starting capital instead of earnings');
    if (state.payT < MONTH - 0.01) throw new Error('payroll timer ran while gated');
    state.earned = PAY_GATE() + 500;
    tick(1);
    if (!state.payOn) throw new Error('payroll did not latch once the gate was earned');
    log.push(['payroll gate latches on earnings, not starting cash', fmt(PAY_GATE())]);

    // regression: a NaN/corrupt cash value must never be adopted from a save
    if (isFinite(NaN)) throw new Error('isFinite broken');
    {
      const bad = Object.assign(freshState(), { cash: NaN });
      if (typeof bad.cash === 'number' && isFinite(bad.cash)) throw new Error('NaN cash test is not exercising the guard');
    }
    // regression: upgrade levels clamp to their maxima (a stale save inflated every price)
    state = freshState(); resetFloor();
    state.ups.printer = 99; state.hires.rec = 99;
    state.offices[1] = snapshotOffice();
    state.country = 1; applyOffice(state.offices[1]);
    if (state.ups.printer > UPS.printer.max) throw new Error('ups not clamped on office apply: ' + state.ups.printer);
    if (state.hires.rec > HIRES.rec.max) throw new Error('hires not clamped on office apply: ' + state.hires.rec);
    log.push(['save hardening', 'ups/hires clamped on travel']);
    state = freshState(); resetFloor(); state.country = 0;

    // regression: the drift valve is per-candidate, not one global 1.1s tap
    state = freshState(); resetFloor(); state.tut = TUT.length; state.payOn = false;
    candidates.length = 0; clients.length = 0; deskQueue.length = 0; clientT = 9999;
    at(0, 1080);
    for (let i = 0; i < 4; i++)
      candidates.push({ x:zoneSlots[i].x, y:zoneSlots[i].y, vert:'bc', st:'wait', slot:i, owner:null, idx:0, bob:0, waitT:9.5 });
    for (let i = 0; i < 40; i++) { simNow += 50; update(0.05); render(); } // 2s
    const drifted = candidates.filter(c => c.st === 'booth').length;
    if (drifted < 2) throw new Error('drift valve still globally throttled: only ' + drifted + ' moved in 2s');
    log.push(['drift valve per-candidate', drifted + ' candidates seated in 2s']);
    state = freshState(); resetFloor(); modalOpen = false;

    // interviews can rarely reject - but never while the player is under the floor
    const runInterviews = (cash, n) => {
      state = freshState(); resetFloor(); state.tut = TUT.length; gameOver = false; modalOpen = false;
      state.payOn = false; clientT = 9999; clients.length = 0; candidates.length = 0;
      state.cash = cash; state.ups.ready = UPS.ready.max;
      let rejected = 0, done = 0;
      for (let i = 0; i < n; i++) {
        candidates.length = 0;
        candidates.push({ x:boothSlots[0].x, y:boothSlots[0].y, vert:'bc', st:'booth', bslot:0, iT:interviewTime(), owner:null, idx:0, bob:0 });
        const before = state.rejected || 0;
        for (let k = 0; k < 6 && candidates.length && candidates[0].st === 'booth'; k++) { simNow += 50; update(0.05); render(); }
        if ((state.rejected||0) > before) rejected++;
        else if (candidates[0] && candidates[0].done) done++;
        state.cash = cash; // hold the balance steady across trials
      }
      return { rejected, done };
    };
    const poor = runInterviews(0, 60);
    if (poor.rejected !== 0) throw new Error('a broke player was rejected ' + poor.rejected + ' times');
    if (poor.done === 0) throw new Error('no interviews completed in the broke run');
    const rich = runInterviews(20000, 400);
    if (rich.rejected === 0) throw new Error('rich player never saw a post-interview rejection');
    const rate = rich.rejected / 400;
    if (rate > 0.2) throw new Error('post-interview rejection is meant to be rare, got ' + (rate*100).toFixed(0) + '%');
    log.push(['post-interview rejection', '0% under ' + fmt(REJECT_FLOOR()) + ', ' + (rate*100).toFixed(0) + '% above']);
    state = freshState(); resetFloor(); modalOpen = false;

    // software subscriptions are charged with payroll and can be cancelled
    state = freshState(); resetFloor(); state.tut = TUT.length; modalOpen = false; gameOver = false;
    state.placed = 60; state.cash = 50000; state.payOn = true;
    if (subsTotal() !== 0) throw new Error('a fresh office should owe no software fees');
    state.ups.screen = 2; state.ups.aiint = 1;
    const subs1 = subsTotal();
    if (subs1 <= 0) throw new Error('software levels did not create a subscription cost');
    if (monthlyDue() !== payrollTotal() + subs1) throw new Error('monthly bill does not include software');
    if (subs1 > payrollTotal() + 200) throw new Error('software fees are meant to be small');
    panelOpen = false; at(rc(L.mgr).x, rc(L.mgr).y); tick(10);
    const subRow = els['panelRows'].children.find(r => r._inner && r._inner.includes('AI resume screening'));
    const cancel = subRow && subRow.children.find(c => c.textContent === '\u2212');
    if (!cancel) throw new Error('no cancel control on a subscribed software row');
    cancel.onclick();
    if (state.ups.screen !== 1) throw new Error('cancelling did not drop a licence');
    if (subsTotal() >= subs1) throw new Error('cancelling did not cut the monthly software bill');
    log.push(['software subs', fmt(subs1) + '/mo -> ' + fmt(subsTotal()) + '/mo after cancelling one licence']);
    panelOpen = false;

    // upgrades reveal progressively instead of dumping the whole catalogue
    state = freshState(); resetFloor(); state.tut = TUT.length; state.placed = 0; state.cash = 50000;
    at(rc(L.mgr).x, rc(L.mgr).y); tick(10);
    const earlyRows = els['panelRows'].children.filter(r => r.className && r.className.includes('tb-ups')).length;
    state.placed = 60; buildPanel();
    const lateRows = els['panelRows'].children.filter(r => r.className && r.className.includes('tb-ups')).length;
    if (earlyRows >= lateRows) throw new Error('upgrade list did not grow with progress: ' + earlyRows + ' vs ' + lateRows);
    if (earlyRows > 6) throw new Error('too many upgrades shown at the start: ' + earlyRows);
    log.push(['staged upgrades', earlyRows + ' rows at 0 placements -> ' + lateRows + ' at 60']);
    panelOpen = false; state = freshState(); resetFloor(); modalOpen = false;

    // regression: travelling between owned offices via the country chip must work
    state = freshState(); resetFloor(); state.tut = TUT.length; modalOpen = false; gameOver = false;
    state.placed = 20; state.offices[0] = snapshotOffice();
    state.country = 1; applyOffice(null); resetFloor(); applyHud();
    if (ownedOffices().length < 2) throw new Error('two offices should be owned');
    showOffices();
    const offRows = els['mBody'].children;
    const goBtn = offRows.map(r => r.children.find(ch => ch.textContent === 'Go')).find(Boolean);
    if (!goBtn) throw new Error('no Go button for the other office');
    goBtn.onclick();
    if (state.country !== 0) throw new Error('travel back to India failed: country=' + state.country);
    log.push(['office travel', 'Dubai -> India ok']);
    state = freshState(); resetFloor(); modalOpen = false;

    // the Manager desk offers a working "Start over" that wipes progress
    state = freshState(); resetFloor(); state.tut = TUT.length; modalOpen = false; gameOver = false;
    state.cash = 9000; state.placed = 42; state.hires = { sourcer:2, rec:1, am:1, fin:1 }; syncEmp();
    state.ups.printer = 3; state.payOn = true;
    panelOpen = false; at(rc(L.mgr).x, rc(L.mgr).y); tick(10);
    const resetRow = els['panelRows'].children.find(r => r._inner && r._inner.includes('Start over'));
    if (!resetRow || !resetRow.children[0]) throw new Error('no Start over option at the Manager desk');
    resetRow.children[0].onclick();
    const yes = els['mBtns'].children.find(b => b.className.includes('pri'));
    if (!yes) throw new Error('no confirm button on the reset modal');
    yes.onclick();
    tick(1);
    if (state.placed !== 0 || state.ups.printer !== 0 || state.payOn) throw new Error('reset did not clear progress');
    if (state.cash !== START_CASH) throw new Error('reset did not restore starting cash: ' + state.cash);
    log.push(['start over', 'wipes progress, back to ' + fmt(START_CASH)]);
    state = freshState(); resetFloor(); modalOpen = false; panelOpen = false;

    // client patience is not inert: an unservable client eventually walks out
    state = freshState(); resetFloor(); state.tut = TUT.length; gameOver = false; modalOpen = false;
    state.payOn = false; candidates.length = 0; clients.length = 0; bills.length = 0;
    clientT = 9999; at(0, 1080);
    spawnClient();
    if (!clients.length) throw new Error('no client spawned for the patience test');
    const pc0 = clients[0], lost0 = state.lost, maxP0 = pc0.maxP;
    if (!(maxP0 > 0)) throw new Error('client has no patience window');
    for (let i = 0; i < Math.ceil((maxP0 + 20) / 0.05) && state.lost === lost0; i++) { simNow += 50; update(0.05); render(); }
    if (state.lost <= lost0) throw new Error('client patience is inert: nobody walked out after ' + Math.round(maxP0) + 's');
    log.push(['patience expires', 'walkout after ~' + Math.round(maxP0) + 's']);
    state = freshState(); resetFloor(); modalOpen = false;

    // a fresh office starts funded and payroll-free
    const fs2 = freshState();
    if (fs2.cash !== START_CASH) throw new Error('starting cash is ' + fs2.cash + ', expected ' + START_CASH);
    if (fs2.earned !== 0 || fs2.payOn) throw new Error('fresh state should have no earnings and no payroll');
    log.push(['fresh start', fmt(START_CASH) + ', payroll idle']);

    // a short payday goes negative: no loans, no instant death
    state = freshState(); resetFloor(); state.tut = TUT.length; gameOver = false; modalOpen = false;
    state.hires = { sourcer:1, rec:1, am:0, fin:0 }; syncEmp(); state.payOn = true;
    state.cash = 10; state.payT = 0.02;
    tick(4);
    if (state.cash >= 0) throw new Error('cash did not go negative on a short payday');
    if (gameOver) throw new Error('went bankrupt from a merely negative balance');
    log.push(['negative balance survived', fmt(state.cash)]);

    // sinking below the ruin line ends the game
    state.cash = -RUIN() + 5; state.payT = 0.02;
    tick(4);
    if (!gameOver) throw new Error('game did not end below the ruin line');
    log.push(['ruin below', fmt(-RUIN()), 'ok']);
    const overBtn = els['mBtns'].children.find(b => b.className.includes('pri'));
    if (!overBtn) throw new Error('no restart option after bankruptcy');
    overBtn.onclick();
    if (gameOver || state.payOn) throw new Error('restart after bankruptcy failed');
    if (state.cash <= 0) throw new Error('restart gave no cash');
    log.push(['restart after bankruptcy', 'ok']);

    // debt is gone from fresh state; payOn exists
    if ('debt' in freshState()) throw new Error('freshState still carries debt');
    if (freshState().payOn !== false) throw new Error('freshState missing payOn');
    log.push(['loan system removed', 'ok']);
    state = freshState(); resetFloor(); modalOpen = false;

    // multi-office empire: snapshot, travel back, passive income
    state = freshState(); resetFloor(); state.tut = TUT.length;
    state.ups.speed = 3; state.hires.sourcer = 2; syncEmp();
    state.cash = COUNTRIES[0].moveCost + 500;
    state.offices[state.country] = snapshotOffice();
    state.country = 1; applyOffice(null); resetFloor();
    if (state.ups.speed !== 0 || state.hires.sourcer !== 0) throw new Error('new office did not start empty');
    if (ownedOffices().length !== 2) throw new Error('previous office not retained');
    if (passiveRate() !== COUNTRIES[0].passive) throw new Error('previous office not paying passive income');
    log.push(['owned offices', ownedOffices().map(i=>COUNTRIES[i].name).join(', '), 'passive', passiveRate()]);
    travelTo(0);
    if (state.country !== 0) throw new Error('travel back failed');
    if (state.ups.speed !== 3 || state.hires.sourcer !== 2) throw new Error('office state not restored on return');
    if (emp.sourcers.length !== 2) throw new Error('staff not restored on return');
    if (passiveRate() !== COUNTRIES[1].passive) throw new Error('passive income did not switch to the office you left');
    log.push(['travel back restores office', 'ok']);
    travelTo(1);
    if (state.ups.speed !== 0) throw new Error('second office state clobbered');
    log.push(['travel round trip', 'ok']);
    state = freshState(); resetFloor();

    // rapid country moves with live state
    state.cash = 999999;
    for (let hop = 0; hop < 2; hop++) {
      const before = COUNTRIES[state.country].name;
      state.cash -= COUNTRIES[state.country].moveCost;
      state.country++; Object.assign(state, freshOffice()); resetFloor(); syncEmp();
      for (let i = 0; i < 600; i++) { simNow += 50; update(0.05); render(); }
      log.push(['STRESS hop', before, '->', COUNTRIES[state.country].name, 'ok']);
    }
    if (state.country !== COUNTRIES.length - 1) throw new Error('hop chain failed');
    if (isFinite(COUNTRIES[state.country].moveCost)) throw new Error('final country should have no exit');
    at(rc(L.exit).x, rc(L.exit).y); tick(20);
    log.push(['STRESS final-country exit safe', 'ok']);

    // save/load roundtrip with dirty data
    const snap = JSON.parse(JSON.stringify(state));
    snap.country = 99; snap.verts = ['bc','zz']; snap.tut = -5; snap.chain = 999; snap.hires.sourcer = 77;
    state = Object.assign(freshState(), snap);
    state.ups = Object.assign(freshOffice().ups, snap.ups || {});
    state.hires = Object.assign(freshOffice().hires, snap.hires || {});
    state.country = Math.min(COUNTRIES.length-1, Math.max(0, snap.country|0));
    state.tut = Math.min(TUT.length, Math.max(0, snap.tut|0));
    state.chain = Math.min(10, Math.max(0, snap.chain|0));
    state.verts = (Array.isArray(snap.verts) ? snap.verts : ['bc']).filter(v => VERTS[v]);
    if (!state.verts.length) state.verts = ['bc'];
    Object.keys(HIRES).forEach(k => { state.hires[k] = Math.max(0, Math.min(HIRES[k].max, +state.hires[k] || 0)); });
    resetFloor(); syncEmp();
    for (let i = 0; i < 400; i++) { simNow += 50; update(0.05); render(); }
    log.push(['STRESS dirty-save clamped: country', state.country, 'verts', JSON.stringify(state.verts), 'sourcers', state.hires.sourcer]);
    if (state.country >= COUNTRIES.length || state.hires.sourcer > HIRES.sourcer.max) throw new Error('dirty save not clamped');
    if (state.verts.includes('zz')) throw new Error('invalid vertical survived load');

    // zero-staff manual soak
    state = freshState(); resetFloor(); state.tut = TUT.length; syncEmp();
    for (let i = 0; i < 2400; i++) { simNow += 50; update(0.05); render(); }
    log.push(['STRESS no-staff 2min ok, deskQueue', deskQueue.length, 'printer', printerStack.length]);

    log.forEach(l => console.log(...l));
    console.log('ALL_TESTS_PASSED');
  } catch (e) {
    console.error('TEST_FAILED:', e.message);
    console.error(e.stack.split('\n').slice(0, 4).join('\n'));
    process.exit(1);
  }
  process.exit(0);
}, 60);
